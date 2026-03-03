import { z } from "zod";
import { db } from "@/db";
import { publicProcedure } from "@/trpc/init";
import { type SyncLogEntry } from "@/dexieDb";

/**
 * tRPC procedures for fetching system logs.
 */
export const logsProcedures = {
  /**
   * Fetches sync logs after a specific timestamp from the server.
   */
  getSyncLogs: publicProcedure
    .input(z.object({ after: z.number().default(0) }))
    .query(async ({ input }) => {
      const logs = await db.syncLog.findMany({
        where: { timestamp: { gt: BigInt(input.after) } },
        orderBy: { timestamp: "desc" }, // Most recent first for logs view
      });
      
      // Convert BigInt timestamp to Number for JSON serialization
      return logs.map(log => ({
        ...log,
        timestamp: Number(log.timestamp),
      })) as SyncLogEntry[];
    }),
};
