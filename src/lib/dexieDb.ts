import { Dexie, type EntityTable } from "dexie";
import type {
  DatasetRecord,
  MeasurementRecord,
  MeasurementValueRecord,
  MetricRecord,
  PreferenceRecord,
  UnitRecord,
} from "../types/dataset";

const isBrowser = typeof window !== "undefined";

export interface OfflineOp {
  id?: number;
  collection:
    | "datasets"
    | "metrics"
    | "measurements"
    | "measurement_values"
    | "units"
    | "preferences";
  action: "create" | "update" | "delete";
  recordId: string;
  data:
    | DatasetRecord
    | MetricRecord
    | MeasurementRecord
    | MeasurementValueRecord
    | UnitRecord
    | PreferenceRecord
    | {
        datasetRecord: DatasetRecord;
        metricRecords: MetricRecord[];
        measurementRecords: MeasurementRecord[];
        measurementValueRecords: MeasurementValueRecord[];
      }
    | null;
  timestamp: number;
}

/**
 * Scales Database - Dexie implementation for local-first persistence.
 * Instantiated with SSR-safety to support the TanStack Start environment.
 */
export const db = (isBrowser ? new Dexie("ScalesDatabase") : ({} as unknown)) as Dexie & {
  datasets: EntityTable<DatasetRecord, "id">;
  metrics: EntityTable<MetricRecord, "id">;
  units: EntityTable<UnitRecord, "id">;
  measurements: EntityTable<MeasurementRecord, "id">;
  measurement_values: EntityTable<MeasurementValueRecord, "id">;
  preferences: EntityTable<PreferenceRecord, "id">;
  offline_ops: EntityTable<OfflineOp, "id">;
};

if (isBrowser) {
  // Schema declaration:
  // Add schemas for older Dexie versions 1-6 so older local databases upgrade correctly.
  // Historical schemas to ensure safe upgrades for existing users
  db.version(1).stores({
    datasets: "id, title, unitId, createdAt",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
  });

  db.version(2).stores({
    datasets: "id, title, unitId, createdAt",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
  });

  db.version(3).stores({
    datasets: "id, title, unitId, createdAt",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
    offline_ops: "++id, collection, action, recordId, timestamp",
  });

  db.version(4).stores({
    datasets: "id, title, unitId, created",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
    offline_ops: "++id, collection, action, recordId, timestamp",
  });

  db.version(5).stores({
    datasets: "id, title, unitId, created",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
    preferences: "id, preference",
    offline_ops: "++id, collection, action, recordId, timestamp",
  });

  db.version(6).stores({
    datasets: "id, title, unitId, created",
    units: "id, name, symbol",
    measurements: "id, datasetId, timestamp, value",
    preferences: "id, preference",
    offline_ops: "++id, collection, action, recordId, timestamp",
  });

  const schema = {
    datasets: "id, title, type, created, updated",
    metrics: "id, datasetId, unitId, updated",
    units: "id, name, symbol, updated",
    measurements: "id, datasetId, timestamp, updated",
    measurement_values: "id, measurementId, metricId, updated",
    preferences: "id, preference, updated",
    offline_ops: "++id, collection, action, recordId, timestamp",
  };

  // Version bumped to reflect normalized 4-table structure and indexed updated field.
  db.version(7).stores(schema);

  // CASCADE DELETE HOOKS
  // 1. Dataset Cascade: metrics + measurements
  db.datasets.hook("deleting", async (id, _transaction) => {
    // Note: We don't wait for these to complete to avoid blocking the main delete,
    // but they will run in the same transaction if provided.
    await Promise.all([
      db.metrics.where("datasetId").equals(id).delete(),
      db.measurements.where("datasetId").equals(id).delete(),
    ]);
  });

  // 2. Measurement Cascade: values
  db.measurements.hook("deleting", async (id, _transaction) => {
    await db.measurement_values.where("measurementId").equals(id).delete();
  });
}

export type {
  DatasetRecord,
  MeasurementRecord,
  MeasurementValueRecord,
  MetricRecord,
  PreferenceRecord,
  UnitRecord,
};
