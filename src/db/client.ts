import Dexie, { type Table } from "dexie";
import { type Dataset, type Measurement, type ViewType } from "../types/dataset";

export interface DexieDataset extends Omit<Dataset, "measurements" | "views"> {
  // We keep them optional or exclude them for the flat store
}

export interface DexieMeasurement extends Measurement {
  datasetId: string;
}

export interface DexieView {
  id: string;
  datasetId: string;
  type: ViewType;
}

export class ScalesDB extends Dexie {
  datasets!: Table<DexieDataset>;
  measurements!: Table<DexieMeasurement>;
  views!: Table<DexieView>;

  constructor() {
    super("ScalesDB");
    this.version(1).stores({
      datasets: "++id, slug, title, unit",
      measurements: "++id, datasetId, timestamp",
      views: "++id, [datasetId+type], datasetId",
    });
  }
}

export const db = new ScalesDB();
