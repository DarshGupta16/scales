import { useEffect, useState, useCallback, useRef } from "react";
import { dexieDb, type SyncLogEntry } from "@/dexieDb";
import { trpcClient } from "@/trpc/client";
import { SyncOperation } from "@/types/syncOperations";
import type { SyncPayloads } from "./types";
import { createClientOnlyFn } from "@tanstack/react-start";

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
  const isSyncingRef = useRef(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  /**
   * Triggers a one-time synchronization event.
   * This is made SSR-safe with dynamic imports for client-only registries.
   */
  const sync = useCallback(
    createClientOnlyFn(async () => {
      // Only run if we are in the browser and not already syncing.
      if (typeof window === "undefined" || isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        // 1. Fetch server logs
        const serverLogsQuery = await trpcClient.getSyncLogs.query({
          after: 0,
        });
        const serverLogs = serverLogsQuery as SyncLogEntry[];

        // 2. Fetch all local logs
        const localLogs = await dexieDb.syncLogs.orderBy("timestamp").toArray();

        // 3. Early Exit / Short-circuit
        if (serverLogs.length > 0 && localLogs.length > 0) {
          const latestServerLog = serverLogs[serverLogs.length - 1];
          const latestLocalLog = localLogs[localLogs.length - 1];
          if (latestServerLog.id === latestLocalLog.id) {
            setLastSyncedAt(new Date());
            return;
          }
        }

        // 4. Find the last common log ID (moving backwards)
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
        if (serverOnlyLogs.length > 0) {
          // SSR-Safe Dynamic Import:registry.client imports Dexie and other client-only files.
          // We only load this in the browser during an active sync.
          const { allClientHandlers } = await import("./registry.client");

          for (const log of serverOnlyLogs) {
            try {
              const payload = JSON.parse(
                log.payload,
              ) as SyncPayloads[SyncOperation];
              const handler = allClientHandlers[log.operation as SyncOperation];
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
        }

        // 8. Prune old logs on the server
        await trpcClient.pruneOldLogs.mutate({ thresholdDays: 10 });

        setLastSyncedAt(new Date());
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    }),
    [],
  );

  /**
   * Helper to record a new operation.
   * Immediately writes to local Dexie and triggers a background sync.
   */
  const recordOperation = useCallback(
    async <T extends SyncOperation>(
      operation: T,
      payloadObject: SyncPayloads[T],
    ) => {
      if (typeof window === "undefined") return;

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

/**
 * SyncManager component
 *
 * A dedicated component that should be rendered ONCE at the root of the app.
 * It handles the event-driven synchronization logic (mount-sync and online-sync).
 * Separating this prevents the sync logic from firing multiple times if the hook
 * is used in multiple child components.
 */
export function SyncManager() {
  const { sync } = useSync();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      console.log("Browser went online. Triggering sync.");
      void sync();
    };

    // Trigger initial sync on mount
    void sync();

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [sync]);

  return null;
}
