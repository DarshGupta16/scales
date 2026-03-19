import { create } from "zustand";
import { db } from "./lib/dexieDb";
import { type DatasetState } from "./store/types";
import { buildDatasets } from "./store/helpers";
import { createDatasetSlice } from "./store/slices/datasetSlice";
import { createUnitSlice } from "./store/slices/unitSlice";
import { pb } from "./lib/pocketbase";
import type {
  DatasetRecord,
  MeasurementRecord,
  UnitRecord,
} from "./types/dataset";

export const useDatasetStore = create<DatasetState>((set, get, ...args) => ({
  datasets: [],
  units: [],
  selectedDatasetId: null,
  isLoading: false,
  error: null,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });

    // Listen for back-online events to trigger sync
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        get().sync();
      });
    }

    const fn = async (syncedPocketbase = false) => {
      try {
        const [datasetRecords, unitRecords, measurementRecords] =
          await Promise.all([
            db.datasets.toArray(),
            db.units.toArray(),
            db.measurements.toArray(),
          ]);

        const datasets = buildDatasets(
          datasetRecords,
          unitRecords,
          measurementRecords,
        );

        set({
          datasets,
          units: unitRecords,
          isHydrated: true,
          isLoading: false,
        });

        if (!syncedPocketbase) {
          try {
            // Trigger sync first before fetching fresh data
            await get().sync();

            // Sync with pocketbase and re-call hydrate
            const [pbDatasets, pbMeasurements, pbUnits] = await Promise.all([
              pb.collection("datasets").getFullList(),
              pb.collection("measurements").getFullList(),
              pb.collection("units").getFullList(),
            ]);

            const datasetRecords: DatasetRecord[] = pbDatasets.map((d: any) => ({
              id: d.id,
              title: d.title,
              description: d.description,
              unitId: d.unit_id,
              views: d.views,
              createdAt: d.createdAt,
            }));

            const measurementRecords: MeasurementRecord[] = pbMeasurements.map(
              (m: any) => ({
                id: m.id,
                datasetId: m.dataset_id,
                timestamp: m.timestamp,
                value: m.value,
              }),
            );

            const unitRecords: UnitRecord[] = pbUnits.map((u: any) => ({
              id: u.id,
              name: u.name,
              symbol: u.symbol,
            }));

            await db.datasets.bulkPut(datasetRecords);
            await db.measurements.bulkPut(measurementRecords);
            await db.units.bulkPut(unitRecords);

            await fn(true);
          } catch (syncErr) {
            console.error("Pocketbase sync failed:", syncErr);
          }
        }
      } catch (err) {
        set({
          error: (err as Error).message,
          isLoading: false,
        });
      }
    };
    await fn();
  },

  sync: async () => {
    const ops = await db.offline_ops.orderBy("timestamp").toArray();
    if (ops.length === 0) return;

    console.log(`Syncing ${ops.length} offline operations...`);

    for (const op of ops) {
      try {
        const collection = pb.collection(op.collection);

        if (op.action === "create") {
          if (op.collection === "datasets") {
            const { datasetRecord, measurementRecords } = op.data;
            await collection.create({
              ...datasetRecord,
              unit_id: datasetRecord.unitId,
            });
            for (const m of measurementRecords) {
              await pb.collection("measurements").create({
                ...m,
                dataset_id: m.datasetId,
              });
            }
          } else {
            await collection.create(op.data);
          }
        } else if (op.action === "update") {
          if (op.collection === "datasets") {
            const { datasetRecord } = op.data;
            await collection.update(op.recordId, {
              ...datasetRecord,
              unit_id: datasetRecord.unitId,
            });

            // For simplicity, we'll assume measurements are handled by the rewrite sync after this
          } else {
            await collection.update(op.recordId, op.data);
          }
        } else if (op.action === "delete") {
          await collection.delete(op.recordId);
        }

        // Remove successful op from log
        await db.offline_ops.delete(op.id!);
      } catch (err) {
        console.error(`Failed to sync op ${op.id}:`, err);
        // If it's a network error, stop processing and wait for next online event
        if (!navigator.onLine) break;
      }
    }

    console.log("Offline sync complete.");
  },

  ...createDatasetSlice(set, get, ...args),
  ...createUnitSlice(set, get, ...args),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));

export * from "./store/types";
