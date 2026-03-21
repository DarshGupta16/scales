import { create } from "zustand";
import { db } from "./lib/dexieDb";
import { buildDatasets } from "./store/helpers";
import { createDatasetSlice } from "./store/slices/datasetSlice";
import { createPreferencesSlice } from "./store/slices/preferencesSlice";
import { createSyncSlice } from "./store/slices/syncSlice";
import { createUnitSlice } from "./store/slices/unitSlice";
import type { DatasetState } from "./store/types";
import { setupSubscriptions } from "./utils/subscriptions";

let subscriptionsSetup = false;

export const useDatasetStore = create<DatasetState>((set, get, ...args) => ({
  datasets: [],
  units: [],
  preferences: [],
  selectedDatasetId: null,
  isLoading: false,
  error: null,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });

    // 1. Setup real-time subscriptions (one-time)
    if (!subscriptionsSetup) {
      setupSubscriptions();
      subscriptionsSetup = true;
    }

    // 2. Setup "online" listener for future syncs
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        get().localToPbSync();
        get().pbToLocalSync();
      });
    }

    try {
      // 3. Load initial state from DEXIE (Fast local-first start)
      const [datasetRecords, unitRecords, measurementRecords, preferenceRecords] =
        await Promise.all([
          db.datasets.toArray(),
          db.units.toArray(),
          db.measurements.toArray(),
          db.preferences.toArray(),
        ]);

      const datasets = buildDatasets(datasetRecords, unitRecords, measurementRecords);

      set({
        datasets,
        units: unitRecords,
        preferences: preferenceRecords,
        isHydrated: true,
      });

      // 4. Populate default units if collection is empty
      if (unitRecords.length === 0) {
        await get().populateDefaultUnits();
      }

      // 5. Perform Full Sync (Two-way)
      await get().localToPbSync();
      await get().pbToLocalSync();

      set({ isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
      });
    }
  },

  ...createDatasetSlice(set, get, ...args),
  ...createUnitSlice(set, get, ...args),
  ...createSyncSlice(set, get, ...args),
  ...createPreferencesSlice(set, get, ...args),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));

interface AppState {
  isAddDatasetModalOpen: boolean;
  isUnitsModalOpen: boolean;

  // Actions
  setAddDatasetModalOpen: (isOpen: boolean) => void;
  setUnitsModalOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAddDatasetModalOpen: false,
  isUnitsModalOpen: false,

  setAddDatasetModalOpen: (isOpen) => set({ isAddDatasetModalOpen: isOpen }),
  setUnitsModalOpen: (isOpen) => set({ isUnitsModalOpen: isOpen }),
}));

export * from "./store/types";
