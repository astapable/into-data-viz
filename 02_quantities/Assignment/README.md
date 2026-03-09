# Stacked Bars: Key JavaScript + D3 Concepts

This chart (`bar_stacked.js`) stacks payment totals by:
- category (`Class`) on x
- year (`2022`, `2023`, `2024`, `2025`) as stack segments

## Why `d3.rollup` here

`d3.rollup` is useful because it makes grouped aggregation explicit.

- `d3.rollup(...)` returns a nested `Map`
- Shape in this file: `Map<Class, Map<Year, Total>>`

Then we flatten it into an array of objects (`{ cat, year, total }`) for later scale and stack steps.

D3 reference:
- `rollup`: https://d3js.org/d3-array/group#rollup

## `.map()` / `Array.from()`

This file uses `Array.from(...).flat()` to transform nested `Map` entries into flat row objects.

Same idea as `.map()`: take each item, return a transformed item.

MDN:
- `Array.prototype.map()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
- `Array.from()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

## `Set`

`Set` stores unique values only.

In this file:
- unique categories: `new Set(groupObject.map(x => x.cat))`
- unique years: `new Set(groupObject.map(x => x.year))`

MDN:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

## `.some()`

`.some()` returns `true` if at least one array element matches a condition.

In this file:
- checks whether a `(cat, year)` combination already exists.

MDN:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some

## `.push()`

`.push()` appends new items to an array.

In this file:
- missing `(cat, year)` combinations are added with `{ cat, year, total: 0 }`
- this is required for consistent stacking across categories.

MDN:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push

## `d3.scaleLinear`

`scaleLinear` maps numeric values to pixel space.

In this file:
- domain: `[0, max stacked total]`
- range: `[chart bottom, chart top]`

The y-range is inverted for SVG so larger values appear higher.

D3 reference:
- https://d3js.org/d3-scale/linear#scaleLinear

## `d3.stack`

`d3.stack()` converts tidy rows into stack layers (series), where each layer corresponds to one year key.

In this file:
- keys are years
- output values are `[y0, y1]` extents used to draw each stacked segment.

D3 reference:
- https://d3js.org/d3-shape/stack#stack

## Quick flow in this file

1. Parse dates and extract `year`
2. Aggregate totals with `d3.rollup`
3. Flatten to `{ cat, year, total }`
4. Fill missing `(cat, year)` pairs with 0 using `.some()` + `.push()`
5. Build stacked series with `d3.stack()`
6. Draw bars with `scaleBand` + `scaleLinear`, then draw axes
