import { describe, test, expect, mock, beforeEach } from "bun:test";
import { createStore } from "zustand";

// ─── Mocks ───────────────────────────────────────────────────────

const mockDbPut = mock(() => Promise.resolve());
const mockDbDelete = mock(() => Promise.resolve());

mock.module("@/lib/dexieDb", () => ({
	db: {
		preferences: {
			put: mockDbPut,
			delete: mockDbDelete,
		},
	},
}));

mock.module("@/lib/pocketbase", () => ({
	pb: {
		collection: mock(() => ({
			create: mock(() => Promise.resolve()),
			update: mock(() => Promise.resolve()),
			delete: mock(() => Promise.resolve()),
		})),
	},
}));

// Mock tryPbOrQueue to execute the pbFn directly
const mockTryPbOrQueue = mock(async (fn: () => Promise<void>, _op: any) => {
	await fn();
});
mock.module("@/store/pbSync", () => ({
	tryPbOrQueue: mockTryPbOrQueue,
}));

// Mock generatePbId for deterministic IDs
mock.module("@/utils/id", () => ({
	generatePbId: mock(() => "generated00001"),
}));

import { createPreferencesSlice } from "@/store/slices/preferencesSlice";

// ─── Test store helper ───────────────────────────────────────────

function createTestStore(initialPrefs: any[] = []) {
	return createStore<any>((set, get, api) => ({
		preferences: initialPrefs,
		error: null,
		...createPreferencesSlice(set, get, api),
	}));
}

// ─── Tests ───────────────────────────────────────────────────────

describe("createPreferencesSlice — updatePreferences", () => {
	beforeEach(() => {
		mockDbPut.mockClear();
		mockDbDelete.mockClear();
		mockTryPbOrQueue.mockClear();
	});

	// --- Operation resolution ---

	test("upsert with no existing preference → creates new", async () => {
		const store = createTestStore();

		await store.getState().updatePreferences(undefined, "upsert", {
			preference: "theme",
			value: "dark",
		});

		const prefs = store.getState().preferences;
		expect(prefs).toHaveLength(1);
		expect(prefs[0].id).toBe("generated00001");
		expect(prefs[0].preference).toBe("theme");
		expect(prefs[0].value).toBe("dark");
	});

	test("upsert with existing preference (by ID) → updates", async () => {
		const existing = {
			id: "pref1", preference: "theme", value: "light",
			created: 1000, updated: 1000,
		};
		const store = createTestStore([existing]);

		await store.getState().updatePreferences("pref1", "upsert", {
			value: "dark",
		});

		const pref = store.getState().preferences.find((p: any) => p.id === "pref1");
		expect(pref.value).toBe("dark");
	});

	test("upsert with existing preference (by name) → updates", async () => {
		const existing = {
			id: "pref1", preference: "theme", value: "light",
			created: 1000, updated: 1000,
		};
		const store = createTestStore([existing]);

		await store.getState().updatePreferences(undefined, "upsert", {
			preference: "theme",
			value: "dark",
		});

		const pref = store.getState().preferences.find((p: any) => p.id === "pref1");
		expect(pref.value).toBe("dark");
	});

	test("delete removes preference from state", async () => {
		const existing = {
			id: "pref1", preference: "theme", value: "dark",
			created: 1000, updated: 1000,
		};
		const store = createTestStore([existing]);

		await store.getState().updatePreferences("pref1", "delete");

		expect(store.getState().preferences).toHaveLength(0);
	});

	// --- Persistence ---

	test("persists to Dexie on create", async () => {
		const store = createTestStore();

		await store.getState().updatePreferences(undefined, "upsert", {
			preference: "lang", value: "en",
		});

		expect(mockDbPut).toHaveBeenCalledTimes(1);
	});

	test("persists to Dexie on update", async () => {
		const existing = {
			id: "pref1", preference: "theme", value: "light",
			created: 1000, updated: 1000,
		};
		const store = createTestStore([existing]);

		await store.getState().updatePreferences("pref1", "upsert", { value: "dark" });

		expect(mockDbPut).toHaveBeenCalledTimes(1);
	});

	test("deletes from Dexie on delete", async () => {
		const existing = {
			id: "pref1", preference: "theme", value: "light",
			created: 1000, updated: 1000,
		};
		const store = createTestStore([existing]);

		await store.getState().updatePreferences("pref1", "delete");

		expect(mockDbDelete).toHaveBeenCalledWith("pref1");
	});

	test("calls tryPbOrQueue with correct action for create", async () => {
		const store = createTestStore();

		await store.getState().updatePreferences(undefined, "upsert", {
			preference: "timezone", value: "UTC",
		});

		expect(mockTryPbOrQueue).toHaveBeenCalledTimes(1);
		const offlineOp = mockTryPbOrQueue.mock.calls[0][1] as any;
		expect(offlineOp.collection).toBe("preferences");
		expect(offlineOp.action).toBe("create");
	});

	test("calls tryPbOrQueue with 'update' action for existing preference", async () => {
		const existing = {
			id: "pref1", preference: "theme", value: "light",
			created: 1000, updated: 1000,
		};
		const store = createTestStore([existing]);

		await store.getState().updatePreferences("pref1", "upsert", { value: "dark" });

		const offlineOp = mockTryPbOrQueue.mock.calls[0][1] as any;
		expect(offlineOp.action).toBe("update");
	});

	test("calls tryPbOrQueue with 'delete' action on delete", async () => {
		const existing = {
			id: "pref1", preference: "theme", value: "dark",
			created: 1000, updated: 1000,
		};
		const store = createTestStore([existing]);

		await store.getState().updatePreferences("pref1", "delete");

		const offlineOp = mockTryPbOrQueue.mock.calls[0][1] as any;
		expect(offlineOp.action).toBe("delete");
		expect(offlineOp.data).toBeNull();
	});

	// --- Rollback ---

	test("rolls back state on Dexie error", async () => {
		mockDbPut.mockImplementationOnce(() => Promise.reject(new Error("Dexie write failed")));

		const store = createTestStore();

		await store.getState().updatePreferences(undefined, "upsert", {
			preference: "broken", value: "x",
		});

		expect(store.getState().preferences).toHaveLength(0);
		expect(store.getState().error).toBe("Dexie write failed");
	});
});
