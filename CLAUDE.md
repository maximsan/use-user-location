# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`use-user-location` is a single-package, published npm library exposing one React hook, `useUserLocation`, that resolves the user's geographic coordinates and a human-readable address. Package manager is **pnpm**. Despite the presence of `pnpm-workspace.yaml`, this is **not** a monorepo — the workspace file only allows `esbuild` as a built dependency.

## Commands

```bash
pnpm install            # also runs `husky` via the prepare script

pnpm run typecheck      # tsc --noEmit (includes `vite.config.ts` + `src/**/*`)
pnpm run lint           # biome check .
pnpm run lint:fix       # biome check --write . (format + autofix)
pnpm run test           # vitest run (single pass)
pnpm run test:watch     # vitest (watch mode)
pnpm run build          # vite build → dist/ (es, umd, cjs + .d.ts)
pnpm run ci             # lint → typecheck → test → build (run this before pushing)
```

Run a single test file or test by name:

```bash
pnpm vitest run src/__tests__/useUserLocation.test.ts
pnpm vitest run -t "falls back to IP location"   # match by test name
```

Release (Changesets):

```bash
pnpm run cs:add         # add a changeset describing the change
pnpm run cs:version     # apply changesets → bump version + CHANGELOG
pnpm run cs:publish     # runs ci, then `changeset publish` to npm
```

In practice releases are automated: `.github/workflows/release.yml` runs the Changesets action on push to `main` (opens/updates a version PR, publishes on merge). `.github/workflows/ci.yml` runs the `ci` script on PRs and pushes to `main`.

**Auth:** publishing uses [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) (no `NPM_TOKEN`). The workflow sets `id-token: write` and `pnpm publish` exchanges the OIDC token for a short-lived npm token; this requires a trusted publisher configured on npmjs.com for `maximsan/use-user-location` + `release.yml`, and Node >= 22.14.0 (workflow pins Node 24). `@changesets/cli` 2.31.0 can throw `Cannot read properties of undefined (reading 'includes')` on an **E403** without a `summary` field; a [pnpm patch](patches/@changesets__cli@2.31.0.patch) surfaces the real npm error.

## Commit conventions

Commits **must** follow Conventional Commits — enforced by the `.husky/commit-msg` hook running `commitlint` against `@commitlint/config-conventional`. A non-conforming message will block the commit locally.

## Architecture

Implementation lives under [src/useUserLocation/](src/useUserLocation/): small modules plus the hook entry. [src/index.ts](src/index.ts) re-exports the public API from [src/useUserLocation/index.ts](src/useUserLocation/index.ts).

| File | Role |
|------|------|
| `types.ts` | Public TypeScript interfaces |
| `constants.ts` | `DEFAULT_OPTIONS`, geolocation error codes, browser geo timeouts, Unicode flag math |
| `typeGuards.ts` | Shared `unknown` predicates (`isRecord`, `isString`, `isFiniteNumber`) for parsers and errors |
| `flagEmoji.ts` | ISO alpha-2 → flag emoji |
| `geocodeResponseParsers.ts` | Pure parsers: Nominatim / OpenCage / IP JSON → `LocationDetails` / `Location` |
| `reverseGeocode.ts` | OpenCage + Nominatim fallback |
| `fetchAbortError.ts` | Detect `AbortError` from `fetch` so aborts are not treated as provider failure |
| `ipLocation.ts` | IP-based coordinate fallback |
| `browserGeolocation.ts` | `getCurrentPosition` + `POSITION_UNAVAILABLE` retries |
| `useUserLocation.ts` | React hook, permissions wiring, effect lifecycle |
| `index.ts` | Barrel: `useUserLocation` + type exports |

The hook returns `{ location, error }` and is driven by a **layered fallback cascade**:

1. **Browser geolocation** — `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy`. Retries up to `maxRetries` (default 3) on `POSITION_UNAVAILABLE` (code 2).
2. **Reverse geocoding** — OpenCage when `openCageApiKey` is set; Nominatim/OSM when no key or on OpenCage failure.
3. **IP geolocation fallback** — if the browser API errors, approximate coords from `ipwho.is`, then reverse-geocode.

The hook integrates the **Permissions API**: it queries `navigator.permissions` and subscribes to permission-state changes, re-fetching when the user grants access after an initial denial.

Options use `DEFAULT_OPTIONS` from `constants.ts` and are merged at runtime in the hook.

### Gotchas

- **Options stability**: merged options are memoized from `JSON.stringify(options)` (`optionsKey`), not the options object reference, so passing a fresh inline object each render won't cause refetch loops. There is a deliberate `biome-ignore` for the exhaustive-deps rule documenting this — preserve it if you touch the memo deps.
- **Unmount safety**: effect cleanup bumps a generation counter; async paths check staleness after every `await` before `setState`, so work started under a prior effect run (including after `await`) cannot update state.
- **In-flight HTTP:** each location effect creates an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController); its `signal` is passed to reverse-geocode and IP `fetch` calls, and cleanup calls `abort()` after bumping the generation counter. That tears down redundant network work; generation checks still gate `setState`, because [`getCurrentPosition`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) is not cancelled via `AbortSignal` the same way as `fetch`.
- **Geocoder JSON:** response field mapping is implemented in `geocodeResponseParsers.ts` (not in `fetch` callers). Example API bodies for tests live in [`src/__tests__/fixtures/geocodingResponses.ts`](src/__tests__/fixtures/geocodingResponses.ts) so mocks match parser expectations.
- Default endpoints (`reverseGeocodeApi`, `reverseGeocodeApiFallback`, `ipApi`) are all overridable via options.

## Testing

- **Integration:** [src/__tests__/useUserLocation.test.ts](src/__tests__/useUserLocation.test.ts) — Vitest + jsdom + `@testing-library/react` `renderHook`, full hook cascade.
- **Unit:** [src/__tests__/flagEmoji.test.ts](src/__tests__/flagEmoji.test.ts), [src/__tests__/reverseGeocode.test.ts](src/__tests__/reverseGeocode.test.ts), [src/__tests__/geocodeResponseParsers.test.ts](src/__tests__/geocodeResponseParsers.test.ts), [src/__tests__/fetchAbortError.test.ts](src/__tests__/fetchAbortError.test.ts), [src/__tests__/typeGuards.test.ts](src/__tests__/typeGuards.test.ts) — pure helpers with mocked `fetch` where needed.
- **Shared test helpers:** [src/__tests__/helpers/jsonResponse.ts](src/__tests__/helpers/jsonResponse.ts) builds a fresh `Response` per mock call; [src/__tests__/fixtures/geocodingResponses.ts](src/__tests__/fixtures/geocodingResponses.ts) holds reusable Nominatim / OpenCage / ipwho JSON bodies aligned with the parsers.

Because jsdom omits the browser APIs the hook needs, [src/__tests__/setup.ts](src/__tests__/setup.ts) mocks `navigator.geolocation`, `navigator.permissions`, and global `fetch`. Return a **fresh `Response`** per `fetch` call (bodies are single-use) and branch mocks on the request URL to hit each tier.

## Build output

Vite library mode ([vite.config.ts](vite.config.ts)) emits `es`, `umd`, and `cjs` bundles. Sourcemaps use `sourcemap: "hidden"`: `.map` files are still written to `dist/` for local debugging, but the bundles carry no `//# sourceMappingURL` comment, and the `files` allowlist excludes `dist/**/*.map` so maps are not published. `react` and `react-dom` are externalized (peer deps, `react >=16.8.0`). `vite-plugin-dts` v5 (`bundleTypes` + `@microsoft/api-extractor`) emits bundled `dist/index.d.ts`. `tsconfig.json` is `noEmit` — Vite/Rollup owns the build; `typecheck` still validates `vite.config.ts` (Vitest config merged via `vitest/config`).
