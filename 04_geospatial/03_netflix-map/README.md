# Netflix Titles — Production Countries Map

An interactive choropleth showing where Netflix content is produced, broken down by movies, TV shows, or both.

## What it shows
Countries are filled on a sequential purple-red scale (`d3.interpolatePuRd`) — the darker the country, the more Netflix titles produced there. Hover any country for a list of titles; use the buttons to filter between All / Movies / TV Shows.

## Visual encoding
| Variable | Encoding |
|---|---|
| Title count per country | Fill color (sequential, light → dark) |
| Country with no titles | Light gray |
| Mode (All / Movies / TV) | Filter buttons |

## Setup — TMDB API key
This example fetches production country data live from TMDB. You need a free API token:
1. Create an account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to **Settings → API** and copy your **Bearer token**
3. Replace `YOUR_TMDB_API_TOKEN_HERE` at the top of `app.js`

## How to run
Serve from the `geospatial/` parent directory so relative data paths resolve:
```bash
cd solutions/geospatial
npx serve .
```
Then open `http://localhost:3000/03_netflix-map/`.

Loading ~200 titles takes roughly 5–10 seconds (rate-limited to ~40 req/s).

## Data
- **GeoJSON**: `../countries.geojson` — shared world country boundaries
- **Netflix CSV**: `../../../01_netflix-added/data/` — `NetflixMovies_added.csv` and `NetflixTV_added.csv`
- **Production countries**: TMDB API ([Find by IMDb ID](https://developer.themoviedb.org/reference/find-by-id) → [Movie/TV details](https://developer.themoviedb.org/reference/movie-details))
- **Tiles**: OpenStreetMap

## Technical notes
- Uses ES module top-level `await` (same pattern as `01_continent-map` and `02_population-choropleth`)
- TMDB rate limit: 40 requests/second — a 25 ms delay is added between requests
- Fetches 100 movies + 100 TV shows by default; adjust `maxCount` in `app.js`
