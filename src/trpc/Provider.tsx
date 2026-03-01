import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { TRPCProvider as TRPCQueryProvider, trpcClient } from './client'
import { LoadingScreen } from '../components/LoadingScreen'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Get the queryClient from the router context
  const context = router.options.context as { queryClient: QueryClient }
  const qc = context.queryClient

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Artificial delay to ensure hydration and Recharts rendering can happen 
    // behind the scenes before we reveal the UI on first load.
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <QueryClientProvider client={qc}>
      <TRPCQueryProvider trpcClient={trpcClient} queryClient={qc}>
        <LoadingScreen isVisible={isLoading} />
        <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
          {children}
        </div>
      </TRPCQueryProvider>
    </QueryClientProvider>
  )
}
