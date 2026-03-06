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

  await db.$transaction(async (tx) => {
    // 1. Wipe existing views for this dataset
    await tx.datasetView.deleteMany({
      where: { datasetId: dataset.id },
    });

    // 2. Insert the new set of views in bulk
    if (views.length > 0) {
      await tx.datasetView.createMany({
        data: views.map((view) => ({
          type: view,
          datasetId: dataset.id,
        })),
      });
    }
  });

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
