import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../../trpc/client";
import type { Measurement } from "../../types/dataset";
import { dexieDb } from "../../dexieDb";

/**
 * Sub-hook for managing measurements for a specific dataset.
 * Handles adding and removing measurements with complex optimistic updates.
 */
export function useMeasurements(datasetId: string) {
  const queryClient = useQueryClient();

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
          const updated = {
            ...old,
            measurements: [...old.measurements, newMeasurement],
          };
          // Sync to Dexie
          dexieDb.datasets.put(updated as any);
          return updated;
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
          const updated = {
            ...old,
            measurements: old.measurements.filter(
              (m: any) => m.id !== measurementId,
            ),
          };
          // Sync to Dexie
          dexieDb.datasets.put(updated as any);
          return updated;
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
    addMeasurement,
    removeMeasurement,
  };
}
