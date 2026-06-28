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
      get: mock(() => Promise.resolve(null)),
      put: mock(() => Promise.resolve()),
      bulkPut: mock(() => Promise.resolve()),
      delete: mockDbMeasurementsDelete,
      bulkDelete: mockDbMeasurementsBulkDelete,
      where: mock(() => ({
        anyOf: mock(() => ({
          toArray: mock(() => Promise.resolve([])),
        })),
        equals: mock(() => ({
          toArray: mock(() => Promise.resolve([])),
        })),
      })),
    },
    measurement_values: {
      bulkPut: mock(() => Promise.resolve()),
      where: mock(() => ({
        equals: mock(() => ({
          delete: mockDbValuesDelete,
          toArray: mock(() => Promise.resolve([])),
        })),
        anyOf: mock(() => ({
          delete: mockDbValuesDelete,
          toArray: mock(() => Promise.resolve([])),
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
  return createStore<any>((set, get, api) => {
    const datasetsById = initialDatasets.reduce(
      (acc, ds) => ({ ...acc, [ds.id]: ds }),
      {} as Record<string, Dataset>,
    );
    const datasetIds = initialDatasets.map((ds) => ds.id);
    const measurementToDatasetMap: Record<string, string> = {};
    const measurementsById: Record<string, any> = {};
    const valuesById: Record<string, any> = {};

    initialDatasets.forEach((ds) => {
      ds.measurementIds?.forEach((mId) => {
        measurementToDatasetMap[mId] = ds.id;
        measurementsById[mId] = { id: mId, timestamp: Date.now(), valueIds: [] };
      });
    });

    return {
      datasetsById,
      datasetIds,
      metricsById: {},
      measurementsById,
      valuesById,
      measurementToDatasetMap,
      error: null,
      ...createMeasurementSlice(set, get, api),
    };
  });
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
      unit: { id: "unit1", name: "Gram", symbol: "g", created: 0, updated: 0 },
      views: ["line"],
      created: Date.now(),
      updated: Date.now(),
      metricIds: [],
      measurementIds: ["m1", "m2", "m3"],
    },
  ];

  test("removeMeasurement removes a single measurement from state", async () => {
    const store = createTestStore(initialDatasets);

    await store.getState().removeMeasurement("m2");

    const datasetsById: Record<string, Dataset> = store.getState().datasetsById;
    expect(datasetsById[datasetId].measurementIds).toHaveLength(2);
    expect(datasetsById[datasetId].measurementIds).toEqual(["m1", "m3"]);

    expect(mockDbMeasurementsDelete).toHaveBeenCalledWith("m2");
    expect(mockTryPbOrQueue).toHaveBeenCalled();
  });

  test("removeMeasurements removes multiple measurements from state", async () => {
    const store = createTestStore(initialDatasets);

    await store.getState().removeMeasurements(["m1", "m3"]);

    const datasetsById: Record<string, Dataset> = store.getState().datasetsById;
    expect(datasetsById[datasetId].measurementIds).toHaveLength(1);
    expect(datasetsById[datasetId].measurementIds[0]).toBe("m2");

    expect(mockDbMeasurementsBulkDelete).toHaveBeenCalledWith(["m1", "m3"]);
    expect(mockTryPbOrQueue).toHaveBeenCalledTimes(2);
  });
});
