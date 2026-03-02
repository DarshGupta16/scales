import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../../trpc/client";
import type { Dataset } from "../../types/dataset";
import { useLiveQuery } from "dexie-react-hooks";
import { dexieDb } from "../../dexieDb";

/**
 * Sub-hook for managing the collection of datasets.
 * Handles fetching the list, syncing to local DB, and adding new datasets.
 */
export function useDatasetCollection() {
  const queryClient = useQueryClient();

  const localDatasets = useLiveQuery(() => dexieDb.datasets.toArray()) || [];

  const datasetsQuery = useQuery({
    ...trpc.getDatasets.queryOptions(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const serverDatasets = datasetsQuery.data;

  // Sync Server Data -> Local Dexie DB
  useEffect(() => {
    if (serverDatasets && serverDatasets.length > 0) {
      dexieDb.datasets.bulkPut(serverDatasets as any);
    }
  }, [serverDatasets]);

  const upsertDataset = useMutation(
    trpc.upsertDataset.mutationOptions({
      onMutate: async (newDataset) => {
        const queryKey = trpc.getDatasets.queryKey();

        await queryClient.cancelQueries({ queryKey });

        const previousDatasets = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old: any) => {
          const optimisticDataset: Dataset = {
            id: newDataset.id,
            title: newDataset.title,
            description: newDataset.description ?? undefined,
            unit: newDataset.unit as any,
            views: newDataset.views as any,
            measurements: (newDataset.measurements as any[]).map((m) => ({
              id: m.id || "temp-id",
              timestamp: m.timestamp,
              value: m.value,
            })),
            slug: newDataset.slug,
            isOptimistic: true,
          };

          return [...(old || []), optimisticDataset];
        });

        return { previousDatasets };
      },

      onError: (err, _newDataset, context) => {
        const queryKey = trpc.getDatasets.queryKey();
        queryClient.setQueryData(queryKey, context?.previousDatasets);
        console.error("Failed to add dataset:", err);
      },

      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.getDatasets.queryKey(),
        });
      },
    }),
  );

  return {
    datasets: serverDatasets || localDatasets,
    isCollectionLoading: datasetsQuery.isLoading && localDatasets.length === 0,
    collectionError: datasetsQuery.error,
    upsertDataset,
  };
}
