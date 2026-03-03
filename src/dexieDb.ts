import { Dexie, type EntityTable } from "dexie";
import { type Dataset } from "./types/dataset";
import { type SyncOperation } from "./types/syncOperations";

export interface SyncLogEntry {
  id: string;
  timestamp: number;
  operation: SyncOperation;
  payload: string;
}

/**
 * Dexie.js initialization with SSR-safety.
 * 
 * We only instantiate the Dexie instance if we are in a browser environment
 * where IndexedDB is available. On the server, we return a mock object
 * to prevent crashes during SSR.
 */
const isBrowser = typeof window !== "undefined";

const dexieDb = (isBrowser
  ? new Dexie("ScalesDexieLocal")
  : ({} as unknown)) as Dexie & {
  datasets: EntityTable<Dataset, "id">;
  syncLogs: EntityTable<SyncLogEntry, "id">;
};

if (isBrowser) {
  // Schema declaration:
  dexieDb.version(4).stores({
    datasets: "id, title, description, unit, views, slug, measurements",
    syncLogs: "id, timestamp, operation",
  });
}

export { dexieDb };
