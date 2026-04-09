import { describe, test, expect } from "bun:test";
import {
	mapPbDataset,
	mapPbMetric,
	mapPbMeasurement,
	mapPbMeasurementValue,
	mapPbUnit,
	mapPbPreference,
} from "@/store/mappers";

const ISO_CREATED = "2024-06-15T10:00:00.000Z";
const ISO_UPDATED = "2024-06-15T14:30:00.000Z";
const TS_CREATED = new Date(ISO_CREATED).getTime();
const TS_UPDATED = new Date(ISO_UPDATED).getTime();

// ─── mapPbDataset ────────────────────────────────────────────────

describe("mapPbDataset", () => {
	test("maps all fields correctly", () => {
		const result = mapPbDataset({
			id: "ds1",
			title: "Weight",
			description: "Body weight",
			type: "single",
			views: ["line", "bar"],
			created: ISO_CREATED,
			updated: ISO_UPDATED,
		});

		expect(result).toEqual({
			id: "ds1",
			title: "Weight",
			description: "Body weight",
			type: "single",
			views: ["line", "bar"],
			created: TS_CREATED,
			updated: TS_UPDATED,
		});
	});

	test("casts type field to string literal", () => {
		const result = mapPbDataset({
			id: "ds1", title: "Multi", description: "",
			type: "composite", views: [],
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(result.type).toBe("composite");
	});

	test("preserves empty views array", () => {
		const result = mapPbDataset({
			id: "ds1", title: "T", description: "",
			type: "single", views: [],
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(result.views).toEqual([]);
	});
});

// ─── mapPbMetric ─────────────────────────────────────────────────

describe("mapPbMetric", () => {
	test("maps PB snake_case fields to camelCase", () => {
		const result = mapPbMetric({
			id: "met1", dataset_id: "ds1", name: "Weight", unit_id: "u1",
			created: ISO_CREATED, updated: ISO_UPDATED,
		});

		expect(result).toEqual({
			id: "met1", datasetId: "ds1", name: "Weight", unitId: "u1",
			created: TS_CREATED, updated: TS_UPDATED,
		});
	});

	test("dataset_id → datasetId transformation", () => {
		const result = mapPbMetric({
			id: "m", dataset_id: "abc123", name: "X", unit_id: "u",
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(result.datasetId).toBe("abc123");
		expect((result as any).dataset_id).toBeUndefined();
	});
});

// ─── mapPbMeasurement ────────────────────────────────────────────

describe("mapPbMeasurement", () => {
	test("maps fields correctly including dataset_id", () => {
		const result = mapPbMeasurement({
			id: "meas1", dataset_id: "ds1", timestamp: 1718458200000,
			created: ISO_CREATED, updated: ISO_UPDATED,
		});

		expect(result).toEqual({
			id: "meas1", datasetId: "ds1", timestamp: 1718458200000,
			created: TS_CREATED, updated: TS_UPDATED,
		});
	});

	test("preserves numeric timestamp as-is", () => {
		const result = mapPbMeasurement({
			id: "m", dataset_id: "d", timestamp: 0,
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(result.timestamp).toBe(0);
	});
});

// ─── mapPbMeasurementValue ───────────────────────────────────────

describe("mapPbMeasurementValue", () => {
	test("maps snake_case PB fields to camelCase", () => {
		const result = mapPbMeasurementValue({
			id: "mv1", measurement_id: "meas1", metric_id: "met1", value: 75.5,
			created: ISO_CREATED, updated: ISO_UPDATED,
		});

		expect(result).toEqual({
			id: "mv1", measurementId: "meas1", metricId: "met1", value: 75.5,
			created: TS_CREATED, updated: TS_UPDATED,
		});
	});

	test("handles zero and negative numeric values", () => {
		const zeroResult = mapPbMeasurementValue({
			id: "v", measurement_id: "m", metric_id: "met", value: 0,
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(zeroResult.value).toBe(0);

		const negResult = mapPbMeasurementValue({
			id: "v", measurement_id: "m", metric_id: "met", value: -10.5,
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(negResult.value).toBe(-10.5);
	});
});

// ─── mapPbUnit ───────────────────────────────────────────────────

describe("mapPbUnit", () => {
	test("maps all unit fields correctly", () => {
		const result = mapPbUnit({
			id: "u1", name: "Kilogram", symbol: "kg",
			created: ISO_CREATED, updated: ISO_UPDATED,
		});

		expect(result).toEqual({
			id: "u1", name: "Kilogram", symbol: "kg",
			created: TS_CREATED, updated: TS_UPDATED,
		});
	});

	test("handles special characters in symbol", () => {
		const result = mapPbUnit({
			id: "u2", name: "Percentage", symbol: "%",
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(result.symbol).toBe("%");
	});
});

// ─── mapPbPreference ─────────────────────────────────────────────

describe("mapPbPreference", () => {
	test("maps preference fields correctly", () => {
		const result = mapPbPreference({
			id: "p1", preference: "theme", value: "dark",
			created: ISO_CREATED, updated: ISO_UPDATED,
		});

		expect(result).toEqual({
			id: "p1", preference: "theme", value: "dark",
			created: TS_CREATED, updated: TS_UPDATED,
		});
	});

	test("preserves complex value types", () => {
		const complexValue = { nested: { key: [1, 2, 3] } };
		const result = mapPbPreference({
			id: "p2", preference: "settings", value: complexValue,
			created: ISO_CREATED, updated: ISO_UPDATED,
		});
		expect(result.value).toEqual(complexValue);
	});
});

// ─── Cross-cutting: date conversion ─────────────────────────────

describe("date conversion (all mappers)", () => {
	test("all mappers convert ISO date strings to millisecond timestamps", () => {
		const iso = "2024-01-01T00:00:00.000Z";
		const expected = new Date(iso).getTime();

		expect(mapPbDataset({
			id: "", title: "", description: "", type: "single", views: [],
			created: iso, updated: iso,
		}).created).toBe(expected);

		expect(mapPbMetric({
			id: "", dataset_id: "", name: "", unit_id: "",
			created: iso, updated: iso,
		}).created).toBe(expected);

		expect(mapPbMeasurement({
			id: "", dataset_id: "", timestamp: 0,
			created: iso, updated: iso,
		}).created).toBe(expected);

		expect(mapPbMeasurementValue({
			id: "", measurement_id: "", metric_id: "", value: 0,
			created: iso, updated: iso,
		}).created).toBe(expected);

		expect(mapPbUnit({
			id: "", name: "", symbol: "",
			created: iso, updated: iso,
		}).created).toBe(expected);

		expect(mapPbPreference({
			id: "", preference: "", value: null,
			created: iso, updated: iso,
		}).created).toBe(expected);
	});
});
