import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/client";
import { type Dataset } from "../types/dataset";
import { useDatasets } from "./useDatasets";

export function useDataset(slug: string, initialData?: Dataset[]) {
  // We leverage useDatasets for sync/hydration logic
  const { datasets, isLoading } = useDatasets(initialData);

  const dataset = useLiveQuery(async () => {
    const d = await db.datasets.where("slug").equals(slug).first();
    if (!d) return null;

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
  }, [slug]);

  return {
    dataset: dataset || (datasets || []).find(d => d.slug === slug),
    isLoading,
  };
}
