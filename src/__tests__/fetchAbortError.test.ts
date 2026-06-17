import { describe, expect, it } from "vitest";
import { isFetchAbortError } from "../useUserLocation/fetchAbortError";

describe("isFetchAbortError", () => {
  it("returns true for DOMException AbortError", () => {
    expect(isFetchAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
  });

  it("returns true for object-shaped AbortError", () => {
    expect(isFetchAbortError({ name: "AbortError" })).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isFetchAbortError(new Error("network"))).toBe(false);
    expect(isFetchAbortError(null)).toBe(false);
  });
});
