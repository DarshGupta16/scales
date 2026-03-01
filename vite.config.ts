import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      manifest: {
        name: "Scales",
        short_name: "Scales",
        description: "Track and visualize your metrics over time",
        theme_color: "#050505",
        background_color: "#050505",
        display: "standalone",
        icons: [
          {
            src: "launchericon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "launchericon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "launchericon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "launchericon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "launchericon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});

export default config;
