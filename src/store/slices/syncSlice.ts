import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { DatasetRecord, MeasurementValueRecord, MetricRecord } from "../../types/dataset";
import { buildDatasets } from "../helpers";
import {
  mapPbDataset,
  mapPbMeasurement,
  mapPbMeasurementValue,
  mapPbMetric,
  mapPbPreference,
  mapPbUnit,
} from "../mappers";
import type { DatasetState } from "../types";

export interface SyncSlice {
  localToPbSync: () => Promise<void>;
  pbToLocalSync: () => Promise<void>;
  pbDeltaSync: () => Promise<void>;
}

// Tested in tests/store/slices/syncSlice.test.ts
export const createSyncSlice: StateCreator<DatasetState, [], [], SyncSlice> = (set, _get) => ({
  localToPbSync: async () => {
    const ops = await db.offline_ops.orderBy("timestamp").toArray();
    if (ops.length === 0) return;

    console.log(`Syncing ${ops.length} offline operations to PocketBase...`);

    for (const op of ops) {
      try {
        const collection = pb.collection(op.collection);

        if (op.action === "create") {
          if (op.collection === "datasets") {
            const data = op.data as {
              datasetRecord: DatasetRecord;
              metricRecords: MetricRecord[];
            };
            const { datasetRecord, metricRecords } = data;

            await pb.collection("datasets").create({
              id: datasetRecord.id,
              title: datasetRecord.title,
              description: datasetRecord.description,
              type: datasetRecord.type,
              views: datasetRecord.views,
              created: new Date(datasetRecord.created).toISOString(),
            });

            for (const metric of metricRecords) {
              await pb.collection("metrics").create({
                id: metric.id,
                dataset_id: metric.datasetId,
                name: metric.name,
                unit_id: metric.unitId,
                created: new Date(metric.created).toISOString(),
              });
            }
          } else if (op.collection === "measurements") {
            // biome-ignore lint/suspicious/noExplicitAny: Sync payload
            const data = op.data as any;

            const measurementRecord = data.measurementRecord || data;
            const valueRecords = data.valueRecords || [];

            await pb.collection("measurements").create({
              id: measurementRecord.id,
              dataset_id: measurementRecord.datasetId,
              timestamp: measurementRecord.timestamp,
              created: new Date(measurementRecord.created).toISOString(),
            });

            for (const v of valueRecords) {
              await pb.collection("measurement_values").create({
                id: v.id,
                measurement_id: v.measurementId,
                metric_id: v.metricId,
                value: v.value,
                created: new Date(v.created).toISOString(),
              });
            }
          } else if (op.collection === "measurement_values") {
            const data = op.data as MeasurementValueRecord;
            await pb.collection("measurement_values").create({
              id: data.id,
              measurement_id: data.measurementId,
              metric_id: data.metricId,
              value: data.value,
              created: new Date(data.created).toISOString(),
            });
          } else {
            if (op.data) await collection.create(op.data);
          }
        } else if (op.action === "update") {
          if (op.collection === "datasets") {
            const data = op.data as { datasetRecord: DatasetRecord };
            const { datasetRecord } = data;
            await collection.update(op.recordId, {
              title: datasetRecord.title,
              description: datasetRecord.description,
              views: datasetRecord.views,
            });
          } else {
            if (op.data) await collection.update(op.recordId, op.data);
          }
        } else if (op.action === "delete") {
          try {
            await collection.delete(op.recordId);
          } catch (err: unknown) {
            if (err && typeof err === "object" && "status" in err && err.status !== 404) throw err;
          }
        }

        if (op.id !== undefined) {
          await db.offline_ops.delete(op.id);
        }
      } catch (err) {
        console.error(`Failed to sync op ${op.id}:`, err);
        if (!navigator.onLine) break;
      }
    }
  },

  pbToLocalSync: async () => {
    try {
      const [pbDatasets, pbMetrics, pbMeasurements, pbMeasurementValues, pbUnits, pbPreferences] =
        await Promise.all([
          pb.collection("datasets").getFullList({ requestKey: null }),
          pb.collection("metrics").getFullList({ requestKey: null }),
          pb.collection("measurements").getFullList({ requestKey: null }),
          pb.collection("measurement_values").getFullList({ requestKey: null }),
          pb.collection("units").getFullList({ requestKey: null }),
          pb.collection("preferences").getFullList({ requestKey: null }),
        ]);

      const datasetRecords = pbDatasets.map(mapPbDataset);
      const metricRecords = pbMetrics.map(mapPbMetric);
      const measurementRecords = pbMeasurements.map(mapPbMeasurement);
      const valueRecords = pbMeasurementValues.map(mapPbMeasurementValue);
      const unitRecords = pbUnits.map(mapPbUnit);
      const preferenceRecords = pbPreferences.map(mapPbPreference);

      const datasets = buildDatasets(
        datasetRecords,
        metricRecords,
        unitRecords,
        measurementRecords,
        valueRecords,
      );
      set({
        datasets,
        units: unitRecords,
        preferences: preferenceRecords,
        isLoading: false,
        isHydrated: true,
      });

      // Background: Sync Dexie (Clean Slate)
      const syncDexie = async () => {
        await Promise.all([
          db.datasets.clear(),
          db.metrics.clear(),
          db.units.clear(),
          db.measurements.clear(),
          db.measurement_values.clear(),
          db.preferences.clear(),
        ]);

        await Promise.all([
          db.datasets.bulkPut(datasetRecords),
          db.metrics.bulkPut(metricRecords),
          db.units.bulkPut(unitRecords),
          db.measurements.bulkPut(measurementRecords),
          db.measurement_values.bulkPut(valueRecords),
          db.preferences.bulkPut(preferenceRecords),
        ]);
      };

      syncDexie().catch((err) => console.error("Dexie background sync failed:", err));
    } catch (err) {
      console.error("Pocketbase fetch failed:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  pbDeltaSync: async () => {
    try {
      const preferences = await db.preferences.toArray();
      const lastSyncPref = preferences.find((p) => p.preference === "last_sync_time");
      const lastSyncTime = (lastSyncPref?.value as string) || "1970-01-01 00:00:00";

      const filter = `updated > "${lastSyncTime}"`;
      const now = new Date().toISOString().replace("T", " ").split(".")[0];

      const [pbDatasets, pbMetrics, pbMeasurements, pbMeasurementValues, pbUnits, pbPreferences] =
        await Promise.all([
          pb.collection("datasets").getFullList({ filter, requestKey: null }),
          pb.collection("metrics").getFullList({ filter, requestKey: null }),
          pb.collection("measurements").getFullList({ filter, requestKey: null }),
          pb.collection("measurement_values").getFullList({ filter, requestKey: null }),
          pb.collection("units").getFullList({ filter, requestKey: null }),
          pb.collection("preferences").getFullList({ filter, requestKey: null }),
        ]);

      if (
        [pbDatasets, pbMetrics, pbMeasurements, pbMeasurementValues, pbUnits, pbPreferences].every(
          (l) => l.length === 0,
        )
      ) {
        return;
      }

      const datasetRecords = pbDatasets.map(mapPbDataset);
      const metricRecords = pbMetrics.map(mapPbMetric);
      const measurementRecords = pbMeasurements.map(mapPbMeasurement);
      const valueRecords = pbMeasurementValues.map(mapPbMeasurementValue);
      const unitRecords = pbUnits.map(mapPbUnit);
      const preferenceRecords = pbPreferences.map(mapPbPreference);

      await db.transaction(
        "rw",
        [db.datasets, db.metrics, db.units, db.measurements, db.measurement_values, db.preferences],
        async () => {
          if (datasetRecords.length > 0) await db.datasets.bulkPut(datasetRecords);
          if (metricRecords.length > 0) await db.metrics.bulkPut(metricRecords);
          if (unitRecords.length > 0) await db.units.bulkPut(unitRecords);
          if (measurementRecords.length > 0) await db.measurements.bulkPut(measurementRecords);
          if (valueRecords.length > 0) await db.measurement_values.bulkPut(valueRecords);
          if (preferenceRecords.length > 0) await db.preferences.bulkPut(preferenceRecords);

          await db.preferences.put({
            id: lastSyncPref?.id || "last_sync_time",
            preference: "last_sync_time",
            value: now,
            created: lastSyncPref?.created || Date.now(),
            updated: Date.now(),
          });
        },
      );

      const [allDs, allMet, allUnits, allM, allVal, allPref] = await Promise.all([
        db.datasets.toArray(),
        db.metrics.toArray(),
        db.units.toArray(),
        db.measurements.toArray(),
        db.measurement_values.toArray(),
        db.preferences.toArray(),
      ]);

      set({
        datasets: buildDatasets(allDs, allMet, allUnits, allM, allVal),
        units: allUnits,
        preferences: allPref,
      });
    } catch (err) {
      console.error("Delta sync failed:", err);
    }
  },
});
