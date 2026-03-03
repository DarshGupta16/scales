import { z } from "zod";
import { router, publicProcedure } from "./init";

import { datasetsProcedures } from "@/modules/datasets/router";
import { measurementsProcedures } from "@/modules/measurements/router";
import { syncProcedures } from "@/modules/sync/router";

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

  ...datasetsProcedures,
  ...measurementsProcedures,
  ...syncProcedures,
});

export type AppRouter = typeof appRouter;
