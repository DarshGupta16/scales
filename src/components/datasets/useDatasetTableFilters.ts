import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useDatasetStore } from "@/store";
import type { CustomRange, Dataset, Timeline } from "../../types/dataset";
import { formatTimestampToDatetimeLocal, isValidDateStr, parseLocalDatetime } from "./tableUtils";

export interface UseDatasetTableFiltersProps {
  dataset: Dataset;
  measurements: string[];
  syncWithGraph: boolean;
  onSyncWithGraphChange: (sync: boolean) => void;
  onFilteredMeasurementsChange: (filtered: string[]) => void;
  timeline: Timeline;
  onTimelineChange: (timeline: Timeline) => void;
  customRange: CustomRange;
  onCustomRangeChange: (customRange: CustomRange) => void;
}

export function useDatasetTableFilters({
  dataset,
  measurements,
  syncWithGraph,
  onSyncWithGraphChange,
  onFilteredMeasurementsChange,
  timeline,
  onTimelineChange,
  customRange,
  onCustomRangeChange,
}: UseDatasetTableFiltersProps) {
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [filterMetricId, setFilterMetricId] = useState("any");

  const [sortColumn, setSortColumn] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const deferredFilterStartTime = useDeferredValue(filterStartTime);
  const deferredFilterEndTime = useDeferredValue(filterEndTime);
  const deferredMinValue = useDeferredValue(minValue);
  const deferredMaxValue = useDeferredValue(maxValue);
  const deferredFilterMetricId = useDeferredValue(filterMetricId);

  const measurementsById = useDatasetStore((state) => state.measurementsById);
  const valuesById = useDatasetStore((state) => state.valuesById);

  const temporalRange = useMemo(() => {
    const now = Date.now();
    if (timeline === "day") {
      return { start: now - 24 * 3600 * 1000, end: now };
    }
    if (timeline === "week") {
      return { start: now - 7 * 24 * 3600 * 1000, end: now };
    }
    if (timeline === "custom") {
      return customRange;
    }
    return { start: 0, end: Infinity };
  }, [timeline, customRange]);

  const parentStartVal = useMemo(() => {
    return timeline === "all" ? "" : formatTimestampToDatetimeLocal(temporalRange.start);
  }, [timeline, temporalRange.start]);

  const parentEndVal = useMemo(() => {
    return timeline === "all" ? "" : formatTimestampToDatetimeLocal(temporalRange.end);
  }, [timeline, temporalRange.end]);

  useEffect(() => {
    if (syncWithGraph) {
      setFilterStartTime(parentStartVal);
      setFilterEndTime(parentEndVal);
    }
  }, [syncWithGraph, parentStartVal, parentEndVal]);

  const flushStartTime = useCallback(
    (val: string) => {
      if (syncWithGraph) {
        if (val === "") {
          onTimelineChange("all");
        } else {
          const parsed = parseLocalDatetime(val);
          if (!Number.isNaN(parsed) && isValidDateStr(val)) {
            onTimelineChange("custom");
            onCustomRangeChange({
              start: parsed,
              end: temporalRange.end === Infinity ? Date.now() : temporalRange.end,
            });
          } else {
            setFilterStartTime(parentStartVal);
          }
        }
      }
    },
    [syncWithGraph, onTimelineChange, onCustomRangeChange, temporalRange.end, parentStartVal],
  );

  const flushEndTime = useCallback(
    (val: string) => {
      if (syncWithGraph) {
        if (val === "") {
          onTimelineChange("all");
        } else {
          const parsed = parseLocalDatetime(val);
          if (!Number.isNaN(parsed) && isValidDateStr(val)) {
            onTimelineChange("custom");
            onCustomRangeChange({
              start:
                temporalRange.start === 0 ? Date.now() - 24 * 3600 * 1000 : temporalRange.start,
              end: parsed,
            });
          } else {
            setFilterEndTime(parentEndVal);
          }
        }
      }
    },
    [syncWithGraph, onTimelineChange, onCustomRangeChange, temporalRange.start, parentEndVal],
  );

  const clearFilters = useCallback(() => {
    if (syncWithGraph) {
      onTimelineChange("all");
    } else {
      setFilterStartTime("");
      setFilterEndTime("");
    }
    setMinValue("");
    setMaxValue("");
    setFilterMetricId("any");
  }, [syncWithGraph, onTimelineChange]);

  const baseMeasurements = syncWithGraph ? measurements : dataset.measurementIds || [];

  const filteredMeasurements = useMemo(() => {
    return baseMeasurements.filter((id) => {
      const m = measurementsById[id];
      if (!m) return false;

      if (!syncWithGraph) {
        if (deferredFilterStartTime) {
          const startMs = parseLocalDatetime(deferredFilterStartTime);
          if (!Number.isNaN(startMs) && m.timestamp < startMs) {
            return false;
          }
        }
        if (deferredFilterEndTime) {
          const endMs = parseLocalDatetime(deferredFilterEndTime);
          if (!Number.isNaN(endMs) && m.timestamp > endMs) {
            return false;
          }
        }
      }

      const min = deferredMinValue !== "" ? Number(deferredMinValue) : -Infinity;
      const max = deferredMaxValue !== "" ? Number(deferredMaxValue) : Infinity;

      if (dataset.type === "composite") {
        if (deferredFilterMetricId === "any") {
          return m.valueIds.some((vId) => {
            const val = valuesById[vId]?.value ?? 0;
            return val >= min && val <= max;
          });
        } else {
          const valRecordId = m.valueIds.find(
            (vId) => valuesById[vId]?.metricId === deferredFilterMetricId,
          );
          if (!valRecordId) return false;
          const valRecord = valuesById[valRecordId];
          if (!valRecord) return false;
          return valRecord.value >= min && valRecord.value <= max;
        }
      } else {
        const firstValId = m.valueIds[0];
        const val = firstValId ? (valuesById[firstValId]?.value ?? 0) : 0;
        return val >= min && val <= max;
      }
    });
  }, [
    baseMeasurements,
    measurementsById,
    valuesById,
    syncWithGraph,
    deferredFilterStartTime,
    deferredFilterEndTime,
    deferredMinValue,
    deferredMaxValue,
    deferredFilterMetricId,
    dataset.type,
  ]);

  useEffect(() => {
    onFilteredMeasurementsChange(filteredMeasurements);
  }, [filteredMeasurements, onFilteredMeasurementsChange]);

  const sortedAndFilteredMeasurements = useMemo(() => {
    const list = [...filteredMeasurements];
    if (!sortColumn) return list;

    list.sort((idA, idB) => {
      const a = measurementsById[idA];
      const b = measurementsById[idB];
      if (!a || !b) return 0;

      let va = 0;
      let vb = 0;

      if (sortColumn === "timestamp") {
        va = a.timestamp;
        vb = b.timestamp;
      } else if (dataset.type === "composite") {
        const vA_id = a.valueIds.find((vId) => valuesById[vId]?.metricId === sortColumn);
        const vB_id = b.valueIds.find((vId) => valuesById[vId]?.metricId === sortColumn);
        va = vA_id ? (valuesById[vA_id]?.value ?? 0) : 0;
        vb = vB_id ? (valuesById[vB_id]?.value ?? 0) : 0;
      } else {
        const vA_id = a.valueIds[0];
        const vB_id = b.valueIds[0];
        va = vA_id ? (valuesById[vA_id]?.value ?? 0) : 0;
        vb = vB_id ? (valuesById[vB_id]?.value ?? 0) : 0;
      }

      if (va === vb) return 0;
      return sortDirection === "asc" ? va - vb : vb - va;
    });

    return list;
  }, [filteredMeasurements, measurementsById, valuesById, sortColumn, sortDirection, dataset.type]);

  const handleSort = useCallback((column: string) => {
    setSortColumn((prevCol) => {
      if (prevCol === column) {
        setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevCol;
      }
      setSortDirection("desc");
      return column;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const isAllSelected =
    filteredMeasurements.length > 0 && filteredMeasurements.every((id) => selectedIds.includes(id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const isAllSelectedNow =
        filteredMeasurements.length > 0 && filteredMeasurements.every((id) => prev.includes(id));
      if (isAllSelectedNow) {
        const filteredIds = new Set(filteredMeasurements);
        return prev.filter((id) => !filteredIds.has(id));
      } else {
        const next = new Set(prev);
        for (const id of filteredMeasurements) {
          next.add(id);
        }
        return Array.from(next);
      }
    });
  }, [filteredMeasurements]);

  const hasActiveFilters = syncWithGraph
    ? timeline !== "all" || minValue !== "" || maxValue !== "" || filterMetricId !== "any"
    : filterStartTime !== "" ||
      filterEndTime !== "" ||
      minValue !== "" ||
      maxValue !== "" ||
      filterMetricId !== "any";

  return {
    state: {
      filterStartTime,
      filterEndTime,
      minValue,
      maxValue,
      filterMetricId,
      sortColumn,
      sortDirection,
      selectedIds,
      syncWithGraph,
      hasActiveFilters,
      isAllSelected,
      sortedAndFilteredMeasurements,
    },
    actions: {
      setFilterStartTime,
      setFilterEndTime,
      setMinValue,
      setMaxValue,
      setFilterMetricId,
      flushStartTime,
      flushEndTime,
      clearFilters,
      handleSort,
      toggleSelect,
      toggleSelectAll,
      setSelectedIds,
      onSyncWithGraphChange,
    },
  };
}
