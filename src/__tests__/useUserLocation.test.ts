import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUserLocation } from "../useUserLocation";
import {
  ipwhoFailureGeneric,
  ipwhoFailureRateLimit,
  ipwhoLondonSuccess,
  nominatimCustomDisplay,
  nominatimLateStale,
  nominatimLondonEnglandUk,
  nominatimLondonFullAddress,
  nominatimLondonShort,
  nominatimNewYorkNyUsa,
  openCageNewYorkUsa,
} from "./fixtures/geocodingResponses";
import { jsonResponse } from "./helpers/jsonResponse";

// Mock position returned by the browser Geolocation API
const mockPosition = {
  coords: {
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
} as unknown as GeolocationPosition;

type MockPermissionStatus = PermissionStatus & { _change(next: PermissionState): void };

// Mock permission status with a working change-event mechanism
function createMockPermissionStatus(state: PermissionState): MockPermissionStatus {
  let current = state;
  const listeners = new Set<() => void>();
  const status = {
    get state() {
      return current;
    },
    name: "geolocation" as PermissionName,
    onchange: null,
    addEventListener: vi.fn((_type: string, cb: () => void) => {
      listeners.add(cb);
    }),
    removeEventListener: vi.fn((_type: string, cb: () => void) => {
      listeners.delete(cb);
    }),
    dispatchEvent: vi.fn(),
    // test helper: simulate a permission state change
    _change(next: PermissionState) {
      current = next;
      for (const cb of listeners) cb();
    },
  };
  return status as unknown as MockPermissionStatus;
}

beforeEach(() => {
  // jsdom doesn't provide navigator.permissions or navigator.geolocation — define them
  if (!navigator.permissions) {
    Object.defineProperty(navigator, "permissions", {
      value: { query: vi.fn() },
      writable: true,
      configurable: true,
    });
  }
  if (!navigator.geolocation) {
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() },
      writable: true,
      configurable: true,
    });
  }

  // Stub navigator.permissions.query
  vi.spyOn(navigator.permissions, "query").mockResolvedValue(createMockPermissionStatus("granted"));

  // Stub navigator.geolocation.getCurrentPosition
  vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation((success) =>
    success(mockPosition),
  );

  // Stub global fetch — return a new Response each call (body can only be read once)
  vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse(nominatimNewYorkNyUsa));
});

afterEach(() => {
  // Unmount any rendered hooks before restoring mocks so their effect cleanup
  // runs and no leftover async work bleeds into the next test.
  cleanup();
  vi.restoreAllMocks();
});

describe("useUserLocation", () => {
  it("returns null location and null error initially", () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("resolves location from the browser geolocation API", async () => {
    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.location).not.toBeNull();
    });

    expect(result.current.location?.latitude).toBe(40.7128);
    expect(result.current.location?.longitude).toBe(-74.006);
  });

  it("resolves address via reverse geocoding", async () => {
    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.location?.address).toBeDefined();
    });

    expect(result.current.location?.address).toBe("New York, NY, USA");
    expect(result.current.location?.country).toBe("United States");
  });

  it("derives a flag emoji from the country code on the fallback (Nominatim) path", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse(nominatimLondonEnglandUk));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.location?.flag).toBeDefined();
    });

    expect(result.current.location?.flag).toBe("🇬🇧");
  });

  it("uses OpenCage and parses the flag emoji when an API key is provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("opencagedata.com")) {
        return jsonResponse(openCageNewYorkUsa);
      }
      return jsonResponse({});
    });

    const { result } = renderHook(() => useUserLocation({ openCageApiKey: "test-key" }));

    await waitFor(() => {
      expect(result.current.location?.flag).toBeDefined();
    });

    expect(result.current.location?.flag).toBe("🇺🇸");
    expect(result.current.location?.address).toBe("New York, NY, USA");
    const calledUrls = fetchSpy.mock.calls.map((call) => String(call[0]));
    expect(calledUrls.some((url) => url.includes("api.opencagedata.com"))).toBe(true);
  });

  it("retries getCurrentPosition on POSITION_UNAVAILABLE (code 2) until it succeeds", async () => {
    let attempts = 0;
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation((success, errorCb) => {
      attempts += 1;
      if (attempts <= 2) {
        errorCb?.({ code: 2, message: "unavailable" } as GeolocationPositionError);
      } else {
        success(mockPosition);
      }
    });

    const { result } = renderHook(() => useUserLocation({ maxRetries: 3 }));

    // Without retrying, the first code-2 failure would route to the IP fallback
    // and never reach the browser position. Resolving to mockPosition's exact
    // coordinates proves the code-2 retry path ran.
    await waitFor(() => {
      expect(result.current.location?.latitude).toBe(40.7128);
    });
    expect(result.current.location?.longitude).toBe(-74.006);
  });

  it("does not hang on a TIMEOUT (code 3): the error propagates and IP fallback runs", async () => {
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation((_success, errorCb) =>
      errorCb?.({ code: 3, message: "timeout" } as GeolocationPositionError),
    );
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("nominatim")) {
        return jsonResponse(nominatimLondonShort);
      }
      return jsonResponse(ipwhoLondonSuccess);
    });

    const { result } = renderHook(() => useUserLocation());

    // code 3 is not retried, so it surfaces immediately and the IP fallback
    // resolves the location (distinct coordinates from the browser mock).
    await waitFor(() => {
      expect(result.current.location).not.toBeNull();
    });
    expect(result.current.location?.latitude).toBe(51.5074);
  });

  it("falls back to IP geolocation when browser API is denied and clears the error", async () => {
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      createMockPermissionStatus("denied"),
    );

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.includes("nominatim")) {
        return jsonResponse(nominatimLondonFullAddress);
      }
      return jsonResponse(ipwhoLondonSuccess);
    });

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.location).not.toBeNull();
    });

    // error is cleared once the IP fallback recovers a usable location
    expect(result.current.error).toBeNull();
    expect(result.current.location?.latitude).toBe(51.5074);
  });

  it("ignores ipwho.is failure responses (success:false) and keeps the error", async () => {
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      createMockPermissionStatus("denied"),
    );
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse(ipwhoFailureRateLimit));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe("Permission denied");
    expect(result.current.location).toBeNull();
  });

  it("handles a non-ok HTTP response from the IP fallback without crashing", async () => {
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(
      createMockPermissionStatus("denied"),
    );
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse({}, 500));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.location).toBeNull();
  });

  it("refetches when the permission changes to granted", async () => {
    const status = createMockPermissionStatus("prompt");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(status);
    const getPosSpy = vi.spyOn(navigator.geolocation, "getCurrentPosition");

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.location).not.toBeNull();
    });
    const before = getPosSpy.mock.calls.length;

    act(() => {
      status._change("granted");
    });

    await waitFor(() => {
      expect(getPosSpy.mock.calls.length).toBe(before + 1);
    });
  });

  it("aborts the HTTP request signal when the hook unmounts during reverse geocode", async () => {
    let httpRequestInit: RequestInit | undefined;
    let resolveFetch!: (value: Response) => void;
    const fetchPending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      httpRequestInit = init;
      return fetchPending;
    });

    const { unmount } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(httpRequestInit?.signal).toBeDefined();
    });

    expect(httpRequestInit?.signal?.aborted).toBe(false);

    unmount();

    expect(httpRequestInit?.signal?.aborted).toBe(true);

    await act(async () => {
      resolveFetch(await jsonResponse(nominatimLateStale));
    });
  });

  it("does not update state after unmount when reverse geocode resolves late", async () => {
    let resolveFetch!: (value: Response) => void;
    const fetchPending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(() => fetchPending);

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      resolveFetch(await jsonResponse(nominatimLateStale));
    });

    const reactUnmountWarning = consoleError.mock.calls.some((args) =>
      String(args[0]).includes("Can't perform a React state update"),
    );
    expect(reactUnmountWarning).toBe(false);

    consoleError.mockRestore();
  });

  it("does not refetch after unmount when the permission changes", async () => {
    const status = createMockPermissionStatus("granted");
    vi.spyOn(navigator.permissions, "query").mockResolvedValue(status);
    const getPosSpy = vi.spyOn(navigator.geolocation, "getCurrentPosition");

    const { result, unmount } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.location).not.toBeNull();
    });
    const before = getPosSpy.mock.calls.length;

    unmount();
    act(() => {
      status._change("granted");
    });

    expect(getPosSpy.mock.calls.length).toBe(before);
    expect(status.removeEventListener).toHaveBeenCalled();
  });

  it("sets error when geolocation is not supported", async () => {
    // Temporarily remove geolocation — must delete so "geolocation" in navigator === false
    const original = navigator.geolocation;
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    delete (navigator as unknown as Record<string, unknown>).geolocation;

    // IP fallback also fails so the error is not cleared
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse(ipwhoFailureGeneric));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toBe("Geolocation not supported");
    expect(result.current.location).toBeNull();

    // Restore
    if (descriptor) {
      Object.defineProperty(navigator, "geolocation", descriptor);
    } else {
      Object.defineProperty(navigator, "geolocation", {
        value: original,
        writable: true,
        configurable: true,
      });
    }
  });

  it("accepts custom options", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => jsonResponse(nominatimCustomDisplay));

    renderHook(() =>
      useUserLocation({
        ipApi: "https://custom-ip-api.example.com/",
        maxRetries: 1,
      }),
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Should use the fallback geocoder (nominatim) since no OpenCage key provided
    const calledUrls = fetchSpy.mock.calls.map((call) => String(call[0]));
    const nominatimCall = calledUrls.find((url) => url.includes("nominatim.openstreetmap.org"));
    expect(nominatimCall).toBeDefined();
  });
});
