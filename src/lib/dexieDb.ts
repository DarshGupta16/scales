import { Dexie, type EntityTable } from "dexie";
import type {
  DatasetRecord,
  MeasurementRecord,
  MeasurementValueRecord,
  MetricRecord,
  PreferenceRecord,
  UnitRecord,
} from "../types/dataset";
import { generatePbId } from "../utils/id";

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

  // Version 7: normalized 4-table structure.
  // Upgrade callback migrates v6 flat data (datasets.unitId, measurements.value)
  // to the new normalized structure (metrics, measurement_values).
  // This mirrors the PocketBase migration 1775440000_migrate_data.js on the client side.
  db.version(7)
    .stores(schema)
    .upgrade(async (tx) => {
      console.log("[Dexie Migration] Starting v6 → v7 data migration...");

      const datasets = tx.table("datasets");
      const metrics = tx.table("metrics");
      const measurements = tx.table("measurements");
      const measurementValues = tx.table("measurement_values");

      // Track which datasets have been migrated: datasetId → metricId
      const metricIdMap = new Map<string, string>();

      // 1. Migrate datasets: set type, create a metric for each dataset with a unitId
      const allDatasets = await datasets.toArray();
      for (const ds of allDatasets) {
        // biome-ignore lint/suspicious/noExplicitAny: Legacy Dexie records have dynamic shape
        const legacy = ds as any;
        const needsMigration = legacy.unitId && !legacy.type;

        if (needsMigration) {
          const now = Date.now();
          const metricId = generatePbId();

          // Update the dataset record
          await datasets.update(ds.id, {
            type: "single",
            views: legacy.views?.length ? legacy.views : ["line"],
            updated: now,
          });

          // Create the default metric linking this dataset to its unit
          await metrics.put({
            id: metricId,
            datasetId: ds.id,
            name: "Value",
            unitId: legacy.unitId,
            created: legacy.created || now,
            updated: now,
          });

          metricIdMap.set(ds.id, metricId);
          console.log(`[Dexie Migration] Migrated dataset "${legacy.title}" (${ds.id})`);
        }
      }

      // 2. Migrate measurements: move inline value to measurement_values table
      if (metricIdMap.size > 0) {
        const allMeasurements = await measurements.toArray();
        for (const m of allMeasurements) {
          // biome-ignore lint/suspicious/noExplicitAny: Legacy Dexie records have dynamic shape
          const legacy = m as any;
          const metricId = metricIdMap.get(legacy.datasetId);

          if (metricId && legacy.value !== null && legacy.value !== undefined) {
            const now = Date.now();
            await measurementValues.put({
              id: generatePbId(),
              measurementId: m.id,
              metricId,
              value: legacy.value,
              created: legacy.created || now,
              updated: now,
            });
          }
        }
        console.log(
          `[Dexie Migration] Migrated measurement values for ${metricIdMap.size} dataset(s)`,
        );
      }

      console.log("[Dexie Migration] v6 → v7 migration complete.");
    });

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
