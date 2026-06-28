import { useEffect, useMemo, useState } from "react";
import { useDatasetStore } from "@/store";
import type { ChartData } from "../components/datasets/charts/types";
import type { Dataset } from "../types/dataset";
import { formatDate } from "../utils/format";

export function useChartData(dataset: Dataset, measurementIds: string[]) {
  const [isClient, setIsClient] = useState(false);
  const [visibleMetricIds, setVisibleMetricIds] = useState<Set<string>>(new Set());

  const metricsById = useDatasetStore((state) => state.metricsById);
  const measurementsById = useDatasetStore((state) => state.measurementsById);
  const valuesById = useDatasetStore((state) => state.valuesById);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize all metrics as visible when dataset changes
  useEffect(() => {
    if (dataset?.metricIds) {
      setVisibleMetricIds(new Set(dataset.metricIds));
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

  const metrics = useMemo(() => {
    return dataset.metricIds.map((id) => metricsById[id]).filter(Boolean);
  }, [dataset.metricIds, metricsById]);

  const visibleMetrics = useMemo(() => {
    return metrics.filter((m) => visibleMetricIds.has(m.id));
  }, [metrics, visibleMetricIds]);

  const chartData = useMemo<ChartData[]>(() => {
    // Explicitly sort ascending (oldest first) for the chart flow
    const sortedData = [...measurementIds]
      .map((id) => measurementsById[id])
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);

    return sortedData.map((m, index) => {
      const firstValId = m.valueIds[0];
      const dataPoint: ChartData = {
        ...m,
        value: firstValId ? valuesById[firstValId]?.value || 0 : 0, // Fallback for single metric charts
        tooltipId: `${m.id || index.toString()}-${m.timestamp}`,
        displayDate: isClient ? formatDate(m.timestamp, "full") : "",
      };

      // Map each metric value dynamically under its metricId
      for (const valId of m.valueIds) {
        const valRecord = valuesById[valId];
        if (valRecord) {
          dataPoint[valRecord.metricId] = valRecord.value;
        }
      }

      return dataPoint;
    });
  }, [measurementIds, measurementsById, valuesById, isClient]);

  const pieData = useMemo(() => {
    if (dataset.type === "composite") {
      // Find latest measurement
      const sortedData = [...measurementIds]
        .map((id) => measurementsById[id])
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);

      const latest = sortedData[0];
      if (!latest) return [];

      return visibleMetrics.map((metric) => {
        const valRecordId = latest.valueIds.find((vId) => valuesById[vId]?.metricId === metric.id);
        const valRecord = valRecordId ? valuesById[valRecordId] : undefined;
        const metricIndex = metrics.findIndex((m) => m.id === metric.id);
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
      value: d.value as number, // type assertion to avoid issues
      unit: dataset.unit?.symbol || dataset.unit?.name || "?",
      displayDate: d.displayDate,
      tooltipId: d.tooltipId,
    }));
  }, [
    dataset,
    measurementIds,
    measurementsById,
    valuesById,
    visibleMetrics,
    metrics,
    chartData,
    isClient,
  ]);

  return {
    isClient,
    metrics,
    visibleMetricIds,
    visibleMetrics,
    chartData,
    pieData,
    toggleMetricVisibility,
  };
}
