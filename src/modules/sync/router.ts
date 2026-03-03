import { z } from "zod";
import { db } from "@/db";
import { publicProcedure } from "@/trpc/init";
import { allServerHandlers } from "./registry.server";
import { type SyncOperation } from "@/types/syncOperations";
import { type SyncLogEntry } from "@/dexieDb";
import type { SyncPayloads } from "./types";

/**
 * tRPC procedures for synchronization operations.
 * 
 * Includes logic for fetching sync logs, pushing new logs from the client,
 * and pruning old logs. This is the server-side counterpart to the
 * background sync engine.
 */
export const syncProcedures = {
  /**
   * Fetches sync logs after a specific timestamp.
   * 
   * Note: SQLite/Prisma BigInts must be converted to Numbers for JSON serialization.
   */
  getSyncLogs: publicProcedure
    .input(z.object({ after: z.number().default(0) }))
    .query(async ({ input }) => {
      const logs = await db.syncLog.findMany({
        where: { timestamp: { gt: BigInt(input.after) } },
        orderBy: { timestamp: "asc" },
      });
      
      // Convert BigInt timestamp to Number for JSON serialization
      return logs.map(log => ({
        ...log,
        timestamp: Number(log.timestamp),
      })) as SyncLogEntry[];
    }),

  /**
   * Pushes a batch of sync logs from the client to the server.
   * 
   * Each log is processed by replaying its operation on the server's database
   * using the registered server handlers. This ensures the server stays
   * in sync with client-side offline changes.
   */
  pushSyncLogs: publicProcedure
    .input(z.array(z.any()))
    .mutation(async ({ input: logs }) => {
      for (const log of logs as SyncLogEntry[]) {
        const operation = log.operation as SyncOperation;
        const handler = allServerHandlers[operation];
        
        if (handler) {
          try {
            const payload = JSON.parse(log.payload) as SyncPayloads[SyncOperation];
            // Cast handler to accept any of the valid payloads to satisfy the generic union
            await (handler as (p: typeof payload) => Promise<void>)(payload);
          } catch (e) {
            console.error(`Failed to replay operation ${log.operation}:`, e);
          }
        }
        
        try {
          // Save the log to the server's sync log table
          await db.syncLog.upsert({
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
          // Log exists or other error, ignore to keep sync moving
          console.warn(`Sync log ${log.id} already exists or failed to save:`, e);
        }
      }
      return { success: true };
    }),

  /**
   * Prunes old sync logs from the database.
   */
  pruneOldLogs: publicProcedure
    .input(z.object({ thresholdDays: z.number().default(30) }))
    .mutation(async ({ input }) => {
      const threshold = new Date().getTime() - input.thresholdDays * 24 * 60 * 60 * 1000;
      const result = await db.syncLog.deleteMany({
        where: { timestamp: { lt: BigInt(threshold) } },
      });
      return { deletedCount: result.count };
    }),
};
