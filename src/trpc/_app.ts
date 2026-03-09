import { z } from "zod";
import { router, publicProcedure } from "./init";

import { datasetsProcedures } from "@/trpc/routers/datasets";
import { measurementsProcedures } from "@/trpc/routers/measurements";
import { syncProcedures } from "@/trpc/routers/sync";
import { logsProcedures } from "@/trpc/routers/logs";
import { viewsProcedures } from "@/trpc/routers/views";

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
  ...logsProcedures,
  ...viewsProcedures,
});

export type AppRouter = typeof appRouter;
