import { z } from "zod";
import { db } from "@/db";
import { datasetSchema } from "@/types/zodSchemas";
import { type Dataset as DatasetModelType } from "generated/prisma/client";
import {
  type Dataset as DatasetType,
  type Measurement,
  type ViewType,
} from "@/types/dataset";
import { publicProcedure } from "@/trpc/init";

export const datasetsProcedures = {
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
};
