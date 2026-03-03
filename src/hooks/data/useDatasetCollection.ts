import { useQuery } from "@tanstack/react-query";
import { trpc } from "../../trpc/client";
import type { Dataset } from "../../types/dataset";
import { useLiveQuery } from "dexie-react-hooks";
import { dexieDb } from "../../dexieDb";
import { useSync } from "../useSync";
import { SyncOperation } from "../../types/syncOperations";

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

  // Removed instant bulkPut to prevent infinite loops. The sync engine handles hydrating Dexie.

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
