import { dexieDb } from "@/dexieDb";
import { useSync } from "@/modules/sync/useSync";
import { SyncOperation } from "@/types/syncOperations";
import type { ViewType, Dataset } from "@/types/dataset";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";

/**
 * Hook for managing views for a specific dataset.
 *
 * Provides function to update the entire views array.
 * Operations are local-first and optimistic.
 *
 * @param datasetId The slug of the dataset to manage views for.
 */
export function useViews(datasetId: string) {
  const { recordOperation } = useSync();
  const queryClient = useQueryClient();

  /**
   * Helper to update the TanStack Query cache optimistically.
   */
  const updateQueryCache = (updater: (old: Dataset) => Dataset) => {
    const queryKey = trpc.getDataset.queryKey(datasetId);
    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return old;
      return updater(old);
    });
  };

  /**
   * Updates the entire views configuration for the dataset.
   */
  const updateViews = async (views: ViewType[]) => {
    // 1. Update TanStack Query Cache (Optimistic UI)
    updateQueryCache((old) => ({
      ...old,
      views,
    }));

    // 2. Update Dexie (Local Persistence)
    const dataset = await dexieDb.datasets
      .where("slug")
      .equals(datasetId)
      .first();

    if (dataset) {
      await dexieDb.datasets.put({
        ...dataset,
        views,
      });

      // 3. Record Sync Operation (Background Sync)
      await recordOperation(SyncOperation.UPDATE_VIEWS, {
        datasetSlug: datasetId,
        views,
      });
    }
  };

  return {
    updateViews,
  };
}
