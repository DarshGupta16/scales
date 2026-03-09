import { SyncOperation } from "@/types/syncOperations";
import type { ServerReplayHandler } from "@/sync/types";
import {
  addMeasurementInternal,
  removeMeasurementInternal,
} from "@/trpc/routers/measurements";

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
    // Only update if we have the required fields to do an upsert
    if (payload.value !== undefined && payload.timestamp !== undefined) {
      await addMeasurementInternal({
        ...payload,
        value: payload.value,
        timestamp: payload.timestamp,
        datasetSlug: "", // Not needed for update due to ID-based upsert
      });
    }
  },
  [SyncOperation.REMOVE_MEASUREMENT]: async (payload) => {
    await removeMeasurementInternal(payload.id);
  },
};
