// Database/PocketBase Types (Normalized)
export interface UnitRecord {
  id: string;
  name: string;
  symbol: string;
  created: number;
  updated: number;
}

export interface MetricRecord {
  id: string;
  datasetId: string;
  name: string;
  unitId: string;
  created: number;
  updated: number;
}

export interface MeasurementRecord {
  id: string;
  datasetId: string;
  timestamp: number;
  created: number;
  updated: number;
}

export interface MeasurementValueRecord {
  id: string;
  measurementId: string;
  metricId: string;
  value: number;
  created: number;
  updated: number;
}

export interface DatasetRecord {
  id: string;
  title: string;
  description?: string;
  type: "single" | "composite";
  views: ViewType[];
  created: number;
  updated: number;
  // Legacy support for migration
  unitId?: string;
}

export type ViewType = "line" | "bar" | "area" | "pie" | "scatter";

// UI Representation Types (Nested/Denormalized)
export type Unit = UnitRecord;

export interface Metric {
  id: string;
  name: string;
  unit: Unit;
}

export interface MeasurementValue {
  metricId: string;
  name: string;
  value: number;
  unit: Unit;
}

export interface Measurement {
  id: string;
  timestamp: number;
  values: MeasurementValue[];
  created: number;
  updated: number;
}

export interface Dataset {
  id: string;
  title: string;
  description?: string;
  type: "single" | "composite";
  metrics: Metric[];
  views: ViewType[];
  measurements: Measurement[];
  created: number;
  updated: number;
  // Convenience properties for UI
  unit: Unit; // Represents the primary unit (first metric)
  latestMeasurement?: Measurement;
}

export interface PreferenceRecord {
  id: string;
  preference: string;
  value: unknown;
  created: number;
  updated: number;
}

export type Timeline = "all" | "week" | "day" | "custom";

export interface CustomRange {
  start: number;
  end: number;
}
