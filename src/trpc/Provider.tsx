import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { TRPCProvider as TRPCQueryProvider, trpcClient } from './client'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Get the queryClient from the router context
  const context = router.options.context as { queryClient: QueryClient }
  const qc = context.queryClient

  return (
    <QueryClientProvider client={qc}>
      <TRPCQueryProvider trpcClient={trpcClient} queryClient={qc}>
        {children}
      </TRPCQueryProvider>
    </QueryClientProvider>
  )
}
