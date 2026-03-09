# D3 Quantities and Bar Charts

This directory contains examples demonstrating how to work with quantitative data in D3.js. Examples progress from simple to more complex, covering grouped bar charts, stacked bar charts, and binning (histograms).

## 📚 Core Concepts

### Bar Charts
**Bar charts** are fundamental visualizations for comparing quantities across categories.

- **Grouped (Clustered) Bars**: Multiple bars per category, positioned side-by-side for comparison
- **Stacked Bars**: Multiple values per category, stacked vertically to show part-to-whole relationships
- **Data Stacking**: Using `d3.stack()` to transform data for stacked visualizations

### Binning (Histograms)
**Binning** is the process of grouping continuous numerical data into discrete intervals (buckets). This is fundamental for creating histograms and understanding data distribution.

- **`d3.bin()`**: Creates a bin generator that divides data into intervals
- **Domain**: The range of values to bin (e.g., `[0, 100]`)
- **Thresholds**: The boundaries between bins (can be auto-generated or custom)
- **Value accessor**: Function that extracts the numerical value from each data point

### Scales
**Scales** map data values to visual properties (position, size, color).

- **`d3.scaleLinear()`**: Maps continuous input → continuous output (e.g., data values → pixel positions)
- **`d3.scaleBand()`**: Maps discrete/categorical data → evenly-spaced positions (ideal for bar charts)
- **`d3.scaleOrdinal()`**: Maps discrete input → discrete output (e.g., categories → colors)

### Color Schemes
D3 provides built-in categorical color palettes:

- **`d3.schemeCategory10`**: 10 distinct colors for categorical data
- **`d3.schemeTableau10`**: Alternative 10-color palette
- More schemes available in [d3-scale-chromatic](https://d3js.org/d3-scale-chromatic/categorical)

### Data Operations
- **`d3.min()` / `d3.max()`**: Find minimum/maximum values
- **`d3.extent()`**: Returns [min, max] as array
- **`d3.median()`**: Calculate median value
- **`d3.groupSort()`**: Sort data by grouped aggregate values

---

## 📂 Examples in This Directory

### 01. Grouped Bar Chart
**Directory**: `01_grouped_bars/`  
**File**: `01_grouped_bars/index.html`

Demonstrates how to create grouped (clustered) bar charts for comparing multiple categories side-by-side.

**Key concepts**:
- Grouping data by multiple dimensions
- Nested scales for positioning groups and bars within groups
- Color coding for subcategories
- Loading and parsing CSV data

**Run**: Open `01_grouped_bars/index.html` in a browser

---

### 02. Stacked Bar Chart
**Directory**: `02_stacked_bars/`  
**File**: `02_stacked_bars/index.html`

Shows how to create stacked bar charts for showing part-to-whole relationships.

**Key concepts**:
- Data stacking with `d3.stack()`
- Cumulative positioning
- Legend generation (imported from Observable)
- Date/time parsing and formatting

**Run**: Open `02_stacked_bars/index.html` in a browser

---

### 03. Basic Bins
**Directory**: `03_basic_bins/`  
**File**: `03_basic_bins/index.html`

Introduces the fundamentals of binning with a simple histogram using the Iris dataset.

**Key concepts**:
- Loading CSV data with `d3.csv()`
- Creating bins with `d3.bin()`
- Drawing bars with SVG rectangles
- Using `scaleLinear` and `scaleBand`
- Computing min/max and other statistics

**Run**: Open `03_basic_bins/index.html` in a browser

---

### 04. Bins with Color Scale
**Directory**: `04_bins_with_color/`  
**File**: `04_bins_with_color/index.html`

Builds on basic binning by adding categorical colors to each bin.

**Key concepts**:
- Everything from Example 03
- Using `d3.scaleOrdinal()` for color mapping
- Applying `d3.schemeCategory10` color palette
- Enhanced visual styling

**Run**: Open `04_bins_with_color/index.html` in a browser

---

## 🔗 Essential References

### D3.js Documentation
- **D3 API Reference**: [https://d3js.org/api](https://d3js.org/api)
- **D3 Arrays (Statistics)**: [https://d3js.org/d3-array](https://d3js.org/d3-array)
- **D3 Scales**: [https://d3js.org/d3-scale](https://d3js.org/d3-scale)
- **D3 Color Schemes**: [https://d3js.org/d3-scale-chromatic](https://d3js.org/d3-scale-chromatic)
- **D3 Shapes (Stack)**: [https://d3js.org/d3-shape/stack](https://d3js.org/d3-shape/stack)

### JavaScript Fundamentals
- **MDN JavaScript Guide**: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- **Async/Await**: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- **Arrow Functions**: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- **Array Methods**: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

### SVG Basics
- **MDN SVG Tutorial**: [https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- **SVG Coordinate System**: [https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions)

### Observable Examples
- **D3 Gallery**: [https://observablehq.com/@d3/gallery](https://observablehq.com/@d3/gallery)
- **Learn D3**: [https://observablehq.com/collection/@d3/learn-d3](https://observablehq.com/collection/@d3/learn-d3)

---

## � Datasets

### Grouped & Stacked Examples (01, 02)
These examples use **sample grant data** demonstrating funding allocation across different categories and time periods.

### Binning Examples (03, 04)
These examples use the **Iris flower dataset**, a classic dataset in statistics and machine learning:
- **Source**: [Iris flower data set (Wikipedia)](https://en.wikipedia.org/wiki/Iris_flower_data_set)
- **Fields**: sepal_length, sepal_width, petal_length, petal_width, species
- **Records**: 150 iris flowers (50 each of 3 species)

