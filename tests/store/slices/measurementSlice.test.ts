import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createStore } from "zustand";

// ─── Mocks ───────────────────────────────────────────────────────

const mockDbMeasurementsDelete = mock(() => Promise.resolve());
const mockDbMeasurementsBulkDelete = mock(() => Promise.resolve());
const mockDbValuesDelete = mock(() => Promise.resolve());

// Mock Dexie transaction helper to execute the last argument (callback)
const mockTransaction = mock((...args: unknown[]) => {
  const fn = args[args.length - 1] as () => Promise<void>;
  return fn();
});

mock.module("@/lib/dexieDb", () => ({
  db: {
    transaction: mockTransaction,
    measurements: {
      delete: mockDbMeasurementsDelete,
      bulkDelete: mockDbMeasurementsBulkDelete,
    },
    measurement_values: {
      where: mock(() => ({
        equals: mock(() => ({
          delete: mockDbValuesDelete,
        })),
        anyOf: mock(() => ({
          delete: mockDbValuesDelete,
        })),
      })),
    },
  },
}));

const mockPbDelete = mock(() => Promise.resolve());
mock.module("@/lib/pocketbase", () => ({
  pb: {
    collection: mock(() => ({
      delete: mockPbDelete,
      create: mock(() => Promise.resolve()),
    })),
  },
}));

const mockTryPbOrQueue = mock(async (fn: () => Promise<void>, _op: unknown) => {
  await fn();
});
mock.module("@/store/pbSync", () => ({
  tryPbOrQueue: mockTryPbOrQueue,
}));

import { createMeasurementSlice } from "@/store/slices/measurementSlice";
import type { Dataset } from "@/types/dataset";

// ─── Test store helper ───────────────────────────────────────────

function createTestStore(initialDatasets: Dataset[] = []) {
  // biome-ignore lint/suspicious/noExplicitAny: Mocking partial store state for isolated slice testing
  return createStore<any>((set, get, api) => ({
    datasets: initialDatasets,
    error: null,
    ...createMeasurementSlice(set, get, api),
  }));
}

// ─── Tests ───────────────────────────────────────────────────────

describe("createMeasurementSlice", () => {
  beforeEach(() => {
    mockDbMeasurementsDelete.mockClear();
    mockDbMeasurementsBulkDelete.mockClear();
    mockDbValuesDelete.mockClear();
    mockPbDelete.mockClear();
    mockTryPbOrQueue.mockClear();
  });

  const datasetId = "dataset1";
  const initialDatasets: Dataset[] = [
    {
      id: datasetId,
      title: "Test Dataset",
      description: "A dataset for testing",
      type: "single",
      unit: { id: "unit1", name: "Gram", symbol: "g" },
      views: ["line"],
      created: Date.now(),
      updated: Date.now(),
      measurements: [
        {
          id: "m1",
          timestamp: 1000,
          created: Date.now(),
          updated: Date.now(),
          values: [{ metricId: "metric1", value: 10 }],
        },
        {
          id: "m2",
          timestamp: 2000,
          created: Date.now(),
          updated: Date.now(),
          values: [{ metricId: "metric1", value: 20 }],
        },
        {
          id: "m3",
          timestamp: 3000,
          created: Date.now(),
          updated: Date.now(),
          values: [{ metricId: "metric1", value: 30 }],
        },
      ],
    },
  ];

  test("removeMeasurement removes a single measurement from state", async () => {
    const store = createTestStore(initialDatasets);

    await store.getState().removeMeasurement("m2");

    const datasets = store.getState().datasets;
    expect(datasets[0].measurements).toHaveLength(2);
    expect(datasets[0].measurements.map((m) => m.id)).toEqual(["m1", "m3"]);

    expect(mockDbMeasurementsDelete).toHaveBeenCalledWith("m2");
    expect(mockTryPbOrQueue).toHaveBeenCalled();
  });

  test("removeMeasurements removes multiple measurements from state", async () => {
    const store = createTestStore(initialDatasets);

    await store.getState().removeMeasurements(["m1", "m3"]);

    const datasets = store.getState().datasets;
    expect(datasets[0].measurements).toHaveLength(1);
    expect(datasets[0].measurements[0].id).toBe("m2");

    expect(mockDbMeasurementsBulkDelete).toHaveBeenCalledWith(["m1", "m3"]);
    expect(mockTryPbOrQueue).toHaveBeenCalledTimes(2);
  });
});
