/**
 * useUserLocation — React hook for coordinates, reverse geocoding, and IP fallback.
 *
 * @packageDocumentation
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocationByBrowserAPI } from "./browserGeolocation";
import { DEFAULT_OPTIONS, GEO_ERR_NOT_SUPPORTED, GEO_ERR_PERMISSION_DENIED } from "./constants";
import { getIPLocationFallback } from "./ipLocation";
import { getUserLocationDetails } from "./reverseGeocode";
import type {
  Location,
  LocationError,
  UseUserLocationOptions,
  UseUserLocationReturn,
} from "./types";

function syntheticGeolocationError(code: number, message: string): GeolocationPositionError {
  return { code, message } as GeolocationPositionError;
}

/**
 * Resolves the user's location (browser API → reverse geocode → IP fallback) and
 * listens for permission changes so granting access after denial triggers a refetch.
 */
export function useUserLocation(options?: UseUserLocationOptions): UseUserLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<LocationError | null>(null);

  // Serialized options key: effect deps use callbacks keyed on `config`, not the raw object,
  // so inline option objects do not cause refetch loops (see CLAUDE.md).
  const optionsKey = JSON.stringify(options ?? {});

  // biome-ignore lint/correctness/useExhaustiveDependencies: optionsKey tracks options by value
  const config = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...options,
    }),
    [optionsKey],
  );

  const handleSuccess = useCallback(
    async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      const locationDetails = await getUserLocationDetails(latitude, longitude, config);

      setError(null);
      setLocation({ latitude, longitude, ...locationDetails });
    },
    [config],
  );

  const handleError = useCallback(
    async (err: GeolocationPositionError) => {
      setError({ code: err.code, message: err.message });

      const fallbackLocation = await getIPLocationFallback(config.ipApi);

      if (fallbackLocation) {
        const { latitude, longitude } = fallbackLocation;

        const locationDetails = await getUserLocationDetails(latitude, longitude, config);

        setError(null);
        setLocation({ latitude, longitude, ...locationDetails });
      }
    },
    [config],
  );

  useEffect(() => {
    let cancelled = false;
    let permission: PermissionStatus | undefined;
    let onPermissionChange: (() => void) | undefined;

    const getPositionWithPermissionCheck = async () => {
      try {
        permission = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });

        // Register `change` before the first read so a later transition to `granted`
        // still refetches even if the initial `getCurrentPosition` rejects.
        onPermissionChange = async () => {
          if (permission?.state === "granted" && !cancelled) {
            try {
              const position = await getLocationByBrowserAPI(config.maxRetries);
              if (!cancelled) {
                handleSuccess(position);
              }
            } catch (changeError) {
              if (!cancelled) {
                handleError(changeError as GeolocationPositionError);
              }
            }
          }
        };
        permission.addEventListener("change", onPermissionChange);

        if (permission.state === "denied" && !cancelled) {
          handleError(syntheticGeolocationError(GEO_ERR_PERMISSION_DENIED, "Permission denied"));
          return;
        }

        const position = await getLocationByBrowserAPI(config.maxRetries);
        if (!cancelled) {
          handleSuccess(position);
        }
      } catch (queryError) {
        if (!cancelled) {
          handleError(queryError as GeolocationPositionError);
        }
      }
    };

    if ("geolocation" in navigator) {
      getPositionWithPermissionCheck();
    } else {
      handleError(syntheticGeolocationError(GEO_ERR_NOT_SUPPORTED, "Geolocation not supported"));
    }

    return () => {
      cancelled = true;
      if (permission && onPermissionChange) {
        permission.removeEventListener("change", onPermissionChange);
      }
    };
  }, [handleError, handleSuccess, config.maxRetries]);

  return { location, error };
}
