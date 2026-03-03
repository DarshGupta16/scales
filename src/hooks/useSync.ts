import { useEffect, useState, useCallback } from "react";
import { dexieDb, type SyncLogEntry } from "../dexieDb";
import { trpcClient } from "../trpc/client";
import { SyncOperation } from "../types/syncOperations";

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Fetch server logs (since timestamp 0 for simplicity, could be optimized to last known sync)
      // Actually, we'll fetch all of them to find the common point reliably if DBs diverge
      const serverLogsQuery = await trpcClient.getSyncLogs.query({ after: 0 });
      const serverLogs = serverLogsQuery as SyncLogEntry[];

      // 2. Fetch all local logs
      const localLogs = await dexieDb.syncLogs.orderBy("timestamp").toArray();

      // 3. Early Exit / Short-circuit: If the latest log ID and timestamp match, we are fully in sync.
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

      // We look at the end of the lists usually to find common points quickly
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
        // Find where the common log is in local logs
        const commonLocalIndex = localLogs.findIndex(
          (l: SyncLogEntry) => l.id === commonLogId,
        );
        clientOnlyLogs = localLogs.slice(commonLocalIndex + 1);
        serverOnlyLogs = serverLogs.slice(commonServerIndex + 1);
      } else {
        // No common log (e.g., completely fresh install or wiped db)
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
          switch (log.operation) {
            case SyncOperation.CREATE_DATASET:
              await dexieDb.datasets.put({
                ...payload,
                isOptimistic: false,
              } as any);
              break;
            case SyncOperation.UPDATE_DATASET: {
              const ds = await dexieDb.datasets
                .where("id")
                .equals(payload.id)
                .first();
              if (ds) {
                await dexieDb.datasets.update(payload.id, {
                  title: payload.title,
                  description: payload.description,
                  unit: payload.unit,
                  slug: payload.slug,
                } as any);
              }
              break;
            }
            case SyncOperation.DELETE_DATASET:
              await dexieDb.datasets.delete(payload.id);
              break;
            case SyncOperation.ADD_MEASUREMENT: {
              const dsAdd = await dexieDb.datasets
                .where("slug")
                .equals(payload.datasetSlug)
                .first();
              if (dsAdd) {
                const newMeasurements = [
                  ...dsAdd.measurements,
                  {
                    id: payload.id,
                    value: payload.value,
                    timestamp: payload.timestamp,
                  },
                ];
                // Sort by timestamp just in case
                newMeasurements.sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
                );
                await dexieDb.datasets.update(dsAdd.id, {
                  measurements: newMeasurements,
                } as any);
              }
              break;
            }
            case SyncOperation.UPDATE_MEASUREMENT: {
              const datasetsWithMeasUpdate = await dexieDb.datasets.toArray();
              for (const ds of datasetsWithMeasUpdate) {
                const mIndex = ds.measurements.findIndex(
                  (m) => m.id === payload.id,
                );
                if (mIndex !== -1) {
                  const newM = [...ds.measurements];
                  newM[mIndex] = {
                    ...newM[mIndex],
                    value: payload.value,
                    timestamp: payload.timestamp,
                  };
                  await dexieDb.datasets.update(ds.id, {
                    measurements: newM,
                  } as any);
                  break;
                }
              }
              break;
            }
            case SyncOperation.REMOVE_MEASUREMENT: {
              const datasetsWithMeasRemove = await dexieDb.datasets.toArray();
              for (const ds of datasetsWithMeasRemove) {
                if (ds.measurements.some((m) => m.id === payload.id)) {
                  await dexieDb.datasets.update(ds.id, {
                    measurements: ds.measurements.filter(
                      (m) => m.id !== payload.id,
                    ),
                  } as any);
                  break;
                }
              }
              break;
            }
            case SyncOperation.ADD_VIEW: {
              const dsVAdd = await dexieDb.datasets
                .where("id")
                .equals(payload.datasetId)
                .first();
              if (dsVAdd && !dsVAdd.views.includes(payload.type)) {
                await dexieDb.datasets.update(dsVAdd.id, {
                  views: [...dsVAdd.views, payload.type],
                } as any);
              }
              break;
            }
            case SyncOperation.REMOVE_VIEW: {
              const dsVRem = await dexieDb.datasets
                .where("id")
                .equals(payload.datasetId)
                .first();
              if (dsVRem) {
                await dexieDb.datasets.update(dsVRem.id, {
                  views: dsVRem.views.filter((v) => v !== payload.type),
                } as any);
              }
              break;
            }
          }
          // After successfully applying, we should also save this log locally so we don't replay it next time
          await dexieDb.syncLogs.put(log);
        } catch (error) {
          console.warn(
            `[Local Replay Error] ${log.operation} (${log.id}):`,
            error,
          );
        }
      }

      // 8. Prune old logs on the server (async, don't wait for it)
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
        // Use crypto random UUID to avoid any node crypto dependency issues in browser
        id: crypto.randomUUID(),
        timestamp: new Date().getTime(),
        operation,
        payload: JSON.stringify(payloadObject),
      };

      // Store log locally first
      await dexieDb.syncLogs.put(log);

      // Trigger sync to push it
      // Don't await it, let it run in background
      sync();
    },
    // We purposefully omit `sync` from the dependency array to prevent the returned `recordOperation` reference from changing constantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return {
    sync,
    recordOperation,
    isSyncing,
    lastSyncedAt,
  };
}
