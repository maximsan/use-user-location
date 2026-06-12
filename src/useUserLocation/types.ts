/**
 * Configuration options for the useUserLocation hook
 */
export interface UseUserLocationOptions {
  /**
   * API key for OpenCage Data reverse geocoding service
   * @see https://opencagedata.com/api
   */
  openCageApiKey?: string;

  /**
   * URL for OpenCage Data reverse geocoding API
   * @default "https://api.opencagedata.com/geocode/v1/json"
   */
  reverseGeocodeApi?: string;

  /**
   * URL for fallback reverse geocoding API
   * @default "https://nominatim.openstreetmap.org/reverse"
   */
  reverseGeocodeApiFallback?: string;

  /**
   * URL for IP-based geolocation API
   * @default "https://ipwho.is/"
   */
  ipApi?: string;

  /**
   * Maximum number of retries for browser geolocation API
   * @default 3
   */
  maxRetries?: number;
}

/** Location details from reverse geocoding */
export interface LocationDetails {
  address?: string;
  continent?: string;
  country?: string;
  city?: string;
  state?: string;
  country_code?: string;
  state_code?: string;
  flag?: string;
}

/** Location including coordinates and address details */
export interface Location extends LocationDetails {
  latitude: number;
  longitude: number;
}

/** Error information for geolocation failures */
export interface LocationError {
  code: number;
  message: string;
}

/** Value returned by the `useUserLocation` hook. */
export interface UseUserLocationReturn {
  location: Location | null;
  error: LocationError | null;
}
