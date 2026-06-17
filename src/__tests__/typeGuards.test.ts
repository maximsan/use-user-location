import { describe, expect, it } from "vitest";
import { isFiniteNumber, isRecord, isString } from "../useUserLocation/typeGuards";

describe("isRecord", () => {
  it("narrows plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("rejects null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("treats arrays as records (typeof array is object)", () => {
    expect(isRecord([])).toBe(true);
  });
});

describe("isString", () => {
  it("accepts only strings", () => {
    expect(isString("")).toBe(true);
    expect(isString(1)).toBe(false);
  });
});

describe("isFiniteNumber", () => {
  it("accepts finite numbers only", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-1.5)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber("1")).toBe(false);
  });
});
