import { dexieDb } from "@/dexieDb";
import { useSync } from "@/hooks/useSync";
import { SyncOperation } from "@/types/syncOperations";
import type { ViewType } from "@/types/dataset";

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

  /**
   * Updates the entire views configuration for the dataset.
   */
  const updateViews = async (views: ViewType[]) => {
    // 1. Update Dexie (Local Persistence)
    const dataset = await dexieDb.datasets
      .where("slug")
      .equals(datasetId)
      .first();

    if (dataset) {
      await dexieDb.datasets.put({
        ...dataset,
        views,
      });

      // 2. Record Sync Operation (Background Sync)
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
