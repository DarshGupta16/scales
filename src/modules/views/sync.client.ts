import { SyncOperation } from "@/types/syncOperations";
import { dexieDb } from "@/dexieDb";
import type { ClientReplayHandler } from "@/modules/sync/types";

export const clientHandlers: Record<string, ClientReplayHandler> = {
  [SyncOperation.ADD_VIEW]: async (payload) => {
    const dsVAdd = await dexieDb.datasets
      .where("id")
      .equals(payload.datasetId)
      .first();
    if (dsVAdd && !dsVAdd.views.includes(payload.type)) {
      await dexieDb.datasets.update(dsVAdd.id, {
        views: [...dsVAdd.views, payload.type],
      } as any);
    }
  },
  [SyncOperation.REMOVE_VIEW]: async (payload) => {
    const dsVRem = await dexieDb.datasets
      .where("id")
      .equals(payload.datasetId)
      .first();
    if (dsVRem) {
      await dexieDb.datasets.update(dsVRem.id, {
        views: dsVRem.views.filter((v) => v !== payload.type),
      } as any);
    }
  },
};
