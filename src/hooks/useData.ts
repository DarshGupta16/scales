import {
  useDatasetCollection,
  useDatasetDetail,
} from "@/modules/datasets/hooks";
import { useMeasurements } from "@/modules/measurements/hooks";
import { useLogs } from "@/modules/logs/hooks";

/**
 * Universal data management hook.
 *
 * Use without arguments for collection-level access (all datasets).
 * Pass a datasetId to also get detail-level access (specific dataset + measurements).
 *
 * This hook acts as a central distribution channel for all specialized sub-hooks.
 * It provides a unified interface for datasets and their associated measurements.
 *
 * @param datasetId Optional slug of the dataset to focus on.
 * @returns Combined data and operation functions for the dataset lifecycle.
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
    datasetId ?? "",
  );
  const { addMeasurement, removeMeasurement, isAddPending, isRemovePending } =
    useMeasurements(datasetId ?? "");

  // Logs logic
  const { localLogs, serverLogs, isServerLogsLoading, serverLogsError } = useLogs();

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

    // Logs Exports
    localLogs,
    serverLogs,
    isServerLogsLoading,
    serverLogsError,
  };
}
