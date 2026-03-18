import { create } from "zustand";
import {
  type Dataset,
  type Unit,
  type DatasetRecord,
  type UnitRecord,
  type MeasurementRecord,
} from "./types/dataset";
import { db } from "./dexieDb";

interface DatasetState {
  datasets: Dataset[];
  units: Unit[];
  selectedDatasetId: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;

  // Dataset Actions
  addDataset: (dataset: Dataset) => Promise<void>;
  updateDataset: (dataset: Dataset) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  setSelectedDatasetId: (id: string | null) => void;

  // Unit Actions
  addUnit: (unit: Unit) => Promise<void>;
  updateUnit: (unit: Unit) => Promise<void>;
  removeUnit: (id: string) => Promise<void>;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const buildDatasets = (
  datasetRecords: DatasetRecord[],
  unitRecords: UnitRecord[],
  measurementRecords: MeasurementRecord[],
): Dataset[] => {
  return datasetRecords.map((d) => {
    const unit = unitRecords.find((u) => u.id === d.unitId) || {
      id: "unknown",
      name: "Unknown",
      symbol: "?",
    };
    const measurements = measurementRecords
      .filter((m) => m.datasetId === d.id)
      .map(({ id, timestamp, value }) => ({ id, timestamp, value }));

    return {
      id: d.id,
      title: d.title,
      description: d.description,
      views: d.views,
      createdAt: d.createdAt,
      unit,
      measurements,
    };
  });
};

export const useDatasetStore = create<DatasetState>((set, get) => ({
  datasets: [],
  units: [],
  selectedDatasetId: null,
  isLoading: false,
  error: null,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });
    try {
      const [datasetRecords, unitRecords, measurementRecords] =
        await Promise.all([
          db.datasets.toArray(),
          db.units.toArray(),
          db.measurements.toArray(),
        ]);

      const datasets = buildDatasets(
        datasetRecords,
        unitRecords,
        measurementRecords,
      );

      set({
        datasets,
        units: unitRecords,
        isHydrated: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
      });
    }
  },

  // Dataset Actions
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
      (m) => ({
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
      updatedDataset.measurements.map((m) => ({
        ...m,
        datasetId: updatedDataset.id,
      }));

    await db.transaction("rw", db.datasets, db.measurements, async () => {
      await db.datasets.put(datasetRecord);

      // Sync measurements: simple diffing strategy
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

  // Unit Actions
  addUnit: async (unit) => {
    await db.units.put(unit);
    set((state) => ({ units: [...state.units, unit] }));
  },

  updateUnit: async (unit) => {
    await db.units.put(unit);
    set((state) => ({
      units: state.units.map((u) => (u.id === unit.id ? unit : u)),
      datasets: state.datasets.map((d) =>
        d.unit.id === unit.id ? { ...d, unit } : d,
      ),
    }));
  },

  removeUnit: async (id) => {
    await db.units.delete(id);
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    }));
  },

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
