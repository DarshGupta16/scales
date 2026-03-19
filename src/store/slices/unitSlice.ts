import { type StateCreator } from "zustand";
import { type DatasetState } from "../types";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";

export const createUnitSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<DatasetState, "addUnit" | "updateUnit" | "removeUnit">
> = (set, get) => ({
  addUnit: async (unit) => {
    const previousUnits = get().units;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({ units: [...state.units, unit] }));

    try {
      // 2. DEXIE: Local Persistence
      await db.units.put(unit);

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("units").create(unit);
      } catch (pbErr) {
        // Record offline operation
        await db.offline_ops.add({
          collection: "units",
          action: "create",
          recordId: unit.id,
          data: unit,
          timestamp: Date.now(),
        });
        console.warn("Offline: Recorded unit creation in op logs.");
      }
    } catch (err) {
      set({ units: previousUnits });
      set({ error: (err as Error).message });
      console.error("Failed to persist unit (PB/Dexie):", err);
    }
  },

  updateUnit: async (unit) => {
    const previousUnits = get().units;
    const previousDatasets = get().datasets;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      units: state.units.map((u) => (u.id === unit.id ? unit : u)),
      datasets: state.datasets.map((d) =>
        d.unit.id === unit.id ? { ...d, unit } : d,
      ),
    }));

    try {
      // 2. DEXIE: Local Persistence
      await db.units.put(unit);

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("units").update(unit.id, unit);
      } catch (pbErr) {
        // Record offline operation
        await db.offline_ops.add({
          collection: "units",
          action: "update",
          recordId: unit.id,
          data: unit,
          timestamp: Date.now(),
        });
        console.warn("Offline: Recorded unit update in op logs.");
      }
    } catch (err) {
      set({ units: previousUnits, datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to update unit (PB/Dexie):", err);
    }
  },

  removeUnit: async (id) => {
    const previousUnits = get().units;

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    }));

    try {
      // 2. DEXIE: Local Persistence
      await db.units.delete(id as any);

      // 3. POCKETBASE: Remote Persistence
      try {
        await pb.collection("units").delete(id);
      } catch (pbErr) {
        // Record offline operation
        await db.offline_ops.add({
          collection: "units",
          action: "delete",
          recordId: id,
          data: null,
          timestamp: Date.now(),
        });
        console.warn("Offline: Recorded unit deletion in op logs.");
      }
    } catch (err) {
      set({ units: previousUnits });
      set({ error: (err as Error).message });
      console.error("Failed to remove unit (PB/Dexie):", err);
    }
  },
});
