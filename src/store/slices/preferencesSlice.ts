import type { StateCreator } from "zustand";
import { db } from "../../lib/dexieDb";
import { pb } from "../../lib/pocketbase";
import { generatePbId } from "../../utils/id";
import type { DatasetState, Preference } from "../types";

export const createPreferencesSlice: StateCreator<
  DatasetState,
  [],
  [],
  Pick<DatasetState, "updatePreferences">
> = (set, get) => ({
  updatePreferences: async (id, op, data) => {
    const previousPreferences = get().preferences;

    // Find if preference already exists by ID or by preference name (to avoid duplicates)
    const existing = get().preferences.find(
      (p) => (id && p.id === id) || (!id && data?.preference && p.preference === data.preference),
    );

    const finalOp = op === "upsert" ? (existing ? "update" : "create") : "delete";
    const finalId = id || existing?.id || generatePbId();

    // 1. ZUSTAND: Optimistic Update
    if (finalOp === "create") {
      const newPref: Preference = {
        id: finalId,
        preference: data?.preference || "",
        value: data?.value,
        created: Date.now(),
        updated: Date.now(),
      };
      set((state) => ({ preferences: [...state.preferences, newPref] }));
    } else if (finalOp === "update") {
      set((state) => ({
        preferences: state.preferences.map((p) =>
          p.id === finalId ? { ...p, ...data, updated: Date.now() } : p,
        ),
      }));
    } else if (finalOp === "delete") {
      set((state) => ({
        preferences: state.preferences.filter((p) => p.id !== finalId),
      }));
    }

    try {
      const currentPref = get().preferences.find((p) => p.id === finalId);

      // 2. DEXIE: Local Persistence
      if (finalOp === "create" || finalOp === "update") {
        if (currentPref) {
          await db.preferences.put(currentPref);
        }
      } else if (finalOp === "delete") {
        await db.preferences.delete(finalId);
      }

      // 3. POCKETBASE: Remote Persistence
      try {
        if (finalOp === "create") {
          if (currentPref) {
            await pb.collection("preferences").create(currentPref);
          }
        } else if (finalOp === "update") {
          if (currentPref) {
            await pb.collection("preferences").update(finalId, currentPref);
          }
        } else if (finalOp === "delete") {
          await pb.collection("preferences").delete(finalId);
        }
      } catch (pbErr: unknown) {
        if (pbErr && typeof pbErr === "object" && "status" in pbErr && pbErr.status === 0) {
          // Record offline operation
          await db.offline_ops.add({
            collection: "preferences",
            action: finalOp as "create" | "update" | "delete", // This will be "create", "update" or "delete" which syncSlice expects
            recordId: finalId,
            data: finalOp === "delete" ? null : currentPref || null,
            timestamp: Date.now(),
          });
          console.warn(`Offline: Recorded preference ${finalOp} in op logs.`);
        }
      }
    } catch (err) {
      set({ preferences: previousPreferences });
      set({ error: (err as Error).message });
      console.error(`Failed to ${finalOp} preference (PB/Dexie):`, err);
    }
  },
});
