# Scales | Brutal Metrics

A high-performance, local-first web application designed to track, visualize, and analyze your personal metrics and data over time. Built with an uncompromising "brutal" dark-mode aesthetic, Scales offers an instantaneous, offline-capable experience that syncs seamlessly in the background.

## 🚀 Key Features

- **Instantaneous Local-First Experience**: Data is read instantly from a local Dexie.js (IndexedDB) database which acts as the absolute source of truth for the UI. The app feels incredibly fast because it never waits on the network to render your data.
- **PWA & Offline Support**: Fully installable as a Progressive Web App (PWA). Powered by a custom Serwist service worker, the application caches its UI shell and assets, allowing you to view and log metrics even without an internet connection.
- **Background Synchronization**: While you interact with the local data, operations are immediately written to Dexie and then a background sync engine silently pushes changes to the SQLite backend and pulls in new data.
- **Brutal & Immersive UI**: High-contrast, dark-mode aesthetic featuring JetBrains Mono typography, custom SVG grain overlays, fluid Framer Motion animations, and a distinctive "Booting Matrix" initial load sequence.
- **Advanced Visualizations**: Render your datasets using a highly modular Recharts implementation supporting Line, Bar, Area, Pie, and Scatter charts with custom tooltips and styling.

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19 via [TanStack Start](https://tanstack.com/start)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://motion.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Local Database**: [Dexie.js](https://dexie.org/)
- **PWA/Service Worker**: [Serwist](https://serwist.build/)

### Backend & Tooling

- **Backend**: [PocketBase](https://pocketbase.io/) (SQLite-based BaaS)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)
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

3. Set up PocketBase:
   - Download [PocketBase](https://pocketbase.io/docs/) and place the executable in a `pocketbase-server/` directory at the project root
   - Start PocketBase: `./pocketbase-server/pocketbase serve`
   - Migrations in `pb_migrations/` will auto-apply on first run

### Development

To start the development server with Hot Module Replacement (HMR):

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

_Note: In development mode, the Service Worker is intentionally disabled to allow HMR to function correctly. The local Dexie database will still work as expected._

### Production Build & PWA Testing

To test the exact production environment with full Service Worker caching and PWA installability:

```bash
# Build the client, server, and inject the Service Worker
bun run build

# Preview the production build locally
bun run preview
```

## 🧠 Architecture Notes

- **Zustand as Central State**: The UI components read from a Zustand store with dedicated slices (`datasetSlice`, `unitSlice`, `syncSlice`). Data flows: Component → Zustand Action → Write to Dexie (instant UI update) → Sync to PocketBase (background) → PocketBase realtime subscription updates Zustand/Dexie.
- **PocketBase Realtime Subscriptions**: Instead of a custom sync engine, the app uses PocketBase's built-in realtime subscriptions (`src/utils/subscriptions.ts`) to keep the local Dexie DB in sync with the server.
- **Hydration Suspense**: Custom shimmering skeleton loaders are used during initial React hydration to prevent layout shift and hide the empty state before Dexie successfully mounts.
- **SW Build Hook**: The Service Worker is generated using dedicated scripts (`scripts/build-sw.ts`, `scripts/inject-manifest.ts`) immediately following the standard Vite build.

## 📜 License

MIT License
