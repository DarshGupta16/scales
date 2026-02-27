import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { db } from "../db";
import { datasetSchema } from "@/types/zodSchemas";
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

  upsertDataset: publicProcedure
    .input(datasetSchema)
    .mutation(async ({ input: dataset }) => {
      return await db.dataset.upsert({
        where: { slug: dataset.slug },
        update: {
          title: dataset.title,
          description: dataset.description,
          unit: dataset.unit,
          views: {
            deleteMany: {},
            create: dataset.views.map((type) => ({ type })),
          },
          measurements: {
            deleteMany: {},
            create: dataset.measurements.map((m) => ({
              id: m.id,
              value: m.value,
              timestamp: new Date(m.timestamp),
            })),
          },
        },
        create: {
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
});

// Export type definition of API
export type AppRouter = typeof appRouter;
