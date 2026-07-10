# Sparse Matrix Viz — Show Transposed Triple Vector b[]

Date: 2026-07-10 (follow-up to 2026-07-10-sparse-matrix-viz-design.md)

## Goal

Alongside the dense "轉置結果" matrix, display the FAST_TRANSPOSE output triple array `b[]`, filled
step-by-step in sync with the `place` animation frames, with the slot just written highlighted.

## Affected files

- `js/matrix_sparse_viz.js` — add `dst` to each `place` frame.
- `js/app.js` — `renderMatrixSparse()` renders the b[] vector next to the transposed grid.
- `style.css` — vector table style + side-by-side flex wrapper.
- `tests/unit/matrix_sparse_viz.test.js` — assert the `dst` field.

## Design

### 1. Frame data (`matrix_sparse_viz.js`)

Each `place` frame gains `dst` — the index in `placed` written on that step (already computed for the
message text). Non-`place` frames use `dst: -1`. Additive; existing `{ frames, triples, transposed }`
contract and all other frame fields unchanged.

### 2. Renderer (`app.js`)

- New helper `transposedTriplesHtml(placed, dst)`: a table titled `{ zh: '轉置三元組 b[]', en: 'Transposed
  triples b[]' }` with an index header row and `r`/`c`/`v` rows. Filled slots show their triple; unfilled
  slots show `·`; the column at `dst` gets `.sm-cur` highlight when the current frame is a `place` step.
- The existing dense transposed grid and the new b[] vector are wrapped in a flex row (`.sm-tout`) so the
  vector sits to the right of the matrix. `rowSize`/`startPos` remain above.

### 3. CSS (`style.css`)

- `.sm-tout { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }`
- `.sm-tvec` table styled like `.sm-triple-tbl`; `.sm-tvec .sm-cur` reuses the existing highlight color.

### 4. Tests

Extend the unit suite: every `place` frame has a numeric `dst` that indexes the slot filled in that
frame's `placed`; the `done`/`rowsize`/`startpos` frames have `dst === -1`.

## Non-goals

- No change to the C++ reference or the algorithm.
- No new controls or interactions; this is display-only, driven by the existing step controls.
