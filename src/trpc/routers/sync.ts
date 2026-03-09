import { z } from "zod";
import { db } from "@/db";
import { publicProcedure } from "@/trpc/init";
import { allServerHandlers } from "@/sync/server/registry";
import { type SyncOperation } from "@/types/syncOperations";
import { syncLogSchema } from "@/types/zodSchemas";
import type { SyncPayloads } from "@/sync/types";

/**
 * tRPC procedures for synchronization operations.
 *
 * Includes logic for pushing new logs from the client,
 * and pruning old logs. This is the server-side counterpart to the
 * background sync engine.
 */
export const syncProcedures = {
  /**
   * Pushes a batch of sync logs from the client to the server.
   *
   * Each log is processed by replaying its operation on the server's database
   * using the registered server handlers. This ensures the server stays
   * in sync with client-side offline changes.
   */
  pushSyncLogs: publicProcedure
    .input(z.array(syncLogSchema))
    .mutation(async ({ input: logs }) => {
      // 1. Replay operations outside the transaction — handlers use the
      //    global `db` instance so they don't benefit from `tx` anyway,
      //    and running them inside was causing transaction timeouts.
      for (const log of logs) {
        const operation = log.operation as SyncOperation;
        const handler = allServerHandlers[operation];

        if (handler) {
          try {
            const payload = JSON.parse(
              log.payload,
            ) as SyncPayloads[SyncOperation];
            await (handler as (p: typeof payload) => Promise<void>)(payload);
          } catch (e) {
            console.error(`Failed to replay operation ${log.operation}:`, e);
          }
        }
      }

      // 2. Batch-save sync logs in a transaction (this is fast — just upserts)
      //    Using an array transaction is faster than an interactive transaction.
      try {
        await db.$transaction(
          logs.map((log) =>
            db.syncLog.upsert({
              where: { id: log.id },
              update: {
                timestamp: BigInt(log.timestamp),
                operation: log.operation,
                payload: log.payload,
              },
              create: {
                id: log.id,
                timestamp: BigInt(log.timestamp),
                operation: log.operation,
                payload: log.payload,
              },
            }),
          ),
        );
      } catch (e) {
        console.warn("Sync log batch upsert failed:", e);
      }

      return { success: true };
    }),

  /**
   * Prunes old sync logs from the database.
   */
  pruneOldLogs: publicProcedure
    .input(z.object({ thresholdDays: z.number().default(30) }))
    .mutation(async ({ input }) => {
      const threshold =
        new Date().getTime() - input.thresholdDays * 24 * 60 * 60 * 1000;
      const result = await db.syncLog.deleteMany({
        where: { timestamp: { lt: BigInt(threshold) } },
      });
      return { deletedCount: result.count };
    }),
};
