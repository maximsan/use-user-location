import { describe, expect, it } from "vitest";
import {
  parseIpLocationPayload,
  parseNominatimReversePayload,
  parseOpenCageGeocodePayload,
} from "../useUserLocation/geocodeResponseParsers";

describe("parseNominatimReversePayload", () => {
  it("maps display_name, nested address, and flag from country_code", () => {
    const details = parseNominatimReversePayload({
      display_name: "Berlin, DE",
      address: {
        country: "Germany",
        country_code: "de",
        city: "Berlin",
      },
    });
    expect(details.address).toBe("Berlin, DE");
    expect(details.country).toBe("Germany");
    expect(details.flag).toBe("🇩🇪");
  });

  it("returns an empty object for non-object JSON (matches prior optional-chaining behaviour)", () => {
    expect(parseNominatimReversePayload(null)).toEqual({});
    expect(parseNominatimReversePayload("x")).toEqual({});
  });
});

describe("parseOpenCageGeocodePayload", () => {
  it("maps results[0] formatted, components, and annotations.flag", () => {
    const details = parseOpenCageGeocodePayload({
      results: [
        {
          formatted: "Paris, France",
          components: { country: "France", country_code: "fr", city: "Paris" },
          annotations: { flag: "🇫🇷" },
        },
      ],
    });
    expect(details?.address).toBe("Paris, France");
    expect(details?.country).toBe("France");
    expect(details?.flag).toBe("🇫🇷");
  });

  it("returns undefined when results is missing or empty", () => {
    expect(parseOpenCageGeocodePayload({})).toBeUndefined();
    expect(parseOpenCageGeocodePayload({ results: [] })).toBeUndefined();
    expect(parseOpenCageGeocodePayload({ results: [null] })).toBeUndefined();
  });

  it("returns undefined for non-object root", () => {
    expect(parseOpenCageGeocodePayload(null)).toBeUndefined();
  });
});

describe("parseIpLocationPayload", () => {
  it("maps ipwho-style success payload", () => {
    const loc = parseIpLocationPayload({
      success: true,
      latitude: 51.5,
      longitude: -0.12,
      city: "London",
      region: "England",
      country: "UK",
    });
    expect(loc?.latitude).toBe(51.5);
    expect(loc?.longitude).toBe(-0.12);
    expect(loc?.address).toBe("London, England, UK");
  });

  it("maps generic lat/lon with string address", () => {
    const loc = parseIpLocationPayload({
      lat: 1,
      lon: 2,
      address: "Somewhere",
    });
    expect(loc?.latitude).toBe(1);
    expect(loc?.longitude).toBe(2);
    expect(loc?.address).toBe("Somewhere");
  });

  it("builds address from city/region/country when generic lat/lon has no address", () => {
    const loc = parseIpLocationPayload({
      lat: 3,
      lon: 4,
      city: "A",
      region: "B",
      country: "C",
    });
    expect(loc?.address).toBe("A, B, C");
  });

  it("returns undefined when shape does not match", () => {
    expect(parseIpLocationPayload({ success: false })).toBeUndefined();
    expect(parseIpLocationPayload({ success: true, latitude: NaN, longitude: 0 })).toBeUndefined();
    expect(parseIpLocationPayload(null)).toBeUndefined();
  });

  it("does not treat success string as ipwho success", () => {
    expect(
      parseIpLocationPayload({
        success: "true",
        latitude: 1,
        longitude: 2,
      }),
    ).toBeUndefined();
  });
});
