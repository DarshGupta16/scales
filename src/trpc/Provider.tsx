import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, createTRPCClient } from '@trpc/client'
import React, { useState } from 'react'
import { TRPCProvider as TRPCQueryProvider } from './client'
import type { AppRouter } from './server'

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      }),
  )
  const [trpcClient] = useState(() => 
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCQueryProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCQueryProvider>
    </QueryClientProvider>
  )
}
