import { subscribeDatasets } from "./subscriptions/datasets";
import { subscribeMeasurements } from "./subscriptions/measurements";
import { subscribeMetrics } from "./subscriptions/metrics";
import { subscribeMeasurementValues } from "./subscriptions/measurementValues";
import { subscribePreferences } from "./subscriptions/preferences";
import { subscribeUnits } from "./subscriptions/units";

export const setupSubscriptions = () => {
  subscribeDatasets();
  subscribeMetrics();
  subscribeMeasurements();
  subscribeMeasurementValues();
  subscribeUnits();
  subscribePreferences();
};
