/**
 * Minimal D3 Binning Example - Netflix Views Data
 * Demonstrates the essential code needed to create a histogram
 */

async function main() {
  // Load TSV data
  const data = await d3.tsv('./2026-02-16_country_weekly.tsv');
  
  // Create bins from views data (convert strings to numbers with +)
  const bins = d3.bin()
    .value(d => +d.views_first_91_days)  // Which value to bin
    .thresholds(10)                      // Number of bins
    (data);                              // Pass in the data
  
  // Set up dimensions
  const margin = {top: 20, right: 20, bottom: 40, left: 60};
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  // Create scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.x1)])  // From 0 to max bin edge
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])  // From 0 to max count
    .range([height, 0]);
  
  // Create SVG
  const svg = d3.select('#app')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Draw bars
  svg.selectAll('rect')
    .data(bins)
    .join('rect')
    .attr('x', d => x(d.x0))
    .attr('y', d => y(d.length))
    .attr('width', d => x(d.x1) - x(d.x0) - 1)  // -1 for gap
    .attr('height', d => height - y(d.length))
    .attr('fill', 'steelblue');
  
  // Add x-axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => (d/1e6).toFixed(0) + 'M'));
  
  // Add y-axis
  svg.append('g')
    .call(d3.axisLeft(y));
  
  // Add labels
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 35)
    .attr('text-anchor', 'middle')
    .text('Views (millions)');
  
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .text('Count');
}

main();
