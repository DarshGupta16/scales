import { useDatasetCollection } from "./data/useDatasetCollection";
import { useDatasetDetail } from "./data/useDatasetDetail";
import { useMeasurements } from "./data/useMeasurements";

/**
 * Universal data management hook.
 *
 * Use without arguments for collection-level access (all datasets).
 * Pass a datasetId to also get detail-level access (specific dataset + measurements).
 *
 * This hook acts as a central distribution channel for all specialized sub-hooks.
 */
export function useData(datasetId?: string) {
  // Collection logic - Shared everywhere
  const {
    datasets,
    isCollectionLoading,
    collectionError,
    createDataset,
    isUpsertPending,
  } = useDatasetCollection();

  // Detail & Measurements logic - Only active if datasetId is provided
  const { dataset, isDetailLoading, detailError } = useDatasetDetail(
    datasetId || "",
  );
  const { addMeasurement, removeMeasurement, isAddPending, isRemovePending } =
    useMeasurements(datasetId || "");

  return {
    // Collection Exports
    datasets,
    createDataset,
    isCollectionLoading,
    collectionError,
    isUpsertPending,

    // Detail Exports
    dataset,
    isDetailLoading,
    detailError,

    // Measurement Exports
    addMeasurement,
    removeMeasurement,
    isAddPending,
    isRemovePending,
  };
}
