import { build } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

async function buildServiceWorker() {
  await build({
    configFile: false,
    plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    build: {
      outDir: "dist/client",
      emptyOutDir: false,
      minify: true,
      sourcemap: false,
      lib: {
        entry: "src/sw.ts",
        formats: ["iife"],
        name: "ServiceWorker",
        fileName: () => "sw.js",
      },
    },
  });
}

buildServiceWorker().catch((err) => {
  console.error(err);
  process.exit(1);
});
