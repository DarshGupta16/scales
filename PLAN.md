# Implementing Offline Support and PWA

The goal is to make the app act as a Progressive Web App (PWA) with offline capabilities, achieving an "instant" feel regardless of network speed. We are restoring the Dexie-based local caching as requested, but combining it with a Service Worker to provide true offline reliability.

## Proposed Changes

### 1. Restore Dexie Local Database [DONE]

We have already restored [src/dexieDb.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/dexieDb.ts) to exactly match your previous setup (`++index` primary key). We also updated [src/routes/index.tsx](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/routes/index.tsx) to read from Dexie instantly using `useLiveQuery` while syncing with the server in the background.

### 2. Configure PWA functionality (Migrating to `@serwist/vite`)

*Issue Identified:* `vite-plugin-pwa` has known compatibility issues with TanStack Start because TanStack Start uses the new Vite 6 Environment APIs for SSR and client builds. The PWA plugin fails to inject the service worker registry properly into the TanStack Start routing tree.
*Solution:* We will use `@serwist/vite` (the modern successor to Workbox) which gives us raw control over the service worker generation and is compatible with modern SSR frameworks.

#### [NEW] `src/sw.ts`
- Create a manual Service Worker entry point using Serwist.
- Configure it to precache the assets injected by Vite during the build step.
- Set up runtime caching strategies (NetworkFirst, CacheFirst) for navigation requests and static assets.

#### [MODIFY] [vite.config.ts](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/vite.config.ts)
- Remove `vite-plugin-pwa`.
- Add `@serwist/vite` plugin.
- Configure Serwist to point to `src/sw.ts` and output to `public/sw.js`.

#### [MODIFY] [src/routes/__root.tsx](file:///c:/Users/Darsh%20Gupta/Documents/Darsh/Websites%20and%20Web%20Apps/scales/src/routes/__root.tsx)
- We already added the `manifest.webmanifest` link.
- We will add a small inline script to `<Scripts />` or `useEffect` to manually register the compiled Service Worker (`/sw.js`) when the app boots up on the client.

### 3. Ensure `/manifest.webmanifest` is served
- We will create a `public/manifest.webmanifest` file to hold the JSON manifest (since we removed the auto-generating plugin).

## Verification Plan

### Automated/Local Tests
1. **PWA Generation:** Run `bun run build` to ensure the service worker (`sw.js`) is successfully generated in the `public` or `dist/client` directory.
2. **Offline Testing (Manual via Browser):**
   - We will need you to test this.
   - Run `bun dev`.
   - Open DevTools -> Application -> Service Workers and verify the Serwist service worker is installed.
   - Go to the Network tab, set throttling to "Offline".
   - Refresh the page. The app shell and cached data (via Dexie) should still load instantly.

Would you like me to proceed with ripping out `vite-plugin-pwa` and implementing the `Serwist` manual service worker approach?
