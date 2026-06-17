/**
 * Shared JSON bodies for geocoder / IP mocks. Keeps hook and unit tests aligned with
 * {@link ../useUserLocation/geocodeResponseParsers} field names.
 */

export const nominatimNewYorkNyUsa = {
  display_name: "New York, NY, USA",
  address: {
    city: "New York",
    state: "New York",
    country: "United States",
    country_code: "us",
  },
};

export const nominatimLondonEnglandUk = {
  display_name: "London, England, United Kingdom",
  address: { country: "United Kingdom", country_code: "gb" },
};

export const nominatimLondonShort = {
  display_name: "London",
  address: { country_code: "gb" },
};

export const nominatimLondonFullAddress = {
  display_name: "London, England, United Kingdom",
  address: { city: "London", state: "England", country: "United Kingdom", country_code: "gb" },
};

export const nominatimLateStale = {
  display_name: "Late, ST, USA",
  address: {
    city: "Late",
    state: "ST",
    country: "US",
    country_code: "us",
  },
};

export const nominatimCustomDisplay = {
  display_name: "Custom",
  address: {},
};

export const nominatimSomewhereFrance = {
  display_name: "Somewhere",
  address: { country_code: "fr" },
};

export const nominatimFallbackCityPoland = {
  display_name: "Fallback City",
  address: { country_code: "pl" },
};

export const nominatimBerlinDe = {
  display_name: "Berlin, DE",
  address: {
    country: "Germany",
    country_code: "de",
    city: "Berlin",
  },
};

export const nominatimShouldNotUse = {
  display_name: "Should not be used",
  address: { country_code: "pl" },
};

export const openCageNewYorkUsa = {
  results: [
    {
      formatted: "New York, NY, USA",
      components: { country: "United States", country_code: "us" },
      annotations: { flag: "🇺🇸" },
    },
  ],
};

export const openCageEmptyResults = {
  results: [] as unknown[],
};

export const ipwhoLondonSuccess = {
  success: true,
  latitude: 51.5074,
  longitude: -0.1278,
  city: "London",
  region: "England",
  country: "United Kingdom",
};

export const ipwhoFailureRateLimit = {
  success: false,
  message: "Rate limit exceeded",
};

export const ipwhoFailureGeneric = {
  success: false,
};
