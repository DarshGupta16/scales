import { beforeEach, describe, expect, mock, test } from "bun:test";

// ─── Mocks (hoisted by Bun before imports) ───────────────────────

const mockAdd = mock((_op: unknown) => Promise.resolve());

mock.module("@/lib/dexieDb", () => ({
  db: {
    offline_ops: { add: mockAdd },
  },
}));

import { tryPbOrQueue } from "@/store/pbSync";

// ─── Tests ───────────────────────────────────────────────────────

describe("tryPbOrQueue", () => {
  beforeEach(() => {
    mockAdd.mockClear();
  });

  test("calls pbFn and does not queue on success", async () => {
    const pbFn = mock(() => Promise.resolve());

    await tryPbOrQueue(pbFn, {
      collection: "datasets",
      action: "create",
      recordId: "ds1",
      data: null,
    });

    expect(pbFn).toHaveBeenCalledTimes(1);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  test("queues offline op when error has status === 0", async () => {
    const offlineError = { status: 0, message: "Failed to fetch" };
    const pbFn = mock(() => Promise.reject(offlineError));

    const offlineOp = {
      collection: "datasets" as const,
      action: "create" as const,
      recordId: "ds1",
      data: null,
    };

    await tryPbOrQueue(pbFn, offlineOp);

    expect(mockAdd).toHaveBeenCalledTimes(1);
    const addedOp = mockAdd.mock.calls[0][0] as {
      collection: string;
      action: string;
      recordId: string;
      data: Record<string, unknown>;
      timestamp: number;
    };
    expect(addedOp.collection).toBe("datasets");
    expect(addedOp.action).toBe("create");
    expect(addedOp.recordId).toBe("ds1");
    expect(addedOp.data).toBeNull();
    expect(typeof addedOp.timestamp).toBe("number");
  });

  test("includes a reasonable timestamp in the queued op", async () => {
    const before = Date.now();
    const pbFn = mock(() => Promise.reject({ status: 0 }));

    await tryPbOrQueue(pbFn, {
      collection: "units" as const,
      action: "update" as const,
      recordId: "u1",
      data: null,
    });

    const after = Date.now();
    const ts = (mockAdd.mock.calls[0][0] as { timestamp: number }).timestamp;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  test("does not queue when error has non-zero status", async () => {
    const pbFn = mock(() => Promise.reject({ status: 500 }));

    await tryPbOrQueue(pbFn, {
      collection: "datasets" as const,
      action: "create" as const,
      recordId: "ds1",
      data: null,
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  test("does not queue when error is a plain Error (no status)", async () => {
    const pbFn = mock(() => Promise.reject(new Error("network issue")));

    await tryPbOrQueue(pbFn, {
      collection: "datasets" as const,
      action: "create" as const,
      recordId: "ds1",
      data: null,
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  test("does not queue when error is a string", async () => {
    const pbFn = mock(() => Promise.reject("some error"));

    await tryPbOrQueue(pbFn, {
      collection: "datasets" as const,
      action: "create" as const,
      recordId: "ds1",
      data: null,
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  test("does not queue when error is null", async () => {
    const pbFn = mock(() => Promise.reject(null));

    await tryPbOrQueue(pbFn, {
      collection: "datasets" as const,
      action: "create" as const,
      recordId: "ds1",
      data: null,
    });

    expect(mockAdd).not.toHaveBeenCalled();
  });

  test("does not re-throw any errors (silently swallows)", async () => {
    await expect(
      tryPbOrQueue(
        mock(() => Promise.reject({ status: 0 })),
        {
          collection: "datasets" as const,
          action: "create" as const,
          recordId: "x",
          data: null,
        },
      ),
    ).resolves.toBeUndefined();

    await expect(
      tryPbOrQueue(
        mock(() => Promise.reject({ status: 500 })),
        {
          collection: "datasets" as const,
          action: "create" as const,
          recordId: "x",
          data: null,
        },
      ),
    ).resolves.toBeUndefined();
  });
});
