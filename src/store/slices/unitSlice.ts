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
      await pb.collection("units").create(unit);
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
      await pb.collection("units").update(unit.id, unit);
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
      await db.units.delete(id);

      // 3. POCKETBASE: Remote Persistence
      await pb.collection("units").delete(id);
    } catch (err) {
      set({ units: previousUnits });
      set({ error: (err as Error).message });
      console.error("Failed to remove unit (PB/Dexie):", err);
    }
  },
});
