import { describe, expect, test } from "bun:test";
import { formatDate } from "@/utils/format";

// Fixed timestamp: 2024-06-15T14:30:00.000Z
const TIMESTAMP = 1718458200000;

describe("formatDate", () => {
  test("'short' returns a non-empty string", () => {
    const result = formatDate(TIMESTAMP, "short");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("'medium' returns an uppercased string", () => {
    const result = formatDate(TIMESTAMP, "medium");
    expect(result).toBe(result.toUpperCase());
  });

  test("'full' returns a non-empty string", () => {
    const result = formatDate(TIMESTAMP, "full");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("defaults to 'medium' when no option is provided", () => {
    const defaultResult = formatDate(TIMESTAMP);
    const mediumResult = formatDate(TIMESTAMP, "medium");
    expect(defaultResult).toBe(mediumResult);
  });

  test("different options produce different outputs", () => {
    const short = formatDate(TIMESTAMP, "short");
    const medium = formatDate(TIMESTAMP, "medium");
    const full = formatDate(TIMESTAMP, "full");
    const unique = new Set([short, medium, full]);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });

  test("handles epoch timestamp (0)", () => {
    const result = formatDate(0);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("handles very large timestamps", () => {
    const result = formatDate(4102444800000, "short");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
