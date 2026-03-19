import { create } from "zustand";
import { db } from "./lib/dexieDb";
import { type DatasetState } from "./store/types";
import { buildDatasets } from "./store/helpers";
import { createDatasetSlice } from "./store/slices/datasetSlice";
import { createUnitSlice } from "./store/slices/unitSlice";
import { pb } from "./lib/pocketbase";

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
    const fn = async (syncedPocketbase = false) => {
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

        if (!syncedPocketbase) {
          try {
            // Sync with pocketbase and re-call hydrate
            const pbDatasets = await pb.collection("datasets").getFullList();
            const pbMeasurements = await pb
              .collection("measurements")
              .getFullList();
            const pbUnits = await pb.collection("units").getFullList();

            await db.datasets.bulkPut(pbDatasets);
            await db.measurements.bulkPut(pbMeasurements);
            await db.units.bulkPut(pbUnits);

            await fn(true);
          } catch (syncErr) {
            console.error("Pocketbase sync failed:", syncErr);
          }
        }
      } catch (err) {
        set({
          error: (err as Error).message,
          isLoading: false,
        });
      }
    };
    await fn();
  },

  ...createDatasetSlice(set, get, ...args),
  ...createUnitSlice(set, get, ...args),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));

export * from "./store/types";
