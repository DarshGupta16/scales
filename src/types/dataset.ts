// Database/PocketBase Types (Normalized)
export interface UnitRecord {
  id: string;
  name: string;
  symbol: string;
}

export interface MeasurementRecord {
  id: string;
  datasetId: string;
  timestamp: number;
  value: number;
}

export interface DatasetRecord {
  id: string;
  title: string;
  description?: string;
  unitId: string;
  views: ViewType[];
  createdAt: number;
}

export type ViewType = "line" | "bar" | "area" | "pie" | "scatter";

// UI Representation Types (Nested/Denormalized)
export type Unit = UnitRecord;

export interface Measurement {
  id: string;
  timestamp: number;
  value: number;
}

export interface Dataset {
  id: string;
  title: string;
  description?: string;
  unit: Unit;
  views: ViewType[];
  measurements: Measurement[];
  createdAt: number;
}
