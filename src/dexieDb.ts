import { Dexie, type EntityTable } from "dexie";
import { type Dataset } from "./types/dataset";

interface DexieDataset extends Dataset {}

import { type SyncOperation } from "./types/syncOperations";

export interface SyncLogEntry {
  id: string;
  timestamp: number;
  operation: SyncOperation;
  payload: string;
}

const dexieDb = new Dexie("ScalesDexieLocal") as Dexie & {
  datasets: EntityTable<
    DexieDataset,
    "id" // primary key "id" (for the typings only)
  >;
  syncLogs: EntityTable<SyncLogEntry, "id">;
};

// Schema declaration:
dexieDb.version(4).stores({
  datasets: "id, title, description, unit, views, slug, measurements", // Cannot change this string from v3 without complex migrations
  syncLogs: "id, timestamp, operation",
});

export { dexieDb };
