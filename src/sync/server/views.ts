import { SyncOperation } from "@/types/syncOperations";
import type { ServerReplayHandler } from "@/sync/types";
import { updateViewsInternal } from "@/trpc/routers/views";

export const serverHandlers: {
  [K in SyncOperation.UPDATE_VIEWS]: ServerReplayHandler<K>;
} = {
  [SyncOperation.UPDATE_VIEWS]: async (payload) => {
    await updateViewsInternal(payload.datasetSlug, payload.views);
  },
};
