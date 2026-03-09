import { SyncOperation } from "@/types/syncOperations";
import { dexieDb } from "@/dexieDb";
import type { ClientReplayHandler } from "@/sync/types";

export const clientHandlers: {
  [K in
    | SyncOperation.ADD_MEASUREMENT
    | SyncOperation.UPDATE_MEASUREMENT
    | SyncOperation.REMOVE_MEASUREMENT]: ClientReplayHandler<K>;
} = {
  [SyncOperation.ADD_MEASUREMENT]: async (payload) => {
    const dsAdd = await dexieDb.datasets
      .where("slug")
      .equals(payload.datasetSlug)
      .first();
    if (dsAdd) {
      const newMeasurements = [
        ...dsAdd.measurements,
        {
          id: payload.id,
          datasetId: dsAdd.id,
          value: payload.value,
          timestamp: payload.timestamp,
        },
      ];
      // Sort by timestamp just in case
      newMeasurements.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      await dexieDb.datasets.update(dsAdd.id, {
        measurements: newMeasurements,
      });
    }
  },
  [SyncOperation.UPDATE_MEASUREMENT]: async (payload) => {
    const datasetsWithMeasUpdate = await dexieDb.datasets.toArray();
    for (const ds of datasetsWithMeasUpdate) {
      const mIndex = ds.measurements.findIndex((m) => m.id === payload.id);
      if (mIndex !== -1) {
        const newM = [...ds.measurements];
        newM[mIndex] = {
          ...newM[mIndex],
          value: payload.value ?? newM[mIndex].value,
          timestamp: payload.timestamp ?? newM[mIndex].timestamp,
        };
        await dexieDb.datasets.update(ds.id, {
          measurements: newM,
        });
        break;
      }
    }
  },
  [SyncOperation.REMOVE_MEASUREMENT]: async (payload) => {
    const datasetsWithMeasRemove = await dexieDb.datasets.toArray();
    for (const ds of datasetsWithMeasRemove) {
      if (ds.measurements.some((m) => m.id === payload.id)) {
        await dexieDb.datasets.update(ds.id, {
          measurements: ds.measurements.filter((m) => m.id !== payload.id),
        });
        break;
      }
    }
  },
};
