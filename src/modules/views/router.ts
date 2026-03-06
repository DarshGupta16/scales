import { db } from "@/db";
import { publicProcedure } from "@/trpc/init";
import { viewTypeSchema } from "@/types/zodSchemas";
import { z } from "zod";
import type { ViewType } from "@/types/dataset";

/**
 * Internal logic for updating dataset views.
 * Extracted so it can be shared between tRPC procedures and sync handlers.
 */
export async function updateViewsInternal(slug: string, views: ViewType[]) {
  const dataset = await db.dataset.findFirst({ where: { slug } });

  if (!dataset) {
    throw new Error(`Dataset with slug "${slug}" not found`);
  }

  const previousViews = (
    await db.datasetView.findMany({
      where: {
        datasetId: dataset.id,
      },
    })
  ).map(({ type }) => type);

  const viewsToRemove = previousViews.filter(
    (view) => !views.includes(view as any),
  );

  for (const view of views) {
    await db.datasetView.upsert({
      where: {
        datasetId_type: {
          datasetId: dataset.id,
          type: view as any,
        },
      },
      update: {},
      create: {
        type: view as any,
        datasetId: dataset.id,
      },
    });
  }

  for (const view of viewsToRemove) {
    await db.datasetView.delete({
      where: {
        datasetId_type: {
          datasetId: dataset.id,
          type: view as any,
        },
      },
    });
  }

  return { success: true };
}

export const viewsProcedures = {
  updateViews: publicProcedure
    .input(
      z.object({ views: z.array(viewTypeSchema), datasetSlug: z.string() }),
    )
    .mutation(async ({ input }) => {
      return await updateViewsInternal(
        input.datasetSlug,
        input.views as ViewType[],
      );
    }),
};
