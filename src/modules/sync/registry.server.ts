import { serverHandlers as datasetHandlers } from "../datasets/sync.server";
import { serverHandlers as measurementHandlers } from "../measurements/sync.server";
import { serverHandlers as viewHandlers } from "../views/sync.server";

export const allServerHandlers = {
  ...datasetHandlers,
  ...measurementHandlers,
  ...viewHandlers,
};
