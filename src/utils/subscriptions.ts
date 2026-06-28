import { db } from "../lib/dexieDb";
import { createSubscription } from "./subscriptions/createSubscription";

/**
 * Sets up PocketBase realtime subscriptions for all collections.
 * Uses a generic factory to eliminate boilerplate.
 */
export const setupSubscriptions = async (
  reloadFromDexie: () => Promise<void>,
  pbDeltaSync: () => Promise<void>,
) => {
  const unsubscribes = await Promise.all([
    createSubscription("datasets", db.datasets, reloadFromDexie, pbDeltaSync)(),
    createSubscription("metrics", db.metrics, reloadFromDexie, pbDeltaSync)(),
    createSubscription("measurements", db.measurements, reloadFromDexie, pbDeltaSync)(),
    createSubscription("measurement_values", db.measurement_values, reloadFromDexie, pbDeltaSync)(),
    createSubscription("units", db.units, reloadFromDexie, pbDeltaSync)(),
    createSubscription("preferences", db.preferences, reloadFromDexie, pbDeltaSync)(),
  ]);

  return () => {
    unsubscribes.forEach((unsub) => {
      unsub();
    });
  };
};
