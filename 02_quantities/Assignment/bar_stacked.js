// REMOVED THE DATES
// function fixyear(datestring) {
//   const parts = datestring.split("/");
//   return parts[0] + "/" + parts[1] + "/20" + parts[2];
// }

// Set up dimensions
const margin = {top: 20, right: 10, bottom: 240, left: 60}; // INCREASED THE BTM MARGIN
const width = 900 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom; // INCREASED THE HEIGHT

// Create SVG
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load data
d3.tsv("2026-02-16_country_weekly.tsv").then(ready); // CONNECTED TO MY DATA FILE

function ready(datapoints) {

  // EACH ROW IS ONE TITLE WITH 3 METRICS
  const metrics = ["hours_viewed_first_91_days", "views_first_91_days", "runtime"];
  const metricLabels = {
    "hours_viewed_first_91_days": "Hours Viewed",
    "views_first_91_days": "Number of Views",
    "runtime": "Runtime (scaled)"
  };
  const metricColors = {
    "hours_viewed_first_91_days": "#4472C4",
    "views_first_91_days": "#ED7D31",
    "runtime": "#70AD47"
  };

  // PARSE NUMERIC FIELDS AND SCALE RUNTIME TO SAME ORDER AS HOURS/VIEWS
  datapoints.forEach(d => {
    d.hours_viewed_first_91_days = +d.hours_viewed_first_91_days;
    d.views_first_91_days = +d.views_first_91_days;
    d.runtime = +d.runtime * 1e8;
  });

  // Build stacked data: one group per title, stacked by metric
  const keys = metrics;

  // X scale for show titles (use show_title + season_title as label)
  const titleLabel = d => d.season_title && d.season_title !== "N/A"
    ? d.show_title + " " + d.season_title
    : d.show_title;

  // Sort by total descending (matching original style)
  datapoints.sort((a, b) =>
    (b.hours_viewed_first_91_days + b.views_first_91_days + b.runtime) -
    (a.hours_viewed_first_91_days + a.views_first_91_days + a.runtime)
  );

  const series = d3.stack()
    .keys(keys)
    .value((d, key) => d[key])
    (datapoints);

  // X scale
  const x = d3.scaleBand()
    .domain(datapoints.map(titleLabel))
    .range([0, width])
    .padding(0.1);

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
    .rangeRound([height, 0]);

  // Color scale
  const color = d => metricColors[d];

  // Draw stacked bars
  svg.append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(titleLabel(d.data)))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .append("title")
    .text(d => titleLabel(d.data));

  // Draw axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(g => g.selectAll(".domain").remove())
    .selectAll("text")
    .attr("transform", "translate(-13,10)rotate(-90)")
    .style("text-anchor", "end")
    .style("font-size", "8px");

  svg.append("g")
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.selectAll(".domain").remove());

  // Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#555")
    .text("Stacked metrics (hours views, number of biews, runtime)");

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
    .attr("fill", d => metricColors[d]);

  legendRow.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .style("font-size", "11px")
    .text(d => metricLabels[d]);
}