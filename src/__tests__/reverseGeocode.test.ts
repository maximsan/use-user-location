import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getUserLocationDetails,
  getUserLocationDetailsFallback,
} from "../useUserLocation/reverseGeocode";
import {
  nominatimBerlinDe,
  nominatimFallbackCityPoland,
  nominatimShouldNotUse,
  nominatimSomewhereFrance,
  openCageEmptyResults,
} from "./fixtures/geocodingResponses";
import { jsonResponse } from "./helpers/jsonResponse";

const baseOptions = {
  openCageApiKey: "test-key",
  reverseGeocodeApi: "https://api.opencagedata.com/geocode/v1/json",
  reverseGeocodeApiFallback: "https://nominatim.openstreetmap.org/reverse",
  ipApi: "https://ipwho.is/",
  maxRetries: 3,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getUserLocationDetailsFallback", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse(nominatimBerlinDe));
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
        return jsonResponse(nominatimSomewhereFrance);
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
        return jsonResponse(nominatimFallbackCityPoland);
      }
      return jsonResponse({});
    });

    const details = await getUserLocationDetails(10, 20, baseOptions);
    expect(details?.address).toBe("Fallback City");
    expect(details?.flag).toBe("🇵🇱");
  });

  it("does not fall back to Nominatim when the OpenCage request is aborted", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("opencagedata")) {
        return Promise.reject(new DOMException("Aborted", "AbortError"));
      }
      if (url.includes("nominatim")) {
        return jsonResponse(nominatimShouldNotUse);
      }
      return jsonResponse({});
    });

    const abortController = new AbortController();
    abortController.abort();

    const details = await getUserLocationDetails(10, 20, baseOptions, abortController.signal);

    expect(details).toBeUndefined();
    expect(fetchSpy.mock.calls.filter((c) => String(c[0]).includes("nominatim"))).toHaveLength(0);
  });

  it("returns undefined when OpenCage has empty results (no Nominatim call)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("opencagedata")) {
        return jsonResponse(openCageEmptyResults);
      }
      return jsonResponse({});
    });

    const details = await getUserLocationDetails(1, 1, baseOptions);
    expect(details).toBeUndefined();
    expect(fetchSpy.mock.calls.every((c) => String(c[0]).includes("opencagedata"))).toBe(true);
  });
});
