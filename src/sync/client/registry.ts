import { clientHandlers as datasetHandlers } from "./datasets";
import { clientHandlers as measurementHandlers } from "./measurements";
import { clientHandlers as viewHandlers } from "./views";
import type { SyncOperation } from "@/types/syncOperations";
import type { ClientReplayHandler } from "@/sync/types";

export const allClientHandlers: Partial<
  Record<SyncOperation, ClientReplayHandler<SyncOperation>>
> = {
  ...datasetHandlers,
  ...measurementHandlers,
  ...viewHandlers,
} as Partial<Record<SyncOperation, ClientReplayHandler<SyncOperation>>>;
