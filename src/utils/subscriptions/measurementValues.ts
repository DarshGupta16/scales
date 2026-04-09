import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";

export const subscribeMeasurementValues = () => {
  return pb.collection("measurement_values").subscribe("*", async (e) => {
    const { record } = e;
    const remoteUpdated = new Date(record.updated).getTime();

    const local = await db.measurement_values.get(record.id);
    if (local && local.updated >= remoteUpdated) return;

    await useDatasetStore.getState().pbDeltaSync();
  });
};
