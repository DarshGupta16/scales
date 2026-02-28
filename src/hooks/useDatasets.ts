import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/client";
import { type Dataset } from "../types/dataset";
import { trpcClient } from "../trpc/client";
import { useEffect, useState } from "react";
import { setLocalReadyCookie } from "../utils/cookies";

export function useDatasets(initialData?: Dataset[]) {
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Reactive Dexie Query
  const datasets = useLiveQuery(async () => {
    const dexieDatasets = await db.datasets.toArray();
    
    // Enrich with measurements and views
    return await Promise.all(
      dexieDatasets.map(async (d) => {
        const measurements = await db.measurements
          .where("datasetId")
          .equals(d.id)
          .toArray();
        const views = await db.views
          .where("datasetId")
          .equals(d.id)
          .toArray();
        
        return {
          ...d,
          measurements: measurements.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ),
          views: views.map(v => v.type),
        } as Dataset;
      })
    );
  }, []);

  // 2. Hydration & Sync
  useEffect(() => {
    const sync = async () => {
      // If we have initial data from SSR (first load), seed Dexie
      if (initialData && initialData.length > 0) {
        await hydrateDexie(initialData);
        setLocalReadyCookie(true);
        setIsHydrated(true);
      } else {
        // Otherwise, if Dexie is empty, fetch from server
        const count = await db.datasets.count();
        if (count === 0) {
          const serverData = await trpcClient.getDatasets.query();
          await hydrateDexie(serverData);
          setLocalReadyCookie(true);
        }
        setIsHydrated(true);
      }
    };

    sync();
  }, [initialData]);

  // 3. Background Sync (Optional, but good for local-first)
  useEffect(() => {
    if (!isHydrated) return;

    const backgroundSync = async () => {
      try {
        const serverData = await trpcClient.getDatasets.query();
        await hydrateDexie(serverData);
      } catch (err) {
        console.error("Background sync failed:", err);
      }
    };

    backgroundSync();
  }, [isHydrated]);

  return {
    datasets: datasets || initialData || [],
    isLoading: !datasets && !initialData,
  };
}

async function hydrateDexie(datasets: Dataset[]) {
  await db.transaction("rw", [db.datasets, db.measurements, db.views], async () => {
    for (const dataset of datasets) {
      const { measurements, views, ...rest } = dataset;
      
      await db.datasets.put(rest);
      
      // Clear and re-add measurements for this dataset
      await db.measurements.where("datasetId").equals(dataset.id).delete();
      if (measurements.length > 0) {
        await db.measurements.bulkPut(
          measurements.map((m) => ({ ...m, datasetId: dataset.id }))
        );
      }

      // Clear and re-add views for this dataset
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
    }
  });
}
