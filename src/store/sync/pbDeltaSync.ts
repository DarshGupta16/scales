import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { buildDatasetsMap } from "../helpers";
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

export const pbDeltaSyncStrategy = async (
  set: (state: Partial<DatasetState>) => void,
): Promise<void> => {
  try {
    const preferences = await db.preferences.toArray();
    const lastSyncPref = preferences.find((p) => p.preference === "last_sync_time");
    const lastSyncTime = (lastSyncPref?.value as string) || "1970-01-01 00:00:00";

    const filter = `updated > "${lastSyncTime}"`;
    const now = new Date().toISOString().replace("T", " ").split(".")[0];

    const [pbDatasets, pbMetrics, pbMeasurements, pbMeasurementValues, pbUnits, pbPreferences] =
      await Promise.all([
        pb.collection("datasets").getFullList({ filter, requestKey: null }),
        pb.collection("metrics").getFullList({ filter, requestKey: null }),
        pb.collection("measurements").getFullList({ filter, requestKey: null }),
        pb.collection("measurement_values").getFullList({ filter, requestKey: null }),
        pb.collection("units").getFullList({ filter, requestKey: null }),
        pb.collection("preferences").getFullList({ filter, requestKey: null }),
      ]);

    if (
      [pbDatasets, pbMetrics, pbMeasurements, pbMeasurementValues, pbUnits, pbPreferences].every(
        (l) => l.length === 0,
      )
    ) {
      return;
    }

    const datasetRecords = pbDatasets.map(mapPbDataset);
    const metricRecords = pbMetrics.map(mapPbMetric);
    const measurementRecords = pbMeasurements.map(mapPbMeasurement);
    const valueRecords = pbMeasurementValues.map(mapPbMeasurementValue);
    const unitRecords = pbUnits.map(mapPbUnit);
    const preferenceRecords = pbPreferences.map(mapPbPreference);

    await db.transaction(
      "rw",
      [db.datasets, db.metrics, db.units, db.measurements, db.measurement_values, db.preferences],
      async () => {
        if (datasetRecords.length > 0) await db.datasets.bulkPut(datasetRecords);
        if (metricRecords.length > 0) await db.metrics.bulkPut(metricRecords);
        if (unitRecords.length > 0) await db.units.bulkPut(unitRecords);
        if (measurementRecords.length > 0) await db.measurements.bulkPut(measurementRecords);
        if (valueRecords.length > 0) await db.measurement_values.bulkPut(valueRecords);
        if (preferenceRecords.length > 0) await db.preferences.bulkPut(preferenceRecords);

        await db.preferences.put({
          id: lastSyncPref?.id || "last_sync_time",
          preference: "last_sync_time",
          value: now,
          created: lastSyncPref?.created || Date.now(),
          updated: Date.now(),
        });
      },
    );

    const [allDs, allMet, allUnits, allM, allVal, allPref] = await Promise.all([
      db.datasets.toArray(),
      db.metrics.toArray(),
      db.units.toArray(),
      db.measurements.toArray(),
      db.measurement_values.toArray(),
      db.preferences.toArray(),
    ]);

    const result = buildDatasetsMap(allDs, allMet, allUnits, allM, allVal);
    const unitsById: Record<string, typeof allUnits[0]> = {};
    const unitIds: string[] = [];
    for (const u of allUnits) {
      unitsById[u.id] = u;
      unitIds.push(u.id);
    }

    set({
      datasetsById: result.datasetsById,
      datasetIds: result.datasetIds,
      measurementToDatasetMap: result.measurementToDatasetMap,
      unitsById,
      unitIds,
      preferences: allPref,
    });
    
    // Run integrity check
    runIntegrityCheck();
  } catch (err) {
    console.error("Delta sync failed:", err);
  }
};
