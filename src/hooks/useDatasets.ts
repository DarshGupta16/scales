import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc/client";
import type { Dataset, Measurement } from "../types/dataset";
import { useLiveQuery } from "dexie-react-hooks";
import { dexieDb } from "../dexieDb";

/**
 * Hook for managing the collection of datasets.
 * Handles fetching the list and adding new datasets.
 */
export function useDatasets() {
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
    isLoading: datasetsQuery.isLoading && localDatasets.length === 0,
    isError: datasetsQuery.isError,
    error: datasetsQuery.error,
    upsertDataset,
  };
}

/**
 * Hook for managing a single dataset's detailed data and its measurements.
 */
export function useDataset(datasetId: string) {
  const queryClient = useQueryClient();

  const localDataset = useLiveQuery(
    () => dexieDb.datasets.where("slug").equals(datasetId).first(),
    [datasetId],
  );

  const datasetQuery = useQuery({
    ...trpc.getDataset.queryOptions(datasetId),
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

  const addMeasurement = useMutation(
    trpc.addMeasurement.mutationOptions({
      onMutate: async (variables) => {
        const datasetsKey = trpc.getDatasets.queryKey();
        const datasetDetailKey = trpc.getDataset.queryKey(datasetId);

        await queryClient.cancelQueries({ queryKey: datasetsKey });
        await queryClient.cancelQueries({ queryKey: datasetDetailKey });

        const previousDatasets = queryClient.getQueryData(datasetsKey);
        const previousDatasetDetail =
          queryClient.getQueryData(datasetDetailKey);

        const newMeasurement: Measurement = {
          id: variables.id || "temp-id",
          timestamp: variables.timestamp,
          value: variables.value,
        };

        // Optimistically update the datasets list
        queryClient.setQueryData(datasetsKey, (old: any) => {
          if (!old) return old;
          return old.map((d: any) => {
            if (d.slug === datasetId) {
              return {
                ...d,
                measurements: [...d.measurements, newMeasurement],
              };
            }
            return d;
          });
        });

        // Optimistically update the specific dataset detail
        queryClient.setQueryData(datasetDetailKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            measurements: [...old.measurements, newMeasurement],
          };
        });

        return { previousDatasets, previousDatasetDetail };
      },

      onError: (err, _variables, context) => {
        queryClient.setQueryData(
          trpc.getDatasets.queryKey(),
          context?.previousDatasets,
        );
        queryClient.setQueryData(
          trpc.getDataset.queryKey(datasetId),
          context?.previousDatasetDetail,
        );
        console.error("Failed to add measurement:", err);
      },

      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.getDatasets.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.getDataset.queryKey(datasetId),
        });
      },
    }),
  );

  const removeMeasurement = useMutation(
    trpc.removeMeasurement.mutationOptions({
      onMutate: async (measurementId) => {
        const queryKey = trpc.getDataset.queryKey(datasetId);
        const datasetsKey = trpc.getDatasets.queryKey();

        await queryClient.cancelQueries({ queryKey });
        await queryClient.cancelQueries({ queryKey: datasetsKey });

        const previousDataset = queryClient.getQueryData(queryKey);
        const previousDatasets = queryClient.getQueryData(datasetsKey);

        // Update Detail Cache
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            measurements: old.measurements.filter(
              (m: any) => m.id !== measurementId,
            ),
          };
        });

        // Update List Cache
        queryClient.setQueryData(datasetsKey, (old: any) => {
          if (!old) return old;
          return old.map((d: any) => {
            if (d.slug === datasetId) {
              return {
                ...d,
                measurements: d.measurements.filter(
                  (m: any) => m.id !== measurementId,
                ),
              };
            }
            return d;
          });
        });

        return { previousDataset, previousDatasets };
      },
      onError: (err, _measurementId, context) => {
        if (context?.previousDataset) {
          queryClient.setQueryData(
            trpc.getDataset.queryKey(datasetId),
            context.previousDataset,
          );
        }
        if (context?.previousDatasets) {
          queryClient.setQueryData(
            trpc.getDatasets.queryKey(),
            context.previousDatasets,
          );
        }
        console.error("Failed to remove measurement:", err);
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.getDatasets.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.getDataset.queryKey(datasetId),
        });
      },
    }),
  );

  return {
    dataset: (serverDataset || localDataset) as Dataset | undefined,
    isLoading: datasetQuery.isLoading && !localDataset,
    isError: datasetQuery.isError,
    error: datasetQuery.error,
    addMeasurement,
    removeMeasurement,
  };
}
