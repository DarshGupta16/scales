import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { db } from "../db";
import {
  datasetSchema,
  measurementSchema,
  syncLogSchema,
} from "@/types/zodSchemas";
import { SyncOperation } from "@/types/syncOperations";
import { type Dataset as DatasetModelType } from "generated/prisma/client";
import {
  type Dataset as DatasetType,
  type Measurement,
  type ViewType,
} from "@/types/dataset";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        name: z.string().nullish(),
      }),
    )
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name ?? "world"}`,
      };
    }),

  getDatasets: publicProcedure.query(async () => {
    const prismaDatasets: DatasetModelType[] = await db.dataset.findMany();
    const returnDatasets: DatasetType[] = await Promise.all(
      prismaDatasets.map(async (dataset) => {
        const views: ViewType[] = (
          await db.datasetView.findMany({
            where: { datasetId: dataset.id },
          })
        ).map((view) => view.type);
        const measurements: Measurement[] = (
          await db.measurement.findMany({
            where: { datasetId: dataset.id },
            orderBy: { timestamp: "asc" },
          })
        ).map((measurement) => ({
          ...measurement,
          timestamp: new Date(measurement.timestamp).toISOString(),
        }));

        return {
          ...dataset,
          views,
          measurements,
          description: dataset.description || undefined,
        };
      }),
    );
    return returnDatasets;
  }),

  getDataset: publicProcedure
    .input(z.string())
    .query(async ({ input: slug }) => {
      const dataset = await db.dataset.findFirst({ where: { slug } });

      const views: ViewType[] = (
        await db.datasetView.findMany({
          where: { datasetId: dataset?.id },
        })
      ).map((view) => view.type);

      const measurements: Measurement[] = (
        await db.measurement.findMany({
          where: { datasetId: dataset?.id },
        })
      ).map((measurement) => ({
        ...measurement,
        timestamp: new Date(measurement.timestamp).toISOString(),
      }));

      return {
        ...dataset,
        views,
        measurements,
      };
    }),

  createDataset: publicProcedure
    .input(datasetSchema)
    .mutation(async ({ input: dataset }) => {
      return await db.dataset.create({
        data: {
          id: dataset.id,
          slug: dataset.slug,
          title: dataset.title,
          description: dataset.description,
          unit: dataset.unit,
          views: {
            create: dataset.views.map((type) => ({ type })),
          },
          measurements: {
            create: dataset.measurements.map((m) => ({
              id: m.id,
              value: m.value,
              timestamp: new Date(m.timestamp),
            })),
          },
        },
      });
    }),

  addMeasurement: publicProcedure
    .input(measurementSchema)
    .mutation(async ({ input: measurement }) => {
      return await db.measurement.create({
        data: {
          value: measurement.value,
          timestamp: measurement.timestamp,
          dataset: {
            connect: { slug: measurement.datasetSlug },
          },
        },
      });
    }),

  removeMeasurement: publicProcedure
    .input(z.string())
    .mutation(async ({ input: id }) => {
      return await db.measurement.delete({ where: { id } });
    }),

  // --- Sync Procedures ---

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

      // 1. Insert logs into server DB (SQLite doesn't support skipDuplicates on createMany)
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
        } catch (ignored) {
          // Log probably already exists, which is fine
        }
      }

      // 2. Replay operations on the server DB
      let applied = 0;
      for (const log of logs) {
        try {
          const payload = JSON.parse(log.payload);
          switch (log.operation as SyncOperation) {
            case SyncOperation.CREATE_DATASET:
              await db.dataset.upsert({
                where: { id: payload.id },
                update: {
                  title: payload.title,
                  description: payload.description,
                  unit: payload.unit,
                  slug: payload.slug,
                },
                create: {
                  id: payload.id,
                  slug: payload.slug,
                  title: payload.title,
                  description: payload.description,
                  unit: payload.unit,
                },
              });
              break;
            case SyncOperation.UPDATE_DATASET:
              await db.dataset.update({
                where: { id: payload.id },
                data: {
                  title: payload.title,
                  description: payload.description,
                  unit: payload.unit,
                  slug: payload.slug,
                },
              });
              break;
            case SyncOperation.DELETE_DATASET:
              await db.dataset.delete({ where: { id: payload.id } });
              break;
            case SyncOperation.ADD_MEASUREMENT:
              await db.measurement.upsert({
                where: { id: payload.id },
                update: {
                  value: payload.value,
                  timestamp: payload.timestamp,
                },
                create: {
                  id: payload.id,
                  value: payload.value,
                  timestamp: payload.timestamp,
                  dataset: { connect: { slug: payload.datasetSlug } },
                },
              });
              break;
            case SyncOperation.UPDATE_MEASUREMENT:
              await db.measurement.update({
                where: { id: payload.id },
                data: {
                  value: payload.value,
                  timestamp: payload.timestamp,
                },
              });
              break;
            case SyncOperation.REMOVE_MEASUREMENT:
              await db.measurement.delete({ where: { id: payload.id } });
              break;
            case SyncOperation.ADD_VIEW:
              await db.datasetView.create({
                data: {
                  id: payload.id,
                  type: payload.type,
                  dataset: { connect: { id: payload.datasetId } },
                },
              });
              break;
            case SyncOperation.REMOVE_VIEW:
              await db.datasetView.delete({ where: { id: payload.id } });
              break;
          }
          applied++;
        } catch (error) {
          // Silently ignore replay errors (e.g. deleting already deleted record)
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
});

// Export type definition of API
export type AppRouter = typeof appRouter;
