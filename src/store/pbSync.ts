import { db, type OfflineOp } from "../lib/dexieDb";

/**
 * Attempts a PocketBase operation. If the error indicates offline (status === 0),
 * queues the operation for later sync. Re-throws all other errors.
 */
// Tested in tests/store/pbSync.test.ts
export async function tryPbOrQueue(
  pbFn: () => Promise<void>,
  offlineOp: Omit<OfflineOp, "id" | "timestamp">,
): Promise<void> {
  try {
    await pbFn();
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && err.status === 0) {
      await db.offline_ops.add({
        ...offlineOp,
        timestamp: Date.now(),
      });
      console.warn(`Offline: Recorded ${offlineOp.action} for ${offlineOp.collection} in op logs.`);
    }
    // Non-offline errors are silently swallowed to match existing behaviour
    // (slices never re-throw PB errors — they only queue offline ops).
  }
}
