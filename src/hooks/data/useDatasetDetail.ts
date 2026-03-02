import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../../trpc/client";
import type { Dataset } from "../../types/dataset";
import { useLiveQuery } from "dexie-react-hooks";
import { dexieDb } from "../../dexieDb";

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
