const map = L.map('map', {
    preferCanvas: true,
    maxZoom: 13,
    minZoom: 2,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0
}).setView([30, 10], 2)

;['.leaflet-control-zoom-in', '.leaflet-control-zoom-out'].forEach(sel => {
    const btn = document.querySelector(sel)
    if (!btn) return
    btn.dataset.tooltip = btn.title
    btn.removeAttribute('title')
})

map.dragging.disable()
map.on('zoomend', () => {
    if (map.getZoom() <= map.getMinZoom()) {
        map.dragging.disable()
    } else {
        map.dragging.enable()
    }
})

const geojson = await fetch('../countries.geojson').then(res => res.json())

L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    { attribution: '', subdomains: 'abcd' }
).addTo(map)

const YEARS = Array.from({ length: 18 }, (_, i) => 2024 - i)
const select = document.getElementById('year-select')
YEARS.forEach(y => {
    const opt = document.createElement('option')
    opt.value = y
    opt.textContent = y
    select.appendChild(opt)
})
select.value = YEARS[0]

const colors = ['#ffb3d9', '#ff66b3', '#ec4899', '#be185d', '#831843']

let geoLayer = null
let selectedLayer = null

async function loadYear(year) {
    const raw = await fetch(
        `https://api.worldbank.org/v2/country/all/indicator/TX.VAL.TECH.MF.ZS?date=${year}&format=json&per_page=300`
    ).then(res => res.json())

    const data = d3.rollup(
        raw[1].filter(r => r.value !== null),
        v => parseFloat(v[0].value),
        d => d.countryiso3code
    )

    const vals = Array.from(data.values()).sort((a, b) => a - b)
    const q = [0.2, 0.4, 0.6, 0.8].map(p => d3.quantile(vals, p))
    const domain = [vals[0], ...q]

    const colorScale = d3.scaleLinear().domain(domain).range(colors)

    if (geoLayer) map.removeLayer(geoLayer)
    selectedLayer = null

    geoLayer = L.geoJSON(geojson, {
        style: feature => {
            const val = data.get(feature.properties.ISO_A3)
            const hasData = val !== undefined
            const fill = hasData ? colorScale(val) : '#444'
            return {
                stroke: true,
                weight: 1,
                color: hasData ? fill : '#555',
                opacity: hasData ? 0.8 : 0.2,
                fillColor: fill,
                fillOpacity: hasData ? 0.5 : 0.1
            }
        },
        onEachFeature: (feature, layer) => {
            const name = feature.properties.ADMIN
            const val = data.get(feature.properties.ISO_A3)
            layer.bindPopup(`<strong>${name}</strong><br>${val !== undefined ? val.toFixed(1) + '% of manufactured exports' : 'No data'}`)
            layer.on('click', () => {
                if (selectedLayer && selectedLayer !== layer) {
                    selectedLayer.setStyle({ fillOpacity: selectedLayer._originalOpacity })
                }
                selectedLayer = layer
                selectedLayer._originalOpacity = layer.options.fillOpacity
                layer.setStyle({ fillOpacity: 1 })
            })
        }
    }).addTo(map)

    renderLegend(domain)
}

function renderLegend(domain) {
    const legend = document.getElementById('legend')
    const labels = [
        `< ${domain[1].toFixed(1)}%`,
        `${domain[1].toFixed(1)} – ${domain[2].toFixed(1)}%`,
        `${domain[2].toFixed(1)} – ${domain[3].toFixed(1)}%`,
        `${domain[3].toFixed(1)} – ${domain[4].toFixed(1)}%`,
        `> ${domain[4].toFixed(1)}%`
    ]
    legend.innerHTML = labels.map((label, i) => `
        <div class="legend-item">
            <span class="legend-swatch" style="background:${colors[i]}"></span>
            <span class="legend-label">${label}</span>
        </div>
    `).join('')
}

map.on('popupclose', () => {
    if (selectedLayer) {
        selectedLayer.setStyle({ fillOpacity: selectedLayer._originalOpacity })
        selectedLayer = null
    }
})

await loadYear(YEARS[0])
select.addEventListener('change', e => loadYear(+e.target.value))

const ResetControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd() {
        const btn = L.DomUtil.create('button', 'leaflet-control-reset')
        btn.dataset.tooltip = 'Reset view'
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="3" fill="#212121"/>
            <circle cx="10" cy="10" r="7" stroke="#212121" stroke-width="1.5" fill="none"/>
            <line x1="10" y1="1" x2="10" y2="4" stroke="#212121" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="10" y1="16" x2="10" y2="19" stroke="#212121" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="1" y1="10" x2="4" y2="10" stroke="#212121" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="16" y1="10" x2="19" y2="10" stroke="#212121" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`
        L.DomEvent.on(btn, 'click', () => map.setView([30, 10], map.getMinZoom()))
        L.DomEvent.disableClickPropagation(btn)
        return btn
    }
})
new ResetControl().addTo(map)
