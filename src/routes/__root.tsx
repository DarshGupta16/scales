import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import { LoadingScreen } from "../components/LoadingScreen";
import { Modals } from "../components/ui/Modals";
import { useDatasetStore } from "../store";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
      },
      {
        name: "theme-color",
        content: "#050505",
      },
      {
        title: "SCALES | BRUTAL METRICS",
      },
    ],
    links: [
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Syne:wght@400..800&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const { hydrate, error } = useDatasetStore();

  useEffect(() => {
    // Start hydrating data from Dexie immediately on mount
    hydrate();

    // Artificial delay to ensure hydration and rendering can happen
    // behind the scenes before we reveal the UI on first load.
    const timer = setTimeout(() => setIsLoading(false), 275);
    return () => clearTimeout(timer);
  }, [hydrate]);

  return (
    <>
      <LoadingScreen isVisible={isLoading} />
      <div style={{ visibility: isLoading ? "hidden" : "visible" }}>
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 p-3 px-6 flex items-start sm:items-center gap-3 fixed top-0 left-0 right-0 z-50 shadow-xl backdrop-blur-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-alert-triangle shrink-0 mt-0.5 sm:mt-0"
              role="img"
              aria-label="Error"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <div className="flex-1">
              <p className="font-bold text-sm tracking-wide uppercase">System Error</p>
              <p className="text-xs text-red-400/90 font-mono mt-0.5">{error}</p>
            </div>
          </div>
        )}
        <div className={error ? "pt-16" : ""}>
          <Outlet />
        </div>
        <Modals />
      </div>
    </>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-black text-white min-h-screen font-sans selection:bg-brand selection:text-black">
        <main>{children}</main>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Needed for Service Worker registration
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
  );
}
