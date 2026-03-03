import { SyncOperation } from "@/types/syncOperations";
import { db } from "@/db";
import type { ServerReplayHandler } from "@/modules/sync/types";

export const serverHandlers: {
  [K in
    | SyncOperation.CREATE_DATASET
    | SyncOperation.UPDATE_DATASET
    | SyncOperation.DELETE_DATASET]: ServerReplayHandler<K>;
} = {
  [SyncOperation.CREATE_DATASET]: async (payload) => {
    await db.dataset.upsert({
      where: { id: payload.id },
      update: {
        title: payload.title,
        description: payload.description,
        unit: payload.unit,
        slug: payload.slug,
      },
      create: {
        id: payload.id,
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        unit: payload.unit,
      },
    });
  },
  [SyncOperation.UPDATE_DATASET]: async (payload) => {
    await db.dataset.update({
      where: { id: payload.id },
      data: {
        title: payload.title,
        description: payload.description,
        unit: payload.unit,
        slug: payload.slug,
      },
    });
  },
  [SyncOperation.DELETE_DATASET]: async (payload) => {
    await db.dataset.delete({ where: { id: payload.id } });
  },
};
