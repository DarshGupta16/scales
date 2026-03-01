import { Dexie, type EntityTable } from "dexie";
import { type Dataset } from "./types/dataset";

interface DexieDataset extends Dataset {
  index: number;
}

const dexieDb = new Dexie("ScalesDexieLocal") as Dexie & {
  datasets: EntityTable<
    DexieDataset,
    "index" // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
dexieDb.version(1).stores({
  datasets:
    "++index, title, description, unit, views, measurements, slug, isOptimistic", // primary key "id" (for the runtime!)
});

export { dexieDb };
