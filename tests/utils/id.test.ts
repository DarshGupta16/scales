import { describe, test, expect } from "bun:test";
import { generatePbId } from "@/utils/id";

describe("generatePbId", () => {
	test("returns a string of exactly 15 characters", () => {
		const id = generatePbId();
		expect(id).toHaveLength(15);
	});

	test("contains only lowercase letters and digits", () => {
		const id = generatePbId();
		expect(id).toMatch(/^[a-z0-9]{15}$/);
	});

	test("consistent format across 100 generated IDs", () => {
		for (let i = 0; i < 100; i++) {
			const id = generatePbId();
			expect(id).toHaveLength(15);
			expect(id).toMatch(/^[a-z0-9]+$/);
		}
	});

	test("generates unique IDs (no collisions in 1000 calls)", () => {
		const ids = new Set(Array.from({ length: 1000 }, () => generatePbId()));
		expect(ids.size).toBe(1000);
	});

	test("does not contain uppercase letters or special characters", () => {
		const id = generatePbId();
		expect(id).not.toMatch(/[A-Z]/);
		expect(id).not.toMatch(/[^a-z0-9]/);
	});
});
