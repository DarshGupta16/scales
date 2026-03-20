import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { DatasetRecord, MeasurementRecord, UnitRecord } from "../../types/dataset";
import { buildDatasets } from "../helpers";
import type { DatasetState } from "../types";

export interface SyncSlice {
  localToPbSync: () => Promise<void>;
  pbToLocalSync: () => Promise<void>;
}

export const createSyncSlice: StateCreator<DatasetState, [], [], SyncSlice> = (set, _get) => ({
  localToPbSync: async () => {
    const ops = await db.offline_ops.orderBy("timestamp").toArray();
    if (ops.length === 0) return;

    console.log(`Syncing ${ops.length} offline operations to PocketBase...`);

    for (const op of ops) {
      try {
        const collection = pb.collection(op.collection);

        if (op.action === "create") {
          if (op.collection === "datasets") {
            const { datasetRecord, measurementRecords } = op.data;
            await collection.create({
              id: datasetRecord.id,
              title: datasetRecord.title,
              description: datasetRecord.description,
              unit_id: datasetRecord.unitId,
              views: datasetRecord.views,
              created: new Date(datasetRecord.created).toISOString(),
            });
            for (const m of measurementRecords) {
              await pb.collection("measurements").create({
                id: m.id,
                dataset_id: m.datasetId,
                value: m.value,
                timestamp: m.timestamp,
                created: new Date(m.created).toISOString(),
              });
            }
          } else {
            await collection.create(op.data);
          }
        } else if (op.action === "update") {
          if (op.collection === "datasets") {
            const { datasetRecord } = op.data;
            await collection.update(op.recordId, {
              title: datasetRecord.title,
              description: datasetRecord.description,
              unit_id: datasetRecord.unitId,
              views: datasetRecord.views,
            });
          } else {
            await collection.update(op.recordId, op.data);
          }
        } else if (op.action === "delete") {
          try {
            await collection.delete(op.recordId);
          } catch (err: any) {
            // Ignore 404s on delete (already gone)
            if (err.status !== 404) throw err;
          }
        }

        await db.offline_ops.delete(op.id!);
      } catch (err) {
        console.error(`Failed to sync op ${op.id}:`, err);
        if (!navigator.onLine) break;
      }
    }
  },

  pbToLocalSync: async () => {
    try {
      // 1. Fetch ALL fresh data from PocketBase
      const [pbDatasets, pbMeasurements, pbUnits] = await Promise.all([
        pb.collection("datasets").getFullList(),
        pb.collection("measurements").getFullList(),
        pb.collection("units").getFullList(),
      ]);

      // 2. Map to local record formats
      const datasetRecords: DatasetRecord[] = pbDatasets.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        unitId: d.unit_id,
        views: d.views,
        created: new Date(d.created).getTime(),
        updated: new Date(d.updated).getTime(),
      }));

      const measurementRecords: MeasurementRecord[] = pbMeasurements.map((m: any) => ({
        id: m.id,
        datasetId: m.dataset_id,
        timestamp: m.timestamp,
        value: m.value,
        created: new Date(m.created).getTime(),
        updated: new Date(m.updated).getTime(),
      }));

      const unitRecords: UnitRecord[] = pbUnits.map((u: any) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol,
        created: new Date(u.created).getTime(),
        updated: new Date(u.updated).getTime(),
      }));

      // 3. Update ZUSTAND Store FIRST
      const datasets = buildDatasets(datasetRecords, unitRecords, measurementRecords);
      set({
        datasets,
        units: unitRecords,
        isLoading: false,
        isHydrated: true,
      });

      // 4. Background: Sync DEXIE (The Diffing/Pruning Approach)
      const syncDexie = async () => {
        // DATASETS: Put fresh, delete orphans
        await db.datasets.bulkPut(datasetRecords);
        const localDatasetIds = await db.datasets.toCollection().primaryKeys();
        const pbDatasetIds = datasetRecords.map((d) => d.id);
        const datasetOrphans = localDatasetIds.filter((id) => !pbDatasetIds.includes(id as string));
        if (datasetOrphans.length > 0) await db.datasets.bulkDelete(datasetOrphans as string[]);

        // UNITS: Put fresh, delete orphans
        await db.units.bulkPut(unitRecords);
        const localUnitIds = await db.units.toCollection().primaryKeys();
        const pbUnitIds = unitRecords.map((u) => u.id);
        const unitOrphans = localUnitIds.filter((id) => !pbUnitIds.includes(id as string));
        if (unitOrphans.length > 0) await db.units.bulkDelete(unitOrphans as string[]);

        // MEASUREMENTS: Put fresh, delete orphans
        await db.measurements.bulkPut(measurementRecords);
        const localMeasurementIds = await db.measurements.toCollection().primaryKeys();
        const pbMeasurementIds = measurementRecords.map((m) => m.id);
        const measurementOrphans = localMeasurementIds.filter(
          (id) => !pbMeasurementIds.includes(id as string),
        );
        if (measurementOrphans.length > 0)
          await db.measurements.bulkDelete(measurementOrphans as string[]);
      };

      // Execute pruning without blocking UI
      syncDexie().catch((err) => console.error("Dexie background sync failed:", err));
    } catch (err) {
      console.error("Pocketbase fetch failed:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },
});
