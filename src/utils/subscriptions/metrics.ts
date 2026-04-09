import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";

export const subscribeMetrics = () => {
  return pb.collection("metrics").subscribe("*", async (e) => {
    const { record } = e;
    const remoteUpdated = new Date(record.updated).getTime();

    const local = await db.metrics.get(record.id);
    if (local && new Date(local.updated).getTime() >= remoteUpdated) return;

    await useDatasetStore.getState().pbDeltaSync();
  });
};
