import { SyncOperation } from "@/types/syncOperations";
import { db } from "@/db";
import type { ServerReplayHandler } from "@/modules/sync/types";

export const serverHandlers: Record<string, ServerReplayHandler> = {
  [SyncOperation.ADD_VIEW]: async (payload) => {
    await db.datasetView.create({
      data: {
        id: payload.id,
        type: payload.type,
        dataset: { connect: { id: payload.datasetId } },
      },
    });
  },
  [SyncOperation.REMOVE_VIEW]: async (payload) => {
    await db.datasetView.delete({ where: { id: payload.id } });
  },
};
