# text frequency

counts every word in *Frankenstein* and renders two visualizations: a bar chart of all word frequencies and a word cloud where font size reflects how often each word appears.

---

## new concepts

| concept | description | reference |
|---|---|---|
| `d3.text()` | loads a plain text file asynchronously | [d3-fetch](https://d3js.org/d3-fetch#text) |
| regex `.replace(/[^A-Za-z]/g, '')` | strips punctuation from each word | [MDN RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) |
| `d3.rollup()` | groups an array and reduces each group to a single value (here: count) | [d3-array rollup](https://d3js.org/d3-array#rollup) |
| `Map` | built-in JS key/value store; returned by `d3.rollup` | [MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) |
| `d3.scaleBand()` | maps categorical data (words) to evenly-spaced positions | [d3 scaleBand](https://d3js.org/d3-scale/band) |
| `d3.scaleLinear()` | maps a numeric range to another (count → font size or bar height) | [d3 scaleLinear](https://d3js.org/d3-scale/linear) |
| `async function` | lets you use `await` inside a named function | [MDN async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) |

---

## run it

No Node install needed — D3 is loaded from a CDN.

Because the page fetches a local file (`frankenstein.txt`), open it with a local server. In VS Code, install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.

Or from the terminal in this folder:
```bash
npx serve .
```
Then open the URL shown (e.g. `http://localhost:3000`).
