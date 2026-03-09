import { z } from "zod";
import { db } from "@/db";
import { measurementSchema } from "@/types/zodSchemas";
import { publicProcedure } from "@/trpc/init";

interface MeasurementInput {
  id?: string;
  value: number;
  timestamp: string | Date;
  datasetSlug: string;
}

/**
 * Internal logic for adding a measurement.
 */
export async function addMeasurementInternal(measurement: MeasurementInput) {
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
      // datasetSlug is required for create/connect, but optional in schema for some reason.
      // Cast is needed because Zod schema output might be slightly different from our internal interface.
      return await addMeasurementInternal(measurement as unknown as MeasurementInput);
    }),

  removeMeasurement: publicProcedure
    .input(z.string())
    .mutation(async ({ input: id }) => {
      return await removeMeasurementInternal(id);
    }),
};
