import { dexieDb } from "@/dexieDb";
import { useSync } from "@/hooks/useSync";
import { SyncOperation } from "@/types/syncOperations";

/**
 * Sub-hook for managing measurements for a specific dataset.
 * Handles adding and removing measurements with complex optimistic updates.
 */
export function useMeasurements(datasetId: string) {
  const { recordOperation } = useSync();

  const addMeasurement = async (variables: {
    value: number;
    timestamp: string;
    datasetSlug?: string;
    id?: string;
  }) => {
    const id = variables.id || `temp-${Math.random().toString(36).slice(2, 9)}`;
    const newMeasurement = { ...variables, id };

    // Fire Dexie update
    const dataset = await dexieDb.datasets
      .where("slug")
      .equals(datasetId)
      .first();
    if (dataset) {
      await dexieDb.datasets.put({
        ...dataset,
        measurements: [...dataset.measurements, newMeasurement],
      } as any);

      // Fire Sync Log
      await recordOperation(SyncOperation.ADD_MEASUREMENT, {
        ...newMeasurement,
        datasetSlug: datasetId,
      });
    }
  };

  const removeMeasurement = async (measurementId: string) => {
    // Fire Dexie update
    const dataset = await dexieDb.datasets
      .where("slug")
      .equals(datasetId)
      .first();
    if (dataset) {
      await dexieDb.datasets.put({
        ...dataset,
        measurements: dataset.measurements.filter(
          (m) => m.id !== measurementId,
        ),
      } as any);

      // Fire Sync Log
      await recordOperation(SyncOperation.REMOVE_MEASUREMENT, {
        id: measurementId,
        datasetSlug: datasetId,
      });
    }
  };

  return {
    addMeasurement,
    removeMeasurement,
    isAddPending: false, // Sync runs in background
    isRemovePending: false,
  };
}
