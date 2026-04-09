import { db } from "../lib/dexieDb";
import { createSubscription } from "./subscriptions/createSubscription";

/**
 * Sets up PocketBase realtime subscriptions for all collections.
 * Uses a generic factory to eliminate boilerplate.
 */
export const setupSubscriptions = () => {
	createSubscription("datasets", db.datasets)();
	createSubscription("metrics", db.metrics)();
	createSubscription("measurements", db.measurements)();
	createSubscription("measurement_values", db.measurement_values)();
	createSubscription("units", db.units)();
	createSubscription("preferences", db.preferences)();
};
