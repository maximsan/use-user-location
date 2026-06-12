import { describe, expect, it } from "vitest";
import { codeToFlagEmoji } from "../useUserLocation/flagEmoji";

describe("codeToFlagEmoji", () => {
  it("returns undefined for invalid codes", () => {
    expect(codeToFlagEmoji()).toBeUndefined();
    expect(codeToFlagEmoji("")).toBeUndefined();
    expect(codeToFlagEmoji("usa")).toBeUndefined();
    expect(codeToFlagEmoji("u")).toBeUndefined();
    expect(codeToFlagEmoji("1a")).toBeUndefined();
  });

  it("maps ISO alpha-2 to regional-indicator flag", () => {
    expect(codeToFlagEmoji("us")).toBe("🇺🇸");
    expect(codeToFlagEmoji("de")).toBe("🇩🇪");
    expect(codeToFlagEmoji("GB")).toBe("🇬🇧");
  });
});
