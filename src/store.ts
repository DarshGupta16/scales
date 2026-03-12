import { create } from "zustand";
import { type Dataset } from "./types/dataset";

interface DatasetState {
  datasets: Dataset[];
  selectedDatasetId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  updateDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  setSelectedDatasetId: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Zustand store for managing datasets in-memory.
 * This works alongside Dexie for persistence, providing a reactive
 * state container for the UI.
 */
export const useDatasetStore = create<DatasetState>((set) => ({
  datasets: [],
  selectedDatasetId: null,
  isLoading: false,
  error: null,

  setDatasets: (datasets) => set({ datasets, isLoading: false }),
  
  addDataset: (dataset) =>
    set((state) => ({ 
      datasets: [dataset, ...state.datasets] 
    })),

  updateDataset: (updatedDataset) =>
    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === updatedDataset.id ? updatedDataset : d
      ),
    })),

  removeDataset: (id) =>
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
    })),

  setSelectedDatasetId: (id) => set({ selectedDatasetId: id }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
}));
