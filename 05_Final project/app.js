const css = prop => getComputedStyle(document.documentElement).getPropertyValue(prop).trim()

const container = document.getElementById('map')
const width = container.clientWidth
const height = container.clientHeight

const sidebar = document.getElementById('sidebar')
const sidebarRight = sidebar.offsetLeft + sidebar.offsetWidth
const centerX = sidebarRight + (width - sidebarRight) / 2

const projection = d3.geoOrthographic()
    .scale(Math.min(width - sidebarRight, height) * 0.42)
    .rotate([0, -20])
    .translate([centerX, height / 2])
    .clipAngle(90)

const path = d3.geoPath().projection(projection)

const svg = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height)

document.getElementById('controls').style.left = centerX + 'px'

const [geojson, breakdown] = await Promise.all([
    fetch('./data/countries.geojson').then(r => r.json()),
    fetch('./data/breakdown.json').then(r => r.json())
])

const REGIONS = {
    'North America':  ['USA','CAN','MEX','GRL','BMU','SPM'],
    'Central America':['GTM','BLZ','HND','SLV','NIC','CRI','PAN','CUB','JAM','HTI','DOM','PRI','TTO','BRB','LCA','VCT','GRD','ATG','DMA','KNA','BHS','ABW','CUW','AIA','CYM','VGB','VIR','TCA','MSR','BLM','MAF','SXM'],
    'South America':  ['COL','VEN','GUY','SUR','BRA','ECU','PER','BOL','PRY','CHL','ARG','URY','FLK'],
    'Europe':         ['ALB','AND','AUT','BEL','BGR','BIH','BLR','CHE','CYP','CZE','DEU','DNK','ESP','EST','FIN','FRA','GBR','GRC','HRV','HUN','IRL','ISL','ITA','LIE','LTU','LUX','LVA','MCO','MDA','MKD','MLT','MNE','NLD','NOR','POL','PRT','ROU','RUS','SMR','SRB','SVK','SVN','SWE','UKR','VAT','ALA','FRO','GGY','IMN','JEY','GIB'],
    'Middle East':    ['ARE','ARM','AZE','BHR','EGY','GEO','IRN','IRQ','ISR','JOR','KWT','LBN','OMN','PSE','QAT','SAU','SYR','TUR','YEM'],
    'Central Asia':   ['KAZ','KGZ','TJK','TKM','UZB'],
    'South Asia':     ['AFG','BGD','BTN','IND','LKA','MDV','NPL','PAK'],
    'East Asia':      ['CHN','HKG','JPN','KOR','MAC','MNG','PRK','TWN'],
    'Southeast Asia': ['BRN','IDN','KHM','LAO','MMR','MYS','PHL','SGP','THA','TLS','VNM'],
    'Africa':         ['AGO','BDI','BEN','BFA','BWA','CAF','CIV','CMR','COD','COG','COM','CPV','DJI','DZA','ERI','ESH','ETH','GAB','GHA','GIN','GMB','GNB','GNQ','KEN','LBR','LBY','LSO','MAR','MDG','MLI','MOZ','MRT','MUS','MWI','NAM','NER','NGA','RWA','SDN','SEN','SHN','SLE','SOM','SSD','STP','SWZ','SYC','TCD','TGO','TUN','TZA','UGA','ZAF','ZMB','ZWE'],
    'Oceania':        ['AUS','NZL','FJI','PNG','SLB','VUT','WSM','TON','KIR','FSM','MHL','PLW','NRU','TUV','COK','NCL','PYF','GUM','MNP','ASM','NFK'],
}
const isoToRegion = {}
for (const [region, isos] of Object.entries(REGIONS))
    for (const iso of isos) isoToRegion[iso] = region

const colors = ['#fbcfe8', '#f9a8d4', '#f472b6', '#db2777', '#831843']
const catColors = ['#f472b6','#fb923c','#facc15','#4ade80','#60a5fa','#c084fc','#f87171','#34d399','#a78bfa']

let selectedCountry = null
let currentData = null
let allCountries = null

svg.append('circle')
    .attr('class', 'sphere')
    .attr('cx', centerX).attr('cy', height / 2)
    .attr('r', projection.scale())

svg.append('path')
    .datum(d3.geoGraticule()())
    .attr('class', 'graticule')
    .attr('d', path)

const countryPaths = svg.append('g')
    .selectAll('path')
    .data(geojson.features)
    .enter().append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', css('--no-data'))

svg.append('circle')
    .attr('class', 'globe-outline')
    .attr('cx', centerX).attr('cy', height / 2)
    .attr('r', projection.scale())

const regionSelect = document.getElementById('region-select')
const countrySelect = document.getElementById('country-select')
const tooltip = d3.select('#tooltip')

countryPaths
    .on('mouseover', (event, d) => {
        const val = currentData?.get(d.properties.ISO_A3)
        tooltip.style('display', 'block').html(
            `<strong>${d.properties.ADMIN}</strong>` +
            (val !== undefined ? `<br>${val.toFixed(1)}% of manufactured exports` : '')
        )
    })
    .on('mousemove', event => {
        tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 36) + 'px')
    })
    .on('mouseout', () => tooltip.style('display', 'none'))
    .on('click', (event, d) => {
        const geo = d.properties.ISO_A3
        const name = d.properties.ADMIN
        const region = isoToRegion[geo] || ''
        if (regionSelect.value !== region) {
            regionSelect.value = region
            buildCountryOptions(region)
            countryPaths.classed('country--dimmed', dd => region ? isoToRegion[dd.properties.ISO_A3] !== region : false)
        }
        countrySelect.value = geo
        selectCountry(geo, name)
    })

svg.select('.sphere').on('click', () => {
    countrySelect.value = ''
    selectCountry('', '')
})

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
    regionSelect.value = ''
    countrySelect.value = ''
    buildCountryOptions('')
    countryPaths.classed('country--dimmed', false)
    selectCountry('', '')
    d3.transition().duration(900).tween('rotate', () => {
        const ri = d3.interpolate(projection.rotate(), [0, -20])
        const si = d3.interpolate(projection.scale(), initScale)
        return t => { projection.rotate(ri(t)).scale(si(t)); updateGlobe() }
    })
})

const YEARS = Array.from({ length: 17 }, (_, i) => String(2023 - i))
const yearSelect = document.getElementById('year-select')
YEARS.forEach(y => {
    const opt = document.createElement('option')
    opt.value = y
    opt.textContent = y
    yearSelect.appendChild(opt)
})
yearSelect.value = YEARS[0]

const REGION_CENTERS = {
    'North America':   [-100,  45, 1.3],
    'Central America': [ -85,  15, 2.5],
    'South America':   [ -60, -15, 1.5],
    'Europe':          [  15,  52, 2.0],
    'Middle East':     [  45,  30, 1.8],
    'Central Asia':    [  60,  45, 1.8],
    'South Asia':      [  75,  25, 1.8],
    'East Asia':       [ 115,  35, 1.6],
    'Southeast Asia':  [ 115,   5, 1.8],
    'Africa':          [  20,   0, 1.4],
    'Oceania':         [ 140, -25, 1.3],
}

function buildCountryOptions(region) {
    const current = countrySelect.value
    countrySelect.innerHTML = '<option value="">All countries</option>'
    const list = region
        ? (allCountries || []).filter(c => isoToRegion[c.iso] === region)
        : (allCountries || [])
    list.forEach(c => {
        const opt = document.createElement('option')
        opt.value = c.iso
        opt.textContent = c.name
        countrySelect.appendChild(opt)
    })
    countrySelect.value = current
}

regionSelect.addEventListener('change', e => {
    const region = e.target.value
    countrySelect.value = ''
    selectCountry('', '')
    buildCountryOptions(region)
    countryPaths.classed('country--dimmed', d => region ? isoToRegion[d.properties.ISO_A3] !== region : false)
    const r0 = projection.rotate()
    const s0 = projection.scale()
    if (region && REGION_CENTERS[region]) {
        const [lon, lat, zoom] = REGION_CENTERS[region]
        d3.transition().duration(900).tween('rotate', () => {
            const ri = d3.interpolate(r0, [-lon, -lat])
            const si = d3.interpolate(s0, initScale * zoom)
            return t => { projection.rotate(ri(t)).scale(si(t)); updateGlobe() }
        })
    } else {
        d3.transition().duration(900).tween('rotate', () => {
            const ri = d3.interpolate(r0, [0, -20])
            const si = d3.interpolate(s0, initScale)
            return t => { projection.rotate(ri(t)).scale(si(t)); updateGlobe() }
        })
    }
})

countrySelect.addEventListener('change', e => {
    const geo = e.target.value
    const name = geojson.features.find(f => f.properties.ISO_A3 === geo)?.properties.ADMIN || ''
    if (geo) {
        const region = isoToRegion[geo] || ''
        if (regionSelect.value !== region) {
            regionSelect.value = region
            buildCountryOptions(region)
            countryPaths.classed('country--dimmed', d => region ? isoToRegion[d.properties.ISO_A3] !== region : false)
        }
    }
    selectCountry(geo, name)
})

function selectCountry(geo, name) {
    selectedCountry = geo ? { geo, name } : null
    countryPaths.classed('country--selected', d => d.properties.ISO_A3 === geo)
    countryPaths.classed('country--faded', d => geo ? d.properties.ISO_A3 !== geo : false)
    const panel = d3.select('#panel')
    if (!geo) {
        panel.html('<div class="pie-wrap"><p id="info-desc">Click a country to see its value.</p></div>')
        return
    }
    const feature = geojson.features.find(f => f.properties.ISO_A3 === geo)
    if (feature) {
        const [lon, lat] = d3.geoCentroid(feature)
        const r0 = projection.rotate()
        const s0 = projection.scale()
        d3.transition().duration(900).tween('rotate', () => {
            const ri = d3.interpolate(r0, [-lon, -lat])
            const si = d3.interpolate(s0, initScale * 2)
            return t => { projection.rotate(ri(t)).scale(si(t)); updateGlobe() }
        })
    }
    renderPanel(geo, name)
}

async function loadYear(year) {
    const raw = await fetch(
        `https://api.worldbank.org/v2/country/all/indicator/TX.VAL.TECH.MF.ZS?date=${year}&format=json&per_page=300`
    ).then(res => res.json())

    currentData = d3.rollup(
        raw[1].filter(r => r.value !== null),
        v => parseFloat(v[0].value),
        d => d.countryiso3code
    )

    const vals = Array.from(currentData.values()).sort((a, b) => a - b)
    const q = [0.2, 0.4, 0.6, 0.8].map(p => d3.quantile(vals, p))
    const domain = [vals[0], ...q]
    const colorScale = d3.scaleLinear().domain(domain).range(colors).clamp(true)

    countryPaths.attr('fill', d => {
        const val = currentData.get(d.properties.ISO_A3)
        return val !== undefined ? colorScale(val) : css('--no-data')
    })

    renderLegend(domain)

    if (!allCountries) {
        allCountries = geojson.features
            .filter(f => isoToRegion[f.properties.ISO_A3])
            .map(f => ({ iso: f.properties.ISO_A3, name: f.properties.ADMIN }))
            .sort((a, b) => a.name.localeCompare(b.name))
        buildCountryOptions(regionSelect.value)
    }

    if (selectedCountry) renderPanel(selectedCountry.geo, selectedCountry.name)
}

function renderLegend(domain) {
    const labels = [
        `< ${domain[1].toFixed(1)}%`,
        `${domain[1].toFixed(1)} – ${domain[2].toFixed(1)}%`,
        `${domain[2].toFixed(1)} – ${domain[3].toFixed(1)}%`,
        `${domain[3].toFixed(1)} – ${domain[4].toFixed(1)}%`,
        `> ${domain[4].toFixed(1)}%`
    ]
    document.getElementById('legend').innerHTML = [...labels].reverse().map((label, i) => `
        <div class="legend-item">
            <span class="legend-swatch" style="background:${colors[labels.length - 1 - i]}"></span>
            <span class="legend-label">${label}</span>
        </div>
    `).join('')
}

function renderPanel(geo, name) {
    const val = currentData?.get(geo)
    const panel = d3.select('#panel')
    panel.html(`<p class="panel-country">${name}</p>`)

    if (val === undefined) {
        panel.append('div').attr('class', 'pie-wrap')
            .append('p').attr('class', 'panel-empty').text('No data available')
        return
    }

    panel.append('p').attr('class', 'panel-empty').text(`${val.toFixed(1)}% of manufactured exports`)

    const yearData = breakdown[geo]?.[yearSelect.value]
    const slices = yearData
        ? Object.entries(yearData).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
        : []

    if (!slices.length) {
        panel.append('div').attr('class', 'pie-wrap')
            .append('p').attr('class', 'panel-empty').text('No data available')
        return
    }

    const total = d3.sum(slices, d => d.value)
    const totalW = panel.node().clientWidth || 280
    const radius = Math.min(totalW * 0.35, 110)
    const labelR = radius * 1.32

    const pie = d3.pie().value(d => d.value).sort(null)
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius)

    const pieData = pie(slices)
    const svgH = labelR * 2 + 24

    const svgEl = panel.append('div').attr('class', 'pie-wrap').append('svg')
        .attr('width', totalW)
        .attr('height', svgH)
        .style('display', 'block')
        .style('margin', '0 auto')

    const g = svgEl.append('g')
        .attr('transform', `translate(${totalW / 2}, ${svgH / 2})`)

    g.selectAll('path')
        .data(pieData)
        .enter().append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => catColors[i])
        .style('stroke', 'var(--surface)')
        .attr('stroke-width', 1.5)

    const labels = pieData
        .map((d, i) => {
            const mid = (d.startAngle + d.endAngle) / 2
            const pct = Math.round(d.value / total * 100)
            const y2 = -Math.cos(mid) * labelR
            return {
                i, pct,
                x1: Math.sin(mid) * (radius + 2),
                y1: -Math.cos(mid) * (radius + 2),
                x2: Math.sin(mid) * labelR,
                y2, y3: y2,
                right: Math.sin(mid) >= 0
            }
        })
        .filter(l => l.pct > 0)

    const x3R = totalW / 2 - 25
    const x3L = -(totalW / 2 - 25)
    const minGap = 11
    for (const side of [true, false]) {
        const group = labels.filter(l => l.right === side).sort((a, b) => a.y3 - b.y3)
        for (let k = 1; k < group.length; k++)
            if (group[k].y3 - group[k - 1].y3 < minGap) group[k].y3 = group[k - 1].y3 + minGap
        for (let k = group.length - 2; k >= 0; k--)
            if (group[k + 1].y3 - group[k].y3 < minGap) group[k].y3 = group[k + 1].y3 - minGap
    }

    labels.forEach(({ i, x1, y1, x2, y2, y3, right, pct }) => {
        const x3 = right ? x3R : x3L
        g.append('polyline')
            .attr('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`)
            .attr('fill', 'none')
            .attr('stroke', catColors[i])
            .attr('stroke-width', 0.9)
            .attr('opacity', 0.8)
        g.append('text')
            .attr('x', x3 + (right ? 3 : -3))
            .attr('y', y3)
            .attr('text-anchor', right ? 'start' : 'end')
            .attr('dominant-baseline', 'middle')
            .style('font-size', 'var(--text-xs)')
            .style('fill', 'var(--text-secondary)')
            .text(`${pct}%`)
    })

    const legend = panel.append('div').attr('class', 'pie-legend')
    slices.forEach((d, i) => {
        const item = legend.append('div').attr('class', 'pie-legend-item')
        item.append('span').attr('class', 'pie-legend-swatch').style('background', catColors[i])
        item.append('span').attr('class', 'pie-legend-label').text(d.label)
    })
}

await loadYear(YEARS[0])
yearSelect.addEventListener('change', e => loadYear(e.target.value))
