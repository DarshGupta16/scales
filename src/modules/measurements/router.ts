import { z } from "zod";
import { db } from "@/db";
import { measurementSchema } from "@/types/zodSchemas";
import { publicProcedure } from "@/trpc/init";

export const measurementsProcedures = {
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
};
