import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { Dataset, DatasetRecord, MeasurementRecord } from "../../types/dataset";
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
  Pick<DatasetState, "addDataset" | "updateDataset" | "removeDataset" | "setSelectedDatasetId">
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
        unitId: dataset.unit.id,
        views: dataset.views,
        created: dataset.created,
        updated: Date.now(),
      };

      const measurementRecords: MeasurementRecord[] = dataset.measurements.map((m) => ({
        ...m,
        datasetId: dataset.id,
        created: m.timestamp,
        updated: Date.now(),
      }));

      // 2. DEXIE: Local Persistence
      await db.datasets.put(datasetRecord);
      if (measurementRecords.length > 0) {
        await db.measurements.bulkPut(measurementRecords);
      }

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("datasets").create({
          id: datasetRecord.id,
          title: datasetRecord.title,
          description: datasetRecord.description,
          unit_id: datasetRecord.unitId,
          views: datasetRecord.views,
          created: new Date(datasetRecord.created).toISOString(),
        });

        for (const m of measurementRecords) {
          await pb.collection("measurements").create({
            id: m.id,
            dataset_id: m.datasetId,
            value: m.value,
            timestamp: m.timestamp,
            created: new Date(m.created).toISOString(),
          });
        }
      } catch (pbErr: any) {
        if (pbErr.status === 0) {
          // Record offline operation if it's a network error
          await db.offline_ops.add({
            collection: "datasets",
            action: "create",
            recordId: datasetRecord.id,
            data: { datasetRecord, measurementRecords },
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
      datasets: state.datasets.map((d) => (d.id === updatedDataset.id ? updatedDataset : d)),
    }));

    try {
      const datasetRecord: DatasetRecord = {
        id: updatedDataset.id,
        title: updatedDataset.title,
        description: updatedDataset.description,
        unitId: updatedDataset.unit.id,
        views: updatedDataset.views,
        created: updatedDataset.created,
        updated: Date.now(),
      };

      const measurementRecords: MeasurementRecord[] = updatedDataset.measurements.map((m) => ({
        ...m,
        datasetId: updatedDataset.id,
        created: (m as any).created || m.timestamp,
        updated: Date.now(),
      }));

      // 2. DEXIE: Local Persistence
      await db.transaction("rw", db.datasets, db.measurements, async () => {
        await db.datasets.put(datasetRecord);

        const existingMeasurements = await db.measurements
          .where("datasetId")
          .equals(updatedDataset.id)
          .toArray();
        const existingIds = existingMeasurements.map((m) => m.id);

        const newIds = measurementRecords.map((m) => m.id);
        const toDelete = existingIds.filter((id) => !newIds.includes(id));

        if (toDelete.length > 0) {
          await db.measurements.bulkDelete(toDelete);
        }
        if (measurementRecords.length > 0) {
          await db.measurements.bulkPut(measurementRecords);
        }
      });

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("datasets").update(updatedDataset.id, {
          title: datasetRecord.title,
          description: datasetRecord.description,
          unit_id: datasetRecord.unitId,
          views: datasetRecord.views,
        });

        const pbExisting = await pb
          .collection("measurements")
          .getFullList({ filter: `dataset_id="${updatedDataset.id}"` });

        const pbToUpdate = measurementRecords;
        const pbToDelete = pbExisting.filter((ex) => !pbToUpdate.some((up) => up.id === ex.id));

        for (const del of pbToDelete) {
          await pb.collection("measurements").delete(del.id);
        }
        for (const up of pbToUpdate) {
          try {
            await pb.collection("measurements").update(up.id, {
              value: up.value,
              timestamp: up.timestamp,
              dataset_id: up.datasetId,
            });
          } catch {
            await pb.collection("measurements").create({
              id: up.id,
              value: up.value,
              timestamp: up.timestamp,
              dataset_id: up.datasetId,
              created: new Date(up.created).toISOString(),
            });
          }
        }
      } catch (pbErr: any) {
        if (pbErr.status === 0) {
          // Record offline operation
          await db.offline_ops.add({
            collection: "datasets",
            action: "update",
            recordId: updatedDataset.id,
            data: { datasetRecord, measurementRecords },
            timestamp: Date.now(),
          });
          console.warn("Offline: Recorded dataset update in op logs.");
        }
      }
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to update dataset (PB/Dexie):", err);
    }
  },

  removeDataset: async (id) => {
    const previousDatasets = get().datasets;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
    }));

    try {
      // 2. DEXIE: Local Persistence
      await Promise.all([
        db.datasets.delete(id as any),
        db.measurements.where("datasetId").equals(id).delete(),
      ]);

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("datasets").delete(id);
      } catch (pbErr: any) {
        if (pbErr.status === 0) {
          // Record offline operation
          await db.offline_ops.add({
            collection: "datasets",
            action: "delete",
            recordId: id,
            data: null,
            timestamp: Date.now(),
          });
          console.warn("Offline: Recorded dataset deletion in op logs.");
        }
      }
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to remove dataset (PB/Dexie):", err);
    }
  },

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
});
