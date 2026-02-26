import { createAPIFileRoute } from '@tanstack/start/api'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../trpc/server'

export const APIRoute = createAPIFileRoute('/api/trpc/$')({
  GET: ({ request }: { request: Request }) => {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: () => ({}),
    })
  },
  POST: ({ request }: { request: Request }) => {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: () => ({}),
    })
  },
})
