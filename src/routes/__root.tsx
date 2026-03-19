import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useState, useEffect } from 'react'
import { LoadingScreen } from '../components/LoadingScreen'
import { useDatasetStore } from '../store'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
      },
      {
        name: 'theme-color',
        content: '#050505',
      },
      {
        title: 'SCALES | BRUTAL METRICS',
      },
    ],
    links: [
      {
        rel: 'manifest',
        href: '/manifest.webmanifest',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Syne:wght@400..800&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  const [isLoading, setIsLoading] = useState(true)
  const hydrate = useDatasetStore((state) => state.hydrate)

  useEffect(() => {
    // Start hydrating data from Dexie immediately on mount
    hydrate()

    // Artificial delay to ensure hydration and rendering can happen
    // behind the scenes before we reveal the UI on first load.
    const timer = setTimeout(() => setIsLoading(false), 275)
    return () => clearTimeout(timer)
  }, [hydrate])

  return (
    <>
      <LoadingScreen isVisible={isLoading} />
      <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
        <Outlet />
      </div>
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-black text-white min-h-screen font-sans selection:bg-brand selection:text-black">
        <main>
          {children}
        </main>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
                if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  })
                }
              `,
          }}
        />
      </body>
    </html>
  )
}
