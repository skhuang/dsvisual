# Sparse Matrix Visualization — Bugfix, Validation, Interface Alignment, Saved Examples

Date: 2026-07-10

## Goal

Improve the Sparse Matrix (FAST_TRANSPOSE) visualization along four axes:

1. Fix the ragged-row out-of-bounds bug.
2. Add input validation with a clear, bilingual error.
3. Align the C++ and JS interfaces so the displayed code matches the executed logic.
4. Persist user-entered valid inputs as future selectable examples.

## Affected files

- `js/matrix_sparse_viz.js` — pure logic module (browser global `SparseViz` + `module.exports`).
- `js/app.js` — `renderMatrixSparse()` renderer (around line 5457).
- `cpp/matrix_sparse.cpp` — reference C++ (unchanged; it is the canonical target).
- `tests/unit/matrix_sparse_viz.test.js` — unit tests.

## Background: the bug

`renderMatrixSparse()` derives `cols` from `matrix[0].length`, but `toTriples` iterates each row's own
`matrix[r].length`. If a later row is longer than the first, a triple's column index `t.c >= cols`, so
`rowSize[t.c]++` and `startPos` writes/reads out of bounds, producing wrong output or corrupt frames.
There is no validation, and `parseInt(s) || 0` silently converts non-numeric entries (and legitimate
parse failures) to `0`.

## Design

### 1. Interface alignment (`matrix_sparse_viz.js`)

Add a pure function mirroring `cpp/matrix_sparse.cpp` exactly:

```js
// FAST_TRANSPOSE on a triple list, O(cols + terms). Mirrors cpp/matrix_sparse.cpp.
function fastTranspose(triples, rows, cols) // -> array of {r, c, v} triples (transposed)
```

It reproduces the three C++ loops: count `rowSize` per column, prefix-sum into `startPos`, then place
each triple at `dst = startPos[t.c]++` as `{ r: t.c, c: t.r, v: t.v }`. `buildFastTransposeFrames` is
refactored so its core placement logic is consistent with `fastTranspose` (shared understanding of the
algorithm), keeping its existing frame/phase output contract intact.

Both `rows` and `cols` are real parameters. (C++ ignores `rows` via `(void)rows`; the JS frame builder
legitimately needs both to rebuild the dense transposed matrix for display.)

### 2. Validation + ragged-row fix (`matrix_sparse_viz.js`)

Add a pure, testable parser:

```js
function parseMatrix(text) // -> { ok, matrix, rows, cols, error: { zh, en } }
```

Rules:
- Input non-empty (at least one row, one column).
- Every row has the same number of entries (uniform `cols`) — this is the root fix for the OOB bug.
- Every entry parses as an integer; empty/`NaN` entries are rejected (no silent `|| 0`).

On success `error` is null; on failure `matrix` is null and `error` carries a bilingual message
describing the first problem found (e.g. ragged rows, non-numeric entry).

### 3. Renderer behavior (`app.js` `renderMatrixSparse`)

- On init / Apply / random / example-select, call `parseMatrix(text)`.
- **Valid** → render as today; on an explicit Apply of user input, record the example (§4).
- **Invalid** → keep the previous valid render untouched; show a bilingual red error line
  (`.sm-error`) beneath `.sm-controls`. Do not mutate `_sparseState`.

Because `cols` now comes from a validated uniform matrix, `rowSize[t.c]` is always in bounds.

### 4. Saved examples (localStorage)

- Storage key: `dsvisual:sparse:examples`.
- Value: JSON array of `{ text }`, most-recent-first, capped at 8, deduped by exact `text`.
- Written **only** when the user Applies a valid input — not on the built-in default and not on the
  random (dice) button. Matches the requirement "若使用者輸入" (when the user inputs).
- UI: a `<select class="sm-examples">` in `.sm-controls`. First option is the built-in default; the
  rest are saved entries labelled by their (truncated) text. Selecting one loads it into the input and
  renders.
- All `localStorage` access wrapped in try/catch, matching existing code (`js/app.js` density/difficulty
  storage), so a disabled/unavailable store degrades gracefully to just the default.

### 5. Tests (`tests/unit/matrix_sparse_viz.test.js`)

Extend existing suite:
- `fastTranspose` returns triples matching the C++ FAST_TRANSPOSE output.
- `parseMatrix` accepts a valid matrix; rejects ragged rows, non-numeric entries, and empty input, each
  with a bilingual `error`.
- `buildFastTransposeFrames` output unchanged (regression guard on existing assertions).

Existing unit tests and the `tests/matrix_sparse.spec.js` e2e must continue to pass.

## Non-goals

- No change to `cpp/matrix_sparse.cpp` (it is the canonical reference the JS aligns to).
- No cookie storage: the user's later decision selected `localStorage` (project convention), overriding
  the initial "cookie" request. Flagged explicitly.
- No unrelated refactoring of `app.js` or other visualizers.
