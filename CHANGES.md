# SCALES | Architectural Changes (Local-First Transition)

This document summarizes the changes made during the transition to a local-first architecture.

## Key Changes

### 1. Client-Side Persistence (Dexie.js)
- **File:** `src/db/client.ts`
- **Description:** Implemented a mirroring schema of the Prisma database using Dexie.js (IndexedDB). 
- **Stores:** `datasets`, `measurements`, `views`.
- **Relational Logic:** Since Dexie is flat, a custom `hydrateDexie` utility handles flattening/re-structuring data from the server.

### 2. SSR-Skipping Strategy
- **File:** `src/utils/cookies.ts`, `src/utils/ssr-skip.ts`
- **Description:** Implemented a cookie-based mechanism to detect if the client has a warm local cache.
- **Logic:** 
  - On first visit, standard SSR occurs.
  - After first successful load, a `scales_local_ready=true` cookie is set.
  - On subsequent visits, the TanStack Start loader checks this cookie via a server function (`checkLocalReady`).
  - If the cookie exists, the loader returns an empty payload immediately, skipping expensive Prisma queries and speeding up initial paint.

### 3. Reactive Data Layer
- **File:** `src/hooks/useDatasets.ts`, `src/hooks/useDataset.ts`
- **Description:** Replaced direct tRPC/TanStack Query calls in components with unified hooks.
- **Mechanism:**
  - `useLiveQuery` (from `dexie-react-hooks`) is the primary source of truth for the UI.
  - A background `useEffect` triggers a tRPC fetch to synchronize the local DB with the server truth.
  - UI updates instantly (~16ms) upon any local change.

### 4. Concurrent Mutation Pattern
- **File:** `src/hooks/useMutations.ts`
- **Description:** Implemented a "Fire-and-Forget" pattern for all write operations.
- **Logic:**
  - Writes are performed to Dexie (local) and tRPC (remote) concurrently.
  - `upsertDataset` and `addMeasurement` utilities handle the orchestration.
  - UI responsiveness is prioritized by updating the local database without waiting for network resolution.

## Key Configuration Files
- `src/db/client.ts`: Dexie database definition.
- `src/hooks/useDatasets.ts`: Main entry point for data orchestration.
- `src/utils/ssr-skip.ts`: Server-side logic for checking local cache readiness.

## Verification
- Run `bun run dev` and check the "Network" tab on repeat visits; the SSR payload should be minimal.
- Test offline mode; datasets and graphs should remain fully functional using local data.
- Run `bun x tsc --noEmit` to ensure type integrity.
