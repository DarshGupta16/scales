import type { StateCreator } from "zustand";
import { localToPbSyncStrategy } from "../sync/localToPbSync";
import { pbDeltaSyncStrategy } from "../sync/pbDeltaSync";
import { pbToLocalSyncStrategy } from "../sync/pbToLocalSync";
import { reloadFromDexieStrategy } from "../sync/reloadFromDexie";
import type { DatasetState } from "../types";

export interface SyncSlice {
  localToPbSync: () => Promise<void>;
  pbToLocalSync: () => Promise<void>;
  pbDeltaSync: () => Promise<void>;
  reloadFromDexie: () => Promise<void>;
}

// Tested in tests/store/slices/syncSlice.test.ts
export const createSyncSlice: StateCreator<DatasetState, [], [], SyncSlice> = (set, _get) => ({
  localToPbSync: async () => localToPbSyncStrategy(),
  pbToLocalSync: async () => pbToLocalSyncStrategy(set),
  pbDeltaSync: async () => pbDeltaSyncStrategy(set),
  reloadFromDexie: async () => reloadFromDexieStrategy(set),
});
