import { clientHandlers as datasetHandlers } from "../datasets/sync.client";
import { clientHandlers as measurementHandlers } from "../measurements/sync.client";
import { clientHandlers as viewHandlers } from "../views/sync.client";

export const allClientHandlers = {
  ...datasetHandlers,
  ...measurementHandlers,
  ...viewHandlers,
};
