import { create } from "zustand";
import { db } from "./lib/dexieDb";
import { type DatasetState } from "./store/types";
import { buildDatasets } from "./store/helpers";
import { createDatasetSlice } from "./store/slices/datasetSlice";
import { createUnitSlice } from "./store/slices/unitSlice";

export const useDatasetStore = create<DatasetState>((set, get, ...args) => ({
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

  ...createDatasetSlice(set, get, ...args),
  ...createUnitSlice(set, get, ...args),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));

export * from "./store/types";
