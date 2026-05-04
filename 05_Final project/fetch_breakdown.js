// Run once: node fetch_breakdown.js
// Downloads WITS trade data for 5 high-tech HS chapters and saves as breakdown.json

const https = require('https')
const fs = require('fs')

const HS = ['30', '84', '85', '88', '90']
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021]

const COUNTRIES = [
    'CHN', 'KOR', 'SGP', 'MYS', 'PHL', 'VNM', 'THA', 'HUN', 'CZE', 'IRL',
    'CHE', 'DEU', 'NLD', 'USA', 'GBR', 'FRA', 'JPN', 'ISR', 'FIN', 'SWE',
    'AUT', 'DNK', 'NOR', 'CAN', 'AUS', 'BEL', 'POL', 'SVK', 'ROU', 'EST',
    'LTU', 'LVA', 'SVN', 'IND', 'MEX', 'BRA', 'ZAF', 'TUR', 'ESP', 'ITA',
    'PRT', 'IDN', 'HKG', 'ARE', 'SAU', 'RUS', 'ARG', 'CHL', 'COL', 'EGY',
]

function getJSON(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, res => {
            let body = ''
            res.on('data', c => body += c)
            res.on('end', () => {
                try { resolve(JSON.parse(body)) }
                catch (e) { reject(new Error('parse error')) }
            })
        })
        req.on('error', reject)
        req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')) })
    })
}

function extractValue(data) {
    const ds = data?.data?.dataSets?.[0]
    if (!ds) return null
    if (ds.observations) {
        const first = Object.values(ds.observations)[0]
        return Array.isArray(first) && first[0] != null ? first[0] : null
    }
    if (ds.series) {
        for (const s of Object.values(ds.series)) {
            const obs = s.observations ? Object.values(s.observations)[0] : null
            if (Array.isArray(obs) && obs[0] != null) return obs[0]
        }
    }
    return null
}

async function fetchOne(iso3, year, hs) {
    const url = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/${iso3}/year/${year}/partner/WLD/product/${hs}/indicator/XPRT-VAL`
    try {
        return extractValue(await getJSON(url))
    } catch {
        return null
    }
}

async function main() {
    const out = {}
    const tasks = []

    for (const year of YEARS)
        for (const iso3 of COUNTRIES)
            for (const hs of HS)
                tasks.push({ iso3, year, hs })

    console.log(`Fetching ${tasks.length} data points (8 concurrent)...`)

    const CONCURRENCY = 8
    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        const batch = tasks.slice(i, i + CONCURRENCY)
        await Promise.all(batch.map(async ({ iso3, year, hs }) => {
            const value = await fetchOne(iso3, year, hs)
            if (value !== null) {
                if (!out[iso3]) out[iso3] = {}
                if (!out[iso3][year]) out[iso3][year] = {}
                out[iso3][year][hs] = Math.round(value)
            }
        }))
        process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, tasks.length)}/${tasks.length}`)
        await new Promise(r => setTimeout(r, 150))
    }

    fs.writeFileSync('./breakdown.json', JSON.stringify(out))
    console.log(`\nDone! ${Object.keys(out).length} countries, saved to breakdown.json`)
}

main().catch(console.error)
