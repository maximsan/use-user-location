import { ASCII_UPPERCASE_A, REGIONAL_INDICATOR_BASE_CODEPOINT } from "./constants";

/**
 * ISO 3166-1 alpha-2 (e.g. `"us"`) → flag emoji (`"🇺🇸"`). Returns `undefined` if invalid.
 */
export function codeToFlagEmoji(code?: string): string | undefined {
  if (!code || !/^[a-zA-Z]{2}$/.test(code)) {
    return undefined;
  }
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(
      (char) => REGIONAL_INDICATOR_BASE_CODEPOINT + char.charCodeAt(0) - ASCII_UPPERCASE_A,
    ),
  );
}
