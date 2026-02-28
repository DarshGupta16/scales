import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export const checkLocalReady = createServerFn({ method: "GET" }).handler(
  async () => {
    const isReady = getCookie("scales_local_ready") === "true";
    return isReady;
  },
);
