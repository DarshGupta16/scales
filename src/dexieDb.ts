import { Dexie, type EntityTable } from "dexie";
import type { DatasetRecord, UnitRecord, MeasurementRecord } from "./types/dataset";

const isBrowser = typeof window !== "undefined";

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
};

if (isBrowser) {
  // Schema declaration:
  // Version bumped to reflect normalized structure.
  db.version(2).stores({
    datasets: "id, title, unitId, createdAt",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
  });
}

export type { DatasetRecord, UnitRecord, MeasurementRecord };
