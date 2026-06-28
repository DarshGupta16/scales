import type { Dataset, PreferenceRecord, Unit } from "../types/dataset";
import type { MeasurementSlice } from "./slices/measurementSlice";
import type { SyncSlice } from "./slices/syncSlice";

export type Preference = PreferenceRecord;

export type PreferenceOp = "upsert" | "delete";

export interface DatasetState extends SyncSlice, MeasurementSlice {
  datasetsById: Record<string, Dataset>;
  datasetIds: string[];
  unitsById: Record<string, Unit>;
  unitIds: string[];
  measurementToDatasetMap: Record<string, string>;
  preferences: Preference[];
  selectedDatasetId: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
  isFullyPopulated: boolean;

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
  populateDefaultUnits: () => Promise<void>;

  // Preference Actions
  updatePreferences: (
    id: string | undefined,
    op: PreferenceOp,
    data?: Partial<Omit<Preference, "id">>,
  ) => Promise<void>;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}
