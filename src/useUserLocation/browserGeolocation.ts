import {
  BROWSER_GEO_MAX_AGE_MS,
  BROWSER_GEO_TIMEOUT_MS,
  GEO_ERR_POSITION_UNAVAILABLE,
} from "./constants";
import { isFiniteNumber, isRecord } from "./typeGuards";

function isGeolocationPositionError(error: unknown): error is GeolocationPositionError {
  return isRecord(error) && "code" in error && isFiniteNumber(error.code);
}

/**
 * Single `getCurrentPosition` read with high accuracy. Retries recursively when
 * the error is `POSITION_UNAVAILABLE` (transient fix failure).
 */
export async function getLocationByBrowserAPI(retries: number): Promise<GeolocationPosition> {
  const positioningOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: BROWSER_GEO_TIMEOUT_MS,
    maximumAge: BROWSER_GEO_MAX_AGE_MS,
  };

  try {
    // `await` surfaces async rejection from `getCurrentPosition` into this `catch`
    // so `POSITION_UNAVAILABLE` can trigger a retry.
    return await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, positioningOptions),
    );
  } catch (error) {
    if (
      retries > 0 &&
      isGeolocationPositionError(error) &&
      error.code === GEO_ERR_POSITION_UNAVAILABLE
    ) {
      return getLocationByBrowserAPI(retries - 1);
    }
    throw error;
  }
}
