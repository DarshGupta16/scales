import { SyncOperation } from "@/types/syncOperations";
import type { ServerReplayHandler } from "@/modules/sync/types";
import { addMeasurementInternal, removeMeasurementInternal } from "./router";

export const serverHandlers: {
  [K in
    | SyncOperation.ADD_MEASUREMENT
    | SyncOperation.UPDATE_MEASUREMENT
    | SyncOperation.REMOVE_MEASUREMENT]: ServerReplayHandler<K>;
} = {
  [SyncOperation.ADD_MEASUREMENT]: async (payload) => {
    await addMeasurementInternal(payload);
  },
  [SyncOperation.UPDATE_MEASUREMENT]: async (payload) => {
    // Shared with add logic because it's an upsert internally
    await addMeasurementInternal({
      ...payload,
      datasetSlug: "", // Not needed for update due to ID-based upsert
    } as any);
  },
  [SyncOperation.REMOVE_MEASUREMENT]: async (payload) => {
    await removeMeasurementInternal(payload.id);
  },
};
