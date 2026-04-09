import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { generatePbId } from "../../utils/id";
import type {
  Measurement,
  MeasurementRecord,
  MeasurementValueRecord,
} from "../../types/dataset";
import type { DatasetState } from "../types";

export interface MeasurementSlice {
  addMeasurement: (
    datasetId: string,
    measurement: Measurement,
  ) => Promise<void>;
  removeMeasurement: (id: string) => Promise<void>;
}

export const createMeasurementSlice: StateCreator<
  DatasetState,
  [],
  [],
  MeasurementSlice
> = (set, get) => ({
  addMeasurement: async (datasetId, measurement) => {
    const previousDatasets = get().datasets;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === datasetId
          ? { ...d, measurements: [measurement, ...d.measurements] }
          : d,
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

      const valueRecords: MeasurementValueRecord[] = measurement.values.map(
        (v) => ({
          id: generatePbId(), // Use proper 15-char ID for PocketBase
          measurementId: measurement.id,
          metricId: v.metricId,
          value: v.value,
          created: measurementRecord.created,
          updated: Date.now(),
        }),
      );

      // 2. DEXIE: Local Persistence
      await db.transaction(
        "rw",
        db.measurements,
        db.measurement_values,
        async () => {
          await db.measurements.put(measurementRecord);
          await db.measurement_values.bulkPut(valueRecords);
        },
      );

      // 3. POCKETBASE: Remote Persistence
      try {
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
      } catch (pbErr: unknown) {
        if (
          pbErr &&
          typeof pbErr === "object" &&
          "status" in pbErr &&
          pbErr.status === 0
        ) {
          // Record offline operation - Bundle header and values
          await db.offline_ops.add({
            collection: "measurements",
            action: "create",
            recordId: measurementRecord.id,
            data: {
              measurementRecord,
              valueRecords,
            } as any,
            timestamp: Date.now(),
          });
          console.warn("Offline: Recorded bundled measurement in op logs.");
        }
      }
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
      await db.transaction(
        "rw",
        db.measurements,
        db.measurement_values,
        async () => {
          await db.measurements.delete(id);
          await db.measurement_values
            .where("measurementId")
            .equals(id)
            .delete();
        },
      );

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("measurements").delete(id);
      } catch (pbErr: unknown) {
        if (
          pbErr &&
          typeof pbErr === "object" &&
          "status" in pbErr &&
          pbErr.status === 0
        ) {
          await db.offline_ops.add({
            collection: "measurements",
            action: "delete",
            recordId: id,
            data: null,
            timestamp: Date.now(),
          });
        }
      }
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
    }
  },
});
