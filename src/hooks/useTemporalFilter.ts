import { useMemo, useState } from "react";
import type { CustomRange, Measurement, Timeline } from "../types/dataset";

export function useTemporalFilter(measurements: Measurement[] = []) {
  const [timeline, setTimeline] = useState<Timeline>("all");
  const [customRange, setCustomRange] = useState<CustomRange>({
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now(),
  });

  const filteredMeasurements = useMemo(() => {
    const now = Date.now();
    let start = 0;
    let end = Infinity;

    if (timeline === "day") {
      start = now - 24 * 60 * 60 * 1000;
    } else if (timeline === "week") {
      start = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeline === "custom") {
      start = customRange.start;
      end = customRange.end;
    }

    return timeline === "all"
      ? measurements
      : measurements.filter((m) => m.timestamp >= start && m.timestamp <= end);
  }, [measurements, timeline, customRange]);

  return {
    timeline,
    setTimeline,
    customRange,
    setCustomRange,
    filteredMeasurements,
  };
}
