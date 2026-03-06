import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { trpc } from "@/trpc/client";
import { dexieDb } from "@/dexieDb";

/**
 * Hook for managing and viewing system synchronization logs.
 * 
 * Provides access to both local Dexie.js sync logs and remote server sync logs.
 */
export function useLogs() {
  // Local logs from Dexie
  const localLogs = useLiveQuery(() => 
    dexieDb.syncLogs.orderBy("timestamp").reverse().toArray()
  ) ?? [];

  // Server logs via tRPC
  const serverLogsQuery = useQuery({
    ...trpc.getSyncLogs.queryOptions({ after: 0 }),
    staleTime: 1000 * 30, // Logs are relatively fresh
  });

  return {
    localLogs,
    serverLogs: serverLogsQuery.data ?? [],
    isServerLogsLoading: serverLogsQuery.isLoading,
    serverLogsError: serverLogsQuery.error,
  };
}
