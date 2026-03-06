import { z } from "zod";
import { db } from "@/db";
import { datasetSchema } from "@/types/zodSchemas";
import { type Dataset as DatasetModelType } from "generated/prisma/client";
import { type Dataset as DatasetType, type ViewType } from "@/types/dataset";
import { publicProcedure } from "@/trpc/init";

/**
 * tRPC procedures for dataset operations.
 *
 * Includes queries for fetching collections and individual datasets,
 * and mutations for creation. These procedures handle the mapping between
 * Prisma models and our application-level domain types.
 */
/**
 * Internal logic for creating/upserting a dataset.
 */
export async function createDatasetInternal(dataset: DatasetType) {
  return await db.dataset.upsert({
    where: { id: dataset.id },
    update: {
      title: dataset.title,
      description: dataset.description,
      unit: dataset.unit,
      slug: dataset.slug,
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
}

/**
 * Internal logic for updating a dataset.
 */
export async function updateDatasetInternal(
  id: string,
  data: Partial<DatasetType>,
) {
  return await db.dataset.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      unit: data.unit,
      slug: data.slug,
    },
  });
}

/**
 * Internal logic for deleting a dataset.
 */
export async function deleteDatasetInternal(id: string) {
  return await db.dataset.deleteMany({ where: { id } });
}

export const datasetsProcedures = {
  getDatasets: publicProcedure.query(async () => {
    const prismaDatasets: DatasetModelType[] = await db.dataset.findMany();
    const returnDatasets: DatasetType[] = await Promise.all(
      prismaDatasets.map(async (dataset) => {
        const views = (
          await db.datasetView.findMany({
            where: { datasetId: dataset.id },
          })
        ).map((view) => view.type as ViewType);

        const measurements = (
          await db.measurement.findMany({
            where: { datasetId: dataset.id },
            orderBy: { timestamp: "asc" },
          })
        ).map((measurement) => ({
          ...measurement,
          timestamp: new Date(measurement.timestamp).toISOString(),
        }));

        return {
          id: dataset.id,
          slug: dataset.slug,
          title: dataset.title,
          unit: dataset.unit as DatasetType["unit"],
          views,
          measurements,
          description: dataset.description ?? undefined,
        };
      }),
    );
    return returnDatasets;
  }),

  getDataset: publicProcedure
    .input(z.string())
    .query(async ({ input: slug }) => {
      const dataset = await db.dataset.findFirst({ where: { slug } });
      if (!dataset) return null;

      const views = (
        await db.datasetView.findMany({
          where: { datasetId: dataset.id },
        })
      ).map((view) => view.type as ViewType);

      const measurements = (
        await db.measurement.findMany({
          where: { datasetId: dataset.id },
          orderBy: { timestamp: "asc" },
        })
      ).map((measurement) => ({
        ...measurement,
        timestamp: new Date(measurement.timestamp).toISOString(),
      }));

      return {
        id: dataset.id,
        slug: dataset.slug,
        title: dataset.title,
        unit: dataset.unit as DatasetType["unit"],
        views,
        measurements,
        description: dataset.description ?? undefined,
      };
    }),

  createDataset: publicProcedure
    .input(datasetSchema)
    .mutation(async ({ input: dataset }) => {
      return await createDatasetInternal(dataset as DatasetType);
    }),
};
