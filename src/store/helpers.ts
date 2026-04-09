import type {
  Dataset,
  DatasetRecord,
  MetricRecord,
  MeasurementRecord,
  MeasurementValueRecord,
  UnitRecord,
  Metric,
  Measurement,
  MeasurementValue,
} from "../types/dataset";

export const buildDatasets = (
  datasetRecords: DatasetRecord[],
  metricRecords: MetricRecord[],
  unitRecords: UnitRecord[],
  measurementRecords: MeasurementRecord[],
  valueRecords: MeasurementValueRecord[]
): Dataset[] => {
  return datasetRecords.map((d) => {
    // 1. Filter metrics for this dataset
    const metrics: Metric[] = metricRecords
      .filter((m) => m.datasetId === d.id)
      .map((m) => {
        const unit = unitRecords.find((u) => u.id === m.unitId) || {
          id: "unknown",
          name: "Unknown",
          symbol: "?",
          created: Date.now(),
          updated: Date.now(),
        };
        return {
          id: m.id,
          name: m.name,
          unit,
        };
      });

    // 2. Filter measurements (events) for this dataset
    const measurements: Measurement[] = measurementRecords
      .filter((m) => m.datasetId === d.id)
      .map((m) => {
        // Find values for this specific measurement event
        const values: MeasurementValue[] = valueRecords
          .filter((v) => v.measurementId === m.id)
          .map((v) => {
            const metric = metrics.find((met) => met.id === v.metricId);
            return {
              metricId: v.metricId,
              name: metric?.name || "Unknown",
              value: v.value,
              unit: metric?.unit || {
                id: "unknown",
                name: "Unknown",
                symbol: "?",
                created: Date.now(),
                updated: Date.now(),
              },
            };
          });

        return {
          id: m.id,
          timestamp: m.timestamp,
          values,
          created: m.created,
          updated: m.updated,
        };
      });

    // 3. Find latest measurement
    const sortedMeasurements = [...measurements].sort((a, b) => b.timestamp - a.timestamp);
    const latestMeasurement = sortedMeasurements[0];

    // 4. Determine primary unit (first metric)
    const primaryUnit = metrics[0]?.unit || {
      id: "unknown",
      name: "Unknown",
      symbol: "?",
      created: Date.now(),
      updated: Date.now(),
    };

    return {
      id: d.id,
      title: d.title,
      description: d.description,
      type: d.type || "single", // Default to single for legacy records
      views: d.views,
      created: d.created,
      updated: d.updated,
      metrics,
      measurements: sortedMeasurements,
      unit: primaryUnit,
      latestMeasurement,
    };
  });
};
