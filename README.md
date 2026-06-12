# useUserLocation

A React hook for getting the user's location with address lookup and fallbacks.

## Features

- 📍 Get user's geolocation using the browser's Geolocation API
- 🔄 Automatic fallback to IP-based geolocation if browser geolocation fails
- 🏙️ Reverse geocoding to get address details from coordinates
- 🌐 Multiple geocoding service options with fallbacks
- 🚩 Country flag emoji support
- ⚙️ Fully configurable API endpoints and options

## Installation

```bash
npm install use-user-location
# or
yarn add use-user-location
# or
pnpm add use-user-location
```

## Development

- **Node.js** 18+ (`engines` in [`package.json`](package.json))
- **pnpm** — version pinned via [`packageManager`](package.json) (use `corepack enable` then `pnpm install`)

| Script | Description |
|--------|-------------|
| `pnpm install` | Install dependencies (runs `prepare` / Husky) |
| `pnpm run lint` | Biome check |
| `pnpm run lint:fix` | Biome format + autofix |
| `pnpm run typecheck` | `tsc --noEmit` (includes `vite.config.ts` and `src`) |
| `pnpm run test` | Vitest, single run |
| `pnpm run test:watch` | Vitest watch |
| `pnpm run build` | Vite library build + `scripts/postbuild.mjs` |
| `pnpm run ci` | lint → typecheck → test → build (matches [CI workflow](.github/workflows/ci.yml)) |

Maintainer-oriented details (fallback cascade, test mocks, `optionsKey` gotcha): [CLAUDE.md](CLAUDE.md).

## Usage

```tsx
import { useUserLocation } from 'use-user-location';

function LocationDisplay() {
  const { location, error } = useUserLocation({
    // Optional: OpenCage API key for reverse geocoding
    openCageApiKey: 'your-opencage-api-key',
  });

  if (error) return <p>Error: {error.message}</p>;
  if (!location) return <p>Getting location...</p>;

  return (
    <div>
      <p>Latitude: {location.latitude}</p>
      <p>Longitude: {location.longitude}</p>
      <p>Address: {location.address || 'Resolving...'}</p>
      {location.country && <p>Country: {location.country}</p>}
      {location.city && <p>City: {location.city}</p>}
      {location.flag && <p>Flag: {location.flag}</p>}
    </div>
  );
}
```

## Configuration Options

The hook accepts an optional configuration object:

```tsx
const { location, error } = useUserLocation({
  // OpenCage Data API key for reverse geocoding
  openCageApiKey: 'your-api-key',
  
  // URL for OpenCage Data reverse geocoding API
  // Default: "https://api.opencagedata.com/geocode/v1/json"
  reverseGeocodeApi: 'https://api.opencagedata.com/geocode/v1/json',
  
  // URL for fallback reverse geocoding API
  // Default: "https://nominatim.openstreetmap.org/reverse"
  reverseGeocodeApiFallback: 'https://nominatim.openstreetmap.org/reverse',
  
  // URL for IP-based geolocation API
  // Default: "https://ipwho.is/"
  ipApi: 'https://ipwho.is/',
  
  // Maximum number of retries for browser geolocation API
  // Default: 3
  maxRetries: 3
});
```

## Return Value

The hook returns an object with the following properties:

```tsx
{
  // Location object with coordinates and address details
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    continent?: string;
    country?: string;
    city?: string;
    state?: string;
    country_code?: string;
    state_code?: string;
    flag?: string;
  } | null,
  
  // Error object if geolocation fails
  error: {
    code: number;
    message: string;
  } | null
}
```

> **Note on `error`:** it reflects the most recent geolocation failure. If the
> browser Geolocation API fails (e.g. permission denied) but the IP-based
> fallback then recovers a location, `error` is cleared and `location` is
> populated. A non-null `error` therefore means no location is currently
> available — check `error` before rendering a loading state.
>
> The `flag` field is a country flag emoji (e.g. 🇺🇸) for both the OpenCage and Nominatim (fallback) providers.

## API Keys

For reverse geocoding (converting coordinates to addresses), you can use:

1. **OpenCage Data API** (recommended): Provides detailed address information including country flags.
   - Get a free API key at [opencagedata.com](https://opencagedata.com/)
   - Free tier: 2,500 requests per day

2. **Nominatim** (fallback): Used automatically if OpenCage API key is not provided or if OpenCage request fails.
   - No API key required
   - Please respect [Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/)

## Contributing

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This helps us automate the release process and generate changelogs.

### Commit Message Format

```
type(scope): description
```

-   **type**: The type of commit, such as `feat`, `fix`, `docs`, `chore`, etc.
-   **scope**: The scope of the commit, such as `useUserLocation`, `README`, etc.
-   **description**: A brief description of the commit.

Example:

```
feat(useUserLocation): add country flag emoji support
```

### Release Process

We use [Changesets](https://github.com/changesets/changesets) to automate the release process. When you add a new feature or fix, run `pnpm changeset add` to create a changeset describing the change. When changes are pushed to `main`, a GitHub Action creates a "Version Packages" PR. Merging that PR bumps the version, updates the changelog, and publishes to npm.

## License

MIT
