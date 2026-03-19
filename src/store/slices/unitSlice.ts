import { type StateCreator } from "zustand";
import { type DatasetState } from "../types";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";

export const createUnitSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<
    DatasetState,
    "addUnit" | "updateUnit" | "removeUnit" | "populateDefaultUnits"
  >
> = (set, get) => ({
  populateDefaultUnits: async () => {
    const defaultUnits = [
      { id: "unit000000000kg", name: "Kilogram", symbol: "kg" },
      { id: "unit0000000000m", name: "Meter", symbol: "m" },
      { id: "unit0000000000s", name: "Second", symbol: "s" },
      { id: "unit0000000000l", name: "Liter", symbol: "l" },
      { id: "unit00000000pct", name: "Percentage", symbol: "%" },
      { id: "unit0000000kcal", name: "Calories", symbol: "kcal" },
    ];

    // 1. ZUSTAND
    set({ units: defaultUnits });

    try {
      // 2. DEXIE
      await db.units.bulkPut(defaultUnits);

      // 3. POCKETBASE
      for (const unit of defaultUnits) {
        try {
          await pb.collection("units").create(unit);
        } catch (pbErr: any) {
          // If it fails with 400, it might already exist on server
          if (pbErr.status === 400) {
            console.warn(`Unit ${unit.id} already exists on PocketBase.`);
            continue;
          }

          // For other errors (like offline), record an offline op
          await db.offline_ops.add({
            collection: "units",
            action: "create",
            recordId: unit.id,
            data: unit,
            timestamp: Date.now(),
          });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("Failed to populate default units:", err);
    }
  },

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
