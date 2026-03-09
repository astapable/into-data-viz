/**
 * D3 Binning with Meaningful Color Encoding
 * 
 * This script demonstrates:
 * - Everything from basic binning
 * - Using d3.scaleOrdinal() to map species to colors
 * - Finding dominant species per bin with d3.rollup()
 * - Revealing the key insight: Iris species cluster by petal length
 */

async function main() {
  // Select the main app container from the DOM
  const app = d3.select('#app');

  // ============================================================
  // STEP 1: Load Data
  // ============================================================
  
  // Fetch CSV data (Iris flower dataset)
  const data = await d3.csv('./iris.csv');
  console.log('Loaded iris data:', data);

  // Fetch plain text data (demonstrates loading different data formats)
  const data_text = await d3.text('./helloWorld.txt');
  console.log('Loaded text data:', data_text);

  // ============================================================
  // STEP 2: Compute Statistics
  // ============================================================
  
  // Find the minimum and maximum petal length values
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
    // Convert each entry to a JSON string and join with line breaks
    let hydrate = bin.map((entry) => JSON.stringify(entry)).join('<br/>');
    
    // Get bin boundaries (x0 and x1 are added by d3.bin())
    const x0 = bin.x0 !== undefined ? bin.x0.toFixed(1) : '0.0';
    const x1 = bin.x1 !== undefined ? bin.x1.toFixed(1) : '0.0';
    
    grouped_html += `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
        <h2>Bin ${groupIndex}: [${x0} - ${x1}]</h2>
        <p><strong>Count:</strong> ${bin.length} entries</p>
        <details>
          <summary>View data</summary>
          <div style="font-size: 11px; overflow-x: auto; max-height: 200px; overflow-y: auto;">
            ${hydrate}
          </div>
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

  // Color scale: maps Iris species to colors
  // This reveals the key insight: species can be distinguished by petal length
  const colorScale = d3.scaleOrdinal()
    .domain(['setosa', 'versicolor', 'virginica'])
    .range(['#e41a1c', '#377eb8', '#4daf4a']);  // Red, blue, green

  // Helper function: find most common species in a bin
  const getDominantSpecies = (bin) => {
    if (bin.length === 0) return 'setosa';  // Default for empty bins
    const speciesCounts = d3.rollup(bin, v => v.length, d => d.species);
    const sorted = Array.from(speciesCounts.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];  // Return species with max count
  };

  // ============================================================
  // STEP 7: Draw Bars with Colors (by dominant species)
  // ============================================================
  
  // Create rectangles for each bin, colored by most common species
  g.append('rect')
    .attr('width', x_scale.bandwidth())                        // Width from band scale
    .attr('height', (d) => y_scale(0) - y_scale(d.length))     // Height based on count
    .attr('x', (d, i) => x_scale(i))                           // Position from band scale
    .attr('y', (d) => y_scale(d.length))                       // Top of bar
    .attr('fill', (d) => colorScale(getDominantSpecies(d)))    // Color by species
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

  // ============================================================
  // STEP 10: Add Legend
  // ============================================================
  
  const legend = d3.create('div')
    .style('margin-top', '20px')
    .style('padding', '10px')
    .style('border', '1px solid #ddd');
  
  legend.append('h3').text('Species:');
  
  ['setosa', 'versicolor', 'virginica'].forEach(species => {
    const item = legend.append('div').style('margin', '5px 0');
    item.append('span')
      .style('display', 'inline-block')
      .style('width', '20px')
      .style('height', '20px')
      .style('background-color', colorScale(species))
      .style('margin-right', '10px')
      .style('vertical-align', 'middle');
    item.append('span').text(species);
  });
  
  app.append(() => legend.node());
}

// Execute the main function when the script loads
main();
