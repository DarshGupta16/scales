import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import type { Unit } from "../../types/dataset";
import { tryPbOrQueue } from "../pbSync";
import type { DatasetState } from "../types";

export const createUnitSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<DatasetState, "addUnit" | "updateUnit" | "removeUnit" | "populateDefaultUnits">
> = (set, get) => ({
  populateDefaultUnits: async () => {
    const defaultUnits = [
      {
        id: "unit000000000kg",
        name: "Kilogram",
        symbol: "kg",
        created: Date.now(),
        updated: Date.now(),
      },
      {
        id: "unit0000000000m",
        name: "Meter",
        symbol: "m",
        created: Date.now(),
        updated: Date.now(),
      },
      {
        id: "unit0000000000s",
        name: "Second",
        symbol: "s",
        created: Date.now(),
        updated: Date.now(),
      },
      {
        id: "unit0000000000l",
        name: "Liter",
        symbol: "l",
        created: Date.now(),
        updated: Date.now(),
      },
      {
        id: "unit00000000pct",
        name: "Percentage",
        symbol: "%",
        created: Date.now(),
        updated: Date.now(),
      },
      {
        id: "unit0000000kcal",
        name: "Calories",
        symbol: "kcal",
        created: Date.now(),
        updated: Date.now(),
      },
    ];

    // 1. ZUSTAND
    const unitsById: Record<string, Unit> = {};
    const unitIds: string[] = [];
    for (const u of defaultUnits) {
      unitsById[u.id] = u;
      unitIds.push(u.id);
    }
    set({ unitsById, unitIds });

    try {
      // 2. DEXIE
      await db.units.bulkPut(defaultUnits);

      // 3. POCKETBASE
      for (const unit of defaultUnits) {
        try {
          await pb.collection("units").create(unit);
        } catch (pbErr: unknown) {
          if (pbErr && typeof pbErr === "object" && "status" in pbErr && pbErr.status === 400) {
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
    const previousUnitsById = get().unitsById;
    const previousUnitIds = get().unitIds;
    const unitWithTime = { ...unit, created: Date.now(), updated: Date.now() };

    // 1. ZUSTAND: Optimistic Update
    set((state) => ({
      unitsById: { ...state.unitsById, [unit.id]: unitWithTime },
      unitIds: [...state.unitIds, unit.id],
    }));

    try {
      // 2. DEXIE: Local Persistence
      await db.units.put(unitWithTime);

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
          await pb.collection("units").create(unitWithTime);
        },
        { collection: "units", action: "create", recordId: unit.id, data: unit },
      );
    } catch (err) {
      set({
        unitsById: previousUnitsById,
        unitIds: previousUnitIds,
        error: (err as Error).message,
      });
      await db.units.delete(unit.id);
      console.error("Failed to persist unit (PB/Dexie):", err);
    }
  },

  updateUnit: async (unit) => {
    const previousUnitsById = get().unitsById;
    const previousDatasetsById = get().datasetsById;
    const unitWithTime = { ...unit, updated: Date.now() };

    // 1. ZUSTAND: Optimistic Update
    set((state) => {
      const newUnitsById = { ...state.unitsById, [unit.id]: unitWithTime };
      const newDatasetsById = { ...state.datasetsById };
      for (const did of state.datasetIds) {
        const d = newDatasetsById[did];
        if (d.unit.id === unit.id) {
          newDatasetsById[did] = { ...d, unit: unitWithTime };
        }
      }
      return { unitsById: newUnitsById, datasetsById: newDatasetsById };
    });

    let prevUnit: Unit | undefined;
    try {
      prevUnit = await db.units.get(unit.id);
      // 2. DEXIE: Local Persistence
      await db.units.put(unitWithTime);

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
          await pb.collection("units").update(unit.id, unitWithTime);
        },
        { collection: "units", action: "update", recordId: unit.id, data: unit },
      );
    } catch (err) {
      set({
        unitsById: previousUnitsById,
        datasetsById: previousDatasetsById,
        error: (err as Error).message,
      });
      if (prevUnit) await db.units.put(prevUnit);
      console.error("Failed to update unit (PB/Dexie):", err);
    }
  },

  removeUnit: async (id) => {
    const dependents = await db.metrics.where("unitId").equals(id).count();
    if (dependents > 0) {
      set({ error: "Cannot delete unit: it is still used by one or more metrics." });
      return;
    }

    const previousUnitsById = get().unitsById;
    const previousUnitIds = get().unitIds;

    // 1. ZUSTAND: Optimistic Update
    set((state) => {
      const { [id]: _, ...rest } = state.unitsById;
      return {
        unitsById: rest,
        unitIds: state.unitIds.filter((u) => u !== id),
      };
    });

    let prevUnit: Unit | undefined;
    try {
      prevUnit = await db.units.get(id);
      // 2. DEXIE: Local Persistence
      await db.units.delete(id);

      // 3. POCKETBASE: Remote Persistence
      await tryPbOrQueue(
        async () => {
          await pb.collection("units").delete(id);
        },
        { collection: "units", action: "delete", recordId: id, data: null },
      );
    } catch (err) {
      set({
        unitsById: previousUnitsById,
        unitIds: previousUnitIds,
        error: (err as Error).message,
      });
      if (prevUnit) await db.units.put(prevUnit);
      console.error("Failed to remove unit (PB/Dexie):", err);
    }
  },
});
