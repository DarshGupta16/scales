import { SyncOperation } from "@/types/syncOperations";
import { dexieDb } from "@/dexieDb";
import type { ClientReplayHandler } from "@/sync/types";

export const clientHandlers: {
  [K in
    | SyncOperation.CREATE_DATASET
    | SyncOperation.UPDATE_DATASET
    | SyncOperation.DELETE_DATASET]: ClientReplayHandler<K>;
} = {
  [SyncOperation.CREATE_DATASET]: async (payload) => {
    await dexieDb.datasets.put({
      ...payload,
      isOptimistic: false,
    });
  },
  [SyncOperation.UPDATE_DATASET]: async (payload) => {
    const ds = await dexieDb.datasets.where("id").equals(payload.id).first();
    if (ds) {
      await dexieDb.datasets.update(payload.id, {
        title: payload.title,
        description: payload.description,
        unit: payload.unit,
        slug: payload.slug,
      });
    }
  },
  [SyncOperation.DELETE_DATASET]: async (payload) => {
    await dexieDb.datasets.delete(payload.id);
  },
};
