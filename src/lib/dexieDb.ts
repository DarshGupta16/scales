import { Dexie, type EntityTable } from "dexie";
import type { DatasetRecord, UnitRecord, MeasurementRecord } from "../types/dataset";

const isBrowser = typeof window !== "undefined";

export interface OfflineOp {
  id?: number;
  collection: "datasets" | "measurements" | "units";
  action: "create" | "update" | "delete";
  recordId: string;
  data: any;
  timestamp: number;
}

/**
 * Scales Database - Dexie implementation for local-first persistence.
 * Instantiated with SSR-safety to support the TanStack Start environment.
 */
export const db = (
  isBrowser ? new Dexie("ScalesDatabase") : ({} as unknown)
) as Dexie & {
  datasets: EntityTable<DatasetRecord, "id">;
  units: EntityTable<UnitRecord, "id">;
  measurements: EntityTable<MeasurementRecord, "id">;
  offline_ops: EntityTable<OfflineOp, "id">;
};

if (isBrowser) {
  // Schema declaration:
  // Version bumped to reflect normalized structure and offline ops.
  db.version(4).stores({
    datasets: "id, title, unitId, created",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
    offline_ops: "++id, collection, action, recordId, timestamp",
  });
}

export type { DatasetRecord, UnitRecord, MeasurementRecord };
