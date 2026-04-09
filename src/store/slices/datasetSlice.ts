import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { Dataset, DatasetRecord, MetricRecord } from "../../types/dataset";
import type { DatasetState } from "../types";

export interface DatasetSlice {
  addDataset: (dataset: Dataset) => Promise<void>;
  updateDataset: (dataset: Dataset) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  setSelectedDatasetId: (id: string | null) => void;
}

export const createDatasetSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<
    DatasetState,
    "addDataset" | "updateDataset" | "removeDataset" | "setSelectedDatasetId"
  >
> = (set, get) => ({
  addDataset: async (dataset) => {
    const previousDatasets = get().datasets;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({ datasets: [dataset, ...state.datasets] }));

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

      const metricRecords: MetricRecord[] = dataset.metrics.map((m) => ({
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
      try {
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
      } catch (pbErr: unknown) {
        if (
          pbErr &&
          typeof pbErr === "object" &&
          "status" in pbErr &&
          pbErr.status === 0
        ) {
          // Record offline operation
          await db.offline_ops.add({
            collection: "datasets",
            action: "create",
            recordId: datasetRecord.id,
            data: {
              datasetRecord,
              metricRecords,
              measurementRecords: [],
              measurementValueRecords: [],
            },
            timestamp: Date.now(),
          });
          console.warn("Offline: Recorded dataset creation in op logs.");
        }
      }
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to persist dataset (PB/Dexie):", err);
    }
  },

  updateDataset: async (updatedDataset) => {
    const previousDatasets = get().datasets;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === updatedDataset.id ? updatedDataset : d,
      ),
    }));

    try {
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
      try {
        await pb.collection("datasets").update(updatedDataset.id, {
          title: datasetRecord.title,
          description: datasetRecord.description,
          views: datasetRecord.views,
        });
      } catch (pbErr: unknown) {
        if (
          pbErr &&
          typeof pbErr === "object" &&
          "status" in pbErr &&
          pbErr.status === 0
        ) {
          await db.offline_ops.add({
            collection: "datasets",
            action: "update",
            recordId: updatedDataset.id,
            data: datasetRecord,
            timestamp: Date.now(),
          });
        }
      }
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
    }
  },

  removeDataset: async (id) => {
    const previousDatasets = get().datasets;

    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
    }));

    try {
      // 2. DEXIE: Local Persistence
      await db.transaction(
        "rw",
        db.datasets,
        db.metrics,
        db.measurements,
        db.measurement_values,
        async () => {
          await db.datasets.delete(id);
          await db.metrics.where("datasetId").equals(id).delete();
          await db.measurements.where("datasetId").equals(id).delete();
          // values are harder to query by datasetId directly in Dexie without joins,
          // but measurement cascade delete above handles header.
          // We'll do a proper cleanup of values based on measurementIds.
          const measurements = await db.measurements
            .where("datasetId")
            .equals(id)
            .toArray();
          const mIds = measurements.map((m) => m.id);
          await db.measurement_values
            .where("measurementId")
            .anyOf(mIds)
            .delete();
        },
      );

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("datasets").delete(id);
      } catch (pbErr: unknown) {
        if (
          pbErr &&
          typeof pbErr === "object" &&
          "status" in pbErr &&
          pbErr.status === 0
        ) {
          await db.offline_ops.add({
            collection: "datasets",
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

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
});
