import { SyncOperation } from "@/types/syncOperations";
import { dexieDb } from "@/dexieDb";
import type { ClientReplayHandler } from "@/modules/sync/types";

export const clientHandlers: Record<string, ClientReplayHandler> = {
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
      } as any);
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
          value: payload.value,
          timestamp: payload.timestamp,
        };
        await dexieDb.datasets.update(ds.id, {
          measurements: newM,
        } as any);
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
        } as any);
        break;
      }
    }
  },
};
