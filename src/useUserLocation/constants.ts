import type { UseUserLocationOptions } from "./types";

/** Default merged options for the hook (see {@link UseUserLocationOptions}). */
export const DEFAULT_OPTIONS: Required<UseUserLocationOptions> = {
  openCageApiKey: "",
  reverseGeocodeApi: "https://api.opencagedata.com/geocode/v1/json",
  reverseGeocodeApiFallback: "https://nominatim.openstreetmap.org/reverse",
  ipApi: "https://ipwho.is/",
  maxRetries: 3,
};

/** `navigator.geolocation` PositionOptions — timeout before the browser stops waiting for a fix. */
export const BROWSER_GEO_TIMEOUT_MS = 30_000;

/** Accept a cached position at most this old (ms) before requesting a fresh reading. */
export const BROWSER_GEO_MAX_AGE_MS = 60_000;

/**
 * HTML Geolocation `PositionError` codes (permission, unavailable, timeout).
 * @see https://w3c.github.io/geolocation-api/#position_error_interface
 */
export const GEO_ERR_PERMISSION_DENIED = 1;
export const GEO_ERR_POSITION_UNAVAILABLE = 2;
export const GEO_ERR_TIMEOUT = 3;

/** Used when `navigator.geolocation` is missing (not part of the W3C enum). */
export const GEO_ERR_NOT_SUPPORTED = 0;

/** First code point of regional-indicator block (Unicode TR #51). */
export const REGIONAL_INDICATOR_BASE_CODEPOINT = 0x1f1e6;

/** ASCII code unit for `'A'` — offset from regional-indicator base for Latin letters. */
export const ASCII_UPPERCASE_A = 65;
