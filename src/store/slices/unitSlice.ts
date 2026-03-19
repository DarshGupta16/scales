import { type StateCreator } from "zustand";
import { type DatasetState } from "../types";
import { db } from "../../lib/dexieDb";

export const createUnitSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<DatasetState, "addUnit" | "updateUnit" | "removeUnit">
> = (set, get) => ({
  addUnit: async (unit) => {
    // Save previous state for potential rollback
    const previousUnits = get().units;

    // OPTIMISTIC UPDATE: Update UI instantly
    set((state) => ({ units: [...state.units, unit] }));

    try {
      // BACKGROUND PERSISTENCE: Let Dexie catch up
      await db.units.put(unit);
    } catch (err) {
      // ROLLBACK: Revert to previous state if persistence fails
      set({ units: previousUnits });
      set({ error: (err as Error).message });
      console.error("Failed to persist unit:", err);
    }
  },

  updateUnit: async (unit) => {
    // Save previous state for potential rollback
    const previousUnits = get().units;
    const previousDatasets = get().datasets;

    // OPTIMISTIC UPDATE: Update UI instantly
    set((state) => ({
      units: state.units.map((u) => (u.id === unit.id ? unit : u)),
      datasets: state.datasets.map((d) =>
        d.unit.id === unit.id ? { ...d, unit } : d,
      ),
    }));

    try {
      // BACKGROUND PERSISTENCE: Let Dexie catch up
      await db.units.put(unit);
    } catch (err) {
      // ROLLBACK: Revert to previous state if persistence fails
      set({ units: previousUnits, datasets: previousDatasets });
      set({ error: (err as Error).message });
      console.error("Failed to update unit:", err);
    }
  },

  removeUnit: async (id) => {
    // Save previous state for potential rollback
    const previousUnits = get().units;

    // OPTIMISTIC UPDATE: Update UI instantly
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    }));

    try {
      // BACKGROUND PERSISTENCE: Let Dexie catch up
      await db.units.delete(id);
    } catch (err) {
      // ROLLBACK: Revert to previous state if persistence fails
      set({ units: previousUnits });
      set({ error: (err as Error).message });
      console.error("Failed to remove unit:", err);
    }
  },
});
