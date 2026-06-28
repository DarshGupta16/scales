import { db } from "../../lib/dexieDb";
import { buildDatasetsMap } from "../helpers";
import type { DatasetState } from "../types";

export const reloadFromDexieStrategy = async (
  set: (state: Partial<DatasetState>) => void,
): Promise<void> => {
  try {
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
  } catch (err) {
    console.error("Failed to reload from Dexie:", err);
  }
};
