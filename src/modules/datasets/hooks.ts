import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { trpc } from "@/trpc/client";
import { dexieDb } from "@/dexieDb";
import { SyncOperation } from "@/types/syncOperations";
import type { Dataset } from "@/types/dataset";
import { useSync } from "@/modules/sync/useSync";

/**
 * Hook for managing the collection of all datasets.
 * 
 * This hook seamlessly merges local-first Dexie.js state with the remote 
 * tRPC server state. It returns a combined list of datasets, preferring the 
 * server data if available, but falling back to local data instantly for 
 * offline or immediate rendering.
 * 
 * @returns Object containing the dataset list, loading states, and the `createDataset` mutation function.
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

  /**
   * Creates a new dataset.
   * 
   * Operation is instant: it writes to the local Dexie DB and records a sync 
   * operation. The background sync engine will process the queue and push the 
   * creation event to the server.
   * 
   * @param newDataset The complete dataset object to create.
   */
  const createDataset = async (newDataset: Dataset) => {
    // Fire Dexie update immediately
    await dexieDb.datasets.put({
      ...newDataset,
      isOptimistic: false, // Local-first, no longer "optimistic"
    });

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
 * Hook for managing a single dataset's detailed data.
 * 
 * Uses a tiered data resolution strategy to ensure instant loading:
 * 1. Checks for server data from its own query.
 * 2. Checks the query cache from the `getDatasets` collection query.
 * 3. Checks the local Dexie database.
 * 
 * @param datasetId The slug of the dataset to retrieve.
 * @returns Object containing the dataset, loading states, and any errors.
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
      void dexieDb.datasets.put(serverDataset);
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
