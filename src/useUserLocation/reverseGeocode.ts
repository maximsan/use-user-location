import { isFetchAbortError } from "./fetchAbortError";
import {
  parseNominatimReversePayload,
  parseOpenCageGeocodePayload,
} from "./geocodeResponseParsers";
import type { LocationDetails, UseUserLocationOptions } from "./types";

type ResolvedOptions = Required<UseUserLocationOptions>;

const fetchInit = (abortSignal?: AbortSignal): RequestInit | undefined =>
  abortSignal ? { signal: abortSignal } : undefined;

/**
 * Reverse geocode via Nominatim/OSM. Returns `undefined` on network or parse failure.
 */
export async function getUserLocationDetailsFallback(
  lat: number,
  lng: number,
  fallbackUrl: string,
  abortSignal?: AbortSignal,
): Promise<LocationDetails | undefined> {
  const searchParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: "json",
  });
  const url = `${fallbackUrl}?${searchParams.toString()}`;

  try {
    const result = await fetch(url, fetchInit(abortSignal));
    if (!result.ok) {
      return undefined;
    }

    const data = await result.json();
    return parseNominatimReversePayload(data);
  } catch {
    return undefined;
  }
}

/**
 * Reverse geocode: OpenCage when `openCageApiKey` is set, else Nominatim only.
 * On OpenCage failure, falls back to Nominatim. Aborted requests do not fall back.
 */
export async function getUserLocationDetails(
  lat: number,
  lng: number,
  options: ResolvedOptions,
  abortSignal?: AbortSignal,
): Promise<LocationDetails | undefined> {
  if (!options.openCageApiKey) {
    return getUserLocationDetailsFallback(lat, lng, options.reverseGeocodeApiFallback, abortSignal);
  }

  const searchParams = new URLSearchParams({
    q: `${lat},${lng}`,
    key: options.openCageApiKey,
  });
  const url = `${options.reverseGeocodeApi}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, fetchInit(abortSignal));
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    return parseOpenCageGeocodePayload(data);
  } catch (error) {
    if (isFetchAbortError(error)) {
      return undefined;
    }
    return getUserLocationDetailsFallback(lat, lng, options.reverseGeocodeApiFallback, abortSignal);
  }
}
