# World Map — Population Choropleth

A choropleth map coloring countries by 2023 population using quintile bins fetched live from the World Bank API.

## What it shows
Countries are filled on a sequential color scale (green → yellow → orange → plum → purple) split at the 20th, 40th, 60th, and 80th population percentiles. Click any country for its name and exact population.

## Visual encoding
| Variable | Encoding |
|---|---|
| Population (2023) | Fill color (sequential 5-bin scale) |
| No data | Light gray |

## Key technique — `d3.quantile`
Rather than a linear scale, the domain is divided into **quintile bins** so each color represents roughly the same number of countries, avoiding the visual dominance of outliers like China and India.

## How to run
Serve from the `02_population-choropleth/` directory:
```bash
npx serve .
```

Requires a live internet connection to fetch World Bank API data.

## Data
- **GeoJSON**: `../countries.geojson` — shared world country boundaries
- **Population**: World Bank Open Data API (`SP.POP.TOTL`, 2023) — fetched at runtime
- **Tiles**: NASA Blue Marble (GIBS/EOSDIS)
