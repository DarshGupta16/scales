# SCALES | Local-First Implementation Plan

This document outlines the strategy for transitioning SCALES to a local-first architecture using Dexie.js for IndexedDB storage and SSR-skipping via browser cookies.

---

## Phase 0: Infrastructure & Dependencies
1.  **Dependencies:** Install `dexie`, `dexie-react-hooks`, and `cookie-es`.
2.  **Type Alignment:** Audit `src/types/dataset.ts` to ensure Prisma, tRPC, and Dexie share synchronized types.
3.  **Branching:** All work performed in `feat/local-first`.

## Phase 1: Client-Side Database Layer (Dexie)
1.  **Schema Definition:** Create `src/db/client.ts`.
2.  **Store Configuration:** Mirror Prisma models:
    - `datasets`: `++id, slug, title, unit`
    - `measurements`: `++id, datasetId, timestamp`
    - `views`: `++id, datasetId, type`
3.  **Singleton Export:** Export a configured Dexie instance with versioning.

## Phase 2: SSR Skipping Logic (Cookie Strategy)
1.  **Cookie Utility:** Create `src/utils/cookies.ts` for isomorphic cookie management.
2.  **Loader Modification:** Update `src/routes/index.tsx` and `src/routes/datasets.$datasetId.tsx`.
    - **Logic:** Check for `scales_local_ready` cookie.
    - **Server-Side:** If cookie exists, return empty payload immediately (Skip SSR).
    - **Client-Side:** If cookie is missing, perform SSR, seed Dexie, and set the cookie.

## Phase 3: Reactive Data Layer (useLiveQuery)
1.  **Unified Hooks:** Create `useDatasets` hook.
    - Use `useLiveQuery` as primary UI source (instant local reads).
    - Trigger tRPC background fetch in `useEffect`.
    - Reconcile Dexie with server data on tRPC success.
2.  **Component Refactor:** Replace `useQuery` and `Route.useLoaderData()` in `index.tsx` and `DatasetDetail`.

## Phase 4: Concurrent Mutation Strategy
1.  **Mutation Wrapper:** Implement "Fire-and-Forget" concurrent updates.
    - Call Dexie update and tRPC mutation simultaneously without `await`.
    - UI updates in ~16ms via `useLiveQuery` subscription.
2.  **UI Updates:** Update `AddDatasetModal`, `AddMeasurementModal`, and deletion logic.
3.  **Conflict Handling:** Update Dexie with server-generated IDs/timestamps in tRPC callbacks.

## Phase 5: Documentation & Validation
1.  **Verification:** Confirm minimal SSR payload on repeat visits and offline persistence.
2.  **Type Check:** Run `tsc` or `bun run type-check` for integrity.
3.  **CHANGES.md:** Create a comprehensive document detailing all architectural changes, key config files, and sync logic.

---

## Commitment Schedule
1. `init: local-first infrastructure and dependencies`
2. `feat: implement dexie client-side database schema`
3. `feat: implement ssr-skip logic via local-ready cookies`
4. `refactor: switch ui components to reactive dexie live queries`
5. `feat: implement concurrent local-remote mutation pattern`
6. `test: final validation and CHANGES.md documentation`
