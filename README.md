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

## Usage

```tsx
import { useUserLocation } from 'use-user-location';

function LocationDisplay() {
  const { location, error } = useUserLocation({
    // Optional: OpenCage API key for reverse geocoding
    openCageApiKey: 'your-opencage-api-key',
  });

  if (!location) return <p>Getting location...</p>;
  if (error && !location) return <p>Error: {error.message}</p>;

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

We use [semantic-release](https://github.com/semantic-release/semantic-release) to automate the release process.  Releases are triggered by commits to the `main` branch. The version number is automatically incremented based on the commit messages. A changelog is automatically generated and published to GitHub Releases and npm.

## License

MIT
