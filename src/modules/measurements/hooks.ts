import { dexieDb } from "@/dexieDb";
import { useSync } from "@/modules/sync/useSync";
import { SyncOperation } from "@/types/syncOperations";
import type { Measurement } from "@/types/dataset";

/**
 * Hook for managing measurements for a specific dataset.
 *
 * Provides functions to add and remove measurements. These operations are
 * local-first and optimistic: they update both the Dexie database and the
 * TanStack Query cache immediately, then record a sync operation.
 *
 * @param datasetId The slug of the dataset to manage measurements for.
 */
export function useMeasurements(datasetId: string) {
  const { recordOperation } = useSync();

  /**
   * Adds a new measurement to the dataset.
   */
  const addMeasurement = async (variables: {
    value: number;
    timestamp: string;
    datasetSlug?: string;
    id?: string;
  }) => {
    // The original `id` variable declaration is removed as `id` is now directly defined in `newMeasurement`.
    const newMeasurement: Measurement = {
      id: variables.id ?? `temp-${Math.random().toString(36).substring(7)}`, // Using the new id generation logic, respecting variables.id if provided
      datasetId: datasetId, // Using the slug/id from the hook context
      value: variables.value,
      timestamp: variables.timestamp,
    };

    // 1. Update Dexie (Local Persistence)
    const dataset = await dexieDb.datasets
      .where("slug")
      .equals(datasetId)
      .first();
    if (dataset) {
      await dexieDb.datasets.put({
        ...dataset,
        measurements: [...dataset.measurements, newMeasurement],
      });

      // 2. Record Sync Operation (Background Sync)
      await recordOperation(SyncOperation.ADD_MEASUREMENT, {
        ...newMeasurement,
        datasetSlug: datasetId,
      });
    }
  };

  /**
   * Removes a measurement from the dataset.
   */
  const removeMeasurement = async (measurementId: string) => {
    // 1. Update Dexie (Local Persistence)
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
      });

      // 2. Record Sync Operation (Background Sync)
      await recordOperation(SyncOperation.REMOVE_MEASUREMENT, {
        id: measurementId,
      });
    }
  };

  return {
    addMeasurement,
    removeMeasurement,
    isAddPending: false,
    isRemovePending: false,
  };
}
