import { serverHandlers as datasetHandlers } from "../datasets/sync.server";
import { serverHandlers as measurementHandlers } from "../measurements/sync.server";
import { serverHandlers as viewHandlers } from "../views/sync.server";
import type { SyncOperation } from "@/types/syncOperations";
import type { ServerReplayHandler } from "./types";

export const allServerHandlers: Partial<
  Record<SyncOperation, ServerReplayHandler>
> = {
  ...datasetHandlers,
  ...measurementHandlers,
  ...viewHandlers,
};
