import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { trpc } from "@/trpc/client";
import { dexieDb } from "@/dexieDb";
import { SyncOperation } from "@/types/syncOperations";
import type { Dataset } from "@/types/dataset";
import { useSync } from "@/hooks/useSync";

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
  const { recordOperation, lastSyncedAt } = useSync();

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

  // Determine the active dataset collection:
  // - Post-sync: Local Dexie DB is the primary source of truth.
  // - Pre-sync: Server data is preferred to show initial cloud state.
  const hasSynced = lastSyncedAt !== null;
  const datasets = hasSynced
    ? (localDatasets ?? serverDatasets ?? [])
    : (serverDatasets ?? localDatasets ?? []);

  const isCollectionLoading =
    datasetsQuery.isLoading && !localDatasets && !serverDatasets;

  return {
    datasets,
    isCollectionLoading,
    collectionError: datasetsQuery.error,
    createDataset,
    isUpsertPending: false, // Sync runs in background
  };
}

/**
 * Hook for managing a single dataset's detailed data.
 *
 * Uses a tiered data resolution strategy to ensure instant loading:
 * 1. Checks the local Dexie database (primary truth).
 * 2. Checks the query cache from the `getDatasets` collection query (instant SSR fallback).
 * 3. Checks the server data from its own specific query.
 *
 * @param datasetId The slug of the dataset to retrieve.
 * @returns Object containing the dataset, loading states, and any errors.
 */
export function useDatasetDetail(datasetId: string) {
  const queryClient = useQueryClient();

  // Instant fallback: find the dataset in the already-cached collection query
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

  // Resolve the dataset in priority order: Local -> Cache -> Direct Server Query
  const dataset = localDataset ?? cachedDataset ?? datasetQuery.data;
  const isDetailLoading = datasetQuery.isLoading && !dataset;

  return {
    dataset,
    isDetailLoading,
    detailError: datasetQuery.error,
  };
}
