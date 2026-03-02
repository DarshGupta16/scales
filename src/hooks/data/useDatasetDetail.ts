import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../../trpc/client";
import type { Dataset } from "../../types/dataset";
import { useLiveQuery } from "dexie-react-hooks";
import { dexieDb } from "../../dexieDb";

/**
 * Sub-hook for managing a single dataset's detailed data.
 * Handles fetching simple details and syncing to local DB.
 */
export function useDatasetDetail(datasetId: string) {
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
    dataset: (serverDataset || localDataset) as Dataset | undefined,
    isDetailLoading: datasetQuery.isLoading && !localDataset,
    detailError: datasetQuery.error,
  };
}
