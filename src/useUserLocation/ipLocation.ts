import type { Location } from "./types";

/**
 * Approximate location from IP when browser geolocation fails.
 * Supports ipwho.is (`success` + `latitude`/`longitude`) and generic `{ lat, lon }` payloads.
 */
export async function getIPLocationFallback(ipApi: string): Promise<Location | undefined> {
  try {
    const res = await fetch(ipApi);
    if (!res.ok) {
      return undefined;
    }

    const data = await res.json();

    if (
      data.success === true &&
      Number.isFinite(data.latitude) &&
      Number.isFinite(data.longitude)
    ) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        address: `${data.city}, ${data.region}, ${data.country}`,
      };
    }

    if (Number.isFinite(data.lat) && Number.isFinite(data.lon)) {
      return {
        latitude: data.lat,
        longitude: data.lon,
        address: data.address || `${data.city || ""}, ${data.region || ""}, ${data.country || ""}`,
      };
    }

    return undefined;
  } catch {
    return undefined;
  }
}
