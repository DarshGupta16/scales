import { type StateCreator } from "zustand";
import { type DatasetState } from "../types";
import { db } from "../../lib/dexieDb";
import {
  type DatasetRecord,
  type MeasurementRecord,
} from "../../types/dataset";

export interface DatasetSlice {
  addDataset: (dataset: any) => Promise<void>;
  updateDataset: (dataset: any) => Promise<void>;
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
> = (set) => ({
  addDataset: async (dataset) => {
    const datasetRecord: DatasetRecord = {
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      unitId: dataset.unit.id,
      views: dataset.views,
      createdAt: dataset.createdAt,
    };

    const measurementRecords: MeasurementRecord[] = dataset.measurements.map(
      (m: any) => ({
        ...m,
        datasetId: dataset.id,
      }),
    );

    await db.datasets.put(datasetRecord);
    if (measurementRecords.length > 0) {
      await db.measurements.bulkPut(measurementRecords);
    }

    set((state) => ({ datasets: [dataset, ...state.datasets] }));
  },

  updateDataset: async (updatedDataset) => {
    const datasetRecord: DatasetRecord = {
      id: updatedDataset.id,
      title: updatedDataset.title,
      description: updatedDataset.description,
      unitId: updatedDataset.unit.id,
      views: updatedDataset.views,
      createdAt: updatedDataset.createdAt,
    };

    const measurementRecords: MeasurementRecord[] =
      updatedDataset.measurements.map((m: any) => ({
        ...m,
        datasetId: updatedDataset.id,
      }));

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

    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === updatedDataset.id ? updatedDataset : d,
      ),
    }));
  },

  removeDataset: async (id) => {
    await Promise.all([
      db.datasets.delete(id),
      db.measurements.where("datasetId").equals(id).delete(),
    ]);
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
    }));
  },

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
});
