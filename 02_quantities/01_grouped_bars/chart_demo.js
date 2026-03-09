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
  console.log("Daniel's check", datapoints);
  
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
  const categories = new Set(groupObject.map((x) => x.cat));
  const years = new Set(groupObject.map((x) => x.year));
  const keys = Array.from(years).sort(d3.ascending);
  
  // X scale for categories
  const xScale = d3.scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right - margin.left])
    .padding(0.1);
  
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
  
  // Ensure every category has every year (missing combos get 0)
  for (const cat of categories) {
    for (const year of keys) {
      const exists = groupObject.some((el) => el.cat === cat && el.year === year);
      if (!exists) {
        groupObject.push({cat, year, total: 0});
      }
    }
  }
  
  // X sub-scale for years within each category
  const xSubScale = d3.scaleBand()
    .domain(keys)
    .rangeRound([0, xScale.bandwidth()])
    .padding(0.05);
  
  // Y scale for totals
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(groupObject, d => d.total)])
    .rangeRound([height - margin.bottom, margin.top]);
  
  const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);
  
  // Color scale
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeCategory10)
    .unknown("#ccc");

  // Draw bars
  svg.append("g")
    .selectAll()
    .data(d3.group(groupObject, d => d.cat))
    .join("g")
    .attr("transform", ([cat]) => `translate(${xScale(cat)},0)`)
    .selectAll()
    .data(([, d]) => d)
    .join("rect")
    .attr("x", d => xSubScale(d.year))
    .attr("y", d => yScale(d.total))
    .attr("width", xSubScale.bandwidth())
    .attr("height", d => yScale(0) - yScale(d.total))
    .attr("fill", d => color(d.year));
  
  // Draw axes
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("font-size", 8);
  
  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${margin.left},0)`)
    .call(yAxis);

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
