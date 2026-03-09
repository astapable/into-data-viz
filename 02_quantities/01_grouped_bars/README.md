# Grouped Bars: Key JavaScript + D3 Concepts

This chart (`chart_demo.js`) groups payment totals by:
- category (`Class`)
- year (`2022`, `2023`, `2024`, `2025`)

## Why `d3.rollup` here

`d3.rollup` is often easier to teach for grouped bars because it makes the grouping structure explicit.

- `d3.rollup(...)` returns a **nested `Map`**.
  - Shape here: `Map<Class, Map<Year, Total>>`

In this file we use `rollup`, then flatten it with `.map()`/`Array.from()` so it is easy to draw bars.

D3 references:
- `rollup`: https://d3js.org/d3-array/group#rollup

## `.map()`

`.map()` transforms each element into a new element and returns a new array.

In this chart, it is used to convert grouped entries into objects like:
- `{ cat, year, total }`

MDN:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map

## `Set`

`Set` stores only unique values.

In this chart:
- `new Set(groupObject.map(x => x.cat))` gets unique categories.

MDN:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

## `.some()`

`.some()` checks whether **at least one** element matches a condition.

In this chart:
- it checks whether a `(category, year)` pair already exists.

MDN:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some

## `.push()`

`.push()` adds a new element to the end of an array.

In this chart:
- if a `(category, year)` combination is missing, we add
  `{ cat, year, total: 0 }`
- this ensures each category has all year slots, so grouped bars line up consistently.

MDN:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push

## `d3.scaleLinear`

`scaleLinear` maps numeric data values to pixel positions.

In this chart:
- domain: `[0, max total]`
- range: `[chart bottom, chart top]`

Because SVG y-values increase downward, the range is inverted so larger totals appear higher.

D3 reference:
- https://d3js.org/d3-scale/linear#scaleLinear

## Quick flow in this file

1. Parse dates and extract `year`
2. Aggregate totals with `d3.rollup`
3. Flatten to `{ cat, year, total }`
4. Fill missing `(cat, year)` with 0 using `.some()` + `.push()`
5. Build x/y scales (`scaleBand`, `scaleLinear`)
6. Draw grouped bars and axes
