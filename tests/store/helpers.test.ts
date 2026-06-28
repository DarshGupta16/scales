import { describe, expect, test } from "bun:test";
import { buildDatasetsMap } from "@/store/helpers";
import type {
  DatasetRecord,
  MeasurementRecord,
  MeasurementValueRecord,
  MetricRecord,
  UnitRecord,
} from "@/types/dataset";

const UNKNOWN_UNIT = {
  id: "unknown",
  name: "Unknown",
  symbol: "?",
  created: 0,
  updated: 0,
};

// ─── Factories ───────────────────────────────────────────────────

const makeDataset = (overrides: Partial<DatasetRecord> = {}): DatasetRecord => ({
  id: "ds1",
  title: "Weight",
  description: "Body weight",
  type: "single",
  views: ["line"] as DatasetRecord["views"],
  created: 1000,
  updated: 2000,
  ...overrides,
});

const makeUnit = (overrides: Partial<UnitRecord> = {}): UnitRecord => ({
  id: "u1",
  name: "Kilogram",
  symbol: "kg",
  created: 0,
  updated: 0,
  ...overrides,
});

const makeMetric = (overrides: Partial<MetricRecord> = {}): MetricRecord => ({
  id: "m1",
  datasetId: "ds1",
  name: "Weight",
  unitId: "u1",
  created: 0,
  updated: 0,
  ...overrides,
});

const makeMeasurement = (overrides: Partial<MeasurementRecord> = {}): MeasurementRecord => ({
  id: "meas1",
  datasetId: "ds1",
  timestamp: 5000,
  created: 5000,
  updated: 5000,
  ...overrides,
});

const makeValue = (overrides: Partial<MeasurementValueRecord> = {}): MeasurementValueRecord => ({
  id: "v1",
  measurementId: "meas1",
  metricId: "m1",
  value: 75.5,
  created: 5000,
  updated: 5000,
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────

const buildDatasets = (...args: Parameters<typeof buildDatasetsMap>) => {
  const result = buildDatasetsMap(...args);
  return {
    datasets: result.datasetIds.map((id) => result.datasetsById[id]),
    metricsById: result.metricsById,
    measurementsById: result.measurementsById,
    valuesById: result.valuesById,
  };
};

describe("buildDatasets", () => {
  // --- Empty / minimal inputs ---

  test("returns empty array for empty inputs", () => {
    const { datasets } = buildDatasets([], [], [], [], []);
    expect(datasets).toEqual([]);
  });

  test("builds a dataset with no metrics or measurements", () => {
    const ds = makeDataset();
    const { datasets } = buildDatasets([ds], [], [], [], []);

    expect(datasets).toHaveLength(1);
    expect(datasets[0].id).toBe("ds1");
    expect(datasets[0].title).toBe("Weight");
    expect(datasets[0].description).toBe("Body weight");
    expect(datasets[0].type).toBe("single");
    expect(datasets[0].views).toEqual(["line"]);
    expect(datasets[0].metricIds).toEqual([]);
    expect(datasets[0].measurementIds).toEqual([]);
    expect(datasets[0].unit).toEqual(UNKNOWN_UNIT);
    expect(datasets[0].latestMeasurement).toBeUndefined();
  });

  // --- Metric resolution ---

  test("resolves metrics with their correct units", () => {
    const { datasets, metricsById } = buildDatasets(
      [makeDataset()],
      [makeMetric()],
      [makeUnit()],
      [],
      [],
    );

    expect(datasets[0].metricIds).toHaveLength(1);
    expect(metricsById["m1"]).toEqual({
      id: "m1",
      name: "Weight",
      unit: { id: "u1", name: "Kilogram", symbol: "kg", created: 0, updated: 0 },
    });
  });

  test("falls back to UNKNOWN_UNIT when unit is not found", () => {
    const metric = makeMetric({ unitId: "non_existent" });
    const { metricsById } = buildDatasets([makeDataset()], [metric], [], [], []);

    expect(metricsById["m1"].unit).toEqual(UNKNOWN_UNIT);
  });

  test("assigns multiple metrics to the correct dataset", () => {
    const m1 = makeMetric({ id: "m1", name: "Weight", unitId: "u1" });
    const m2 = makeMetric({ id: "m2", name: "Height", unitId: "u2" });
    const u1 = makeUnit({ id: "u1", name: "Kilogram", symbol: "kg" });
    const u2 = makeUnit({ id: "u2", name: "Meter", symbol: "m" });

    const { datasets, metricsById } = buildDatasets([makeDataset()], [m1, m2], [u1, u2], [], []);

    expect(datasets[0].metricIds).toHaveLength(2);
    expect(metricsById["m1"].name).toBe("Weight");
    expect(metricsById["m2"].name).toBe("Height");
  });

  test("does not assign metrics from another dataset", () => {
    const ds1 = makeDataset({ id: "ds1" });
    const ds2 = makeDataset({ id: "ds2", title: "Other" });
    const m = makeMetric({ datasetId: "ds2" });

    const { datasets } = buildDatasets([ds1, ds2], [m], [makeUnit()], [], []);

    expect(datasets[0].metricIds).toHaveLength(0);
    expect(datasets[1].metricIds).toHaveLength(1);
  });

  // --- Primary unit ---

  test("sets primaryUnit from first metric's unit", () => {
    const u = makeUnit({ id: "u1", name: "Kilogram", symbol: "kg" });
    const m = makeMetric({ unitId: "u1" });
    const { datasets } = buildDatasets([makeDataset()], [m], [u], [], []);

    expect(datasets[0].unit).toEqual(u);
  });

  test("primaryUnit is UNKNOWN_UNIT when there are no metrics", () => {
    const { datasets } = buildDatasets([makeDataset()], [], [], [], []);
    expect(datasets[0].unit).toEqual(UNKNOWN_UNIT);
  });

  // --- Measurement assembly ---

  test("assembles measurements with their values", () => {
    const meas = makeMeasurement({ id: "meas1", timestamp: 5000 });
    const val = makeValue({ measurementId: "meas1", metricId: "m1", value: 75.5 });

    const { datasets, measurementsById, valuesById } = buildDatasets(
      [makeDataset()],
      [makeMetric()],
      [makeUnit()],
      [meas],
      [val],
    );

    expect(datasets[0].measurementIds).toHaveLength(1);
    const m = measurementsById["meas1"];
    expect(m.id).toBe("meas1");
    expect(m.timestamp).toBe(5000);
    expect(m.valueIds).toHaveLength(1);
    expect(valuesById["v1"]).toEqual({
      id: "v1",
      measurementId: "meas1",
      metricId: "m1",
      value: 75.5,
      created: 5000,
      updated: 5000,
    });
  });

  test("measurement with no values has empty values array", () => {
    const meas = makeMeasurement();
    const { measurementsById } = buildDatasets([makeDataset()], [], [], [meas], []);

    expect(measurementsById["meas1"].valueIds).toEqual([]);
  });

  // --- Sorting ---

  test("sorts measurements descending by timestamp", () => {
    const m1 = makeMeasurement({ id: "meas1", timestamp: 1000 });
    const m2 = makeMeasurement({ id: "meas2", timestamp: 3000 });
    const m3 = makeMeasurement({ id: "meas3", timestamp: 2000 });

    const { datasets } = buildDatasets([makeDataset()], [], [], [m1, m2, m3], []);

    expect(datasets[0].measurementIds[0]).toBe("meas2");
    expect(datasets[0].measurementIds[1]).toBe("meas3");
    expect(datasets[0].measurementIds[2]).toBe("meas1");
  });

  // --- latestMeasurement ---

  test("latestMeasurement is the one with highest timestamp", () => {
    const m1 = makeMeasurement({ id: "old", timestamp: 1000 });
    const m2 = makeMeasurement({ id: "new", timestamp: 9999 });

    const { datasets } = buildDatasets([makeDataset()], [], [], [m1, m2], []);

    expect(datasets[0].latestMeasurement?.id).toBe("new");
  });

  test("latestMeasurement is undefined when there are no measurements", () => {
    const { datasets } = buildDatasets([makeDataset()], [], [], [], []);
    expect(datasets[0].latestMeasurement).toBeUndefined();
  });

  // --- Multiple datasets ---

  test("handles multiple datasets with isolated data", () => {
    const ds1 = makeDataset({ id: "ds1", title: "Weight" });
    const ds2 = makeDataset({ id: "ds2", title: "Sleep" });

    const u1 = makeUnit({ id: "u1", symbol: "kg" });
    const u2 = makeUnit({ id: "u2", name: "Hour", symbol: "h" });

    const met1 = makeMetric({ id: "m1", datasetId: "ds1", unitId: "u1" });
    const met2 = makeMetric({ id: "m2", datasetId: "ds2", name: "Duration", unitId: "u2" });

    const meas1 = makeMeasurement({ id: "meas1", datasetId: "ds1", timestamp: 5000 });
    const meas2 = makeMeasurement({ id: "meas2", datasetId: "ds2", timestamp: 6000 });

    const v1 = makeValue({ id: "v1", measurementId: "meas1", metricId: "m1", value: 80 });
    const v2 = makeValue({ id: "v2", measurementId: "meas2", metricId: "m2", value: 7.5 });

    const { datasets, valuesById } = buildDatasets(
      [ds1, ds2],
      [met1, met2],
      [u1, u2],
      [meas1, meas2],
      [v1, v2],
    );

    expect(datasets).toHaveLength(2);
    expect(datasets[0].metricIds).toHaveLength(1);
    expect(datasets[0].measurementIds).toHaveLength(1);
    expect(valuesById["v1"].value).toBe(80);
    expect(datasets[1].metricIds).toHaveLength(1);
    expect(datasets[1].measurementIds).toHaveLength(1);
    expect(valuesById["v2"].value).toBe(7.5);
  });

  // --- Type preservation ---

  test("handles composite dataset type", () => {
    const ds = makeDataset({ type: "composite" });
    const { datasets } = buildDatasets([ds], [], [], [], []);
    expect(datasets[0].type).toBe("composite");
  });

  test("preserves created and updated timestamps on dataset", () => {
    const ds = makeDataset({ created: 111, updated: 222 });
    const { datasets } = buildDatasets([ds], [], [], [], []);
    expect(datasets[0].created).toBe(111);
    expect(datasets[0].updated).toBe(222);
  });

  test("preserves created and updated timestamps on measurements", () => {
    const meas = makeMeasurement({ created: 333, updated: 444 });
    const { measurementsById } = buildDatasets([makeDataset()], [], [], [meas], []);
    expect(measurementsById["meas1"].created).toBe(333);
    expect(measurementsById["meas1"].updated).toBe(444);
  });
});
