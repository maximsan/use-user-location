import { parseIpLocationPayload } from "./geocodeResponseParsers";
import type { Location } from "./types";

/**
 * Approximate location from IP when browser geolocation fails.
 * Supports ipwho.is (`success` + `latitude`/`longitude`) and generic `{ lat, lon }` payloads.
 */
export async function getIPLocationFallback(
  ipApi: string,
  abortSignal?: AbortSignal,
): Promise<Location | undefined> {
  try {
    const res = await fetch(ipApi, abortSignal ? { signal: abortSignal } : undefined);
    if (!res.ok) {
      return undefined;
    }

    const data = await res.json();
    return parseIpLocationPayload(data);
  } catch {
    return undefined;
  }
}
