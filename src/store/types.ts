import { type Dataset, type Unit } from "../types/dataset";

export interface DatasetState {
  datasets: Dataset[];
  units: Unit[];
  selectedDatasetId: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  sync: () => Promise<void>;

  // Dataset Actions
  addDataset: (dataset: Dataset) => Promise<void>;
  updateDataset: (dataset: Dataset) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  setSelectedDatasetId: (id: string | null) => void;

  // Unit Actions
  addUnit: (unit: Unit) => Promise<void>;
  updateUnit: (unit: Unit) => Promise<void>;
  removeUnit: (id: string) => Promise<void>;
  populateDefaultUnits: () => Promise<void>;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}
