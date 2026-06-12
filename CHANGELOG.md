# use-user-location

## 1.0.0

Initial public release on npm.

### For consumers

- **Retry actually works**: browser geolocation retries on `POSITION_UNAVAILABLE` (the retry path was previously unreachable because the promise was not awaited).
- **Robust IP fallback**: `ipwho.is` failure responses (`{ success: false }`) are not treated as a valid location; network responses are checked with `response.ok` before parsing. The default no-key path avoids unhandled promise rejections.
- **`error` is cleared on success**: once a location resolves (including via IP fallback or a later permission grant), `error` is reset to `null`, so a non-null `error` means no location is currently available.
- **Consistent `flag`**: the Nominatim fallback path returns a country flag emoji (e.g. US flag) instead of a raw country code, matching the OpenCage path.
- **Cleaner runtime behavior**: removed the no-op `Referer` header and `console` logging; the permission-change listener is removed on unmount and still refetches when permission becomes granted later.
- **Packaging**: `exports` map with ESM (`.js`) / CommonJS (`.cjs`) entries and dual `.d.ts` / `.d.cts` types; `main` points at the CommonJS build; test scaffolding is excluded from published declarations.
- **Types**: exported `UseUserLocationReturn` for TypeScript users.

### Implementation (no breaking API)

- Source is organized under `src/useUserLocation/` (types, constants, reverse geocode, IP fallback, browser geolocation, hook barrel); `import { useUserLocation } from 'use-user-location'` and public exports are unchanged.

### Tooling & CI (contributors)

- **Build**: Vite 8, TypeScript 6, `vite-plugin-dts` v5 with bundled declarations (`bundleTypes` + `@microsoft/api-extractor`), Vitest 4; `vite.config.ts` and `tsconfig` typecheck the config.
- **CI / release**: GitHub Actions use pinned semver tags (`actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `changesets/action`); CI runs lint, typecheck, tests, build, and package checks (`publint`, `@arethetypeswrong/cli`).
- **Docs**: `README` development section and `CLAUDE.md` updated for layout, scripts, and testing.
