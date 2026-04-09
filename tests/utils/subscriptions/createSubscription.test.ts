import { beforeEach, describe, expect, mock, test } from "bun:test";

// ─── Mocks ───────────────────────────────────────────────────────

let capturedCallback:
  | ((e: { record: { id: string; updated: number | string } }) => Promise<void>)
  | null = null;
const mockSubscribe = mock(
  (
    _pattern: string,
    cb: (e: { record: { id: string; updated: number | string } }) => Promise<void>,
  ) => {
    capturedCallback = cb;
    return Promise.resolve();
  },
);

mock.module("@/lib/pocketbase", () => ({
  pb: {
    collection: mock(() => ({
      subscribe: mockSubscribe,
    })),
  },
}));

const mockDeltaSync = mock(() => Promise.resolve());
mock.module("@/store", () => ({
  useDatasetStore: {
    getState: () => ({
      pbDeltaSync: mockDeltaSync,
    }),
  },
}));

import { createSubscription } from "@/utils/subscriptions/createSubscription";

// ─── Tests ───────────────────────────────────────────────────────

describe("createSubscription", () => {
  beforeEach(() => {
    capturedCallback = null;
    mockSubscribe.mockClear();
    mockDeltaSync.mockClear();
  });

  test("subscribes to the collection with '*' pattern", () => {
    const mockTable = { get: mock(() => Promise.resolve(null)) } as unknown as Parameters<
      typeof createSubscription
    >[1];
    const subscribe = createSubscription("datasets", mockTable);
    subscribe();

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe.mock.calls[0][0]).toBe("*");
  });

  test("triggers delta sync when local record does not exist", async () => {
    const mockTable = { get: mock(() => Promise.resolve(null)) } as unknown as Parameters<
      typeof createSubscription
    >[1];
    createSubscription("datasets", mockTable)();

    expect(capturedCallback).not.toBeNull();
    await capturedCallback?.({
      record: { id: "ds1", updated: "2024-06-15T14:30:00.000Z" },
    });

    expect(mockTable.get).toHaveBeenCalledWith("ds1");
    expect(mockDeltaSync).toHaveBeenCalledTimes(1);
  });

  test("triggers delta sync when remote record is newer", async () => {
    const localRecord = { id: "ds1", updated: 1000 };
    const mockTable = { get: mock(() => Promise.resolve(localRecord)) } as unknown as Parameters<
      typeof createSubscription
    >[1];
    createSubscription("datasets", mockTable)();

    await capturedCallback?.({
      record: { id: "ds1", updated: "2024-06-15T14:30:00.000Z" },
    });

    expect(mockDeltaSync).toHaveBeenCalledTimes(1);
  });

  test("skips delta sync when local record is newer", async () => {
    const futureTimestamp = new Date("2099-01-01T00:00:00.000Z").getTime();
    const localRecord = { id: "ds1", updated: futureTimestamp };
    const mockTable = { get: mock(() => Promise.resolve(localRecord)) } as unknown as Parameters<
      typeof createSubscription
    >[1];
    createSubscription("datasets", mockTable)();

    await capturedCallback?.({
      record: { id: "ds1", updated: "2024-06-15T14:30:00.000Z" },
    });

    expect(mockDeltaSync).not.toHaveBeenCalled();
  });

  test("skips delta sync when local and remote have equal timestamps", async () => {
    const iso = "2024-06-15T14:30:00.000Z";
    const ts = new Date(iso).getTime();
    const localRecord = { id: "ds1", updated: ts };
    const mockTable = { get: mock(() => Promise.resolve(localRecord)) } as unknown as Parameters<
      typeof createSubscription
    >[1];
    createSubscription("datasets", mockTable)();

    await capturedCallback?.({
      record: { id: "ds1", updated: iso },
    });

    expect(mockDeltaSync).not.toHaveBeenCalled();
  });

  test("passes the correct record ID to dexieTable.get", async () => {
    const mockTable = { get: mock(() => Promise.resolve(null)) } as unknown as Parameters<
      typeof createSubscription
    >[1];
    createSubscription("metrics", mockTable)();

    await capturedCallback?.({
      record: { id: "met_abc_123", updated: "2024-01-01T00:00:00.000Z" },
    });

    expect(mockTable.get).toHaveBeenCalledWith("met_abc_123");
  });
});
