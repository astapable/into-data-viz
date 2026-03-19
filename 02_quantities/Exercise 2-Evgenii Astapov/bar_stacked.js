// Fix dates missing century (e.g., "1/1/22" → "1/1/2022")
// WE DONT USE THE YEARS ANYMORE
// function fixyear(datestring) {
//   const parts = datestring.split("/");
//   return parts[0] + "/" + parts[1] + "/20" + parts[2];
// }

// Set up dimensions
const margin = {top: 20, right: 10, bottom: 20, left: 30};
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load data
// CHANGED DATA FORMAT TO .tsv TO FIX MY DATA TYPE
d3.tsv("2026-02-16_global_alltime.tsv").then(ready);

function ready(datapoints) {
  
  // WE NEED ONLY LATEST INFO< SO !) LATEST WEEK DATA PULLED
  // map() LOOKS THROUGH ALL DATA IN datapoints AND RETURN A NEW WEEKS DATA
  // WE GET Set IN RETURN.
  // ... MEANS WE TAKE OUR Set DATA and CREATE A DATA ARRAY THAT WE COULD ACTUALLY .sort()
  const allWeeks = [...new Set(datapoints.map(d => d.week))].sort();
  // SHOW LAST 10
  const last10 = new Set(allWeeks.slice(-10));
  // SET datapoints AS LAST !)
  datapoints = datapoints.filter(d => last10.has(d.week));

  // Parse dates
  // NEW .tsv FILE HAS THE DATES SO d3 CAN USE IT RIGHT OF THE BOX FOR X. SO PARSING NOT NEEDED. I DONT USE YEARS, ONLY WEEKS
  // const parseTime = d3.timeParse("%m/%d/%Y");
  // datapoints.forEach((d) => d['Scheduled Date'] = fixyear(d['Scheduled Date']));
  // datapoints.forEach((d) => d.date = parseTime(d['Scheduled Date']));
  // datapoints.forEach((d) => d.year = d.date.getFullYear());

  // Group by Class and Year, sum Payment Amounts (nested Map)
  // rollup gives: Map<Class, Map<Year, Total>>
  const groupMap = d3.rollup(
    datapoints,
    // WITH NEW DATA FILE AND NEW GOAL WE NO LONGER NEED TO SUM THE PAYMENT AMOUNT. WE JUST COUNT THE AMOUNT OF LINES
    (v) => d3.sum(v, (d) => +d['weekly_views']),
    // (d) => d.Class,
    // (d) => d.year
    (d) => d.week,
    (d) => d.category
  );

  // Convert nested Map to flat array of objects
  // WE NOW USE WEEKS AND CATEGORIES
  // const groupObject = Array.from(groupMap, ([cat, yearMap]) =>
  //   Array.from(yearMap, ([year, total]) => ({ cat, year, total }))
  // ).flat();
  const groupObject = Array.from(groupMap, ([week, catMap]) =>
    Array.from(catMap, ([cat, total]) => ({ week, cat, total }))
  ).flat();

  // Get unique categories and years
  // WE NOW USE WEEKS AND CATEGORIES
  // const cats = new Set(groupObject.map((x) => x.cat));
  // const years = new Set(groupObject.map((x) => x.year));
  // const keys = Array.from(years).sort(d3.ascending);
  const weeks = new Set(groupObject.map((x) => x.week));
  const cats = new Set(groupObject.map((x) => x.cat));
  // WE DONT NEED ASCENDING/DESCENDING
  const keys = Array.from(cats).sort();

  // Fill in missing category/year combinations with 0 (required for stacking)
  // for (let cat of cats) {
  //   for (let year of years) {
  //     const exists = groupObject.some(el => el.cat === cat && el.year === year);
  //     if (!exists) {
  //       groupObject.push({cat, year, total: 0});
  //     }
  //   }
  // }
  // UPDATING THE DATA TO GET WEEK+CATEGORY
  for (let week of weeks) {
    for (let cat of cats) {
      const exists = groupObject.some(el => el.week === week && el.cat === cat);
      if (!exists) {
        groupObject.push({week, cat, total: 0});
      }
    }
  }

  // НУЖНО ПОДУМАТЬ ТУТ - ПОКА СРЫЛ
  // Normalize to percentages
  // for (let week of weeks) {
  //   const weekTotal = d3.sum(groupObject.filter(d => d.week === week), d => d.total);
  //   groupObject
  //     .filter(d => d.week === week)
  //     .forEach(d => d.total = (d.total / weekTotal) * 100);
  // }

  // Create stacked data using d3.stack()
  const series = d3.stack()
    .keys(keys)
    .value(([, D], key) => D.get(key).total)
    // UPDATING TO WEEKS AND CATEGORIES
    (d3.index(groupObject, d => d.week, d => d.cat));

  // X scale for categories
  const x = d3.scaleBand()
  // d3.groupSort WAS USED TO SORT CATEGORIES BY SUM. THE NEW DATA FILE USE WEEKS FOR X SO DATA IS NO LONGER SHOUL BE REPRESENTED IN DESCENDING ORDER BUT IN CHRONOLOGICAL ONE
    // .domain(d3.groupSort(groupObject, D => -d3.sum(D, d => d.total), d => d.cat))
    // WEEKS WILL BE A Set — THIS IS A SPECIAL DATA STRUCTURE IN JS THAT STORES UNIQUE VALUES.
    // d3.scaleBand() EXPECTS A REGULAR (Array) IN THE .domain(), NOT A SET. THAT’S WHY Array.from(weeks) CONVERTS THE SET TO ARRAY, AND .sort() SORTS IT ALPHABETICALLY.
    .domain(Array.from(weeks).sort())
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // Y scale for stacked totals
  const y = d3.scaleLinear()
    // WE NEED A FIXED PERCENTAGE BAR
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
    // .domain([0, 100])
    .rangeRound([height - margin.bottom, margin.top]);

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeCategory10)
    .unknown("#ccc");

  // Draw stacked bars
  svg.append("g")
    .selectAll()
    .data(series)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(D => D.map(d => (d.key = D.key, d)))
    .join("rect")
    .attr("x", d => x(d.data[0]))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .append("title");

  // Draw axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    // WE WANT W1 Mar 2025 FORMAT in the X
    // .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(weekStr => {
      const d = new Date(weekStr);
      const weekNum = Math.ceil(d.getDate() / 7);
      return `W${weekNum} ${d.toLocaleString('en', {month: 'short'})} ${d.getFullYear()}`;
    }))
    .call(g => g.selectAll(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.selectAll(".domain").remove());

  // Draw legend (core D3)
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 120},${margin.top})`);

  const legendRow = legend.selectAll("g")
    .data(keys)
    .join("g")
    .attr("transform", (_, i) => `translate(0,${i * 18})`);

  legendRow.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", d => color(d));

  legendRow.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .style("font-size", "12px")
    .text(d => d);
}