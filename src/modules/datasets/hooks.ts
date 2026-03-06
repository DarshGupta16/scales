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

  const localDatasets = useLiveQuery(async () => {
    const data = await dexieDb.datasets.toArray();
    return data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  });

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
    await dexieDb.datasets.put(newDataset);

    // Record the operation which automatically triggers a sync to the server
    await recordOperation(SyncOperation.CREATE_DATASET, newDataset);
  };

  // Sync Collection Data -> Local Dexie DB
  useEffect(() => {
    if (serverDatasets && serverDatasets.length > 0) {
      // Hydrate all server datasets into Dexie
      void dexieDb.datasets.bulkPut(serverDatasets as Dataset[]);
    }
  }, [serverDatasets]);

  return {
    datasets: localDatasets ?? serverDatasets ?? [],
    isCollectionLoading:
      datasetsQuery.isLoading && !localDatasets && !serverDatasets,
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
      // Cast to Dataset to satisfy Dexie's InsertType, which might be picky about
      // optional fields or extra server-side fields (like createdAt).
      void dexieDb.datasets.put(serverDataset as Dataset);
    }
  }, [serverDataset]);

  return {
    dataset: localDataset ?? cachedDataset, // fallback to cache only if local isn't ready
    isDetailLoading: datasetQuery.isLoading && !cachedDataset && !localDataset,
    detailError: datasetQuery.error,
  };
}
