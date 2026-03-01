# Scales | Brutal Metrics

A high-performance, local-first web application designed to track, visualize, and analyze your personal metrics and data over time. Built with an uncompromising "brutal" dark-mode aesthetic, Scales offers an instantaneous, offline-capable experience that syncs seamlessly in the background.

## 🚀 Key Features

- **Instantaneous Local-First Experience**: Data is read and written instantly to a local Dexie.js (IndexedDB) cache. The app feels incredibly fast because it never waits on the network to render your data.
- **PWA & Offline Support**: Fully installable as a Progressive Web App (PWA). Powered by a custom Serwist service worker, the application caches its UI shell and assets, allowing you to view and log metrics even without an internet connection.
- **Background Synchronization**: While you interact with the local data, tRPC and TanStack Query silently sync your changes with the SQLite backend in the background.
- **Brutal & Immersive UI**: High-contrast, dark-mode aesthetic featuring JetBrains Mono typography, custom SVG grain overlays, fluid Framer Motion animations, and a distinctive "Booting Matrix" initial load sequence.
- **Advanced Visualizations**: Render your datasets using a highly modular Recharts implementation supporting Line, Bar, Area, Pie, and Scatter charts with custom tooltips and styling.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 via [TanStack Start](https://tanstack.com/start)
- **Routing & State**: [TanStack Router](https://tanstack.com/router) & [TanStack Query](https://tanstack.com/query)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://motion.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Local Database**: [Dexie.js](https://dexie.org/)
- **PWA/Service Worker**: [Serwist](https://serwist.build/)

### Backend & Tooling
- **API Engine**: [tRPC](https://trpc.io/)
- **Database**: [LibSQL](https://turso.tech/libsql) (SQLite) via [Prisma ORM](https://www.prisma.io/)
- **Runtime**: [Bun](https://bun.sh/)
- **Type Safety**: End-to-end TypeScript

## 📦 Getting Started

### Prerequisites
Make sure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DarshGupta16/scales.git
   cd scales
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Generate the Prisma Client and migrate the local database:
   ```bash
   bunx prisma generate
   bunx prisma db push
   ```

### Development

To start the development server with Hot Module Replacement (HMR):
```bash
bun run dev
```
The application will be available at `http://localhost:3000`.

*Note: In development mode, the Service Worker is intentionally disabled to allow HMR to function correctly. The local Dexie database will still work as expected.*

### Production Build & PWA Testing

To test the exact production environment with full Service Worker caching and PWA installability:

```bash
# Build the client, server, and inject the Service Worker
bun run build

# Preview the production build locally
bun run preview
```

## 🧠 Architecture Notes

- **Optimistic Updates**: When logging a new measurement, the UI updates instantly by mutating the TanStack Query cache. If the server request fails, it rolls back gracefully.
- **Hydration Suspense**: Custom shimmering skeleton loaders are used during initial React hydration to prevent layout shift and hide the empty state before Dexie successfully mounts.
- **SW Build Hook**: Because TanStack Start utilizes complex nested Vite environment builds, the Service Worker is generated using a dedicated Node script (`scripts/build-sw.ts`) immediately following the standard build.

## 📜 License
MIT License
