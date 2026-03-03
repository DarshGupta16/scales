import { useEffect, useState, useCallback, useRef } from "react";
import { dexieDb, type SyncLogEntry } from "@/dexieDb";
import { trpcClient } from "@/trpc/client";
import { SyncOperation } from "@/types/syncOperations";
import { allClientHandlers } from "./registry.client";
import type { SyncPayloads } from "./types";

/**
 * useSync hook
 * 
 * Manages the background synchronization between the local Dexie.js database
 * and the remote tRPC server. It handles merging local operations with
 * server operations, pushing unsynced changes, and replaying server
 * changes locally.
 */
export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  // We use a ref to track syncing state without triggering effect re-runs
  // which prevents infinite loop issues.
  const isSyncingRef = useRef(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    if (isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      // 1. Fetch server logs
      const serverLogsQuery = await trpcClient.getSyncLogs.query({ after: 0 });
      const serverLogs = serverLogsQuery as SyncLogEntry[];

      // 2. Fetch all local logs
      const localLogs = await dexieDb.syncLogs.orderBy("timestamp").toArray();

      // 3. Early Exit / Short-circuit
      // If both sides have logs and the latest log IDs match, we are fully synced.
      if (serverLogs.length > 0 && localLogs.length > 0) {
        const latestServerLog = serverLogs[serverLogs.length - 1];
        const latestLocalLog = localLogs[localLogs.length - 1];
        if (latestServerLog.id === latestLocalLog.id) {
          setLastSyncedAt(new Date());
          return; // Already synced!
        }
      }

      // 4. Find the last common log ID (moving backwards)
      // This helps us determine which logs are new on the client and server.
      let commonLogId: string | null = null;
      let commonServerIndex = -1;

      for (let i = localLogs.length - 1; i >= 0; i--) {
        const localLog = localLogs[i];
        const index = serverLogs.findIndex((sl) => sl.id === localLog.id);
        if (index !== -1) {
          commonLogId = localLog.id;
          commonServerIndex = index;
          break;
        }
      }

      // 5. Collect client-only and server-only logs
      let clientOnlyLogs: SyncLogEntry[] = [];
      let serverOnlyLogs: SyncLogEntry[] = [];

      if (commonLogId) {
        const commonLocalIndex = localLogs.findIndex(
          (l: SyncLogEntry) => l.id === commonLogId,
        );
        clientOnlyLogs = localLogs.slice(commonLocalIndex + 1);
        serverOnlyLogs = serverLogs.slice(commonServerIndex + 1);
      } else {
        clientOnlyLogs = [...localLogs];
        serverOnlyLogs = [...serverLogs];
      }

      if (clientOnlyLogs.length === 0 && serverOnlyLogs.length === 0) {
        setLastSyncedAt(new Date());
        return;
      }

      // 6. Push client-only logs to the server
      if (clientOnlyLogs.length > 0) {
        await trpcClient.pushSyncLogs.mutate(clientOnlyLogs);
      }

      // 7. Replay server-only logs on Dexie (Local DB)
      for (const log of serverOnlyLogs) {
        try {
          const payload = JSON.parse(log.payload) as SyncPayloads[SyncOperation];
          const handler = allClientHandlers[log.operation];
          if (handler) {
            await handler(payload);
          }
          await dexieDb.syncLogs.put(log);
        } catch (error) {
          console.warn(
            `[Local Replay Error] ${log.operation} (${log.id}):`,
            error,
          );
        }
      }

      // 8. Prune old logs on the server to prevent the sync table from growing infinitely
      await trpcClient.pruneOldLogs.mutate({ thresholdDays: 10 });

      setLastSyncedAt(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Event-driven online sync
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser went online. Triggering sync.");
      void sync();
    };

    // Initial sync on mount
    void sync();

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [sync]);

  /**
   * Helper to record a new operation (e.g. creating a dataset, adding a measurement)
   * This immediately saves the log locally and triggers a background sync.
   */
  const recordOperation = useCallback(
    async <T extends SyncOperation>(operation: T, payloadObject: SyncPayloads[T]) => {
      const log: SyncLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().getTime(),
        operation,
        payload: JSON.stringify(payloadObject),
      };

      await dexieDb.syncLogs.put(log);
      void sync();
    },
    [sync],
  );

  return { sync, recordOperation, isSyncing, lastSyncedAt };
}
