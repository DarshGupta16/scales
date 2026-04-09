import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";

export const subscribeDatasets = () => {
  return pb.collection("datasets").subscribe("*", async (e) => {
    const { record } = e;
    const remoteUpdated = new Date(record.updated).getTime();

    // IDEMPOTENCY CHECK: Ignore if we already have this or newer
    const local = await db.datasets.get(record.id);
    if (local && local.updated >= remoteUpdated) return;

    await useDatasetStore.getState().pbDeltaSync();
  });
};
