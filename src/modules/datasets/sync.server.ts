import { SyncOperation } from "@/types/syncOperations";
import type { ServerReplayHandler } from "@/modules/sync/types";
import {
  createDatasetInternal,
  updateDatasetInternal,
  deleteDatasetInternal,
} from "./router";
import type { Dataset } from "@/types/dataset";

export const serverHandlers: {
  [K in
    | SyncOperation.CREATE_DATASET
    | SyncOperation.UPDATE_DATASET
    | SyncOperation.DELETE_DATASET]: ServerReplayHandler<K>;
} = {
  [SyncOperation.CREATE_DATASET]: async (payload) => {
    await createDatasetInternal(payload as Dataset);
  },
  [SyncOperation.UPDATE_DATASET]: async (payload) => {
    await updateDatasetInternal(payload.id, payload as Partial<Dataset>);
  },
  [SyncOperation.DELETE_DATASET]: async (payload) => {
    await deleteDatasetInternal(payload.id);
  },
};
