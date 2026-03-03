# Offline Sync System — Local-First Dexie ↔ SQLite Synchronization

**Branch**: `feat/offline-sync`  
**Philosophy**: Dexie is the primary, instant, local-first database. SQLite serves as a universal consolidator and bookkeeper across devices. Every user action executes on Dexie first, then syncs to the server in the background. The app is **single-user, multi-device**.

## Core Concept

1. Every mutation executes **immediately on Dexie**, then a **sync log** is recorded locally.
2. `recordOperation()` logs the operation in Dexie's `syncLogs`, then calls `sync()` to push the log to the server.
3. `sync()` compares client and server logs — if they already match, it short-circuits. Otherwise it finds the **last common log**, collects all logs after that from both sides, merges them by timestamp, and **replays** the divergent ones on both Dexie and SQLite.
4. Sync is **event-driven**: fires after every mutation and when the browser comes back online. No polling.
5. Errors during replay (e.g. deleting something already gone) are silently ignored.
6. Logs older than a configurable threshold (default 10 days) are pruned once confirmed synced.

---

## Proposed Changes

### Schema & Database Layer

#### [MODIFY] [schema.prisma](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/prisma/schema.prisma)

Add `SyncLog` model:

```prisma
model SyncLog {
  id        String @id @default(cuid())
  timestamp BigInt            // new Date().getTime()
  operation String            // SyncOperation enum value
  payload   String            // JSON-serialized operation data
  @@index([timestamp])
}
```

#### [MODIFY] [dexieDb.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/dexieDb.ts)

Bump version to 4, add `syncLogs` table, and export `SyncLogEntry` interface:

```ts
export interface SyncLogEntry {
  id: string;
  timestamp: number;
  operation: SyncOperation;
  payload: string;
}

dexieDb.version(4).stores({
  datasets:
    "id, title, description, unit, views, slug, isOptimistic, measurements",
  syncLogs: "id, timestamp, operation",
});
```

---

### Types

#### [NEW] [syncOperations.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/types/syncOperations.ts)

A proper enum of all possible operations (including ones not yet implemented in the UI):

```ts
export enum SyncOperation {
  // Dataset operations
  CREATE_DATASET = "CREATE_DATASET",
  UPDATE_DATASET = "UPDATE_DATASET",
  DELETE_DATASET = "DELETE_DATASET",

  // Measurement operations
  ADD_MEASUREMENT = "ADD_MEASUREMENT",
  UPDATE_MEASUREMENT = "UPDATE_MEASUREMENT",
  REMOVE_MEASUREMENT = "REMOVE_MEASUREMENT",

  // View operations
  ADD_VIEW = "ADD_VIEW",
  REMOVE_VIEW = "REMOVE_VIEW",
}
```

#### [MODIFY] [zodSchemas.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/types/zodSchemas.ts)

Add sync log Zod schema:

```ts
export const syncLogSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  operation: z.string(),
  payload: z.string(),
});
```

---

### Server (tRPC)

#### [MODIFY] [server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts)

Add three sync-related procedures:

1. **`getSyncLogs`** — returns all logs after a given timestamp.
2. **`pushSyncLogs`** — receives client logs, inserts them into the server's `SyncLog` table, then replays each operation on the server DB via a `replayOnServer(log)` helper. Errors during replay are caught and silently ignored.
3. **`pruneOldLogs`** — deletes logs older than the configurable threshold. Called at the end of a successful sync.

`replayOnServer` handles each `SyncOperation`:

- `CREATE_DATASET` → `db.dataset.create(...)` with the payload data
- `UPDATE_DATASET` → `db.dataset.update(...)` with partial payload
- `DELETE_DATASET` → `db.dataset.delete(...)` by id
- `ADD_MEASUREMENT` → `db.measurement.create(...)` connecting to dataset
- `UPDATE_MEASUREMENT` → `db.measurement.update(...)` by id
- `REMOVE_MEASUREMENT` → `db.measurement.delete(...)` by id
- `ADD_VIEW` → `db.datasetView.create(...)` connecting to dataset
- `REMOVE_VIEW` → `db.datasetView.delete(...)` by id

All wrapped in try/catch — errors are no-ops.

---

### Client Sync Hook

#### [NEW] [useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts)

**`recordOperation(operation, payload)`**

- Generates `id` (cuid) and `timestamp` (`new Date().getTime()`).
- Inserts into Dexie's `syncLogs` table.
- Calls `sync()` to push the log to the server.

**`sync()`**

- **Early exit**: fetch the latest server log timestamp via `getSyncLogs({ after: 0 })` and compare against local logs. If the latest log ID and timestamp match on both sides, return immediately — nothing to do.
- Fetch all server logs and all local (Dexie) logs.
- Find the **last common log** by ID (matching by `id` since timestamps could collide).
- Collect **client-only** logs (IDs not on server) and **server-only** logs (IDs not on client).
- If neither set has entries, short-circuit.
- **Push** client-only logs to the server via `pushSyncLogs` (server replays them).
- **Replay** server-only logs on Dexie via `replayOnDexie(log)`.
- After successful sync, call `pruneOldLogs` if applicable.

**`replayOnDexie(log)`**

- `CREATE_DATASET` → `dexieDb.datasets.put(payload)`
- `UPDATE_DATASET` → `dexieDb.datasets.update(id, payload)` (partial, measurement-level)
- `DELETE_DATASET` → `dexieDb.datasets.delete(id)`
- `ADD_MEASUREMENT` → find dataset by slug, append measurement to its array
- `UPDATE_MEASUREMENT` → find dataset by slug, replace the measurement in the array
- `REMOVE_MEASUREMENT` → find dataset by slug, filter out the measurement
- `ADD_VIEW` / `REMOVE_VIEW` → similar array manipulation on the dataset's `views`
- All try/catch — errors silently ignored.

**Event-driven triggers** (no polling):

- `window.addEventListener('online', sync)` to sync when browser reconnects.
- `sync()` is called by `recordOperation()` after every mutation.
- Cleanup listener on unmount.

**Exports**: `{ sync, recordOperation, isSyncing, lastSyncedAt }`

---

### Wiring Into Existing Hooks

#### [MODIFY] [useDatasetCollection.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useDatasetCollection.ts)

- Rename `upsertDataset` → `createDataset` (both the function and the internal mutation). This will only handle dataset **creation**, not updates.
- After the Dexie `put` call:
  ```ts
  recordOperation(SyncOperation.CREATE_DATASET, JSON.stringify(newDataset));
  ```
- Remove the direct tRPC `mutate` call — the sync system handles server communication now.

#### [MODIFY] [useMeasurements.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useMeasurements.ts)

In `addMeasurement`:

```ts
recordOperation(
  SyncOperation.ADD_MEASUREMENT,
  JSON.stringify({ ...newMeasurement, datasetSlug }),
);
```

In `removeMeasurement`:

```ts
recordOperation(
  SyncOperation.REMOVE_MEASUREMENT,
  JSON.stringify({ id: measurementId, datasetSlug }),
);
```

Similarly, remove the direct tRPC mutation calls — sync handles it.

#### [MODIFY] [useData.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useData.ts)

Update exports to reflect `createDataset` rename (was `upsertDataset`).

---

### Callers of `upsertDataset`

Any component calling `upsertDataset` from `useData()` will need its reference updated to `createDataset`. I'll grep for these and update them during execution.

---

## Commit Strategy

All work on `feat/offline-sync`. Commits after each logical chunk:

1. Schema + Dexie + types
2. tRPC sync procedures
3. `useSync` hook
4. Hook wiring + rename
5. Cleanup + type check

---

## Verification Plan

### Automated

```bash
bunx tsc --noEmit
```

### Manual

1. Run `bun run dev`, create a dataset → confirm sync log in both Dexie (`Application` → `IndexedDB`) and SQLite.
2. Go offline → add measurement → confirm Dexie log exists, no server error crashes the app.
3. Go online → confirm `sync()` fires, log pushed to server, measurement appears in SQLite.
4. Check log compaction after 10 days threshold.
