import { useEffect, useState, useCallback } from "react";
import { dexieDb, type SyncLogEntry } from "@/dexieDb";
import { trpcClient } from "@/trpc/client";
import { SyncOperation } from "@/types/syncOperations";
import { allClientHandlers } from "./registry.client";

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Fetch server logs
      const serverLogsQuery = await trpcClient.getSyncLogs.query({ after: 0 });
      const serverLogs = serverLogsQuery as SyncLogEntry[];

      // 2. Fetch all local logs
      const localLogs = await dexieDb.syncLogs.orderBy("timestamp").toArray();

      // 3. Early Exit / Short-circuit
      if (serverLogs.length > 0 && localLogs.length > 0) {
        const latestServerLog = serverLogs[serverLogs.length - 1];
        const latestLocalLog = localLogs[localLogs.length - 1];
        if (latestServerLog.id === latestLocalLog.id) {
          setIsSyncing(false);
          setLastSyncedAt(new Date());
          return; // Already synced!
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
        setIsSyncing(false);
        setLastSyncedAt(new Date());
        return;
      }

      // 6. Push client-only logs to the server
      if (clientOnlyLogs.length > 0) {
        await trpcClient.pushSyncLogs.mutate(clientOnlyLogs as any[]);
      }

      // 7. Replay server-only logs on Dexie
      for (const log of serverOnlyLogs) {
        try {
          const payload = JSON.parse(log.payload);
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

      // 8. Prune old logs on the server
      trpcClient.pruneOldLogs.mutate({ thresholdDays: 10 });

      setLastSyncedAt(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Event-driven online sync
  useEffect(() => {
    const handleOnline = () => {
      console.log("Browser went online. Triggering sync.");
      sync();
    };

    // Initial sync on mount
    sync();

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to record an operation
  const recordOperation = useCallback(
    async (operation: SyncOperation, payloadObject: any) => {
      const log: SyncLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().getTime(),
        operation,
        payload: JSON.stringify(payloadObject),
      };

      await dexieDb.syncLogs.put(log);
      sync();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { sync, recordOperation, isSyncing, lastSyncedAt };
}
