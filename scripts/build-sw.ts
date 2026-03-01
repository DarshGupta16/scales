import { build } from "vite";
import { serwist } from "@serwist/vite";
import tsconfigPaths from "vite-tsconfig-paths";

async function buildServiceWorker() {
  await build({
    configFile: false,
    plugins: [
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      serwist({
        swSrc: "src/sw.ts",
        swDest: "sw.js",
        globDirectory: "dist/client",
        injectionPoint: "self.__SW_MANIFEST",
      }),
    ],
    build: {
      outDir: "dist/client",
      emptyOutDir: false,
      rollupOptions: {
        input: "src/sw.ts",
      },
    },
  });
}

buildServiceWorker().catch((err) => {
  console.error(err);
  process.exit(1);
});