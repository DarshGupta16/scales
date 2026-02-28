import { db } from "../db/client";
import { type Dataset } from "../types/dataset";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc/client";

export function useDatasetMutations() {
  const queryClient = useQueryClient();

  // remote upsert
  const remoteUpsert = useMutation(
    trpc.upsertDataset.mutationOptions({
      onSuccess: () => {
        // Sync back truth if needed
        queryClient.invalidateQueries(trpc.getDatasets.queryOptions());
      },
    })
  );

  const upsertDataset = (dataset: Dataset) => {
    // 1. Instant Local Update
    const { measurements, views, ...rest } = dataset;
    
    // Non-blocking local writes
    db.transaction("rw", [db.datasets, db.measurements, db.views], async () => {
      await db.datasets.put(rest);
      
      // Update measurements
      await db.measurements.where("datasetId").equals(dataset.id).delete();
      if (measurements.length > 0) {
        await db.measurements.bulkPut(
          measurements.map((m) => ({ ...m, datasetId: dataset.id }))
        );
      }

      // Update views
      await db.views.where("datasetId").equals(dataset.id).delete();
      if (views.length > 0) {
        await db.views.bulkPut(
          views.map((type) => ({ 
            id: `${dataset.id}-${type}`, 
            datasetId: dataset.id, 
            type 
          }))
        );
      }
    }).catch(err => console.error("Dexie update failed:", err));

    // 2. Background Remote Sync
    remoteUpsert.mutate(dataset);
  };

  const remoteAddMeasurement = useMutation(
    trpc.addMeasurement.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getDatasets.queryOptions());
      },
    })
  );

  const addMeasurement = (measurement: { value: number; timestamp: string; datasetSlug: string }) => {
    const id = Math.random().toString(36).substring(7);
    
    // 1. Instant Local Update
    db.datasets.where("slug").equals(measurement.datasetSlug).first().then(dataset => {
      if (dataset) {
        db.measurements.put({
          id,
          value: measurement.value,
          timestamp: measurement.timestamp,
          datasetId: dataset.id
        }).catch(err => console.error("Dexie measurement update failed:", err));
      }
    });

    // 2. Background Remote Sync
    remoteAddMeasurement.mutate(measurement);
  };

  return { upsertDataset, addMeasurement };
}
