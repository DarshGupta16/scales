import { SyncOperation } from "@/types/syncOperations";
import { dexieDb } from "@/dexieDb";
import type { ClientReplayHandler } from "@/modules/sync/types";

export const clientHandlers: Record<string, ClientReplayHandler> = {
  [SyncOperation.CREATE_DATASET]: async (payload) => {
    await dexieDb.datasets.put({
      ...payload,
      isOptimistic: false,
    } as any);
  },
  [SyncOperation.UPDATE_DATASET]: async (payload) => {
    const ds = await dexieDb.datasets.where("id").equals(payload.id).first();
    if (ds) {
      await dexieDb.datasets.update(payload.id, {
        title: payload.title,
        description: payload.description,
        unit: payload.unit,
        slug: payload.slug,
      } as any);
    }
  },
  [SyncOperation.DELETE_DATASET]: async (payload) => {
    await dexieDb.datasets.delete(payload.id);
  },
};
