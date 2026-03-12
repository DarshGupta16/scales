import { Dexie, type EntityTable } from "dexie";
import type { Dataset } from "./types/dataset";

const isBrowser = typeof window !== "undefined";

/**
 * Scales Database - Dexie implementation for local-first persistence.
 * Instantiated with SSR-safety to support the TanStack Start environment.
 */
export const db = (
  isBrowser ? new Dexie("ScalesDatabase") : ({} as unknown)
) as Dexie & {
  datasets: EntityTable<Dataset, "id">;
};

if (isBrowser) {
  // Schema declaration:
  // Only indexing fields that might be used for searching/filtering.
  db.version(1).stores({
    datasets: "id, title, description, unit, views, slug, measurements",
  });
}

export type { Dataset };
