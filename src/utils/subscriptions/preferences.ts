import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { useDatasetStore } from "../../store";

export const subscribePreferences = () => {
  return pb.collection("preferences").subscribe("*", async (e) => {
    const { action, record } = e;
    const updated = new Date(record.updated).getTime();
    const created = new Date(record.created).getTime();

    const preferenceRecord = {
      id: record.id,
      preference: record.preference,
      value: record.value,
      created,
      updated,
    };

    if (action === "create" || action === "update") {
      useDatasetStore.setState((state) => {
        const existing = state.preferences.find((p) => p.id === record.id);
        if (existing) {
          const localUpdated = existing.updated || 0;
          if (updated <= localUpdated) {
            if (
              existing.preference === preferenceRecord.preference &&
              JSON.stringify(existing.value) === JSON.stringify(preferenceRecord.value)
            )
              return state;
          }
        }

        const newPreferences = existing
          ? state.preferences.map((p) => (p.id === record.id ? preferenceRecord : p))
          : [...state.preferences, preferenceRecord];

        return { preferences: newPreferences };
      });
      await db.preferences.put(preferenceRecord);
    } else if (action === "delete") {
      useDatasetStore.setState((state) => {
        if (!state.preferences.some((p) => p.id === record.id)) return state;
        return { preferences: state.preferences.filter((p) => p.id !== record.id) };
      });
      await db.preferences.delete(record.id);
    }
  });
};
