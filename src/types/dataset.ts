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

export type Measurement = {
  id: string;
  timestamp: string; // ISO string
  value: number;
};

export type Dataset = {
  id: string; // used as slug in URL
  title: string;
  description?: string;
  unit: Unit;
  views: ViewType[]; // persisted configuration
  measurements: Measurement[];
  slug: string;
  isOptimistic?: boolean;
};
