// World Map — High-Technology Exports Choropleth
// Countries colored by high-tech exports as % of manufactured exports (2022)
// Data: World Bank Open Data API — https://data.worldbank.org/indicator/TX.VAL.TECH.MF.ZS
// GeoJSON source: https://datahub.io/core/geo-countries
// Tile source: NASA Blue Marble (GIBS/EOSDIS)

// Initialize map centered at [0, 0] with zoom level 2
const map = L.map('map', {
    preferCanvas: true,
    maxZoom: 13,
    minZoom: 2
}).setView([0, 0], 2)

// Load country boundaries GeoJSON (shared across geospatial examples)
const geojson = await fetch('../countries.geojson').then(res => res.json())

// Fetch 2022 high-technology exports (% of manufactured exports) from World Bank API
const worldBankData = await fetch(
    'https://api.worldbank.org/v2/country/all/indicator/TX.VAL.TECH.MF.ZS?date=2022&format=json&per_page=300'
).then(res => res.json())

// Build country ISO code → value map (exclude null values)
const techExports = d3.rollup(
    worldBankData[1].filter(row => row.value !== null),
    v => parseFloat(v[0].value),
    d => d.countryiso3code
)

// Compute quintile breakpoints for a 5-bin sequential color scale
const values = Array.from(techExports.values()).sort((a, b) => a - b)
const q20 = d3.quantile(values, 0.20)
const q40 = d3.quantile(values, 0.40)
const q60 = d3.quantile(values, 0.60)
const q80 = d3.quantile(values, 0.80)

// NASA Blue Marble tile layer
L.tileLayer(
    'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    { attribution: '', noWrap: true }
).addTo(map)

// Sequential color scale: 5 quintile bins (low → high tech exports %)
const color_scale = d3.scaleLinear()
    .domain([values[0], q20, q40, q60, q80])
    .range(['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'])

// Add GeoJSON layer — fill color driven by high-tech exports %
L.geoJSON(geojson, {
    style: feature => {
        const code = feature.properties.ISO_A3
        const val = techExports.get(code)
        const hasData = val !== undefined
        const fill = hasData ? color_scale(val) : '#ccc'

        return {
            stroke: true,
            weight: 1,
            color: hasData ? fill : '#aaa',
            opacity: hasData ? 0.8 : 0.2,
            fillColor: fill,
            fillOpacity: hasData ? 0.5 : 0.1
        }
    },
    onEachFeature: (feature, layer) => {
        const name = feature.properties.ADMIN
        const code = feature.properties.ISO_A3
        const val = techExports.get(code)
        layer.bindPopup(`<strong>${name}</strong><br>${val !== undefined ? val.toFixed(1) + '% of manufactured exports' : 'No data'}`)
    }
}).addTo(map)
