import { subscribeDatasets } from "./subscriptions/datasets";
import { subscribeMeasurements } from "./subscriptions/measurements";
import { subscribePreferences } from "./subscriptions/preferences";
import { subscribeUnits } from "./subscriptions/units";

export const setupSubscriptions = () => {
  subscribeDatasets();
  subscribeMeasurements();
  subscribeUnits();
  subscribePreferences();
};
