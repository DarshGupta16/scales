import type {
  Dataset,
  DatasetRecord,
  Measurement,
  MeasurementRecord,
  MeasurementValue,
  MeasurementValueRecord,
  Metric,
  MetricRecord,
  UnitRecord,
} from "../types/dataset";

const UNKNOWN_UNIT: UnitRecord = {
  id: "unknown",
  name: "Unknown",
  symbol: "?",
  created: 0,
  updated: 0,
};

/**
 * Assembles denormalized Dataset objects from normalized records.
 * Uses Map-based lookups for O(n) performance instead of nested .filter()/.find().
 *
 * Also handles legacy (pre-composite) data gracefully as a fallback:
 * - Datasets that still have a `unitId` but no metrics get a synthesized metric.
 * - Measurements that still have an inline `value` but no measurement_values get a synthesized value.
 */
// Tested in tests/store/helpers.test.ts
export interface BuildResult {
  datasetsById: Record<string, Dataset>;
  datasetIds: string[];
  measurementToDatasetMap: Record<string, string>;
}

export const buildDatasetsMap = (
  datasetRecords: DatasetRecord[],
  metricRecords: MetricRecord[],
  unitRecords: UnitRecord[],
  measurementRecords: MeasurementRecord[],
  valueRecords: MeasurementValueRecord[],
): BuildResult => {
  // Pre-build lookup indices
  const unitMap = new Map(unitRecords.map((u) => [u.id, u]));

  const metricsByDataset = new Map<string, MetricRecord[]>();
  for (const m of metricRecords) {
    const list = metricsByDataset.get(m.datasetId);
    if (list) list.push(m);
    else metricsByDataset.set(m.datasetId, [m]);
  }

  const measurementToDatasetMap: Record<string, string> = {};
  const measurementsByDataset = new Map<string, MeasurementRecord[]>();
  for (const m of measurementRecords) {
    measurementToDatasetMap[m.id] = m.datasetId;
    const list = measurementsByDataset.get(m.datasetId);
    if (list) list.push(m);
    else measurementsByDataset.set(m.datasetId, [m]);
  }

  const valuesByMeasurement = new Map<string, MeasurementValueRecord[]>();
  for (const v of valueRecords) {
    const list = valuesByMeasurement.get(v.measurementId);
    if (list) list.push(v);
    else valuesByMeasurement.set(v.measurementId, [v]);
  }

  const datasetsById: Record<string, Dataset> = {};
  const datasetIds: string[] = [];

  for (const d of datasetRecords) {
    // 1. Resolve metrics for this dataset
    let rawMetrics = metricsByDataset.get(d.id) || [];

    // Legacy fallback: if dataset has a unitId but no metrics exist,
    // synthesize a virtual metric so data is still displayable.
    if (rawMetrics.length === 0 && d.unitId) {
      rawMetrics = [
        {
          id: `legacy-metric-${d.id}`,
          datasetId: d.id,
          name: "Value",
          unitId: d.unitId,
          created: d.created,
          updated: d.updated,
        },
      ];
    }

    const metrics: Metric[] = rawMetrics.map((m) => ({
      id: m.id,
      name: m.name,
      unit: unitMap.get(m.unitId) || UNKNOWN_UNIT,
    }));

    // Build a quick metric lookup for value resolution
    const metricMap = new Map(metrics.map((m) => [m.id, m]));

    // 2. Resolve measurements for this dataset
    const rawMeasurements = measurementsByDataset.get(d.id) || [];
    const measurements: Measurement[] = rawMeasurements.map((m) => {
      let rawValues = valuesByMeasurement.get(m.id) || [];

      // Legacy fallback: if measurement has an inline `value` but no
      // measurement_values records, synthesize a virtual value using the
      // first (or legacy) metric so data is still displayable.
      // biome-ignore lint/suspicious/noExplicitAny: Legacy Dexie records may have dynamic shape
      const legacyMeasurement = m as any;
      if (
        rawValues.length === 0 &&
        legacyMeasurement.value !== null &&
        legacyMeasurement.value !== undefined &&
        rawMetrics.length > 0
      ) {
        rawValues = [
          {
            id: `legacy-value-${m.id}`,
            measurementId: m.id,
            metricId: rawMetrics[0].id,
            value: legacyMeasurement.value,
            created: m.created,
            updated: m.updated,
          },
        ];
      }

      const values: MeasurementValue[] = rawValues.map((v) => {
        const metric = metricMap.get(v.metricId);
        return {
          metricId: v.metricId,
          name: metric?.name || "Unknown",
          value: v.value,
          unit: metric?.unit || UNKNOWN_UNIT,
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

    // 3. Sort measurements descending by timestamp
    const sortedMeasurements = measurements.sort((a, b) => b.timestamp - a.timestamp);

    // 4. Determine primary unit (first metric)
    const primaryUnit = metrics[0]?.unit || UNKNOWN_UNIT;

    const dataset: Dataset = {
      id: d.id,
      title: d.title,
      description: d.description,
      type: d.type || "single",
      views: d.views,
      created: d.created,
      updated: d.updated,
      metrics,
      measurements: sortedMeasurements,
      unit: primaryUnit,
      latestMeasurement: sortedMeasurements[0],
    };

    datasetsById[d.id] = dataset;
    datasetIds.push(d.id);
  }

  return { datasetsById, datasetIds, measurementToDatasetMap };
};

export const buildHydrationPayload = (
  datasetRecords: DatasetRecord[],
  metricRecords: MetricRecord[],
  unitRecords: UnitRecord[],
  measurementRecords: MeasurementRecord[],
  valueRecords: MeasurementValueRecord[],
  preferenceRecords: any[],
) => {
  const result = buildDatasetsMap(
    datasetRecords,
    metricRecords,
    unitRecords,
    measurementRecords,
    valueRecords,
  );

  const unitsById: Record<string, (typeof unitRecords)[0]> = {};
  const unitIds: string[] = [];
  for (const u of unitRecords) {
    unitsById[u.id] = u;
    unitIds.push(u.id);
  }

  return {
    datasetsById: result.datasetsById,
    datasetIds: result.datasetIds,
    measurementToDatasetMap: result.measurementToDatasetMap,
    unitsById,
    unitIds,
    preferences: preferenceRecords,
  };
};
