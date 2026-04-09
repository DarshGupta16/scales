import type { EntityTable } from "dexie";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";

/**
 * Generic PocketBase realtime subscription factory.
 * Subscribes to a collection, performs an idempotency check against the
 * local Dexie table, and triggers a delta sync if the remote record is newer.
 */
// Tested in tests/utils/subscriptions/createSubscription.test.ts
export function createSubscription<T extends { id: string; updated: number }>(
  collectionName: string,
  dexieTable: EntityTable<T, "id">,
) {
  return () =>
    pb.collection(collectionName).subscribe("*", async (e) => {
      const { record } = e;
      const remoteUpdated = new Date(record.updated).getTime();

      // biome-ignore lint/suspicious/noExplicitAny: Expected string lookup
      const local = await dexieTable.get(record.id as any);
      if (local && local.updated >= remoteUpdated) return;

      await useDatasetStore.getState().pbDeltaSync();
    });
}
