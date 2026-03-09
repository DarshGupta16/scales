import { serverHandlers as datasetHandlers } from "./datasets";
import { serverHandlers as measurementHandlers } from "./measurements";
import { serverHandlers as viewHandlers } from "./views";
import type { SyncOperation } from "@/types/syncOperations";
import type { ServerReplayHandler } from "@/sync/types";

export const allServerHandlers: Partial<
  Record<SyncOperation, ServerReplayHandler<SyncOperation>>
> = {
  ...datasetHandlers,
  ...measurementHandlers,
  ...viewHandlers,
} as Partial<Record<SyncOperation, ServerReplayHandler<SyncOperation>>>;
