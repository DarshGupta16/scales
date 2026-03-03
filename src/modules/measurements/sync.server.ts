import { SyncOperation } from "@/types/syncOperations";
import { db } from "@/db";
import type { ServerReplayHandler } from "@/modules/sync/types";

export const serverHandlers: {
  [K in
    | SyncOperation.ADD_MEASUREMENT
    | SyncOperation.UPDATE_MEASUREMENT
    | SyncOperation.REMOVE_MEASUREMENT]: ServerReplayHandler<K>;
} = {
  [SyncOperation.ADD_MEASUREMENT]: async (payload) => {
    await db.measurement.upsert({
      where: { id: payload.id },
      update: {
        value: payload.value,
        timestamp: payload.timestamp,
      },
      create: {
        id: payload.id,
        value: payload.value,
        timestamp: payload.timestamp,
        dataset: { connect: { slug: payload.datasetSlug } },
      },
    });
  },
  [SyncOperation.UPDATE_MEASUREMENT]: async (payload) => {
    await db.measurement.update({
      where: { id: payload.id },
      data: {
        value: payload.value,
        timestamp: payload.timestamp,
      },
    });
  },
  [SyncOperation.REMOVE_MEASUREMENT]: async (payload) => {
    await db.measurement.delete({ where: { id: payload.id } });
  },
};
