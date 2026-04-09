import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";

export const subscribeMeasurements = () => {
  return pb.collection("measurements").subscribe("*", async (e) => {
    const { record } = e;
    const remoteUpdated = new Date(record.updated).getTime();

    const local = await db.measurements.get(record.id);
    if (local && local.updated >= remoteUpdated) return;

    await useDatasetStore.getState().pbDeltaSync();
  });
};
