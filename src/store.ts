import { create } from "zustand";
import { db } from "./lib/dexieDb";
import { backgroundState } from "./store/dirtyTracking";
import { buildDatasetsMap } from "./store/helpers";
import { createDatasetSlice } from "./store/slices/datasetSlice";
import { createMeasurementSlice } from "./store/slices/measurementSlice";
import { createPreferencesSlice } from "./store/slices/preferencesSlice";
import { createSyncSlice } from "./store/slices/syncSlice";
import { createUnitSlice } from "./store/slices/unitSlice";
import { runIntegrityCheck } from "./store/sync/integrityCheck";
import type { DatasetState } from "./store/types";
import { setupSubscriptions } from "./utils/subscriptions";

let subscriptionsSetup = false;

export const useDatasetStore = create<DatasetState>((set, get, ...args) => ({
  datasetsById: {},
  datasetIds: [],
  metricsById: {},
  measurementsById: {},
  valuesById: {},
  unitsById: {},
  unitIds: [],
  measurementToDatasetMap: {},
  preferences: [],
  selectedDatasetId: null,
  isLoading: false,
  error: null,
  isHydrated: false,
  isFullyPopulated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });

    // 1. Setup real-time subscriptions (one-time)
    if (!subscriptionsSetup) {
      setupSubscriptions(get().reloadFromDexie, get().pbDeltaSync);
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
      // 3. Stage A - Fast Hydration (blocking)
      const [datasetRecords, metricRecords, unitRecords, measurementRecords, preferenceRecords] =
        await Promise.all([
          db.datasets.toArray(),
          db.metrics.toArray(),
          db.units.toArray(),
          db.measurements.toArray(),
          db.preferences.toArray(),
        ]);

      // Collect IDs for the latest 7 measurements of each dataset
      const mByDataset = new Map<string, typeof measurementRecords>();
      for (const m of measurementRecords) {
        const list = mByDataset.get(m.datasetId);
        if (list) list.push(m);
        else mByDataset.set(m.datasetId, [m]);
      }

      const recentMeasurementIds = new Set<string>();
      for (const [_, list] of mByDataset.entries()) {
        const sorted = list.sort((a, b) => b.timestamp - a.timestamp);
        const top7 = sorted.slice(0, 7);
        for (const m of top7) recentMeasurementIds.add(m.id);
      }

      const valueRecordsFast = await db.measurement_values
        .where("measurementId")
        .anyOf([...recentMeasurementIds])
        .toArray();

      const fastResult = buildDatasetsMap(
        datasetRecords,
        metricRecords,
        unitRecords,
        measurementRecords,
        valueRecordsFast,
      );

      const unitsById: Record<string, (typeof unitRecords)[0]> = {};
      const unitIds: string[] = [];
      for (const u of unitRecords) {
        unitsById[u.id] = u;
        unitIds.push(u.id);
      }

      set({
        datasetsById: fastResult.datasetsById,
        datasetIds: fastResult.datasetIds,
        metricsById: fastResult.metricsById,
        measurementsById: fastResult.measurementsById,
        valuesById: fastResult.valuesById,
        measurementToDatasetMap: fastResult.measurementToDatasetMap,
        unitsById,
        unitIds,
        preferences: preferenceRecords,
        isHydrated: true,
      });

      // 4. Populate default units if collection is empty
      if (unitRecords.length === 0) {
        await get().populateDefaultUnits();
      }

      // Stage B - Background Population (non-blocking)
      (async () => {
        try {
          backgroundState.isPopulating = true;
          const allValueRecords = await db.measurement_values.toArray();
          const fullResult = buildDatasetsMap(
            datasetRecords,
            metricRecords,
            unitRecords,
            measurementRecords,
            allValueRecords,
          );

          // Re-fetch any datasets that were dirtied during background load
          if (backgroundState.dirtyDatasetIds.size > 0) {
            const dirtyDatasetIds = [...backgroundState.dirtyDatasetIds];

            const dirtyDatasets = await db.datasets.where("id").anyOf(dirtyDatasetIds).toArray();
            const dirtyMetrics = await db.metrics
              .where("datasetId")
              .anyOf(dirtyDatasetIds)
              .toArray();
            const dirtyMeasurements = await db.measurements
              .where("datasetId")
              .anyOf(dirtyDatasetIds)
              .toArray();

            const dirtyMeasurementIds = dirtyMeasurements.map((m) => m.id);
            const dirtyValues =
              dirtyMeasurementIds.length > 0
                ? await db.measurement_values
                    .where("measurementId")
                    .anyOf(dirtyMeasurementIds)
                    .toArray()
                : [];

            const dirtyUnits = await db.units.toArray(); // Keep simple

            const dirtyResult = buildDatasetsMap(
              dirtyDatasets,
              dirtyMetrics,
              dirtyUnits,
              dirtyMeasurements,
              dirtyValues,
            );

            // Merge dirty result over full result
            for (const id of dirtyDatasetIds) {
              if (dirtyResult.datasetsById[id]) {
                fullResult.datasetsById[id] = dirtyResult.datasetsById[id];
              } else {
                delete fullResult.datasetsById[id];
                fullResult.datasetIds = fullResult.datasetIds.filter((did) => did !== id);
              }
            }

            for (const m of dirtyMeasurements) {
              fullResult.measurementToDatasetMap[m.id] = m.datasetId;
            }
          }

          useDatasetStore.setState({
            datasetsById: fullResult.datasetsById,
            datasetIds: fullResult.datasetIds,
            metricsById: fullResult.metricsById,
            measurementsById: fullResult.measurementsById,
            valuesById: fullResult.valuesById,
            measurementToDatasetMap: fullResult.measurementToDatasetMap,
            isFullyPopulated: true,
          });

          backgroundState.dirtyDatasetIds.clear();
          backgroundState.isPopulating = false;

          // Run background integrity check and self-healing
          runIntegrityCheck();
        } catch (bgErr) {
          console.error("Background population failed:", bgErr);
          backgroundState.isPopulating = false;
        }
      })();

      // 5. Perform Full Sync (Two-way)
      await get().localToPbSync();
      await get().pbToLocalSync();

      set({ isLoading: false });
    } catch (err) {
      console.error("Hydration failed:", err);
      let errorMessage = (err as Error).message || "Unknown error occurred";

      // Specifically handle Dexie open/upgrade errors
      if (err && typeof err === "object" && "name" in err) {
        const errorName = (err as { name: string }).name;
        if (
          errorName === "UpgradeError" ||
          errorName === "OpenFailedError" ||
          errorName === "DatabaseClosedError"
        ) {
          errorMessage = `Local database initialization failed (${errorName}). Your local data may be corrupt or fail to migrate: ${errorMessage}`;
        }
      }

      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  ...createDatasetSlice(set, get, ...args),
  ...createMeasurementSlice(set, get, ...args),
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
