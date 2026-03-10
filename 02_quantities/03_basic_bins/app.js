/**
 * Basic D3 Binning Example
 * 
 * This script demonstrates:
 * - Loading CSV data with d3.csv()
 * - Computing min/max values with d3.min() and d3.max()
 * - Creating bins (histogram buckets) with d3.bin()
 * - Building a bar chart visualization
 * - Using D3 scales (scaleLinear, scaleBand)
 */

async function main() {
  // Select the main app container from the DOM
  const app = d3.select('#app');

  // ============================================================
  // STEP 1: Load Data
  // ============================================================
  
  // Fetch CSV data (Iris flower dataset)
  // Reference: https://en.wikipedia.org/wiki/Iris_flower_data_set
  const data = await d3.csv('./iris.csv'); // The await keyword is used with D3's asynchronous data loading functions (like d3.json(), d3.csv(), etc.) to pause code execution until the data has been fetched and parsed. This ensures the data is available before you attempt to use it for visualization
  console.log('Loaded iris data:', data);

  // Fetch plain text data (demonstrates loading different data formats)
  const data_text = await d3.text('./helloWorld.txt');
  console.log('Loaded text data:', data_text);

  // ============================================================
  // STEP 2: Compute Statistics
  // ============================================================
  
  // Find the minimum and maximum petal length values
  // Convert string values to numbers using the unary + operator
  const min_value = d3.min(data, (d) => +d.petal_length);
  const max_value = d3.max(data, (d) => +d.petal_length);
  console.log('Petal length range:', min_value, 'to', max_value);

  // Find the index (position) of the entry with the longest petal
  const max_index = d3.maxIndex(data, (d) => +d.petal_length);
  console.log('Index of max petal length:', max_index);

  // Sort data by median petal length (grouped by individual records)
  const sorted_data = d3.groupSort(
    data,
    (g) => d3.median(g, (d) => +d.petal_length),
    (d) => d
  );
  console.log('Sorted data by median petal length:', sorted_data);

  // ============================================================
  // STEP 3: Create Bins (Histogram Buckets)
  // ============================================================
  
  // Create a bin generator to group data into intervals
  // Think of bins as histogram buckets
  const bin = d3
    .bin()
    .domain([0, max_value])           // Set the range to bin over
    .value((d) => +d.petal_length);   // Specify which field to bin (convert to number)

  // Apply the bin generator to our sorted data
  const binned_data = bin(sorted_data);
  console.log('Binned data (histogram buckets):', binned_data);

  // ============================================================
  // STEP 4: Build HTML Summary
  // ============================================================
  
  // Create HTML to display the contents of each bin
  let grouped_html = '';

  binned_data.forEach((bin, groupIndex) => {
    // Convert each entry to a JSON string for display
    let hydrate = bin.map((entry) => JSON.stringify(entry));
    
    // Get bin boundaries (x0 and x1 are added by d3.bin())
    const x0 = bin.x0 !== undefined ? bin.x0.toFixed(1) : '0.0';
    const x1 = bin.x1 !== undefined ? bin.x1.toFixed(1) : '0.0';
    
    grouped_html += `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
        <h2>Bin ${groupIndex}: [${x0} - ${x1}]</h2>
        <p><strong>Count:</strong> ${bin.length} entries</p>
        <details>
          <summary>View data</summary>
          <pre style="font-size: 11px; overflow-x: auto;">${hydrate.join('\n')}</pre>
        </details>
      </div>
    `;
  });

  // Create a div element and populate it with our HTML
  const div = d3.create('div');
  div.html(grouped_html);

  // ============================================================
  // STEP 5: Create SVG Visualization (Bar Chart)
  // ============================================================
  
  // Create an SVG canvas for drawing
  const svg = d3
    .create('svg')
    .attr('viewBox', [0, 0, 600, 300])
    .style('border', '1px solid gray')
    .style('background', '#fafafa');

  // Bind binned data to SVG groups (one group per bin)
  const g = svg.append('g').selectAll('g').data(binned_data).join('g');

  // ============================================================
  // STEP 6: Set Up Scales
  // ============================================================
  
  // Y-scale: maps bin counts to pixel heights
  // Domain: [0, max bin count], Range: [300, 50] (inverted for SVG coordinates)
  const y_scale = d3
    .scaleLinear()
    .domain([0, d3.max(binned_data, (d) => d.length)])
    .range([300, 50]);

  // X-scale: maps bin indices to horizontal positions
  // Uses scaleBand for evenly-spaced categorical positions
  const x_scale = d3
    .scaleBand()
    .domain(binned_data.map((d, i) => i))
    .range([0, 600]);

  // ============================================================
  // STEP 7: Draw Bars
  // ============================================================
  
  // Create rectangles for each bin
  g.append('rect')
    .attr('width', x_scale.bandwidth())                        // Width from band scale
    .attr('height', (d) => y_scale(0) - y_scale(d.length))     // Height based on count
    .attr('x', (d, i) => x_scale(i))                           // Position from band scale
    .attr('y', (d) => y_scale(d.length))                       // Top of bar
    .attr('fill', '#4285f4')                                    // Bar color
    .attr('stroke', '#333')                                     // Border color
    .attr('stroke-width', 1);

  // ============================================================
  // STEP 8: Add Labels
  // ============================================================
  
  // Add text labels showing the count for each bin
  g.append('text')
    .attr('x', (d, i) => x_scale(i) + x_scale.bandwidth() / 2)  // Center horizontally
    .attr('y', (d) => y_scale(d.length) - 10)                   // Position above bar
    .attr('text-anchor', 'middle')                               // Center-align text
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .text((d) => d.length);                                      // Display count

  // ============================================================
  // STEP 9: Append to DOM
  // ============================================================
  
  // Add the SVG visualization to the page
  app.append(() => svg.node());

  // Add the HTML summary below the visualization
  app.append(() => div.node());
}

// Execute the main function when the script loads
main();
