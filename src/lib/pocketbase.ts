import PocketBase from "pocketbase";

const getPbUrl = () => {
  if (import.meta.env.VITE_POCKETBASE_URL) {
    return import.meta.env.VITE_POCKETBASE_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;

    // If we're on a standard port (80/443) OR the port is 3000 (standard app port),
    // we use the same host and port because the server is now proxying requests.
    if (port === "" || port === "80" || port === "443" || port === "3000") {
      return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
    }

    // Direct port access to PocketBase: assume port 8090
    return `${protocol}//${hostname}:8090`;
  }

  // Fallback for SSR (internal container communication)
  return "http://127.0.0.1:8090";
};

export const pb = new PocketBase(getPbUrl());
