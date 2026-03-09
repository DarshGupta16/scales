import type { SyncOperation } from "@/types/syncOperations";
import type { Dataset, Measurement, ViewType } from "@/types/dataset";

export interface SyncPayloads {
  [SyncOperation.CREATE_DATASET]: Dataset;
  [SyncOperation.UPDATE_DATASET]: Partial<Dataset> & { id: string };
  [SyncOperation.DELETE_DATASET]: { id: string };

  [SyncOperation.ADD_MEASUREMENT]: Measurement & { datasetSlug: string };
  [SyncOperation.UPDATE_MEASUREMENT]: Partial<Measurement> & { id: string };
  [SyncOperation.REMOVE_MEASUREMENT]: { id: string };

  [SyncOperation.UPDATE_VIEWS]: { datasetSlug: string; views: ViewType[] };
}

export type ServerReplayHandler<T extends SyncOperation = SyncOperation> = (
  payload: SyncPayloads[T],
) => Promise<void>;

export type ClientReplayHandler<T extends SyncOperation = SyncOperation> = (
  payload: SyncPayloads[T],
) => Promise<void>;
