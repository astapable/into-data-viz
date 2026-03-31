# sentiment analysis

**NLP** (Natural Language Processing) is how computers analyze human language. Instead of treating text as raw characters, NLP libraries parse meaning — identifying parts of speech, entities, or in this case, emotional tone. Sentiment analysis is one of the simplest NLP tasks: it scores text on a positive/negative scale by matching words against a pre-built emotional dictionary.

This example feeds every sentence of *Frankenstein* through the `wink-sentiment` library and visualizes the results — font size reflects intensity, color reflects positive (green) or negative (red) sentiment.

---

## Concepts

| concept | description | reference |
|---|---|---|
| `npm` + `package.json` | Node package manager; tracks dependencies | [docs.npmjs.com](https://docs.npmjs.com/about-npm) |
| `import` (ES modules) | loads a JS library as a module | [MDN import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) |
| `wink-sentiment` | NLP library that scores text positive/negative | [winkjs.org](https://winkjs.org/wink-nlp/getting-started.html) |
| Vite | local dev server that handles ES module imports | [vitejs.dev](https://vitejs.dev/guide/) |
| `d3.scaleLinear` with 3-point domain | diverging color scale (negative → neutral → positive) | [d3 scales](https://d3js.org/d3-scale/linear) |

---

## run it

**Step 1 — install dependencies** (one time only):
```bash
npm install
```

**Step 2 — start the dev server:**
```bash
npm run dev
```

**Step 3 — open the URL** shown in the terminal (e.g. `http://localhost:5173`)

---

## install Node.js first?

Download the **LTS** installer from [nodejs.org](https://nodejs.org) — works on Mac and PC. Run it, click through the defaults, and you're done.

Verify in your terminal:
```bash
node -v
```
