import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { Measurement, MeasurementRecord, MeasurementValueRecord } from "../../types/dataset";
import { generatePbId } from "../../utils/id";
import { tryPbOrQueue } from "../pbSync";
import type { DatasetState } from "../types";
import { backgroundState } from "../dirtyTracking";

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
    const previousDatasetsById = get().datasetsById;
    const previousMeasurementToDatasetMap = get().measurementToDatasetMap;

    if (backgroundState.isPopulating) backgroundState.dirtyDatasetIds.add(datasetId);

    // 1. ZUSTAND: Optimistic Update
    set((state) => {
      const dataset = state.datasetsById[datasetId];
      if (!dataset) return state;
      return {
        datasetsById: {
          ...state.datasetsById,
          [datasetId]: { ...dataset, measurements: [measurement, ...dataset.measurements] },
        },
        measurementToDatasetMap: {
          ...state.measurementToDatasetMap,
          [measurement.id]: datasetId,
        },
      };
    });

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
      set({ datasetsById: previousDatasetsById, measurementToDatasetMap: previousMeasurementToDatasetMap, error: (err as Error).message });
      console.error("Failed to add measurement:", err);
    }
  },

  removeMeasurement: async (id) => {
    const previousDatasetsById = get().datasetsById;
    const previousMeasurementToDatasetMap = get().measurementToDatasetMap;
    const datasetId = previousMeasurementToDatasetMap[id];

    if (datasetId && backgroundState.isPopulating) backgroundState.dirtyDatasetIds.add(datasetId);

    // 1. ZUSTAND: Optimistic Update
    set((state) => {
      const dId = state.measurementToDatasetMap[id];
      if (!dId) return state;
      const dataset = state.datasetsById[dId];
      if (!dataset) return state;
      const { [id]: _, ...restMap } = state.measurementToDatasetMap;
      return {
        datasetsById: {
          ...state.datasetsById,
          [dId]: {
            ...dataset,
            measurements: dataset.measurements.filter((m) => m.id !== id),
          },
        },
        measurementToDatasetMap: restMap,
      };
    });

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
      set({ datasetsById: previousDatasetsById, measurementToDatasetMap: previousMeasurementToDatasetMap, error: (err as Error).message });
    }
  },

  removeMeasurements: async (ids) => {
    const previousDatasetsById = get().datasetsById;
    const previousMeasurementToDatasetMap = get().measurementToDatasetMap;
    const idsSet = new Set(ids);

    const affectedDatasetIds = new Set<string>();
    for (const id of ids) {
      if (previousMeasurementToDatasetMap[id]) affectedDatasetIds.add(previousMeasurementToDatasetMap[id]);
    }
    
    if (backgroundState.isPopulating) {
      for (const dId of affectedDatasetIds) backgroundState.dirtyDatasetIds.add(dId);
    }

    // 1. ZUSTAND: Optimistic Update
    set((state) => {
      const newDatasetsById = { ...state.datasetsById };
      const newMap = { ...state.measurementToDatasetMap };

      for (const id of ids) {
        const dId = newMap[id];
        if (dId && newDatasetsById[dId]) {
          newDatasetsById[dId] = {
            ...newDatasetsById[dId],
            measurements: newDatasetsById[dId].measurements.filter((m) => !idsSet.has(m.id)),
          };
        }
        delete newMap[id];
      }

      return {
        datasetsById: newDatasetsById,
        measurementToDatasetMap: newMap,
      };
    });

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
      set({ datasetsById: previousDatasetsById, measurementToDatasetMap: previousMeasurementToDatasetMap, error: (err as Error).message });
    }
  },
});
