import { db } from "../../lib/dexieDb";
import { buildDatasets } from "../helpers";
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

    set({
      datasets: buildDatasets(allDs, allMet, allUnits, allM, allVal),
      units: allUnits,
      preferences: allPref,
    });
  } catch (err) {
    console.error("Failed to reload from Dexie:", err);
  }
};
