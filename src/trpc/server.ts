import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { db } from '../db'

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create()

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router
export const publicProcedure = t.procedure

export const appRouter = router({
  hello: publicProcedure
    .input(
      z.object({
        name: z.string().nullish(),
      }),
    )
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name ?? 'world'}`,
      }
    }),
  
  // Example Prisma query
  getDatasets: publicProcedure.query(async () => {
    return await db.dataset.findMany()
  }),
})

// Export type definition of API
export type AppRouter = typeof appRouter
