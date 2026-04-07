# World Map — Continent Colors

An introductory Leaflet map coloring every country by its continent using a categorical color scale.

## What it shows
Each country is filled with a color corresponding to its continent (Africa, Asia, Europe, North America, South America, Oceania). Click any country for its name and continent.

## Visual encoding
| Variable | Encoding |
|---|---|
| Continent | Fill color (categorical) |

## How to run
Serve from the `01_continent-map/` directory **or** from the parent `geospatial/` directory:
```bash
npx serve .
```
Then open `http://localhost:3000/01_continent-map/`.

## Data
- **GeoJSON**: `../countries.geojson` — shared world country boundaries ([datahub.io](https://datahub.io/core/geo-countries))
- **Tiles**: NASA Blue Marble (GIBS/EOSDIS)

## Notes
France includes French Guiana in this dataset — it renders as European green in South America. This is a known quirk of the source GeoJSON.
