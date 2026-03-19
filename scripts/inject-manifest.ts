import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { createHash } from "crypto";

const DIST_DIR = "dist/client";
const SW_PATH = join(DIST_DIR, "sw.js");

function getFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const res = join(dir, entry.name);
    if (entry.isDirectory()) {
      return getFiles(res);
    } else {
      return res;
    }
  });
  return files;
}

function getRevision(file: string): string {
  const content = readFileSync(file);
  return createHash("md5").update(content).digest("hex");
}

async function injectManifest() {
  const allFiles = getFiles(DIST_DIR);
  const precacheEntries = allFiles
    .filter((f) => !f.endsWith("sw.js") && !f.endsWith(".map"))
    .map((f) => {
      const url = "/" + relative(DIST_DIR, f).replace(/\\/g, "/");
      return {
        url,
        revision: getRevision(f),
      };
    });

  // Add the root / to the manifest using the main bundle revision to ensure it's cached
  const mainBundle = allFiles.find(
    (f) => f.includes("main-") && f.endsWith(".js"),
  );
  if (mainBundle) {
    precacheEntries.push({
      url: "/",
      revision: getRevision(mainBundle),
    });
  }

  let swContent = readFileSync(SW_PATH, "utf-8");
  const manifestString = JSON.stringify(precacheEntries);

  if (swContent.includes("self.__SW_MANIFEST")) {
    swContent = swContent.replace("self.__SW_MANIFEST", manifestString);
    writeFileSync(SW_PATH, swContent);
    console.log(
      `Successfully injected ${precacheEntries.length} entries into sw.js`,
    );
  } else {
    console.error("Could not find self.__SW_MANIFEST in sw.js");
  }
}

injectManifest().catch(console.error);
