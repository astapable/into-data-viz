const container = document.getElementById('map')
const width = container.clientWidth
const height = container.clientHeight

const sidebar = document.getElementById('sidebar')
const sidebarRight = sidebar.offsetLeft + sidebar.offsetWidth
const centerX = sidebarRight + (width - sidebarRight) / 2

const projection = d3.geoOrthographic()
    .scale(Math.min(width - sidebarRight, height) * 0.42)
    .rotate([-15, -52])
    .translate([centerX, height / 2])
    .clipAngle(90)

const path = d3.geoPath().projection(projection)

const svg = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height)

// Load data
const geojson = await fetch('./data/eu_countries.geojson').then(r => r.json())
const tsvRows = await d3.tsv('./data/htec_si_exp4.tsv')
const bRows = await d3.tsv('./data/htec_trd_group4.tsv')

// Build Map: year → Map(ISO-2 → % value)
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

// Parse breakdown: EXP + WORLD only, no totals
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

// Globe layers
svg.append('circle')
    .attr('class', 'sphere')
    .attr('cx', centerX).attr('cy', height / 2)
    .attr('r', projection.scale())

svg.append('path')
    .datum(d3.geoGraticule()())
    .attr('class', 'graticule')
    .attr('d', path)

const colors = ['#fce7f3', '#f9a8d4', '#f472b6', '#ec4899', '#be185d']
let selectedCountry = null

const countryPaths = svg.append('g')
    .selectAll('path')
    .data(geojson.features)
    .enter().append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', '#c8c4bc')

svg.append('circle')
    .attr('class', 'globe-outline')
    .attr('cx', centerX).attr('cy', height / 2)
    .attr('r', projection.scale())

// Tooltip
const tooltip = d3.select('#tooltip')

countryPaths
    .on('mouseover', (event, d) => {
        const val = allYears.get(select.value)?.get(d.properties.CNTR_ID)
        tooltip.style('display', 'block').html(
            `<strong>${d.properties.NAME_ENGL}</strong>` +
            (val !== undefined ? `<br>${val.toFixed(1)}% of total exports` : '')
        )
    })
    .on('mousemove', event => {
        tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 36) + 'px')
    })
    .on('mouseout', () => tooltip.style('display', 'none'))
    .on('click', (event, d) => {
        const geo = d.properties.CNTR_ID
        const name = d.properties.NAME_ENGL
        countrySelect.value = geo
        selectCountry(geo, name)
    })

// Click ocean to deselect
svg.select('.sphere').on('click', () => {
    countrySelect.value = ''
    selectCountry('', '')
})

// Drag to rotate
svg.call(d3.drag()
    .on('drag', event => {
        const [λ, φ] = projection.rotate()
        projection.rotate([λ + event.dx * 0.3, Math.max(-80, Math.min(80, φ - event.dy * 0.3))])
        updateGlobe()
    })
)

function updateGlobe() {
    const r = projection.scale()
    svg.select('.sphere').attr('r', r)
    svg.select('.globe-outline').attr('r', r)
    svg.selectAll('path').attr('d', path)
}

// Zoom controls
const initScale = projection.scale()
document.getElementById('zoom-in').addEventListener('click', () => {
    projection.scale(Math.min(projection.scale() * 1.25, initScale * 4))
    updateGlobe()
})
document.getElementById('zoom-out').addEventListener('click', () => {
    projection.scale(Math.max(projection.scale() * 0.8, initScale * 0.5))
    updateGlobe()
})
document.getElementById('reset').addEventListener('click', () => {
    projection.scale(initScale).rotate([-15, -52])
    updateGlobe()
})

// Year select
const YEARS = yearCols.map(c => c.trim()).reverse()
const select = document.getElementById('year-select')
YEARS.forEach(y => {
    const opt = document.createElement('option')
    opt.value = y
    opt.textContent = y
    select.appendChild(opt)
})
select.value = YEARS[0]

// Country select
const countrySelect = document.getElementById('country-select')
const countryList = geojson.features
    .filter(f => allYears.get(YEARS[0])?.has(f.properties.CNTR_ID))
    .map(f => ({ geo: f.properties.CNTR_ID, name: f.properties.NAME_ENGL }))
    .sort((a, b) => a.name.localeCompare(b.name))

countryList.forEach(c => {
    const opt = document.createElement('option')
    opt.value = c.geo
    opt.textContent = c.name
    countrySelect.appendChild(opt)
})

function selectCountry(geo, name) {
    selectedCountry = geo ? { geo, name } : null
    countryPaths.classed('country--selected', d => d.properties.CNTR_ID === geo)
    if (geo) {
        renderPanel(geo, name, select.value)
    } else {
        renderMapPreview(select.value)
    }
}

function renderMapPreview(year) {
    const data = allYears.get(String(year))
    const vals = Array.from(data.values()).sort((a, b) => a - b)
    const domain = [vals[0], d3.quantile(vals, 0.2), d3.quantile(vals, 0.4), d3.quantile(vals, 0.6), d3.quantile(vals, 0.8)]
    const colorScale = d3.scaleLinear().domain(domain).range(colors).clamp(true)

    const panel = d3.select('#panel')
    panel.html('<p class="panel-hint">Select or click a country</p>')

    const container = panel.append('div').attr('class', 'preview-container')

    const w = 300, h = 300
    // Center ~10°E 50°N (France/Germany) at scale 1.6× — Iceland out, Portugal in
    const miniProj = d3.geoOrthographic()
        .scale(w * 1.6)
        .rotate([-10, -50])
        .translate([w / 2, h / 2])
        .clipAngle(90)
    const miniPath = d3.geoPath().projection(miniProj)

    // Absolutely positioned so it fills the container regardless of flex height resolution
    const miniSvg = container.append('svg')
        .attr('viewBox', `0 0 ${w} ${h}`)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .style('position', 'absolute')
        .style('inset', '0')
        .style('width', '100%')
        .style('height', '100%')
        .style('pointer-events', 'none')

    // Fill entire viewBox with sphere color — no empty gaps when container is taller than map content
    miniSvg.append('rect')
        .attr('width', w).attr('height', h)
        .attr('fill', '#ddd9d0')

    miniSvg.append('path')
        .datum(d3.geoGraticule()())
        .attr('class', 'graticule')
        .attr('d', miniPath)

    miniSvg.selectAll('path.country')
        .data(geojson.features)
        .enter().append('path')
        .attr('class', 'country')
        .attr('d', miniPath)
        .attr('fill', d => {
            const val = data.get(d.properties.CNTR_ID)
            return val !== undefined ? colorScale(val) : '#c8c4bc'
        })
}

countrySelect.addEventListener('change', e => {
    const geo = e.target.value
    const name = countryList.find(c => c.geo === geo)?.name || ''
    selectCountry(geo, name)
})

function loadYear(year) {
    const data = allYears.get(String(year))
    const vals = Array.from(data.values()).sort((a, b) => a - b)
    const q20 = d3.quantile(vals, 0.2)
    const q40 = d3.quantile(vals, 0.4)
    const q60 = d3.quantile(vals, 0.6)
    const q80 = d3.quantile(vals, 0.8)
    const domain = [vals[0], q20, q40, q60, q80]
    const colorScale = d3.scaleLinear().domain(domain).range(colors).clamp(true)

    countryPaths.attr('fill', d => {
        const val = data.get(d.properties.CNTR_ID)
        return val !== undefined ? colorScale(val) : '#c8c4bc'
    })

    renderLegend(domain)
    if (selectedCountry) renderPanel(selectedCountry.geo, selectedCountry.name, year)
    else renderMapPreview(year)
}

function renderLegend(domain) {
    const labels = [
        `< ${domain[1].toFixed(1)}%`,
        `${domain[1].toFixed(1)} – ${domain[2].toFixed(1)}%`,
        `${domain[2].toFixed(1)} – ${domain[3].toFixed(1)}%`,
        `${domain[3].toFixed(1)} – ${domain[4].toFixed(1)}%`,
        `> ${domain[4].toFixed(1)}%`
    ]
    document.getElementById('legend').innerHTML = labels.map((label, i) => `
        <div class="legend-item">
            <span class="legend-swatch" style="background:${colors[i]}"></span>
            <span class="legend-label">${label}</span>
        </div>
    `).join('')
}

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

    const totalW = panel.node().clientWidth || 280
    const margin = { top: 6, right: 10, bottom: 28, left: 112 }
    const innerW = totalW - margin.left - margin.right
    const barH = 16, barGap = 8
    const innerH = bars.length * (barH + barGap) - barGap
    const totalH = innerH + margin.top + margin.bottom

    const x = d3.scaleLinear()
        .domain([0, d3.max(bars, d => d.value)])
        .range([0, innerW])
        .nice()

    const svg = panel.append('svg').attr('width', totalW).attr('height', totalH)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Vertical gridlines
    g.append('g').attr('class', 'panel-grid')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(4).tickSize(-innerH).tickFormat(''))

    // Bars
    g.selectAll('rect').data(bars).enter().append('rect')
        .attr('y', (d, i) => i * (barH + barGap))
        .attr('width', d => x(d.value))
        .attr('height', barH)
        .attr('rx', 3)
        .attr('fill', '#ec4899')

    // Category labels on Y axis
    g.selectAll('text.cat').data(bars).enter().append('text')
        .attr('class', 'cat')
        .attr('x', -8).attr('y', (d, i) => i * (barH + barGap) + barH / 2)
        .attr('dy', '0.35em').attr('text-anchor', 'end')
        .text(d => d.label)
        .attr('fill', '#666').attr('font-size', '11px')

    // X axis ticks with formatted values
    const fmt = d => d >= 1000 ? d3.format(',.0f')(d / 1000) + 'k' : d3.format(',.0f')(d)
    g.append('g').attr('class', 'panel-x-axis')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(4).tickFormat(fmt))

    // Unit label
    g.append('text')
        .attr('x', innerW).attr('y', innerH + 24)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px').attr('fill', '#bbb')
        .text('M€')
}

loadYear(YEARS[0])
select.addEventListener('change', e => loadYear(e.target.value))
