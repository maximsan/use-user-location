/** `typeof value === "object"` and not `null`. Arrays satisfy this predicate. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** A finite real number (excludes `NaN`, `Infinity`; rejects non-numbers). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
