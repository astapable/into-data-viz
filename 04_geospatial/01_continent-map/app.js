// World Map — Continent Colors
// Countries colored by continent using Leaflet + D3
// GeoJSON source: https://datahub.io/core/geo-countries
// Tile source: NASA Blue Marble (GIBS/EOSDIS)

// Initialize map centered at [0, 0] with zoom level 2
const map = L.map('map', {
    preferCanvas: true,
    maxZoom: 13,
    minZoom: 2
}).setView([0, 0], 2)

// NASA Blue Marble tile layer
L.tileLayer(
    'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    { attribution: '', noWrap: true }
).addTo(map)

// Load country boundaries GeoJSON (shared across geospatial examples)
const geojson = await d3.json('../countries.geojson')

// Map ISO A3 country codes to continents
function getContinent(iso) {
    const continents = {
        africa: [
            'DZA','AGO','BEN','BWA','BFA','BDI','CMR','CPV','CAF','TCD','COM',
            'COG','COD','CIV','DJI','EGY','GNQ','ERI','ETH','GAB','GMB','GHA',
            'GIN','GNB','KEN','LSO','LBR','LBY','MDG','MWI','MLI','MRT','MUS',
            'MAR','MOZ','NAM','NER','NGA','RWA','STP','SEN','SYC','SLE','SOM',
            'ZAF','SSD','SDN','SWZ','TZA','TGO','TUN','UGA','ZMB','ZWE'
        ],
        asia: [
            'AFG','ARM','AZE','BHR','BGD','BTN','BRN','KHM','CHN','GEO','IND',
            'IDN','IRN','IRQ','ISR','JPN','JOR','KAZ','KWT','KGZ','LAO','LBN',
            'MYS','MDV','MNG','MMR','NPL','PRK','OMN','PAK','PSE','PHL','QAT',
            'SAU','SGP','KOR','LKA','SYR','TWN','TJK','THA','TLS','TUR','TKM',
            'ARE','UZB','VNM','YEM'
        ],
        europe: [
            'ALB','AND','AUT','BLR','BEL','BIH','BGR','HRV','CYP','CZE','DNK',
            'EST','FIN','FRA','DEU','GRC','HUN','ISL','IRL','ITA','XKX','LVA',
            'LIE','LTU','LUX','MKD','MLT','MDA','MCO','MNE','NLD','NOR','POL',
            'PRT','ROU','RUS','SMR','SRB','SVK','SVN','ESP','SWE','CHE','UKR',
            'GBR','VAT'
        ],
        northAmerica: [
            'ATG','BHS','BRB','BLZ','CAN','CRI','CUB','DMA','DOM','SLV','GRD',
            'GTM','HTI','HND','JAM','MEX','NIC','PAN','KNA','LCA','VCT','TTO','USA'
        ],
        southAmerica: [
            'ARG','BOL','BRA','CHL','COL','ECU','GUY','PRY','PER','SUR','URY','VEN'
        ],
        oceania: [
            'AUS','FJI','KIR','MHL','FSM','NRU','NZL','PLW','PNG','WSM','SLB','TON','TUV','VUT'
        ]
    }

    for (const [continent, codes] of Object.entries(continents)) {
        if (codes.includes(iso)) return continent
    }
    return 'other'
}

// One color per continent
const continentColors = {
    africa:       '#e41a1c',
    asia:         '#377eb8',
    europe:       '#4daf4a',
    northAmerica: '#984ea3',
    southAmerica: '#ff7f00',
    oceania:      '#ffff33',
    other:        '#999999'
}

// Add GeoJSON layer — fill and stroke colored by continent
// Note: France includes French Guiana in this dataset, so it renders as European (green) in South America
L.geoJSON(geojson, {
    style: feature => {
        const continent = getContinent(feature.properties.ISO_A3)
        const color = continentColors[continent]
        return { color, opacity: 0.4, fillColor: color, fillOpacity: 0.2 }
    },
    onEachFeature: (feature, layer) => {
        const name = feature.properties.ADMIN
        const continent = getContinent(feature.properties.ISO_A3)
        layer.bindPopup(`<strong>${name}</strong><br>${continent}`)
    }
}).addTo(map)
