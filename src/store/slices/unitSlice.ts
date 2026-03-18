import { type StateCreator } from "zustand";
import { type DatasetState } from "../types";
import { db } from "../../dexieDb";

export const createUnitSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<DatasetState, "addUnit" | "updateUnit" | "removeUnit">
> = (set) => ({
  addUnit: async (unit) => {
    await db.units.put(unit);
    set((state) => ({ units: [...state.units, unit] }));
  },

  updateUnit: async (unit) => {
    await db.units.put(unit);
    set((state) => ({
      units: state.units.map((u) => (u.id === unit.id ? unit : u)),
      datasets: state.datasets.map((d) =>
        d.unit.id === unit.id ? { ...d, unit } : d,
      ),
    }));
  },

  removeUnit: async (id) => {
    await db.units.delete(id);
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    }));
  },
});
