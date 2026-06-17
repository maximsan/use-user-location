/**
 * useUserLocation — React hook for coordinates, reverse geocoding, and IP fallback.
 *
 * @packageDocumentation
 */

import { useEffect, useMemo, useRef, useState } from "react";
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

  // Bumps on effect cleanup so async work from a prior run can detect staleness after `await`
  // (boolean `cancelled` in the effect alone does not cover `await` inside success/error paths).
  // Survives Strict Mode double-mount: each cleanup increments; in-flight work keeps its captured `generation`.
  const effectGenerationRef = useRef(0);

  // Serialized options key: merged `config` is stable while options are equal by value, so the
  // location effect does not loop when callers pass a fresh inline `options` object each render.
  const optionsKey = JSON.stringify(options ?? {});

  // biome-ignore lint/correctness/useExhaustiveDependencies: optionsKey tracks options by value
  const config = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...options,
    }),
    [optionsKey],
  );

  useEffect(() => {
    const generation = effectGenerationRef.current;
    const isStale = () => generation !== effectGenerationRef.current;

    const runSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      const locationDetails = await getUserLocationDetails(latitude, longitude, config);
      if (isStale()) {
        return;
      }

      setError(null);
      setLocation({ latitude, longitude, ...locationDetails });
    };

    const runError = async (err: GeolocationPositionError) => {
      if (isStale()) {
        return;
      }

      setError({ code: err.code, message: err.message });

      const fallbackLocation = await getIPLocationFallback(config.ipApi);
      if (isStale()) {
        return;
      }

      if (fallbackLocation) {
        const { latitude, longitude } = fallbackLocation;

        const locationDetails = await getUserLocationDetails(latitude, longitude, config);
        if (isStale()) {
          return;
        }

        setError(null);
        setLocation({ latitude, longitude, ...locationDetails });
      }
    };

    let permission: PermissionStatus | undefined;
    let onPermissionChange: (() => void) | undefined;

    const getPositionWithPermissionCheck = async () => {
      try {
        permission = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });

        if (isStale()) {
          return;
        }

        // Register `change` before the first read so a later transition to `granted`
        // still refetches even if the initial `getCurrentPosition` rejects.
        onPermissionChange = async () => {
          if (permission?.state === "granted" && !isStale()) {
            try {
              const position = await getLocationByBrowserAPI(config.maxRetries);
              if (!isStale()) {
                void runSuccess(position);
              }
            } catch (changeError) {
              if (!isStale()) {
                void runError(changeError as GeolocationPositionError);
              }
            }
          }
        };
        permission.addEventListener("change", onPermissionChange);

        if (permission.state === "denied" && !isStale()) {
          void runError(syntheticGeolocationError(GEO_ERR_PERMISSION_DENIED, "Permission denied"));
          return;
        }

        const position = await getLocationByBrowserAPI(config.maxRetries);
        if (!isStale()) {
          void runSuccess(position);
        }
      } catch (queryError) {
        if (!isStale()) {
          void runError(queryError as GeolocationPositionError);
        }
      }
    };

    if ("geolocation" in navigator) {
      void getPositionWithPermissionCheck();
    } else {
      void runError(syntheticGeolocationError(GEO_ERR_NOT_SUPPORTED, "Geolocation not supported"));
    }

    return () => {
      effectGenerationRef.current += 1;
      if (permission && onPermissionChange) {
        permission.removeEventListener("change", onPermissionChange);
      }
    };
  }, [config]);

  return { location, error };
}
