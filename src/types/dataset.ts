export type Unit =
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "years"
  | "meters"
  | "kilometers"
  | "miles"
  | "grams"
  | "kilograms"
  | "pounds"
  | "celsius"
  | "fahrenheit"
  | "percentage"
  | "bytes"
  | "kilobytes"
  | "megabytes"
  | "gigabytes"
  | "terabytes"
  | "dollars"
  | "euros"
  | "rupees"
  | "count";

export type ViewType = "line" | "bar" | "area" | "pie" | "scatter";

export interface Measurement {
  id: string;
  datasetId: string;
  timestamp: string; // ISO string
  value: number;
}

export interface Dataset {
  id: string; // used as slug in URL
  title: string;
  description?: string;
  unit: Unit;
  views: ViewType[]; // persisted configuration
  measurements: Measurement[];
  createdAt: number;
}
