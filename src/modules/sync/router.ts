import { z } from "zod";
import { db } from "@/db";
import { syncLogSchema } from "@/types/zodSchemas";
import { publicProcedure } from "@/trpc/init";
import { allServerHandlers } from "./registry.server";

export const syncProcedures = {
  getSyncLogs: publicProcedure
    .input(z.object({ after: z.number() }))
    .query(async ({ input }) => {
      const logs = await db.syncLog.findMany({
        where: { timestamp: { gt: input.after } },
        orderBy: { timestamp: "asc" },
      });
      // Convert BigInt to number for JSON serialization
      return logs.map((log) => ({
        ...log,
        timestamp: Number(log.timestamp),
      }));
    }),

  pushSyncLogs: publicProcedure
    .input(z.array(syncLogSchema))
    .mutation(async ({ input: logs }) => {
      if (logs.length === 0) return { success: true, count: 0 };

      // 1. Insert logs into server DB
      for (const log of logs) {
        try {
          await db.syncLog.create({
            data: {
              id: log.id,
              timestamp: log.timestamp,
              operation: log.operation,
              payload: log.payload,
            },
          });
        } catch (ignored) {}
      }

      // 2. Replay operations on the server DB
      let applied = 0;
      for (const log of logs) {
        try {
          const payload = JSON.parse(log.payload);
          const handler = allServerHandlers[log.operation];
          if (handler) {
            await handler(payload);
            applied++;
          }
        } catch (error) {
          console.warn(
            `[Sync Replay Error] ${log.operation} (${log.id}):`,
            error,
          );
        }
      }
      return { success: true, count: applied };
    }),

  pruneOldLogs: publicProcedure
    .input(z.object({ thresholdDays: z.number().default(10) }))
    .mutation(async ({ input }) => {
      const thresholdMs =
        Date.now() - input.thresholdDays * 24 * 60 * 60 * 1000;
      const result = await db.syncLog.deleteMany({
        where: { timestamp: { lt: thresholdMs } },
      });
      return { success: true, deletedCount: result.count };
    }),
};
