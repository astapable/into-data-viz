const map = L.map('map', {
    preferCanvas: true,
    maxZoom: 10,
    minZoom: 3,
    maxBounds: [[34, -25], [72, 45]],
    maxBoundsViscosity: 1.0
}).setView([54, 15], 4)

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

const geojson = await fetch('./data/eu_countries.geojson').then(res => res.json())
const tsvRows = await d3.tsv('./data/htec_si_exp4.tsv')
const bRows = await d3.tsv('./data/htec_trd_group4.tsv')

// Build Map: year string → Map(ISO-2 code → % value)
const firstCol = Object.keys(tsvRows[0])[0]
const yearCols = Object.keys(tsvRows[0]).slice(1)

const allYears = new Map(
    yearCols.map(col => [
        col.trim(),
        new Map(
            tsvRows
                .map(row => [row[firstCol].split(',')[2], parseFloat(row[col])])
                .filter(([, v]) => !isNaN(v))
        )
    ])
)

// Parse breakdown: keep only EXP + WORLD, exclude totals
const bFirstCol = Object.keys(bRows[0])[0]
const bYearCols = Object.keys(bRows[0]).slice(1)

const breakdownData = bRows
    .filter(row => {
        const p = row[bFirstCol].split(',')
        return p[1] === 'EXP' && p[4] === 'WORLD' && p[2] !== 'TOT_HT'
    })
    .map(row => {
        const p = row[bFirstCol].split(',')
        return {
            geo: p[5],
            sitc: p[2],
            values: new Map(bYearCols.map(col => [col.trim(), parseFloat(row[col]) || 0]))
        }
    })

L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    { attribution: '', subdomains: 'abcd' }
).addTo(map)

const YEARS = yearCols.map(c => c.trim()).reverse()
const select = document.getElementById('year-select')
YEARS.forEach(y => {
    const opt = document.createElement('option')
    opt.value = y
    opt.textContent = y
    select.appendChild(opt)
})
select.value = YEARS[0]

const colors = ['#831843', '#be185d', '#ec4899', '#ff66b3', '#ffb3d9']

let geoLayer = null
let selectedLayer = null
let selectedCountry = null

const LABELS = {
    AER: 'Aerospace', ARM: 'Armament', CHE: 'Chemistry',
    COM: 'Computing', ELM: 'Electrical mach.', ELT: 'Electronics',
    NEM: 'Non-elec. mach.', PHA: 'Pharmacy', SCI: 'Scientific instr.'
}

function renderPanel(geo, name, year) {
    const bars = breakdownData
        .filter(r => r.geo === geo)
        .map(r => ({ label: LABELS[r.sitc] || r.sitc, value: r.values.get(String(year)) || 0 }))
        .sort((a, b) => b.value - a.value)

    const panel = d3.select('#panel')
    panel.html(`<p class="panel-country">${name}</p>`)

    if (!bars.length || bars.every(b => b.value === 0)) {
        panel.append('p').attr('class', 'panel-empty').text('No breakdown data available')
        return
    }

    const w = 260, rowH = 24
    const x = d3.scaleLinear().domain([0, d3.max(bars, d => d.value)]).range([0, 130])

    const svg = panel.append('svg').attr('width', w).attr('height', bars.length * rowH)

    const g = svg.selectAll('g').data(bars).enter().append('g')
        .attr('transform', (d, i) => `translate(0, ${i * rowH})`)

    g.append('text').attr('x', 0).attr('y', 15)
        .text(d => d.label)
        .attr('fill', '#a3a3a3').attr('font-size', '11px')

    g.append('rect').attr('x', 112).attr('y', 4).attr('height', 13).attr('rx', 2)
        .attr('width', d => x(d.value))
        .attr('fill', '#ec4899')

    g.append('text').attr('x', d => 116 + x(d.value)).attr('y', 15)
        .text(d => d.value > 0 ? d3.format(',.0f')(d.value) + 'M' : '—')
        .attr('fill', '#fafafa').attr('font-size', '11px')
}

function loadYear(year) {
    const data = allYears.get(String(year))

    const vals = Array.from(data.values()).sort((a, b) => a - b)
    const q20 = d3.quantile(vals, 0.2)
    const q40 = d3.quantile(vals, 0.4)
    const q60 = d3.quantile(vals, 0.6)
    const q80 = d3.quantile(vals, 0.8)
    const domain = [vals[0], q20, q40, q60, q80]

    const colorScale = d3.scaleLinear().domain(domain).range(colors)

    if (geoLayer) map.removeLayer(geoLayer)
    selectedLayer = null

    geoLayer = L.geoJSON(geojson, {
        style: feature => {
            const val = data.get(feature.properties.CNTR_ID)
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
            const name = feature.properties.NAME_ENGL
            const geo = feature.properties.CNTR_ID
            const val = data.get(geo)
            layer.bindPopup(`<strong>${name}</strong><br>${val !== undefined ? val.toFixed(1) + '% of total exports' : 'No data'}`)
            layer.on('click', () => {
                if (selectedLayer && selectedLayer !== layer) {
                    selectedLayer.setStyle({ fillOpacity: selectedLayer._originalOpacity })
                }
                selectedLayer = layer
                selectedLayer._originalOpacity = layer.options.fillOpacity
                layer.setStyle({ fillOpacity: 1 })
                selectedCountry = { geo, name }
                renderPanel(geo, name, select.value)
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

loadYear(YEARS[0])
select.addEventListener('change', e => {
    loadYear(e.target.value)
    if (selectedCountry) renderPanel(selectedCountry.geo, selectedCountry.name, e.target.value)
})

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
        L.DomEvent.on(btn, 'click', () => map.setView([54, 15], 4))
        L.DomEvent.disableClickPropagation(btn)
        return btn
    }
})
new ResetControl().addTo(map)
