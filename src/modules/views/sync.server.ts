import { SyncOperation } from "@/types/syncOperations";
import type { ServerReplayHandler } from "@/modules/sync/types";
import { updateViewsInternal } from "./router";

export const serverHandlers: {
  [K in SyncOperation.UPDATE_VIEWS]: ServerReplayHandler<K>;
} = {
  [SyncOperation.UPDATE_VIEWS]: async (payload) => {
    await updateViewsInternal(payload.datasetSlug, payload.views);
  },
};
