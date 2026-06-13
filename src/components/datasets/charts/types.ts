import type { Measurement, MeasurementValue } from "../../../types/dataset";

export interface ChartData extends Measurement {
  tooltipId: string;
  displayDate: string;
  value: number; // Fallback for single metric charts
  [key: string]: string | number | MeasurementValue[] | undefined;
}

export const COLORS = [
  "#8b5cf6", // Violet-500 (Brand)
  "#06b6d4", // Cyan-500
  "#10b981", // Emerald-500
  "#ec4899", // Pink-500
  "#f59e0b", // Amber-500
  "#3b82f6", // Blue-500
  "#a78bfa", // Lavender-400
];
