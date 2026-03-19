// Fix dates missing century (e.g., "1/1/22" → "1/1/2022")
// WE DONT USE THE YEARS ANYMORE
// function fixyear(datestring) {
//   const parts = datestring.split("/");
//   return parts[0] + "/" + parts[1] + "/20" + parts[2];
// }

// Set up dimensions
const margin = {top: 20, right: 10, bottom: 20, left: 30};
// A LITTLE WIDER
const width = 1200 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

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
    (d) => d.week,
    (d) => d.category
  );

  // Convert nested Map to flat array of objects
  // WE NOW USE WEEKS AND CATEGORIES
  const groupObject = Array.from(groupMap, ([week, catMap]) =>
    Array.from(catMap, ([cat, total]) => ({ week, cat, total }))
  ).flat();

  // Get unique categories and years
  // WE NOW USE WEEKS AND CATEGORIES
  const weeks = new Set(groupObject.map((x) => x.week));
  const cats = new Set(groupObject.map((x) => x.cat));
  // SORT KEYS BY TOTAL VALUE ASCENDING — SMALLEST AT BOTTOM, LARGEST ON TOP
  const catTotals = d3.rollup(groupObject, v => d3.sum(v, d => d.total), d => d.cat);
  const keys = Array.from(cats).sort((a, b) => catTotals.get(a) - catTotals.get(b));

  // Fill in missing category/year combinations with 0 (required for stacking)
  // UPDATING THE DATA TO GET WEEK+CATEGORY
  for (let week of weeks) {
    for (let cat of cats) {
      const exists = groupObject.some(el => el.week === week && el.cat === cat);
      if (!exists) {
        groupObject.push({week, cat, total: 0});
      }
    }
  }

  // TOTAL VIEWS PER WEEK (USED TO COUNT PERCENTAGE IN TOOLTIP)
  const weekTotals = d3.rollup(
    groupObject, // DATA ARRAY week, cat, total
    v => d3.sum(v, d => d.total), // TOTAL BY GROUP
    d => d.week); // GROUPED BY WEEK

  // Create stacked data using d3.stack()
  const series = d3.stack()
    .keys(keys)
    .value(([, D], key) => D.get(key).total)
    // UPDATING TO WEEKS AND CATEGORIES
    (d3.index(groupObject, d => d.week, d => d.cat));

  // X scale for categories
  const x = d3.scaleBand()
  // d3.groupSort WAS USED TO SORT CATEGORIES BY SUM. THE NEW DATA FILE USE WEEKS FOR X SO DATA IS NO LONGER SHOUL BE REPRESENTED IN DESCENDING ORDER BUT IN CHRONOLOGICAL ONE
    // DELETED - .domain(d3.groupSort(groupObject, D => -d3.sum(D, d => d.total), d => d.cat))
    // WEEKS WILL BE A Set — THIS IS A SPECIAL DATA STRUCTURE IN JS THAT STORES UNIQUE VALUES.
    // d3.scaleBand() EXPECTS A REGULAR (Array) IN THE .domain(), NOT A SET. THAT’S WHY Array.from(weeks) CONVERTS THE SET TO ARRAY, AND .sort() SORTS IT ALPHABETICALLY.
    .domain(Array.from(weeks).sort())
    .range([margin.left, width - margin.right])
    .padding(0.3);

  // Y scale for stacked totals
  const y = d3.scaleLinear()
    // WE NEED A FIXED PERCENTAGE BAR
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
    .rangeRound([height - margin.bottom, margin.top]);

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(keys)
    // DELETED - .range(d3.schemeCategory10)
    // COLORS SET
    .range([
      "#4F46E5",
      "#A5B4FC",
      "#F59E0B",
      "#FCD34D"
    ])
    .unknown("#ccc");

  // Draw stacked bars
  svg.append("g")
    .selectAll()
    .data(series)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("path")
    .data(D => D.map(d => (d.key = D.key, d)))
    // NEED TO CLIP FOR BORDERS
    .join("path")
    .attr("d", d => {
      const px = x(d.data[0]);
      const py = y(d[1]);
      const pw = x.bandwidth();
      const ph = y(d[0]) - y(d[1]);
      const r = d.key === keys[keys.length - 1] ? 12 : 0;
      if (r === 0) return `M${px},${py} h${pw} v${ph} h${-pw}z`;
      return `M${px+r},${py} h${pw-2*r} a${r},${r} 0 0 1 ${r},${r} v${ph-r} h${-pw} v${-(ph-r)} a${r},${r} 0 0 1 ${r},${-r}z`;
    })
    // MOUSE IN-OUT
    .on("mouseover", function(event, d) {
      const tooltip = d3.select("#tooltip"); // SELECT WHAT TO SHOW
      const value = d[1] - d[0]; 
      const weekTotal = weekTotals.get(d.data[0]); // WEEK TOTAL PRE_COUNTED IN map
      const pct = ((value / weekTotal) * 100).toFixed(1); // COUNT THE PERCENT OF THE WEEK SEGMENT
      tooltip
      // TOOLTIP INVISIBLE STYLE AND HTML SETUP
        .style("opacity", 1) 
        .html(`<span>${d.key}</span><span>${d3.format(".2s")(value)} views</span><span>${pct}% of week</span>`);
      d3.select(this).style("opacity", 0.75); // HOVERED BOX SHADE
    })
    .on("mousemove", function(event) {
      d3.select("#tooltip")
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select("#tooltip").style("opacity", 0);
      d3.select(this).style("opacity", 1);
    });

  // Draw axes
  svg.append("g")
    // STYLE PULLED FROM CSS
    .attr("class", "axis-x")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    // WE WANT W1 Mar 2025 FORMAT in the X
    // .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(weekStr => {
      const d = new Date(weekStr);
      const weekNum = Math.ceil(d.getDate() / 7);
      return `W${weekNum} ${d.toLocaleString('en', {month: 'short'})} ${d.getFullYear()}`;
    }))
    // SHRINK TEXT CONTAINER FOR AXIS-X
    // .call(g => g.selectAll(".domain").remove());
    .call(g => g.selectAll(".tick text").each(function() {
      const el = d3.select(this);
      const parts = el.text().split(" ");
      el.text("");
      el.append("tspan").attr("x", 0).attr("dy", "0em").text(parts[0]);
      el.append("tspan").attr("x", 0).attr("dy", "1.2em").text(parts.slice(1).join(" "));
    }));

  svg.append("g")
    // STYLE PULLED FROM CSS
    .attr("class", "axis-y")
    .attr("transform", `translate(${margin.left},0)`)
    // .call(d3.axisLeft(y).ticks(null, "s"))
    .call(d3.axisLeft(y).ticks(null, "s").tickSize(-(width - margin.left - margin.right)))
    .call(g => g.selectAll(".domain").remove());

  // Draw legend (core D3)
  // SELECT THE HTML ELEMENT WITH id="legend"
  const legendEl = d3.select("#legend");

  // FOR EACH ITEM IN keys ARRAY ("Films (English)", "TV (English)", etc)
  // CREATE A <div class="legend-row"> INSIDE #legend
  const legendRow = legendEl.selectAll("div")
    .data(keys)
    .join("div")
    .attr("class", "legend-row");

  // INSIDE EACH ROW — APPEND A <span class="legend-dot">
  // background-color IS SET FROM color SCALE: color("Films (English)") → "#F59E0B", etc
  legendRow.append("span")
    .attr("class", "legend-dot")
    .style("background-color", d => color(d));

  // INSIDE EACH ROW — APPEND A <span class="legend-label"> WITH THE CATEGORY NAME AS TEXT
  legendRow.append("span")
    .attr("class", "legend-label")
    .text(d => d);
}