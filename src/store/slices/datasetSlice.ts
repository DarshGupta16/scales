import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type {
  Dataset,
  DatasetRecord,
  MeasurementRecord,
  MeasurementValueRecord,
  Metric,
  MetricRecord,
} from "../../types/dataset";
import { backgroundState } from "../dirtyTracking";
import { tryPbOrQueue } from "../pbSync";
import type { DatasetState } from "../types";

export interface DatasetSlice {
  addDataset: (dataset: Dataset, metrics?: Metric[]) => Promise<void>;
  updateDataset: (dataset: Dataset) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  setSelectedDatasetId: (id: string | null) => void;
}

export const createDatasetSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<DatasetState, "addDataset" | "updateDataset" | "removeDataset" | "setSelectedDatasetId">
> = (set, get) => ({
  addDataset: async (dataset, metrics: Metric[] = []) => {
    const previousDatasetsById = get().datasetsById;
    const previousDatasetIds = get().datasetIds;
    const previousMetricsById = get().metricsById;

    if (backgroundState.isPopulating) backgroundState.dirtyDatasetIds.add(dataset.id);

    // 1. ZUSTAND: Optimistic Update
    set((state) => {
      const newMetricsById = { ...state.metricsById };
      for (const m of metrics) newMetricsById[m.id] = m;
      return {
        datasetsById: { ...state.datasetsById, [dataset.id]: dataset },
        datasetIds: [dataset.id, ...state.datasetIds],
        metricsById: newMetricsById,
      };
    });

    try {
      const datasetRecord: DatasetRecord = {
        id: dataset.id,
        title: dataset.title,
        description: dataset.description,
        type: dataset.type,
        views: dataset.views,
        created: dataset.created,
        updated: Date.now(),
      };

      const metricRecords: MetricRecord[] = metrics.map((m) => ({
        id: m.id,
        datasetId: dataset.id,
        name: m.name,
        unitId: m.unit.id,
        created: dataset.created,
        updated: Date.now(),
      }));

      // 2. DEXIE: Local Persistence (Transactional)
      await db.transaction("rw", db.datasets, db.metrics, async () => {
        await db.datasets.put(datasetRecord);
        await db.metrics.bulkPut(metricRecords);
      });

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
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
        },
        {
          collection: "datasets",
          action: "create",
          recordId: datasetRecord.id,
          data: {
            datasetRecord,
            metricRecords,
            measurementRecords: [],
            measurementValueRecords: [],
          },
        },
      );
    } catch (err) {
      set({
        datasetsById: previousDatasetsById,
        datasetIds: previousDatasetIds,
        metricsById: previousMetricsById,
        error: (err as Error).message,
      });
      await db.transaction("rw", db.datasets, db.metrics, async () => {
        await db.datasets.delete(dataset.id);
        const metricIds = metrics.map((m) => m.id);
        await db.metrics.bulkDelete(metricIds);
      });
      console.error("Failed to persist dataset (PB/Dexie):", err);
    }
  },

  updateDataset: async (updatedDataset) => {
    const previousDatasetsById = get().datasetsById;

    if (backgroundState.isPopulating) backgroundState.dirtyDatasetIds.add(updatedDataset.id);

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      datasetsById: { ...state.datasetsById, [updatedDataset.id]: updatedDataset },
    }));

    let prevDataset: DatasetRecord | undefined;
    try {
      prevDataset = await db.datasets.get(updatedDataset.id);
      const datasetRecord: DatasetRecord = {
        id: updatedDataset.id,
        title: updatedDataset.title,
        description: updatedDataset.description,
        type: updatedDataset.type,
        views: updatedDataset.views,
        created: updatedDataset.created,
        updated: Date.now(),
      };

      // 2. DEXIE: Local Persistence
      await db.datasets.put(datasetRecord);

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
          await pb.collection("datasets").update(updatedDataset.id, {
            title: datasetRecord.title,
            description: datasetRecord.description,
            views: datasetRecord.views,
          });
        },
        {
          collection: "datasets",
          action: "update",
          recordId: updatedDataset.id,
          data: datasetRecord,
        },
      );
    } catch (err) {
      set({ datasetsById: previousDatasetsById, error: (err as Error).message });
      if (prevDataset) await db.datasets.put(prevDataset);
    }
  },

  removeDataset: async (id) => {
    const previousDatasetsById = get().datasetsById;
    const previousDatasetIds = get().datasetIds;

    if (backgroundState.isPopulating) backgroundState.dirtyDatasetIds.add(id);

    set((state) => {
      const { [id]: datasetToDelete, ...restDatasets } = state.datasetsById;

      // Also remove its metrics from metricsById
      const newMetricsById = { ...state.metricsById };
      if (datasetToDelete?.metricIds) {
        for (const mId of datasetToDelete.metricIds) {
          delete newMetricsById[mId];
        }
      }

      // Also remove its measurements and values
      const newMeasurementsById = { ...state.measurementsById };
      const newValuesById = { ...state.valuesById };
      if (datasetToDelete?.measurementIds) {
        for (const mId of datasetToDelete.measurementIds) {
          const meas = newMeasurementsById[mId];
          if (meas?.valueIds) {
            for (const vId of meas.valueIds) {
              delete newValuesById[vId];
            }
          }
          delete newMeasurementsById[mId];
        }
      }

      return {
        datasetsById: restDatasets,
        datasetIds: state.datasetIds.filter((dId) => dId !== id),
        metricsById: newMetricsById,
        measurementsById: newMeasurementsById,
        valuesById: newValuesById,
      };
    });

    let prevDataset: DatasetRecord | undefined;
    let prevMetrics: MetricRecord[] | undefined;
    let prevMeasurements: MeasurementRecord[] | undefined;
    let prevValues: MeasurementValueRecord[] | undefined;

    try {
      prevDataset = await db.datasets.get(id);
      prevMetrics = await db.metrics.where("datasetId").equals(id).toArray();
      prevMeasurements = await db.measurements.where("datasetId").equals(id).toArray();
      const mIds = prevMeasurements.map((m) => m.id);
      prevValues =
        mIds.length > 0
          ? await db.measurement_values.where("measurementId").anyOf(mIds).toArray()
          : [];

      // 2. DEXIE: Local Persistence
      // Note: Dexie cascade hooks (dexieDb.ts) automatically handle
      // deleting related metrics, measurements, and measurement_values.
      await db.transaction(
        "rw",
        db.datasets,
        db.metrics,
        db.measurements,
        db.measurement_values,
        async () => {
          await db.datasets.delete(id);
        },
      );

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
          await pb.collection("datasets").delete(id);
        },
        {
          collection: "datasets",
          action: "delete",
          recordId: id,
          data: null,
        },
      );
    } catch (err) {
      set({
        datasetsById: previousDatasetsById,
        datasetIds: previousDatasetIds,
        error: (err as Error).message,
      });
      await db.transaction(
        "rw",
        db.datasets,
        db.metrics,
        db.measurements,
        db.measurement_values,
        async () => {
          if (prevDataset) await db.datasets.put(prevDataset);
          if (prevMetrics && prevMetrics.length > 0) await db.metrics.bulkPut(prevMetrics);
          if (prevMeasurements && prevMeasurements.length > 0)
            await db.measurements.bulkPut(prevMeasurements);
          if (prevValues && prevValues.length > 0) await db.measurement_values.bulkPut(prevValues);
        },
      );
    }
  },

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
});
