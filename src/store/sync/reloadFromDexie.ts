import { db } from "../../lib/dexieDb";
import { buildHydrationPayload } from "../helpers";
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

    const payload = buildHydrationPayload(allDs, allMet, allUnits, allM, allVal, allPref);
    set(payload);
  } catch (err) {
    console.error("Failed to reload from Dexie:", err);
  }
};
