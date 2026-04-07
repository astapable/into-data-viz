// World Map — Population Choropleth
// Countries colored by 2023 population using quintile bins (d3.quantile)
// Population data: World Bank Open Data API — https://data.worldbank.org/indicator/SP.POP.TOTL
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

// Fetch 2023 population data from World Bank API
const worldBankData = await fetch(
    'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?date=2023&format=json&per_page=300'
).then(res => res.json())

// Build country ISO code → population map (exclude null values)
const population = d3.rollup(
    worldBankData[1].filter(row => row.value !== null),
    v => parseFloat(v[0].value),
    d => d.countryiso3code
)

// Compute quintile breakpoints for a 5-bin sequential color scale
const popValues = Array.from(population.values()).sort((a, b) => a - b)
const q20 = d3.quantile(popValues, 0.20)
const q40 = d3.quantile(popValues, 0.40)
const q60 = d3.quantile(popValues, 0.60)
const q80 = d3.quantile(popValues, 0.80)

// NASA Blue Marble tile layer
L.tileLayer(
    'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    { attribution: '', noWrap: true }
).addTo(map)

// Sequential color scale: 5 quintile bins (low → high population)
const color_scale = d3.scaleLinear()
    .domain([popValues[0], q20, q40, q60, q80])
    .range(['green', 'lightyellow', 'orange', 'plum', 'purple'])

// Add GeoJSON layer — fill color driven by 2023 population
L.geoJSON(geojson, {
    style: feature => {
        const code = feature.properties.ISO_A3
        const pop = population.get(code)
        const hasData = pop !== undefined
        const fill = hasData ? color_scale(pop) : '#ccc'

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
        const pop = population.get(code)
        layer.bindPopup(`<strong>${name}</strong><br>${pop?.toLocaleString() ?? 'No data'}`)
    }
}).addTo(map)
