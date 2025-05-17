/**
 * useUserLocation - A React hook for getting the user's location
 * 
 * This hook provides the user's location using the browser's Geolocation API
 * with fallback to IP-based geolocation. It also provides reverse geocoding
 * to get the user's address from coordinates.
 * 
 * @packageDocumentation
 */

import { useCallback, useEffect, useState } from 'react';

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

/**
 * Location details from reverse geocoding
 */
export interface LocationDetails {
    /** Formatted address string */
    address?: string;
    /** Continent name */
    continent?: string;
    /** Country name */
    country?: string;
    /** City name */
    city?: string;
    /** State or province name */
    state?: string;
    /** ISO country code */
    country_code?: string;
    /** State or province code */
    state_code?: string;
    /** Country flag emoji */
    flag?: string;
}

/**
 * Location information including coordinates and address details
 */
export interface Location extends LocationDetails {
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
};

/**
 * Error information for geolocation failures
 */
export interface LocationError {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
};

/**
 * Default configuration for the hook
 */
const DEFAULT_OPTIONS: Required<UseUserLocationOptions> = {
  openCageApiKey: '',
  reverseGeocodeApi: 'https://api.opencagedata.com/geocode/v1/json',
  reverseGeocodeApiFallback: 'https://nominatim.openstreetmap.org/reverse',
  ipApi: 'https://ipwho.is/',
  maxRetries: 3
};

/**
 * Get location details using a fallback geocoding service
 */
async function getUserLocationDetailsFallback(
  lat: number, 
  lng: number, 
  fallbackUrl: string
): Promise<LocationDetails | undefined> {
  const searchParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
  });
  const url = `${fallbackUrl}?${searchParams.toString()}`;

  const result = await fetch(url, {
    headers: {
      'Referer': window.location.origin,
    }
  });
  
  const data = await result.json();

  return {
    address: data?.display_name,
    continent: data?.address?.continent,
    country: data?.address?.country,
    city: data?.address?.city,
    state: data?.address?.state,
    country_code: data?.address?.country_code,
    state_code: data?.address?.state_code,
    flag: data?.address?.country_code,
  };
}

/**
 * Get location details using OpenCageData API
 * 
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param options - Configuration options
 * @returns Location details or undefined if not found
 */
async function getUserLocationDetails(
  lat: number, 
  lng: number, 
  options: Required<UseUserLocationOptions>
): Promise<LocationDetails | undefined> {
  // Skip if no API key is provided
  if (!options.openCageApiKey) {
    return getUserLocationDetailsFallback(lat, lng, options.reverseGeocodeApiFallback);
  }

  const searchParams = new URLSearchParams({
    q: `${lat},${lng}`,
    key: options.openCageApiKey,
  });
  const url = `${options.reverseGeocodeApi}?${searchParams.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const result = data.results?.[0]

    if(!result) {
      return undefined;
    }

    const address = result?.formatted;
    const componet = result?.components;
    const annotations = result?.annotations;

    return ({
      address,
      continent: componet?.continent,
      country: componet?.country,
      city: componet?.city,
      state: componet?.state,
      country_code: componet?.country_code,
      state_code: componet?.state_code,
      flag: annotations?.flag,
    })

  } catch (error) {
    console.warn('Error fetching full address', error);
    // Fallback to another geocoding service
    const address = await getUserLocationDetailsFallback(lat, lng, options.reverseGeocodeApiFallback);
    if (address) {
      return address;
    } else {
      console.warn('Error fetching full address from fallback service');
      return undefined;
    }
  }
}

/**
 * Get location by IP address as a fallback
 */
async function getIPLocationFallback(ipApi: string): Promise<Location | undefined> {
  try {
    const res = await fetch(ipApi);
    const data = await res.json();
    
    // ipwho.is format
    if (data.success !== undefined) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        address: `${data.city}, ${data.region}, ${data.country}`,
      };
    }
    
    // Generic format - try to extract coordinates
    if (data.lat !== undefined && data.lon !== undefined) {
      return {
        latitude: data.lat,
        longitude: data.lon,
        address: data.address || `${data.city || ''}, ${data.region || ''}, ${data.country || ''}`,
      };
    }
    
    return undefined;
  } catch (error) {
    console.warn('Error fetching IP location:', error);
    return undefined;
  }
}

/**
 * Get location using the browser's Geolocation API
 */
async function getLocationByBrowserAPI(retries: number): Promise<GeolocationPosition> {
  const options = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 60000
  }

  try {
    return new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, options)
    );
  } catch (error) {
    console.log('Error getting location:', error);
    if(retries > 0 && (error as GeolocationPositionError).code === 2) {
      return getLocationByBrowserAPI(retries - 1);
    }
    throw error;
  }
}

/**
 * React hook for getting the user's location
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing location and error state
 * 
 * @example
 * ```tsx
 * const { location, error } = useUserLocation({
 *   openCageApiKey: 'your-api-key'
 * });
 * 
 * if (!location) return <p>Getting location...</p>;
 * if (error && !location) return <p>Error: {error.message}</p>;
 * 
 * return (
 *   <div>
 *     <p>Lat: {location.latitude}</p>
 *     <p>Lng: {location.longitude}</p>
 *     <p>Address: {location.address || 'Resolving...'}</p>
 *   </div>
 * );
 * ```
 */
export function useUserLocation(options?: UseUserLocationOptions) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  
  // Merge default options with user-provided options
  const config = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  const handleSuccess = useCallback(async (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;

    const locationDetails = await getUserLocationDetails(latitude, longitude, config);
    
    setLocation(() => ({ latitude, longitude, ...locationDetails }));
  }, [config]);

  const handleError = useCallback(async (err: GeolocationPositionError) => {
    setError({ code: err.code, message: err.message });

    const fallbackLocation = await getIPLocationFallback(config.ipApi);

    if (fallbackLocation) {
      const { latitude, longitude } = fallbackLocation;
      
      const locationDetails = await getUserLocationDetails(latitude, longitude, config);

      setLocation(() => ({ latitude, longitude, ...locationDetails }));
    }
  }, [config]);

  useEffect(() => {
    let cancelled = false

    const getPositionWithPermissionCheck = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (permission.state === 'denied' && !cancelled) {
          handleError({ code: 1, message: 'Permission denied' } as GeolocationPositionError);
          return;
        }

        const location = await getLocationByBrowserAPI(config.maxRetries)
        if(!cancelled) {
          handleSuccess(location);
        }
        
        permission.onchange = async () => {
          if(permission.state === 'granted' && !cancelled) {
            try {
              const location = await getLocationByBrowserAPI(config.maxRetries);
              handleSuccess(location);
            } catch (error) {
              handleError(error as GeolocationPositionError);
            }
          }
        }
      } catch (error) {
        if(!cancelled) {
          handleError(error as GeolocationPositionError);
        }
      }
    }

    if ('geolocation' in navigator) {
      getPositionWithPermissionCheck()
    } else {
      handleError({ code: 0, message: 'Geolocation not supported' } as GeolocationPositionError);
    }

    return () => {
      cancelled = true;
    }

  }, [handleError, handleSuccess, config.maxRetries]);

  return { location, error };
}
