import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { buildHydrationPayload } from "../helpers";
import {
  mapPbDataset,
  mapPbMeasurement,
  mapPbMeasurementValue,
  mapPbMetric,
  mapPbPreference,
  mapPbUnit,
} from "../mappers";
import type { DatasetState } from "../types";

import { runIntegrityCheck } from "./integrityCheck";

export const pbToLocalSyncStrategy = async (
  set: (state: Partial<DatasetState>) => void,
): Promise<void> => {
  try {
    const [pbDatasets, pbMetrics, pbMeasurements, pbMeasurementValues, pbUnits, pbPreferences] =
      await Promise.all([
        pb.collection("datasets").getFullList({ requestKey: null }),
        pb.collection("metrics").getFullList({ requestKey: null }),
        pb.collection("measurements").getFullList({ requestKey: null }),
        pb.collection("measurement_values").getFullList({ requestKey: null }),
        pb.collection("units").getFullList({ requestKey: null }),
        pb.collection("preferences").getFullList({ requestKey: null }),
      ]);

    const datasetRecords = pbDatasets.map(mapPbDataset);
    const metricRecords = pbMetrics.map(mapPbMetric);
    const measurementRecords = pbMeasurements.map(mapPbMeasurement);
    const valueRecords = pbMeasurementValues.map(mapPbMeasurementValue);
    const unitRecords = pbUnits.map(mapPbUnit);
    const preferenceRecords = pbPreferences.map(mapPbPreference);

    const payload = buildHydrationPayload(
      datasetRecords,
      metricRecords,
      unitRecords,
      measurementRecords,
      valueRecords,
      preferenceRecords,
    );

    set({
      ...payload,
      isLoading: false,
      isHydrated: true,
    });

    // Background: Sync Dexie (Clean Slate)
    const syncDexie = async () => {
      await db.transaction(
        "rw",
        [db.datasets, db.metrics, db.units, db.measurements, db.measurement_values, db.preferences],
        async () => {
          await Promise.all([
            db.datasets.clear(),
            db.metrics.clear(),
            db.units.clear(),
            db.measurements.clear(),
            db.measurement_values.clear(),
            db.preferences.clear(),
          ]);

          await Promise.all([
            db.datasets.bulkPut(datasetRecords),
            db.metrics.bulkPut(metricRecords),
            db.units.bulkPut(unitRecords),
            db.measurements.bulkPut(measurementRecords),
            db.measurement_values.bulkPut(valueRecords),
            db.preferences.bulkPut(preferenceRecords),
          ]);
        },
      );

      // Run integrity check
      runIntegrityCheck();
    };

    syncDexie().catch((err) => console.error("Dexie background sync failed:", err));
  } catch (err) {
    console.error("Pocketbase fetch failed:", err);
    set({ error: (err as Error).message, isLoading: false });
  }
};
