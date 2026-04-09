import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createStore } from "zustand";

// ─── Mock infrastructure ─────────────────────────────────────────

// Per-collection mock storage so we can assert on individual collections
type MockCollectionData = {
  id?: string;
  dataset_id?: string;
  measurement_id?: string;
  title?: string;
  description?: string;
  views?: string[];
  preference?: string;
  value?: string;
  timestamp?: string | number;
  filter?: string;
  name?: string;
  symbol?: string;
  [key: string]: unknown;
};

const collections: Record<
  string,
  {
    getFullList: import("bun:test").Mock<(opts?: MockCollectionData) => Promise<unknown[]>>;
    create: import("bun:test").Mock<(record: MockCollectionData) => Promise<unknown>>;
    update: import("bun:test").Mock<(id: string, record: MockCollectionData) => Promise<unknown>>;
    delete: import("bun:test").Mock<(id: string) => Promise<unknown>>;
  }
> = {};
function getMockCollection(name: string) {
  if (!collections[name]) {
    collections[name] = {
      getFullList: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve()),
      update: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
    };
  }
  return collections[name];
}

function resetCollections() {
  for (const key of Object.keys(collections)) {
    delete collections[key];
  }
}

const mockPb = {
  collection: mock((name: string) => getMockCollection(name)),
};

// DB mock with per-table mocks
let mockOps: unknown[] = [];
const mockOpsToArray = mock(() => Promise.resolve(mockOps));
const mockOpsOrderBy = mock(() => ({ toArray: mockOpsToArray }));
const mockOpsDelete = mock(() => Promise.resolve());
const mockOpsAdd = mock(() => Promise.resolve());

function makeTableMock() {
  return {
    clear: mock(() => Promise.resolve()),
    bulkPut: mock((_items: unknown[]) => Promise.resolve()),
    toArray: mock((): Promise<unknown[]> => Promise.resolve([])),
    put: mock((_item: unknown) => Promise.resolve()),
  };
}

const dbTables = {
  datasets: makeTableMock(),
  metrics: makeTableMock(),
  units: makeTableMock(),
  measurements: makeTableMock(),
  measurement_values: makeTableMock(),
  preferences: makeTableMock(),
};

const mockDb = {
  ...dbTables,
  offline_ops: {
    orderBy: mockOpsOrderBy,
    delete: mockOpsDelete,
    add: mockOpsAdd,
  },
  transaction: mock(async (...args: unknown[]) => {
    const fn = args[args.length - 1] as () => Promise<void>;
    await fn();
  }),
};

mock.module("@/lib/pocketbase", () => ({ pb: mockPb }));
mock.module("@/lib/dexieDb", () => ({ db: mockDb }));

import { createSyncSlice } from "@/store/slices/syncSlice";

// ─── Test store helper ───────────────────────────────────────────

function createTestStore(overrides: Record<string, unknown> = {}) {
  // biome-ignore lint/suspicious/noExplicitAny: Mock test store creation bypass
  return createStore<any>((set, get, api) => ({
    datasets: [],
    units: [],
    preferences: [],
    selectedDatasetId: null,
    isLoading: false,
    error: null,
    isHydrated: false,
    ...overrides,
    ...createSyncSlice(set, get, api),
  }));
}

// ─── Reset helper ────────────────────────────────────────────────

function resetAllMocks() {
  mockOps = [];
  resetCollections();
  mockOpsOrderBy.mockClear();
  mockOpsToArray.mockClear();
  mockOpsDelete.mockClear();
  mockOpsAdd.mockClear();
  mockPb.collection.mockClear();
  mockDb.transaction.mockClear();
  for (const table of Object.values(dbTables)) {
    table.clear.mockClear();
    table.bulkPut.mockClear();
    table.toArray.mockClear();
    table.put.mockClear();
  }
}

// ─────────────────────────────────────────────────────────────────
// localToPbSync
// ─────────────────────────────────────────────────────────────────

describe("localToPbSync", () => {
  beforeEach(resetAllMocks);

  test("returns early when there are no offline ops", async () => {
    mockOps = [];
    const store = createTestStore();

    await store.getState().localToPbSync();

    expect(mockPb.collection).not.toHaveBeenCalled();
  });

  test("creates a dataset with its metrics on PocketBase", async () => {
    const datasetRecord = {
      id: "ds1",
      title: "Weight",
      description: "",
      type: "single",
      views: ["line"],
      created: 1000,
      updated: 2000,
    };
    const metricRecords = [
      { id: "m1", datasetId: "ds1", name: "Weight", unitId: "u1", created: 1000, updated: 2000 },
    ];

    mockOps = [
      {
        id: 1,
        collection: "datasets",
        action: "create",
        recordId: "ds1",
        data: { datasetRecord, metricRecords },
        timestamp: 1000,
      },
    ];

    const store = createTestStore();
    await store.getState().localToPbSync();

    const dsCollection = getMockCollection("datasets");
    expect(dsCollection.create).toHaveBeenCalledTimes(1);
    expect(dsCollection.create.mock.calls[0][0].id).toBe("ds1");

    const metCollection = getMockCollection("metrics");
    expect(metCollection.create).toHaveBeenCalledTimes(1);
    expect(metCollection.create.mock.calls[0][0].id).toBe("m1");
    expect(metCollection.create.mock.calls[0][0].dataset_id).toBe("ds1");
  });

  test("creates a measurement with its values on PocketBase", async () => {
    const measurementRecord = {
      id: "meas1",
      datasetId: "ds1",
      timestamp: 5000,
      created: 5000,
      updated: 5000,
    };
    const valueRecords = [
      { id: "v1", measurementId: "meas1", metricId: "m1", value: 75, created: 5000, updated: 5000 },
    ];

    mockOps = [
      {
        id: 2,
        collection: "measurements",
        action: "create",
        recordId: "meas1",
        data: { measurementRecord, valueRecords },
        timestamp: 5000,
      },
    ];

    const store = createTestStore();
    await store.getState().localToPbSync();

    const measCollection = getMockCollection("measurements");
    expect(measCollection.create).toHaveBeenCalledTimes(1);
    expect(measCollection.create.mock.calls[0][0].id).toBe("meas1");

    const mvCollection = getMockCollection("measurement_values");
    expect(mvCollection.create).toHaveBeenCalledTimes(1);
    expect(mvCollection.create.mock.calls[0][0].measurement_id).toBe("meas1");
  });

  test("creates a standalone measurement_value on PocketBase", async () => {
    const data = {
      id: "v1",
      measurementId: "meas1",
      metricId: "m1",
      value: 80,
      created: 1000,
      updated: 1000,
    };

    mockOps = [
      {
        id: 3,
        collection: "measurement_values",
        action: "create",
        recordId: "v1",
        data,
        timestamp: 1000,
      },
    ];

    const store = createTestStore();
    await store.getState().localToPbSync();

    const mvCollection = getMockCollection("measurement_values");
    expect(mvCollection.create).toHaveBeenCalledTimes(1);
    expect(mvCollection.create.mock.calls[0][0].id).toBe("v1");
    expect(mvCollection.create.mock.calls[0][0].measurement_id).toBe("meas1");
  });

  test("updates a dataset with specific fields", async () => {
    const datasetRecord = {
      id: "ds1",
      title: "Updated",
      description: "new desc",
      type: "single",
      views: ["bar"],
      created: 1000,
      updated: 3000,
    };

    mockOps = [
      {
        id: 4,
        collection: "datasets",
        action: "update",
        recordId: "ds1",
        data: { datasetRecord },
        timestamp: 3000,
      },
    ];

    const store = createTestStore();
    await store.getState().localToPbSync();

    const dsCollection = getMockCollection("datasets");
    expect(dsCollection.update).toHaveBeenCalledTimes(1);
    expect(dsCollection.update.mock.calls[0][0]).toBe("ds1");
    const updateData = dsCollection.update.mock.calls[0][1];
    expect(updateData.title).toBe("Updated");
    expect(updateData.description).toBe("new desc");
    expect(updateData.views).toEqual(["bar"]);
  });

  test("updates a generic record for non-dataset collections", async () => {
    const data = { name: "Meter", symbol: "m" };

    mockOps = [
      {
        id: 5,
        collection: "units",
        action: "update",
        recordId: "u1",
        data,
        timestamp: 1000,
      },
    ];

    const store = createTestStore();
    await store.getState().localToPbSync();

    const unitCollection = getMockCollection("units");
    expect(unitCollection.update).toHaveBeenCalledTimes(1);
    expect(unitCollection.update.mock.calls[0][0]).toBe("u1");
    expect(unitCollection.update.mock.calls[0][1]).toEqual(data);
  });

  test("deletes a record and ignores 404", async () => {
    getMockCollection("datasets").delete.mockImplementationOnce(() =>
      Promise.reject({ status: 404 }),
    );

    mockOps = [
      {
        id: 6,
        collection: "datasets",
        action: "delete",
        recordId: "ds_gone",
        data: null,
        timestamp: 1000,
      },
    ];

    const store = createTestStore();
    // Should not throw
    await store.getState().localToPbSync();

    expect(mockOpsDelete).toHaveBeenCalledWith(6);
  });

  test("re-throws non-404 delete errors (logged, not propagated)", async () => {
    getMockCollection("datasets").delete.mockImplementationOnce(() =>
      Promise.reject({ status: 500 }),
    );

    mockOps = [
      {
        id: 7,
        collection: "datasets",
        action: "delete",
        recordId: "ds1",
        data: null,
        timestamp: 1000,
      },
    ];

    const store = createTestStore();
    // localToPbSync catches outer errors and logs them, does not propagate
    await store.getState().localToPbSync();

    // The op should NOT have been deleted since the inner throw is caught by the outer catch
    expect(mockOpsDelete).not.toHaveBeenCalled();
  });

  test("deletes op from queue after successful sync", async () => {
    mockOps = [
      {
        id: 10,
        collection: "units",
        action: "create",
        recordId: "u1",
        data: { id: "u1", name: "Kg", symbol: "kg" },
        timestamp: 1000,
      },
    ];

    const store = createTestStore();
    await store.getState().localToPbSync();

    expect(mockOpsDelete).toHaveBeenCalledWith(10);
  });

  test("processes multiple ops in order", async () => {
    const callOrder: string[] = [];

    getMockCollection("units").create.mockImplementation(async () => {
      callOrder.push("create-unit");
    });
    getMockCollection("datasets").delete.mockImplementation(async () => {
      callOrder.push("delete-dataset");
    });

    mockOps = [
      {
        id: 1,
        collection: "units",
        action: "create",
        recordId: "u1",
        data: { id: "u1" },
        timestamp: 1000,
      },
      {
        id: 2,
        collection: "datasets",
        action: "delete",
        recordId: "ds1",
        data: null,
        timestamp: 2000,
      },
    ];

    const store = createTestStore();
    await store.getState().localToPbSync();

    expect(callOrder).toEqual(["create-unit", "delete-dataset"]);
  });
});

// ─────────────────────────────────────────────────────────────────
// pbToLocalSync
// ─────────────────────────────────────────────────────────────────

describe("pbToLocalSync", () => {
  beforeEach(resetAllMocks);

  test("fetches all collections, maps data, and sets state", async () => {
    const pbDatasets = [
      {
        id: "ds1",
        title: "W",
        description: "",
        type: "single",
        views: [],
        created: "2024-01-01T00:00:00.000Z",
        updated: "2024-01-01T00:00:00.000Z",
      },
    ];
    const pbUnits = [
      {
        id: "u1",
        name: "Kg",
        symbol: "kg",
        created: "2024-01-01T00:00:00.000Z",
        updated: "2024-01-01T00:00:00.000Z",
      },
    ];
    const pbMetrics = [
      {
        id: "m1",
        dataset_id: "ds1",
        name: "Weight",
        unit_id: "u1",
        created: "2024-01-01T00:00:00.000Z",
        updated: "2024-01-01T00:00:00.000Z",
      },
    ];

    getMockCollection("datasets").getFullList.mockResolvedValueOnce(pbDatasets);
    getMockCollection("metrics").getFullList.mockResolvedValueOnce(pbMetrics);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce(pbUnits);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    const store = createTestStore({ isLoading: true });
    await store.getState().pbToLocalSync();

    const state = store.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isHydrated).toBe(true);
    expect(state.datasets).toHaveLength(1);
    expect(state.datasets[0].title).toBe("W");
    expect(state.units).toHaveLength(1);
    expect(state.units[0].name).toBe("Kg");
  });

  test("clears and repopulates all Dexie tables", async () => {
    getMockCollection("datasets").getFullList.mockResolvedValueOnce([]);
    getMockCollection("metrics").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce([]);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    const store = createTestStore();
    await store.getState().pbToLocalSync();

    // Wait for background Dexie sync
    await new Promise((r) => setTimeout(r, 50));

    for (const tableName of [
      "datasets",
      "metrics",
      "units",
      "measurements",
      "measurement_values",
      "preferences",
    ] as const) {
      expect(dbTables[tableName].clear).toHaveBeenCalledTimes(1);
      expect(dbTables[tableName].bulkPut).toHaveBeenCalledTimes(1);
    }
  });

  test("sets error state on PocketBase fetch failure", async () => {
    getMockCollection("datasets").getFullList.mockRejectedValueOnce(new Error("Network error"));
    getMockCollection("metrics").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce([]);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    const store = createTestStore({ isLoading: true });
    await store.getState().pbToLocalSync();

    const state = store.getState();
    expect(state.error).toBe("Network error");
    expect(state.isLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// pbDeltaSync
// ─────────────────────────────────────────────────────────────────

describe("pbDeltaSync", () => {
  beforeEach(resetAllMocks);

  test("returns early when no changed records", async () => {
    dbTables.preferences.toArray.mockResolvedValueOnce([]);

    // All empty results
    getMockCollection("datasets").getFullList.mockResolvedValueOnce([]);
    getMockCollection("metrics").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce([]);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    const store = createTestStore();
    await store.getState().pbDeltaSync();

    // No Dexie transaction should have been called
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  test("uses last_sync_time as the PocketBase filter", async () => {
    const prefs = [
      {
        id: "lst",
        preference: "last_sync_time",
        value: "2024-06-15 14:30:00",
        created: 0,
        updated: 0,
      },
    ];
    dbTables.preferences.toArray.mockResolvedValueOnce(prefs);

    getMockCollection("datasets").getFullList.mockResolvedValueOnce([]);
    getMockCollection("metrics").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce([]);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    const store = createTestStore();
    await store.getState().pbDeltaSync();

    const dsCall = getMockCollection("datasets").getFullList.mock.calls[0][0] as MockCollectionData;
    expect(dsCall.filter).toBe('updated > "2024-06-15 14:30:00"');
  });

  test("updates Dexie with changed records", async () => {
    dbTables.preferences.toArray
      .mockResolvedValueOnce([]) // initial preferences read
      .mockResolvedValueOnce([]); // final read-all

    const changedDataset = {
      id: "ds1",
      title: "Updated",
      description: "",
      type: "single",
      views: [],
      created: "2024-01-01T00:00:00.000Z",
      updated: "2024-06-15T00:00:00.000Z",
    };

    getMockCollection("datasets").getFullList.mockResolvedValueOnce([changedDataset]);
    getMockCollection("metrics").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce([]);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    // Mock the read-all after transaction
    dbTables.datasets.toArray.mockResolvedValueOnce([
      {
        id: "ds1",
        title: "Updated",
        description: "",
        type: "single",
        views: [],
        created: 1704067200000,
        updated: 1718409600000,
      },
    ]);
    dbTables.metrics.toArray.mockResolvedValueOnce([]);
    dbTables.units.toArray.mockResolvedValueOnce([]);
    dbTables.measurements.toArray.mockResolvedValueOnce([]);
    dbTables.measurement_values.toArray.mockResolvedValueOnce([]);

    const store = createTestStore();
    await store.getState().pbDeltaSync();

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(dbTables.datasets.bulkPut).toHaveBeenCalledTimes(1);
  });

  test("rebuilds and sets state from all Dexie data after sync", async () => {
    dbTables.preferences.toArray
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: "p1", preference: "theme", value: "dark", created: 0, updated: 0 },
      ]);

    const changedUnit = {
      id: "u1",
      name: "Kg",
      symbol: "kg",
      created: "2024-01-01T00:00:00.000Z",
      updated: "2024-06-15T00:00:00.000Z",
    };

    getMockCollection("datasets").getFullList.mockResolvedValueOnce([]);
    getMockCollection("metrics").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce([changedUnit]);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    // Mock the read-all after transaction
    dbTables.datasets.toArray.mockResolvedValueOnce([]);
    dbTables.metrics.toArray.mockResolvedValueOnce([]);
    dbTables.units.toArray.mockResolvedValueOnce([
      { id: "u1", name: "Kg", symbol: "kg", created: 0, updated: 0 },
    ]);
    dbTables.measurements.toArray.mockResolvedValueOnce([]);
    dbTables.measurement_values.toArray.mockResolvedValueOnce([]);

    const store = createTestStore();
    await store.getState().pbDeltaSync();

    const state = store.getState();
    expect(state.units).toHaveLength(1);
    expect(state.units[0].name).toBe("Kg");
  });

  test("updates last_sync_time preference on success", async () => {
    dbTables.preferences.toArray.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const changedUnit = {
      id: "u1",
      name: "Kg",
      symbol: "kg",
      created: "2024-01-01T00:00:00.000Z",
      updated: "2024-06-15T00:00:00.000Z",
    };

    getMockCollection("datasets").getFullList.mockResolvedValueOnce([]);
    getMockCollection("metrics").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurements").getFullList.mockResolvedValueOnce([]);
    getMockCollection("measurement_values").getFullList.mockResolvedValueOnce([]);
    getMockCollection("units").getFullList.mockResolvedValueOnce([changedUnit]);
    getMockCollection("preferences").getFullList.mockResolvedValueOnce([]);

    dbTables.datasets.toArray.mockResolvedValueOnce([]);
    dbTables.metrics.toArray.mockResolvedValueOnce([]);
    dbTables.units.toArray.mockResolvedValueOnce([]);
    dbTables.measurements.toArray.mockResolvedValueOnce([]);
    dbTables.measurement_values.toArray.mockResolvedValueOnce([]);

    const store = createTestStore();
    await store.getState().pbDeltaSync();

    // last_sync_time should have been written via db.preferences.put inside the transaction
    expect(dbTables.preferences.put).toHaveBeenCalledTimes(1);
    const putArg = dbTables.preferences.put.mock.calls[0][0] as {
      preference: string;
      value: string;
    };
    expect(putArg.preference).toBe("last_sync_time");
    expect(typeof putArg.value).toBe("string");
  });
});
