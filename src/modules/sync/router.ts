import { z } from "zod";
import { db } from "@/db";
import { publicProcedure } from "@/trpc/init";
import { allServerHandlers } from "./registry.server";
import { type SyncOperation } from "@/types/syncOperations";
import { syncLogSchema } from "@/types/zodSchemas";
import type { SyncPayloads } from "./types";

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
      // Timeout increased to 30s to handle large batches of sync logs
      await db.$transaction(
        async (tx) => {
          for (const log of logs) {
            const operation = log.operation as SyncOperation;
            const handler = allServerHandlers[operation];

            if (handler) {
              try {
                const payload = JSON.parse(
                  log.payload,
                ) as SyncPayloads[SyncOperation];
                // The handlers use the global db instance, which is generally fine
                // for atomic operations, but to be fully transaction-safe we would
                // need to pass the tx object down. For now, this loop is within
                // a transaction context, but Prisma requires explicit tx passing for
                // full atomic guarantees. As a first step, we wrap the log saving
                // in the transaction to batch write operations.
                await (handler as (p: typeof payload) => Promise<void>)(
                  payload,
                );
              } catch (e) {
                console.error(
                  `Failed to replay operation ${log.operation}:`,
                  e,
                );
              }
            }
          }

          // Batch insert/upsert the sync logs to prevent re-replaying in the future
          // We do this after successful replays. If a replay fails, the log is still saved
          // so we don't block the sync queue forever.
          for (const log of logs) {
            try {
              await tx.syncLog.upsert({
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
              });
            } catch (e) {
              console.warn(
                `Sync log ${log.id} already exists or failed to save:`,
                e,
              );
            }
          }
        },
        { timeout: 30000 },
      );

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
