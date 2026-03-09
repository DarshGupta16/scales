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
   * Can be paginated via limit, and sorted either ascending (for sync replays) or descending (for log views).
   */
  getSyncLogs: publicProcedure
    .input(
      z.object({
        after: z.number().default(0),
        limit: z.number().optional(),
        sort: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const logs = await db.syncLog.findMany({
        where: { timestamp: { gt: BigInt(input.after) } },
        orderBy: { timestamp: input.sort },
        ...(input.limit ? { take: input.limit } : {}),
      });
      
      // Convert BigInt timestamp to Number for JSON serialization
      return logs.map((log) => ({
        ...log,
        timestamp: Number(log.timestamp),
      })) as SyncLogEntry[];
    }),
};
