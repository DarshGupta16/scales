import { type StateCreator } from "zustand";
import { type DatasetState } from "../types";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import {
  type DatasetRecord,
  type MeasurementRecord,
  type Dataset,
} from "../../types/dataset";

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
        unitId: dataset.unit.id,
        views: dataset.views,
        createdAt: dataset.createdAt,
      };

      const measurementRecords: MeasurementRecord[] = dataset.measurements.map(
        (m) => ({
          ...m,
          datasetId: dataset.id,
        }),
      );

      // 2. DEXIE: Local Persistence
      await db.datasets.put(datasetRecord);
      if (measurementRecords.length > 0) {
        await db.measurements.bulkPut(measurementRecords);
      }

      // 3. POCKETBASE: Remote Persistence
      // Note: We use the client-side ID. PocketBase supports custom IDs (max 15 chars).
      await pb.collection("datasets").create({
        ...datasetRecord,
        unit_id: datasetRecord.unitId, // PocketBase usually uses underscores
      });

      // Batch create measurements if any
      for (const m of measurementRecords) {
        await pb.collection("measurements").create({
          ...m,
          dataset_id: m.datasetId,
        });
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
        unitId: updatedDataset.unit.id,
        views: updatedDataset.views,
        createdAt: updatedDataset.createdAt,
      };

      const measurementRecords: MeasurementRecord[] =
        updatedDataset.measurements.map((m) => ({
          ...m,
          datasetId: updatedDataset.id,
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
      await pb.collection("datasets").update(updatedDataset.id, {
        ...datasetRecord,
        unit_id: datasetRecord.unitId,
      });

      // PocketBase Measurement Sync (Simple version: Delete all and re-add or diff)
      // For simplicity in this local-first flow, we'll follow the Dexie logic
      const pbExisting = await pb
        .collection("measurements")
        .getFullList({ filter: `dataset_id="${updatedDataset.id}"` });
      
      const pbToUpdate = measurementRecords;
      const pbToDelete = pbExisting.filter(
        (ex) => !pbToUpdate.some((up) => up.id === ex.id)
      );

      for (const del of pbToDelete) {
        await pb.collection("measurements").delete(del.id);
      }
      for (const up of pbToUpdate) {
        // PocketBase update/create (upsert)
        try {
          await pb.collection("measurements").update(up.id, { ...up, dataset_id: up.datasetId });
        } catch {
          await pb.collection("measurements").create({ ...up, dataset_id: up.datasetId });
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
        db.datasets.delete(id),
        db.measurements.where("datasetId").equals(id).delete(),
      ]);

      // 3. POCKETBASE: Remote Persistence
      await pb.collection("datasets").delete(id);
      // Measurements are usually deleted via cascade in PB, 
      // but we could manually delete them if needed.
    } catch (err) {
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to remove dataset (PB/Dexie):", err);
    }
  },

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
});
