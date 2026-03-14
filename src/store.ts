import { create } from "zustand";
import { type Dataset } from "./types/dataset";
import { db } from "./dexieDb";

interface DatasetState {
  datasets: Dataset[];
  selectedDatasetId: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => Promise<void>;
  updateDataset: (dataset: Dataset) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  setSelectedDatasetId: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Zustand store for managing datasets with Dexie persistence.
 * This provides a single source of truth for the UI and ensures
 * that data is kept in sync between memory and local storage.
 */
export const useDatasetStore = create<DatasetState>((set, get) => ({
  datasets: [],
  selectedDatasetId: null,
  isLoading: false,
  error: null,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });
    try {
      const persistedDatasets = (await db.datasets.toArray()) as Dataset[];
      set({ 
        datasets: persistedDatasets, 
        isHydrated: true, 
        isLoading: false 
      });
    } catch (err) {
      set({ 
        error: (err as Error).message, 
        isLoading: false 
      });
    }
  },

  setDatasets: (datasets) => set({ datasets, isLoading: false }),
  
  addDataset: async (dataset) => {
    await db.datasets.put(dataset);
    set((state) => ({ 
      datasets: [dataset, ...state.datasets] 
    }));
  },

  updateDataset: async (updatedDataset) => {
    await db.datasets.put(updatedDataset);
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === updatedDataset.id ? updatedDataset : d
      ),
    }));
  },

  removeDataset: async (id) => {
    await db.datasets.delete(id);
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
    }));
  },

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
}));
