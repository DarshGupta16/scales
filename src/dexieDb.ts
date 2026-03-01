import { Dexie, type EntityTable } from "dexie";
import { type Dataset } from "./types/dataset";

interface DexieDataset extends Dataset {}

const dexieDb = new Dexie("ScalesDexieLocal") as Dexie & {
  datasets: EntityTable<
    DexieDataset,
    "id" // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
dexieDb.version(2).stores({
  datasets: "id, title, description, unit, views, slug, isOptimistic", // primary key "id" (for the runtime!)
});

export { dexieDb };
