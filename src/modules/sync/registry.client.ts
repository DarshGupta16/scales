import { clientHandlers as datasetHandlers } from "../datasets/sync.client";
import { clientHandlers as measurementHandlers } from "../measurements/sync.client";
import { clientHandlers as viewHandlers } from "../views/sync.client";
import type { SyncOperation } from "@/types/syncOperations";
import type { ClientReplayHandler } from "./types";

export const allClientHandlers: Partial<
  Record<SyncOperation, ClientReplayHandler<any>>
> = {
  ...datasetHandlers,
  ...measurementHandlers,
  ...viewHandlers,
} as Partial<Record<SyncOperation, ClientReplayHandler<any>>>;
