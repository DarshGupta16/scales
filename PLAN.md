# Module-Per-Folder Refactor — Execution Plan

## Context & Background

**Branch**: `refactor/offline-sync`
**Runtime**: Bun (use `bun` for all commands, never `npm`)

### The Problem
The Scales codebase has two monolithic files that own all domain logic:
- **[src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts)** (285 lines) — A flat tRPC router containing every procedure + a giant `switch` statement inside `pushSyncLogs` that replays sync operations on the Prisma (server) DB.
- **[src/hooks/useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts)** (258 lines) — The client-side sync engine with a parallel ~110-line `switch` that replays the same operations on the Dexie (client) DB.

Every time a new feature is added (e.g. a new entity type), both switch statements, the router, and the hooks all need to be modified. The logic for a single domain is scattered across 4-5 files.

### The Goal
Refactor into a **module-per-folder** architecture under `src/modules/`. Each module (datasets, measurements, views, sync) owns **all** of its logic in one folder:
- Its tRPC sub-router
- Its server-side sync replay handlers
- Its client-side sync replay handlers
- Its React hooks

This means: to work on measurements, you open `src/modules/measurements/` and everything is right there.

### Key Decisions (Already Confirmed)
- **[useData.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useData.ts) stays as a facade** — The current [src/hooks/useData.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useData.ts) remains as a single import for consumers, re-exporting from module hooks.
- **`hello` procedure stays as-is** — It lives in the root router merge file, untouched.
- **Sync handlers split into `.server.ts` / `.client.ts`** — For clean tree-shaking and separation of Prisma (server) vs Dexie (client) code.
- **`views` stays as a standalone module** — Even though it's thin (sync handlers only), this is for consistency and future extensibility.
- **No runtime registry pattern** — Just plain handler maps merged via static imports.

---

## Current File Map (What Gets Moved)

| Current Location | Destination | What |
|---|---|---|
| [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts) → `getDatasets`, `getDataset`, [createDataset](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useDatasetCollection.ts#28-38) | `src/modules/datasets/router.ts` | tRPC procedures |
| [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts) → [addMeasurement](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useMeasurements.ts#13-40), [removeMeasurement](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useMeasurements.ts#41-62) | `src/modules/measurements/router.ts` | tRPC procedures |
| [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts) → `getSyncLogs`, `pushSyncLogs`, `pruneOldLogs` | `src/modules/sync/router.ts` | tRPC procedures |
| [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts) → `hello` | `src/trpc/_app.ts` | Stays in root merge |
| [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts) → dataset cases in `pushSyncLogs` switch | `src/modules/datasets/sync.server.ts` | Server replay handlers |
| [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts) → measurement cases in `pushSyncLogs` switch | `src/modules/measurements/sync.server.ts` | Server replay handlers |
| [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts) → view cases in `pushSyncLogs` switch | `src/modules/views/sync.server.ts` | Server replay handlers |
| [src/hooks/useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts) → dataset cases in client switch | `src/modules/datasets/sync.client.ts` | Client replay handlers |
| [src/hooks/useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts) → measurement cases in client switch | `src/modules/measurements/sync.client.ts` | Client replay handlers |
| [src/hooks/useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts) → view cases in client switch | `src/modules/views/sync.client.ts` | Client replay handlers |
| [src/hooks/useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts) → orchestration logic | `src/modules/sync/useSync.ts` | Sync engine (no domain knowledge) |
| [src/hooks/data/useDatasetCollection.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useDatasetCollection.ts) | `src/modules/datasets/hooks.ts` | React hooks |
| [src/hooks/data/useDatasetDetail.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useDatasetDetail.ts) | `src/modules/datasets/hooks.ts` | React hooks (merged) |
| [src/hooks/data/useMeasurements.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useMeasurements.ts) | `src/modules/measurements/hooks.ts` | React hooks |

---

## Target Structure

```
src/modules/
├── datasets/
│   ├── router.ts              ← getDatasets, getDataset, createDataset
│   ├── sync.server.ts         ← Prisma replay: CREATE/UPDATE/DELETE_DATASET
│   ├── sync.client.ts         ← Dexie replay: CREATE/UPDATE/DELETE_DATASET
│   └── hooks.ts               ← useDatasetCollection, useDatasetDetail
│
├── measurements/
│   ├── router.ts              ← addMeasurement, removeMeasurement
│   ├── sync.server.ts         ← Prisma replay: ADD/UPDATE/REMOVE_MEASUREMENT
│   ├── sync.client.ts         ← Dexie replay: ADD/UPDATE/REMOVE_MEASUREMENT
│   └── hooks.ts               ← useMeasurements
│
├── views/
│   ├── sync.server.ts         ← Prisma replay: ADD/REMOVE_VIEW
│   └── sync.client.ts         ← Dexie replay: ADD/REMOVE_VIEW
│
└── sync/
    ├── router.ts              ← getSyncLogs, pushSyncLogs, pruneOldLogs
    ├── types.ts               ← ServerReplayHandler, ClientReplayHandler type defs
    ├── registry.server.ts     ← Merges all *.sync.server handlers
    ├── registry.client.ts     ← Merges all *.sync.client handlers
    └── useSync.ts             ← Core sync engine (orchestration only)

src/trpc/
├── _app.ts                    ← Merges all module sub-routers + hello procedure
├── init.ts                    ← tRPC init (t, router, publicProcedure exports)
├── client.ts                  ← Unchanged
├── Provider.tsx               ← Unchanged
└── queryClient.ts             ← Unchanged

src/hooks/
├── useData.ts                 ← Facade, re-exports from module hooks
└── useSync.ts                 ← DELETE (moved to src/modules/sync/)
```

---

## Handler Map Pattern (How Sync Replaces the Switch)

Each module exports a plain object mapping `SyncOperation` → handler function:

```ts
// src/modules/sync/types.ts
export type ServerReplayHandler = (payload: any) => Promise<void>;
export type ClientReplayHandler = (payload: any) => Promise<void>;
```

```ts
// src/modules/datasets/sync.server.ts
import { SyncOperation } from "@/types/syncOperations";
import { db } from "@/db";
import type { ServerReplayHandler } from "@/modules/sync/types";

export const serverHandlers: Record<string, ServerReplayHandler> = {
  [SyncOperation.CREATE_DATASET]: async (payload) => {
    await db.dataset.upsert({ /* exact same logic as current switch case */ });
  },
  [SyncOperation.UPDATE_DATASET]: async (payload) => { /* ... */ },
  [SyncOperation.DELETE_DATASET]: async (payload) => { /* ... */ },
};
```

```ts
// src/modules/sync/registry.server.ts
import { serverHandlers as datasetHandlers } from "../datasets/sync.server";
import { serverHandlers as measurementHandlers } from "../measurements/sync.server";
import { serverHandlers as viewHandlers } from "../views/sync.server";

export const allServerHandlers = {
  ...datasetHandlers,
  ...measurementHandlers,
  ...viewHandlers,
};
```

Then `pushSyncLogs` in `src/modules/sync/router.ts` replaces the switch with:

```ts
const handler = allServerHandlers[log.operation];
if (handler) {
  await handler(payload);
  applied++;
}
```

Same pattern for client-side: `registry.client.ts` merges client handlers, [useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts) uses them.

> [!IMPORTANT]
> **To add a new domain in the future**: create its module folder, add `sync.server.ts` + `sync.client.ts`, and add 2 import lines to each registry file. That's it.

---

## Phases

### Phase 1: Scaffolding
Create the directory structure and shared infrastructure files.

**Files to create:**
- `src/modules/sync/types.ts` — `ServerReplayHandler` and `ClientReplayHandler` type definitions
- `src/trpc/init.ts` — Extract tRPC initialization (`initTRPC.create()`, `router`, `publicProcedure` exports) from [src/trpc/server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts)

**No behavioral changes.** Everything still works via the old monolith.

**Commit**: `refactor: scaffold module structure and extract tRPC init`

---

### Phase 2: Migrate `datasets` module
The largest module. Move everything dataset-related in one pass.

**Files to create:**
- `src/modules/datasets/router.ts` — Extract `getDatasets`, `getDataset`, [createDataset](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useDatasetCollection.ts#28-38) from [server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts)
- `src/modules/datasets/sync.server.ts` — Extract `CREATE_DATASET`, `UPDATE_DATASET`, `DELETE_DATASET` server replay handlers from the `pushSyncLogs` switch in [server.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/trpc/server.ts)
- `src/modules/datasets/sync.client.ts` — Extract the same operations' client replay handlers from the switch in [useSync.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/useSync.ts)
- `src/modules/datasets/hooks.ts` — Move [useDatasetCollection](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useDatasetCollection.ts#9-47) and [useDatasetDetail](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/hooks/data/useDatasetDetail.ts#8-51) here from `src/hooks/data/`

**Files to modify:**
- `src/hooks/useData.ts` — Update imports to point to `@/modules/datasets/hooks`

**Commit**: `refactor: migrate datasets to module folder`

---

### Phase 3: Migrate `measurements` module
Same pattern as datasets.

**Files to create:**
- `src/modules/measurements/router.ts` — Extract `addMeasurement`, `removeMeasurement`
- `src/modules/measurements/sync.server.ts` — Extract `ADD_MEASUREMENT`, `UPDATE_MEASUREMENT`, `REMOVE_MEASUREMENT` server handlers
- `src/modules/measurements/sync.client.ts` — Extract client handlers
- `src/modules/measurements/hooks.ts` — Move `useMeasurements` from `src/hooks/data/`

**Files to modify:**
- `src/hooks/useData.ts` — Update imports to point to `@/modules/measurements/hooks`

**Commit**: `refactor: migrate measurements to module folder`

---

### Phase 4: Migrate `views` module
Sync handlers only — views have no standalone tRPC procedures or hooks currently.

**Files to create:**
- `src/modules/views/sync.server.ts` — Extract `ADD_VIEW`, `REMOVE_VIEW` server handlers
- `src/modules/views/sync.client.ts` — Extract client handlers

**Commit**: `refactor: migrate views sync handlers to module folder`

---

### Phase 5: Migrate `sync` module + wire registries
This is the keystone phase that rewires the sync engine and tRPC router.

**Files to create:**
- `src/modules/sync/registry.server.ts` — Import and merge all `*.sync.server` handlers
- `src/modules/sync/registry.client.ts` — Import and merge all `*.sync.client` handlers
- `src/modules/sync/router.ts` — Extract `getSyncLogs`, `pushSyncLogs`, `pruneOldLogs`; refactor `pushSyncLogs` to use `allServerHandlers` instead of the switch
- `src/modules/sync/useSync.ts` — Move sync engine from `src/hooks/useSync.ts`; refactor client replay to use `allClientHandlers` instead of the switch

**Files to create:**
- `src/trpc/_app.ts` — Create the root router that merges all module sub-routers + keeps `hello` inline

**Files to modify:**
- `src/trpc/client.ts` — Update `AppRouter` import to point to `_app.ts`
- Any file that imports from `src/hooks/useSync.ts` → update to `@/modules/sync/useSync`

**Commit**: `refactor: wire sync registries and merge module routers`

---

### Phase 6: Cleanup + Verification
Delete obsolete files and verify everything.

**Files to delete:**
- `src/trpc/server.ts` (replaced by `init.ts` + `_app.ts` + module routers)
- `src/hooks/useSync.ts` (moved to `src/modules/sync/useSync.ts`)
- `src/hooks/data/useDatasetCollection.ts` (moved to datasets module)
- `src/hooks/data/useDatasetDetail.ts` (moved to datasets module)
- `src/hooks/data/useMeasurements.ts` (moved to measurements module)
- `src/hooks/data/` directory itself

**Files to update:**
- Any remaining imports across routes/components that reference the old paths. Currently `useData` is imported in 4 places — those should not change since `useData.ts` stays as a facade. But verify `useSync` imports (currently in `useDatasetCollection.ts` and `useMeasurements.ts`, which are now inside modules).

**Verification:**
```bash
bunx tsc --noEmit
```

**Commit**: `refactor: clean up obsolete files and verify types`

---

## Post-Refactor Verification Checklist

### Automated
- [ ] `bunx tsc --noEmit` passes with zero errors

### Manual
- [ ] Create a new dataset → appears instantly (Dexie) and syncs to server
- [ ] Add a measurement offline → go online → verify sync pushes and replays
- [ ] Add/remove a view → verify sync works
- [ ] Reload the page → tRPC fetches data correctly through new sub-routers
- [ ] Check network tab → no extra/duplicate requests

---

## Important Notes for Execution

> [!CAUTION]
> Do NOT modify any logic. This is a pure structural refactor. Every handler body, every query, every hook should be **copy-pasted exactly**. The only logic change is replacing `switch` statements with handler map lookups.

> [!WARNING]
> The `hello` procedure in the current `server.ts` must be preserved exactly as-is in `src/trpc/_app.ts`. Do not move it to a module.

> [!NOTE]
> After each phase, run `bunx tsc --noEmit` to catch import/type errors early. Do not batch all phases and then check.
