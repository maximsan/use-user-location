/**
 * Detects abort from `fetch(..., { signal })` (or any API that rejects with `AbortError`).
 * Used so aborted work is not treated as a normal failure (e.g. OpenCage → Nominatim fallback).
 */
export function isFetchAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  );
}
