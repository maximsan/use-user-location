import { codeToFlagEmoji } from "./flagEmoji";
import { isFiniteNumber, isRecord, isString } from "./typeGuards";
import type { Location, LocationDetails } from "./types";

/**
 * Maps a Nominatim reverse-JSON body to {@link LocationDetails}.
 * Non-objects (e.g. `null` from an empty body) yield an empty details object, matching previous inline mapping.
 */
export function parseNominatimReversePayload(data: unknown): LocationDetails {
  if (!isRecord(data)) {
    return {};
  }

  const address = isRecord(data.address) ? data.address : undefined;
  const countryCode = isString(address?.country_code) ? address.country_code : undefined;

  return {
    address: isString(data.display_name) ? data.display_name : undefined,
    continent: isString(address?.continent) ? address.continent : undefined,
    country: isString(address?.country) ? address.country : undefined,
    city: isString(address?.city) ? address.city : undefined,
    state: isString(address?.state) ? address.state : undefined,
    country_code: countryCode,
    state_code: isString(address?.state_code) ? address.state_code : undefined,
    flag: codeToFlagEmoji(countryCode),
  };
}

/**
 * Maps an OpenCage geocode JSON body to {@link LocationDetails}. Missing `results[0]` yields `undefined`.
 */
export function parseOpenCageGeocodePayload(data: unknown): LocationDetails | undefined {
  if (!isRecord(data)) {
    return undefined;
  }

  const results = data.results;
  if (!Array.isArray(results) || results.length === 0) {
    return undefined;
  }

  const first = results[0];
  if (!isRecord(first)) {
    return undefined;
  }

  const component = isRecord(first.components) ? first.components : undefined;
  const annotations = isRecord(first.annotations) ? first.annotations : undefined;

  return {
    address: isString(first.formatted) ? first.formatted : undefined,
    continent: isString(component?.continent) ? component.continent : undefined,
    country: isString(component?.country) ? component.country : undefined,
    city: isString(component?.city) ? component.city : undefined,
    state: isString(component?.state) ? component.state : undefined,
    country_code: isString(component?.country_code) ? component.country_code : undefined,
    state_code: isString(component?.state_code) ? component.state_code : undefined,
    flag: isString(annotations?.flag) ? annotations.flag : undefined,
  };
}

/**
 * Maps an IP geolocation JSON body to {@link Location}. Supports ipwho-style and generic `{ lat, lon }` shapes.
 */
export function parseIpLocationPayload(data: unknown): Location | undefined {
  if (!isRecord(data)) {
    return undefined;
  }

  if (data.success === true && isFiniteNumber(data.latitude) && isFiniteNumber(data.longitude)) {
    const city = isString(data.city) ? data.city : "";
    const region = isString(data.region) ? data.region : "";
    const country = isString(data.country) ? data.country : "";
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      address: `${city}, ${region}, ${country}`,
    };
  }

  const lat = data.lat;
  const lon = data.lon;
  if (isFiniteNumber(lat) && isFiniteNumber(lon)) {
    const addressField = isString(data.address) ? data.address : undefined;
    const city = isString(data.city) ? data.city : "";
    const region = isString(data.region) ? data.region : "";
    const country = isString(data.country) ? data.country : "";
    return {
      latitude: lat,
      longitude: lon,
      address: addressField ?? `${city}, ${region}, ${country}`,
    };
  }

  return undefined;
}
