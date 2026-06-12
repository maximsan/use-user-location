import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getUserLocationDetails,
  getUserLocationDetailsFallback,
} from "../useUserLocation/reverseGeocode";

const baseOptions = {
  openCageApiKey: "test-key",
  reverseGeocodeApi: "https://api.opencagedata.com/geocode/v1/json",
  reverseGeocodeApiFallback: "https://nominatim.openstreetmap.org/reverse",
  ipApi: "https://ipwho.is/",
  maxRetries: 3,
};

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getUserLocationDetailsFallback", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      jsonResponse({
        display_name: "Berlin, DE",
        address: {
          country: "Germany",
          country_code: "de",
          city: "Berlin",
        },
      }),
    );
  });

  it("returns parsed Nominatim payload", async () => {
    const details = await getUserLocationDetailsFallback(
      52.52,
      13.405,
      "https://nominatim.openstreetmap.org/reverse",
    );
    expect(details?.address).toBe("Berlin, DE");
    expect(details?.country).toBe("Germany");
    expect(details?.flag).toBe("🇩🇪");
  });
});

describe("getUserLocationDetails", () => {
  it("uses Nominatim when no API key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("nominatim")) {
        return jsonResponse({
          display_name: "Somewhere",
          address: { country_code: "fr" },
        });
      }
      return jsonResponse({});
    });

    const details = await getUserLocationDetails(1, 2, {
      ...baseOptions,
      openCageApiKey: "",
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("nominatim");
    expect(details?.address).toBe("Somewhere");
    expect(details?.flag).toBe("🇫🇷");
  });

  it("falls back to Nominatim when OpenCage returns non-OK", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("opencagedata")) {
        return jsonResponse({ error: "bad" }, 500);
      }
      if (url.includes("nominatim")) {
        return jsonResponse({
          display_name: "Fallback City",
          address: { country_code: "pl" },
        });
      }
      return jsonResponse({});
    });

    const details = await getUserLocationDetails(10, 20, baseOptions);
    expect(details?.address).toBe("Fallback City");
    expect(details?.flag).toBe("🇵🇱");
  });

  it("returns undefined when OpenCage has empty results (no Nominatim call)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("opencagedata")) {
        return jsonResponse({ results: [] });
      }
      return jsonResponse({});
    });

    const details = await getUserLocationDetails(1, 1, baseOptions);
    expect(details).toBeUndefined();
    expect(fetchSpy.mock.calls.every((c) => String(c[0]).includes("opencagedata"))).toBe(true);
  });
});
