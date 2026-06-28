import { useMemo, useState } from "react";
import { useDatasetStore } from "@/store";
import type { CustomRange, Timeline } from "../types/dataset";

export function useTemporalFilter(measurementIds: string[] = []) {
  const [timeline, setTimeline] = useState<Timeline>("all");
  const [customRange, setCustomRange] = useState<CustomRange>({
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now(),
  });

  const measurementsById = useDatasetStore((state) => state.measurementsById);

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
      ? measurementIds
      : measurementIds.filter((id) => {
          const m = measurementsById[id];
          if (!m) return false;
          return m.timestamp >= start && m.timestamp <= end;
        });
  }, [measurementIds, timeline, customRange, measurementsById]);

  return {
    timeline,
    setTimeline,
    customRange,
    setCustomRange,
    filteredMeasurements,
  };
}
