import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { trpc } from "@/trpc/client";
import { dexieDb } from "@/dexieDb";
import { SyncOperation } from "@/types/syncOperations";
import type { Dataset } from "@/types/dataset";
// We import useSync from its new location, or the old one until it moves.
// PLAN.md says to update useSync imports across files at the end. For now we use the old path or the new one?
// Wait, the plan says Phase 2 creates hooks, Phase 5 moves useSync. We will just use new path or old path. Let's use old path for now and let tsc pass, or just new path. The plan says "Phase 5 Update useSync imports". Let's use the current path `src/hooks/useSync` so Phase 2 tests pass, then update it later, OR just update it all at the end.
import { useSync } from "@/hooks/useSync";

/**
 * Sub-hook for managing the collection of datasets.
 * Handles fetching the list, syncing to local DB, and adding new datasets.
 */
export function useDatasetCollection() {
  const { recordOperation } = useSync();

  const localDatasets = useLiveQuery(() => dexieDb.datasets.toArray()) || [];

  const datasetsQuery = useQuery({
    ...trpc.getDatasets.queryOptions(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const serverDatasets = datasetsQuery.data;

  const createDataset = async (newDataset: Dataset) => {
    // Fire Dexie update immediately
    await dexieDb.datasets.put({
      ...newDataset,
      isOptimistic: false, // Local-first, no longer "optimistic"
    } as any);

    // Record the operation which automatically triggers a sync to the server
    await recordOperation(SyncOperation.CREATE_DATASET, newDataset);
  };

  return {
    datasets: serverDatasets || localDatasets,
    isCollectionLoading: datasetsQuery.isLoading && localDatasets.length === 0,
    collectionError: datasetsQuery.error,
    createDataset,
    isUpsertPending: false, // Sync runs in background
  };
}

/**
 * Sub-hook for managing a single dataset's detailed data.
 * Handles fetching simple details and syncing to local DB.
 */
export function useDatasetDetail(datasetId: string) {
  const queryClient = useQueryClient();

  // Instant fallback: find the dataset in the already-cached collection query
  // (the route loader awaits getDatasets, so this is populated on navigation)
  const cachedDatasets = queryClient.getQueryData(trpc.getDatasets.queryKey());
  const cachedDataset = (cachedDatasets as Dataset[] | undefined)?.find(
    (d) => d.slug === datasetId,
  );

  const localDataset = useLiveQuery(
    () => dexieDb.datasets.where("slug").equals(datasetId).first(),
    [datasetId],
  );

  const datasetQuery = useQuery({
    ...trpc.getDataset.queryOptions(datasetId),
    enabled: !!datasetId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const serverDataset = datasetQuery.data;

  // Sync Detail Data -> Local Dexie DB
  useEffect(() => {
    if (serverDataset) {
      dexieDb.datasets.put(serverDataset as any);
    }
  }, [serverDataset]);

  return {
    dataset: (serverDataset || cachedDataset || localDataset) as
      | Dataset
      | undefined,
    isDetailLoading: datasetQuery.isLoading && !cachedDataset && !localDataset,
    detailError: datasetQuery.error,
  };
}
