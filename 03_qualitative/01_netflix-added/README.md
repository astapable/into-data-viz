# Netflix Extended Dataset

This example loads a CSV of Netflix titles, filters to a single genre (Anime), sorts by release date, and renders each title as a card — genre label, title, date, and summary — using D3's data join to build the DOM dynamically.

---

## Concepts

| concept | description | reference |
|---|---|---|
| `d3.csv()` | loads a CSV file asynchronously and parses each row into an object | [d3-fetch](https://d3js.org/d3-fetch#csv) |
| `.then()` | runs a callback once the async data load resolves | [MDN Promise.then](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) |
| `.filter()` | returns a new array containing only elements that pass a test | [MDN Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) |
| `.sort()` | sorts an array in place using a comparator function | [MDN Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) |
| `.selectAll()` / `.data()` / `.join()` | D3's core data join — binds an array to DOM elements and creates, updates, or removes them to match | [d3-selection join](https://d3js.org/d3-selection/joining) |
| `.append()` | adds a new child element to each selected element | [d3-selection append](https://d3js.org/d3-selection/modifying#selection_append) |
| `.attr()` | sets an HTML attribute (e.g. `class`) on selected elements | [d3-selection attr](https://d3js.org/d3-selection/modifying#selection_attr) |
| `.text()` | sets the text content of selected elements | [d3-selection text](https://d3js.org/d3-selection/modifying#selection_text) |
| `.html()` | sets the inner HTML of selected elements — use when data contains markup tags | [d3-selection html](https://d3js.org/d3-selection/modifying#selection_html) |
