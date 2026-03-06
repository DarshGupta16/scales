import { SyncOperation } from "@/types/syncOperations";
import { dexieDb } from "@/dexieDb";
import type { ClientReplayHandler } from "@/modules/sync/types";

export const clientHandlers: {
  [K in SyncOperation.UPDATE_VIEWS]: ClientReplayHandler<K>;
} = {
  [SyncOperation.UPDATE_VIEWS]: async (payload) => {
    const dataset = await dexieDb.datasets
      .where("slug")
      .equals(payload.datasetSlug)
      .first();
    if (dataset) {
      await dexieDb.datasets.update(dataset.id, {
        views: payload.views,
      });
    }
  },
};
