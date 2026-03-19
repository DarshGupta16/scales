import { type StateCreator } from "zustand";
import { type DatasetState } from "../types";
import { db } from "../../lib/dexieDb";
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
    // Save previous state for potential rollback
    const previousDatasets = get().datasets;

    // OPTIMISTIC UPDATE: Update UI instantly
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

      // BACKGROUND PERSISTENCE: Let Dexie catch up
      await db.datasets.put(datasetRecord);
      if (measurementRecords.length > 0) {
        await db.measurements.bulkPut(measurementRecords);
      }
    } catch (err) {
      // ROLLBACK: Revert to previous state if persistence fails
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to persist dataset:", err);
    }
  },

  updateDataset: async (updatedDataset) => {
    // Save previous state for potential rollback
    const previousDatasets = get().datasets;

    // OPTIMISTIC UPDATE: Update UI instantly
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

      // BACKGROUND PERSISTENCE: Let Dexie catch up
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
    } catch (err) {
      // ROLLBACK: Revert to previous state if persistence fails
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to update dataset:", err);
    }
  },

  removeDataset: async (id) => {
    // Save previous state for potential rollback
    const previousDatasets = get().datasets;

    // OPTIMISTIC UPDATE: Update UI instantly
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
    }));

    try {
      // BACKGROUND PERSISTENCE: Let Dexie catch up
      await Promise.all([
        db.datasets.delete(id),
        db.measurements.where("datasetId").equals(id).delete(),
      ]);
    } catch (err) {
      // ROLLBACK: Revert to previous state if persistence fails
      set({ datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to remove dataset:", err);
    }
  },

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
});
