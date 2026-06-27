import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { Measurement, MeasurementRecord, MeasurementValueRecord } from "../../types/dataset";
import { generatePbId } from "../../utils/id";
import { tryPbOrQueue } from "../pbSync";
import type { DatasetState } from "../types";

export interface MeasurementSlice {
  addMeasurement: (datasetId: string, measurement: Measurement) => Promise<void>;
  removeMeasurement: (id: string) => Promise<void>;
  removeMeasurements: (ids: string[]) => Promise<void>;
}

export const createMeasurementSlice: StateCreator<DatasetState, [], [], MeasurementSlice> = (
  set,
  get,
) => ({
  addMeasurement: async (datasetId, measurement) => {
    const previousDatasets = get().datasets;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === datasetId ? { ...d, measurements: [measurement, ...d.measurements] } : d,
      ),
    }));

    try {
      const measurementRecord: MeasurementRecord = {
        id: measurement.id,
        datasetId,
        timestamp: measurement.timestamp,
        created: measurement.created || Date.now(),
        updated: Date.now(),
      };

      const valueRecords: MeasurementValueRecord[] = measurement.values.map((v) => ({
        id: generatePbId(),
        measurementId: measurement.id,
        metricId: v.metricId,
        value: v.value,
        created: measurementRecord.created,
        updated: Date.now(),
      }));

      // 2. DEXIE: Local Persistence
      await db.transaction("rw", db.measurements, db.measurement_values, async () => {
        await db.measurements.put(measurementRecord);
        await db.measurement_values.bulkPut(valueRecords);
      });

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
          await pb.collection("measurements").create({
            id: measurementRecord.id,
            dataset_id: datasetId,
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
        },
        {
          collection: "measurements",
          action: "create",
          recordId: measurementRecord.id,
          // biome-ignore lint/suspicious/noExplicitAny: Sync queue expects arbitrary structure
          data: { measurementRecord, valueRecords } as any,
        },
      );
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to add measurement:", err);
    }
  },

  removeMeasurement: async (id) => {
    const previousDatasets = get().datasets;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      datasets: state.datasets.map((d) => ({
        ...d,
        measurements: d.measurements.filter((m) => m.id !== id),
      })),
    }));

    try {
      // 2. DEXIE: Local Persistence
      await db.transaction("rw", db.measurements, db.measurement_values, async () => {
        await db.measurements.delete(id);
        await db.measurement_values.where("measurementId").equals(id).delete();
      });

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
          await pb.collection("measurements").delete(id);
        },
        {
          collection: "measurements",
          action: "delete",
          recordId: id,
          data: null,
        },
      );
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
    }
  },

  removeMeasurements: async (ids) => {
    const previousDatasets = get().datasets;
    const idsSet = new Set(ids);

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      datasets: state.datasets.map((d) => ({
        ...d,
        measurements: d.measurements.filter((m) => !idsSet.has(m.id)),
      })),
    }));

    try {
      // 2. DEXIE: Local Persistence
      await db.transaction("rw", db.measurements, db.measurement_values, async () => {
        await db.measurements.bulkDelete(ids);
        await db.measurement_values.where("measurementId").anyOf(ids).delete();
      });

      // 3. POCKETBASE: Remote Persistence
      await Promise.all(
        ids.map((id) =>
          tryPbOrQueue(
            async () => {
              await pb.collection("measurements").delete(id);
            },
            {
              collection: "measurements",
              action: "delete",
              recordId: id,
              data: null,
            },
          ),
        ),
      );
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
    }
  },
});
