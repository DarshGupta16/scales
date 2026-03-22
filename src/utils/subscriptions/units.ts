import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";
import type { UnitRecord } from "../../types/dataset";

export const subscribeUnits = () => {
  return pb.collection("units").subscribe("*", async (e) => {
    const { action, record } = e;
    const updated = new Date(record.updated).getTime();
    const created = new Date(record.created).getTime();

    const unitRecord: UnitRecord = {
      id: record.id,
      name: record.name,
      symbol: record.symbol,
      created,
      updated,
    };

    if (action === "create" || action === "update") {
      useDatasetStore.setState((state) => {
        const existing = state.units.find((u) => u.id === record.id);
        if (existing) {
          const localUpdated = existing.updated || 0;
          if (updated <= localUpdated) {
            if (existing.name === unitRecord.name && existing.symbol === unitRecord.symbol)
              return state;
          }
        }

        const newUnits = existing
          ? state.units.map((u) => (u.id === record.id ? unitRecord : u))
          : [...state.units, unitRecord];

        const newDatasets = state.datasets.map((d) =>
          d.unit.id === unitRecord.id ? { ...d, unit: unitRecord } : d,
        );

        return { units: newUnits, datasets: newDatasets };
      });
      await db.units.put(unitRecord);
    } else if (action === "delete") {
      useDatasetStore.setState((state) => {
        if (!state.units.some((u) => u.id === record.id)) return state;
        return { units: state.units.filter((u) => u.id !== record.id) };
      });
      await db.units.delete(record.id);
    }
  });
};
