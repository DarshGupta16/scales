import { useEffect, useMemo, useState } from "react";
import type { ChartData } from "../components/datasets/charts/types";
import type { Dataset, Measurement } from "../types/dataset";
import { formatDate } from "../utils/format";

export function useChartData(dataset: Dataset, data: Measurement[]) {
  const [isClient, setIsClient] = useState(false);
  const [visibleMetricIds, setVisibleMetricIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize all metrics as visible when dataset changes
  useEffect(() => {
    if (dataset?.metrics) {
      setVisibleMetricIds(new Set(dataset.metrics.map((m) => m.id)));
    }
  }, [dataset]);

  const toggleMetricVisibility = (metricId: string) => {
    setVisibleMetricIds((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        // Enforce that at least one metric remains visible
        if (next.size > 1) {
          next.delete(metricId);
        }
      } else {
        next.add(metricId);
      }
      return next;
    });
  };

  const visibleMetrics = useMemo(() => {
    return (dataset.metrics || []).filter((m) => visibleMetricIds.has(m.id));
  }, [dataset.metrics, visibleMetricIds]);

  const chartData = useMemo<ChartData[]>(() => {
    // Explicitly sort ascending (oldest first) for the chart flow
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    return sortedData.map((m, index) => {
      const dataPoint: ChartData = {
        ...m,
        value: m.values[0]?.value || 0, // Fallback for single metric charts
        tooltipId: `${m.id || index.toString()}-${m.timestamp}`,
        displayDate: isClient ? formatDate(m.timestamp, "full") : "",
      };

      // Map each metric value dynamically under its metricId
      for (const val of m.values) {
        dataPoint[val.metricId] = val.value;
      }

      return dataPoint;
    });
  }, [data, isClient]);

  const pieData = useMemo(() => {
    if (dataset.type === "composite") {
      // Find latest measurement
      const sortedData = [...data].sort((a, b) => b.timestamp - a.timestamp);
      const latest = sortedData[0];
      if (!latest) return [];

      return visibleMetrics.map((metric) => {
        const valRecord = latest.values.find((v) => v.metricId === metric.id);
        const metricIndex = (dataset.metrics || []).findIndex((m) => m.id === metric.id);
        return {
          name: metric.name,
          value: valRecord ? valRecord.value : 0,
          unit: metric.unit.symbol || metric.unit.name,
          displayDate: isClient ? formatDate(latest.timestamp, "full") : "",
          tooltipId: `pie-${metric.id}`,
          colorIndex: metricIndex,
        };
      });
    }

    // Single dataset: slices represent historical values
    return chartData.map((d) => ({
      name: d.displayDate,
      value: d.value,
      unit: dataset.unit?.symbol || dataset.unit?.name || "?",
      displayDate: d.displayDate,
      tooltipId: d.tooltipId,
    }));
  }, [dataset, data, visibleMetrics, chartData, isClient]);

  return {
    isClient,
    visibleMetricIds,
    visibleMetrics,
    chartData,
    pieData,
    toggleMetricVisibility,
  };
}
