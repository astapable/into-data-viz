# Geospatial Examples

Three progressive Leaflet + D3 examples showing how to build geographic visualizations — from categorical coloring to live API-driven choropleths.

## Examples

| Folder | What it shows | Data source |
|---|---|---|
| `01_continent-map/` | Countries colored by continent (categorical) | GeoJSON only |
| `02_population-choropleth/` | Countries colored by 2023 population (quantile bins) | World Bank API (live) |
| `03_netflix-map/` | Countries colored by Netflix title count (sequential scale) | TMDB API (live) + Netflix CSVs |

## Shared asset
`countries.geojson` — world country boundaries used by all three examples.  
Source: [datahub.io/core/geo-countries](https://datahub.io/core/geo-countries)

## How to run all examples
Serve from this `geospatial/` directory so relative paths work across all examples:
```bash
npx serve .
```

Then navigate to each example:
- `http://localhost:3000/01_continent-map/`
- `http://localhost:3000/02_population-choropleth/`
- `http://localhost:3000/03_netflix-map/`

## Prerequisites
- `03_netflix-map` requires a TMDB API token — see its `README.md`
- `02_population-choropleth` fetches live data from the World Bank API (no key needed)
