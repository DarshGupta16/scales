import { z } from "zod";
import { db } from "@/db";
import { measurementSchema } from "@/types/zodSchemas";
import { publicProcedure } from "@/trpc/init";

/**
 * Internal logic for adding a measurement.
 */
export async function addMeasurementInternal(measurement: {
  id?: string;
  value: number;
  timestamp: string | Date;
  datasetSlug: string;
}) {
  return await db.measurement.upsert({
    where: { id: measurement.id ?? "" },
    update: {
      value: measurement.value,
      timestamp: new Date(measurement.timestamp),
    },
    create: {
      id: measurement.id,
      value: measurement.value,
      timestamp: new Date(measurement.timestamp),
      dataset: {
        connect: { slug: measurement.datasetSlug },
      },
    },
  });
}

/**
 * Internal logic for removing a measurement.
 */
export async function removeMeasurementInternal(id: string) {
  // Use deleteMany to avoid crashing (P2025) if the record is missing
  return await db.measurement.deleteMany({ where: { id } });
}

export const measurementsProcedures = {
  addMeasurement: publicProcedure
    .input(measurementSchema)
    .mutation(async ({ input: measurement }) => {
      return await addMeasurementInternal(measurement as any);
    }),

  removeMeasurement: publicProcedure
    .input(z.string())
    .mutation(async ({ input: id }) => {
      return await removeMeasurementInternal(id);
    }),
};
