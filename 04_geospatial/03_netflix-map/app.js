// Netflix Titles — Production Countries Map
// Maps Netflix movies and TV shows by production country using the TMDB API
// GeoJSON source: https://datahub.io/core/geo-countries
// TMDB API docs: https://developer.themoviedb.org/docs

// ⚠️ Replace with your TMDB Bearer token — https://www.themoviedb.org/settings/api
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTVmNWQyOWUwNWJlNDViNGNmZjU1NDdiMjZkZGNkNCIsIm5iZiI6MTc1OTc4MTg0NS4wNSwic3ViIjoiNjhlNDIzZDU5NzU3NDBhYzVhNjE4MDhjIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.JlNBshvvwbTf_2C7JSA01z0bDODfK1rNPmV43aIiu7A'

// Load shared GeoJSON and Netflix CSV data
const geojson    = await d3.json('../countries.geojson')
const moviesData = await d3.csv('./data/NetflixMovies_added.csv')
const tvData     = await d3.csv('./data/NetflixTV_added.csv')

console.log(`Loaded ${moviesData.length} movies, ${tvData.length} TV shows`)

// Fetch production countries for a single title via TMDB Find + Details endpoints
async function fetchProductionCountries(imdbId) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_TOKEN}`
        }
    }

    try {
        const findData = await fetch(
            `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`,
            options
        ).then(res => res.json())

        const results = findData.movie_results?.length > 0
            ? findData.movie_results
            : findData.tv_results

        if (!results?.length) return null

        const tmdbId    = results[0].id
        const mediaType = findData.movie_results?.length > 0 ? 'movie' : 'tv'

        const details = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${tmdbId}`,
            options
        ).then(res => res.json())

        return details.production_countries ?? []   // [{ iso_3166_1, name }]
    } catch {
        return null
    }
}

// Enrich a batch of titles with production country data
async function fetchTitlesWithCountries(data, maxCount, type) {
    const enriched = []

    for (let i = 0; i < Math.min(maxCount, data.length); i++) {
        const row    = data[i]
        const imdbId = row.tconst || row['externals.imdb']

        document.getElementById('loader-text').textContent =
            `Loading ${type}: ${i + 1} / ${Math.min(maxCount, data.length)}`

        if (!imdbId) continue

        const countries = await fetchProductionCountries(imdbId)

        if (countries?.length) {
            enriched.push({
                title:     row.Title || row.name,
                countries: countries.map(c => c.name)
            })
        }

        // Stay within TMDB rate limits (~40 req/s)
        await new Promise(resolve => setTimeout(resolve, 25))
    }

    return enriched
}

// Fetch up to 100 of each type
const movieTitles = await fetchTitlesWithCountries(moviesData, 100, 'movies')
const tvTitles    = await fetchTitlesWithCountries(tvData,     100, 'TV shows')

console.log(`✅ ${movieTitles.length} movies, ${tvTitles.length} TV shows with country data`)
document.getElementById('loader').classList.add('hidden')

// Group title names by country name
function groupByCountry(titles) {
    const map = new Map()
    titles.forEach(item => {
        item.countries.forEach(country => {
            if (!map.has(country)) map.set(country, [])
            map.get(country).push(item.title)
        })
    })
    return map
}

// Sequential color scale: light → dark purple-red (D3 interpolatePuRd)
const colorScale = d3.scaleSequential()
    .domain([0, 50])
    .interpolator(d3.interpolatePuRd)
    .clamp(true)

// Initialize Leaflet map
const map = L.map('map').setView([20, 0], 2)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
}).addTo(map)

let geoJsonLayer = null

// Render or re-render the GeoJSON layer for the given mode
function renderMap(mode) {
    const titles = mode === 'movies' ? movieTitles
                 : mode === 'tv'     ? tvTitles
                 : [...movieTitles, ...tvTitles]

    const byCountry = groupByCountry(titles)

    if (geoJsonLayer) map.removeLayer(geoJsonLayer)

    geoJsonLayer = L.geoJSON(geojson, {
        style: feature => {
            const list = byCountry.get(feature.properties.ADMIN) ?? []
            return {
                fillColor:   list.length > 0 ? colorScale(list.length) : '#f0f0f0',
                weight:      1,
                color:       '#666',
                fillOpacity: list.length > 0 ? 0.7 : 0.2
            }
        },
        onEachFeature: (feature, layer) => {
            const list = byCountry.get(feature.properties.ADMIN) ?? []
            if (!list.length) return

            const items = list.slice(0, 20).map(t => `<li>${t}</li>`).join('')
            const more  = list.length > 20 ? `<li><em>+${list.length - 20} more</em></li>` : ''

            layer.bindTooltip(`
                <h3>${feature.properties.ADMIN}</h3>
                <div class="count">${list.length} title${list.length !== 1 ? 's' : ''}</div>
                <ul>${items}${more}</ul>
            `, { sticky: true })
        }
    }).addTo(map)
}

// Initial render
renderMap('all')

// Filter button handlers
function setActive(btn, mode) {
    document.querySelectorAll('#controls button').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    renderMap(mode)
}

document.getElementById('btn-all').addEventListener('click',    e => setActive(e.target, 'all'))
document.getElementById('btn-movies').addEventListener('click', e => setActive(e.target, 'movies'))
document.getElementById('btn-tv').addEventListener('click',     e => setActive(e.target, 'tv'))
