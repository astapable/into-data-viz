// Fix dates missing century (e.g., "1/1/22" → "1/1/2022")
function fixyear(datestring) {
  const parts = datestring.split("/");
  return parts[0] + "/" + parts[1] + "/20" + parts[2];
}

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
d3.csv("sample_data.csv").then(ready);

function ready(datapoints) {

  // Parse dates
  const parseTime = d3.timeParse("%m/%d/%Y");
  datapoints.forEach((d) => d['Scheduled Date'] = fixyear(d['Scheduled Date']));
  datapoints.forEach((d) => d.date = parseTime(d['Scheduled Date']));
  datapoints.forEach((d) => d.year = d.date.getFullYear());

  // Group by Class and Year, sum Payment Amounts (nested Map)
  // rollup gives: Map<Class, Map<Year, Total>>
  const groupMap = d3.rollup(
    datapoints,
    (v) => d3.sum(v, (d) => +d['Payment Amount']),
    (d) => d.Class,
    (d) => d.year
  );

  // Convert nested Map to flat array of objects
  const groupObject = Array.from(groupMap, ([cat, yearMap]) =>
    Array.from(yearMap, ([year, total]) => ({ cat, year, total }))
  ).flat();

  // Get unique categories and years
  const cats = new Set(groupObject.map((x) => x.cat));
  const years = new Set(groupObject.map((x) => x.year));
  const keys = Array.from(years).sort(d3.ascending);

  // Fill in missing category/year combinations with 0 (required for stacking)
  for (let cat of cats) {
    for (let year of years) {
      const exists = groupObject.some(el => el.cat === cat && el.year === year);
      if (!exists) {
        groupObject.push({cat, year, total: 0});
      }
    }
  }

  // Create stacked data using d3.stack()
  const series = d3.stack()
    .keys(keys)
    .value(([, D], key) => D.get(key).total)
    (d3.index(groupObject, d => d.cat, d => d.year));

  // X scale for categories
  const x = d3.scaleBand()
    .domain(d3.groupSort(groupObject, D => -d3.sum(D, d => d.total), d => d.cat))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // Y scale for stacked totals
  const y = d3.scaleLinear()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
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
    .call(d3.axisBottom(x).tickSizeOuter(0))
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





