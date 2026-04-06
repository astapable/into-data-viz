async function main() {

    const csv = await d3.csv('./NetflixTV_added.csv')

    function parseGenres(str) {
        if (!str) return []
        return [...str.matchAll(/'([^']+)'/g)].map(m => m[1])
    }

    function stripHtml(html) {
        return html.replace(/<[^>]+>/g, ' ')
    }

    const STOP = new Set([
        'the','and','for','are','but','not','you','all','can','her','was',
        'one','our','out','day','get','has','him','his','how','its','who',
        'did','new','now','old','see','two','way','may','say','man','men',
        'woman','world','life','lives','live','story','show','back','that',
        'this','with','have','from','they','will','been','when','what',
        'into','more','also','just','then','than','some','very','make',
        'take','find','goes','gets','become','becomes','sets','set','even',
        'after','while','through','about','their','there','here','over',
        'must','only','meet','come','find','face','help','lead','try',
        'discover','begins','begin','tries','seek','seeks','leave','left',
        'soon','keep','use','used','made','know','long','away','where'
    ])

    function getWords(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !STOP.has(w))
    }

    const genreSummaries = new Map()
    const genreShows    = new Map()

    csv.forEach(row => {
        const genres  = parseGenres(row.genres)
        const summary = row.summary || ''
        const name    = row.name    || ''
        if (!summary || !name || genres.length === 0) return

        genres.forEach(genre => {
            if (!genreSummaries.has(genre)) {
                genreSummaries.set(genre, [])
                genreShows.set(genre, new Set())
            }
            if (!genreShows.get(genre).has(name)) {
                genreShows.get(genre).add(name)
                genreSummaries.get(genre).push(stripHtml(summary))
            }
        })
    })

    const TOP_N = 5

    const genreData = Array.from(genreSummaries.entries())
        .map(([genre, summaries]) => {
            const words = summaries.flatMap(s => getWords(s))

            const rollup = d3.rollup(words, v => v.length, d => d)

            const top = Array.from(rollup.entries())
                .sort((a, b) => d3.descending(a[1], b[1]))
                .slice(0, TOP_N)

            return { genre, showCount: genreShows.get(genre).size, top }
        })
        .filter(d => d.showCount >= 3)
        .sort((a, b) => d3.descending(a.showCount, b.showCount))

    const allCounts = genreData.flatMap(d => d.top.map(w => w[1]))

    const font_scale = d3.scalePow()
        .exponent(0.6)
        .domain([d3.min(allCounts), d3.max(allCounts)])
        .range([1.0, 4.5])

    const color_scale = d3.scaleOrdinal()
        .domain(genreData.map(d => d.genre))
        .range([
            '#e63946','#f4a261','#2a9d8f','#457b9d','#8338ec',
            '#fb5607','#0aa67c','#118ab2','#c77dff','#ef476f',
            '#3a86ff','#80b918','#ff006e','#8ecae6','#023047',
            '#00b4d8','#d62828'
        ])

    const app = d3.select('#app')

    genreData.forEach(({ genre, showCount, top }) => {

        const card = app.append('section').attr('class', 'genre-card')

        const header = card.append('div').attr('class', 'card-header')

        header.append('h2')
            .attr('class', 'genre-title')
            .style('background-color', color_scale(genre))
            .style('color', '#F2F2F2')
            .text(genre)

        header.append('p')
            .attr('class', 'genre-count')
            .text(`${showCount} shows`)

        const cloud = card.append('ul').attr('class', 'word-cloud')

        const items = cloud.selectAll('li')
            .data(top)
            .join('li')
            .attr('class', 'word-row')

        items.append('div')
            .attr('class', 'word-text')
            .text(d => d[0])
            .style('font-size', d => font_scale(d[1]) + 'rem')
            .style('color', color_scale(genre))

        items.append('div')
            .attr('class', 'word-count')
            .text(d => `×${d[1]}`)
    })
}

main()
