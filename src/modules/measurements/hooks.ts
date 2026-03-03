import { dexieDb } from "@/dexieDb";
import { useSync } from "@/modules/sync/useSync";
import { SyncOperation } from "@/types/syncOperations";
import type { Measurement, Dataset } from "@/types/dataset";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";

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
  const queryClient = useQueryClient();

  /**
   * Helper to update the TanStack Query cache optimistically.
   */
  const updateQueryCache = (updater: (old: Dataset) => Dataset) => {
    const queryKey = trpc.getDataset.queryKey(datasetId);
    queryClient.setQueryData(queryKey, (old: Dataset | undefined) => {
      if (!old) return old;
      return updater(old);
    });
  };

  /**
   * Adds a new measurement to the dataset.
   */
  const addMeasurement = async (variables: {
    value: number;
    timestamp: string;
    datasetSlug?: string;
    id?: string;
  }) => {
    const id = variables.id ?? `temp-${Math.random().toString(36).slice(2, 9)}`;
    const newMeasurement: Measurement = { 
      id,
      value: variables.value,
      timestamp: variables.timestamp
    };

    // 1. Update TanStack Query Cache (Optimistic UI)
    updateQueryCache((old) => ({
      ...old,
      measurements: [...old.measurements, newMeasurement].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    }));

    // 2. Update Dexie (Local Persistence)
    const dataset = await dexieDb.datasets
      .where("slug")
      .equals(datasetId)
      .first();
    if (dataset) {
      await dexieDb.datasets.put({
        ...dataset,
        measurements: [...dataset.measurements, newMeasurement],
      });

      // 3. Record Sync Operation (Background Sync)
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
    // 1. Update TanStack Query Cache (Optimistic UI)
    updateQueryCache((old) => ({
      ...old,
      measurements: old.measurements.filter((m) => m.id !== measurementId),
    }));

    // 2. Update Dexie (Local Persistence)
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

      // 3. Record Sync Operation (Background Sync)
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
