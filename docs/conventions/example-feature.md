# Convention: Example (localStorage) feature for visualizations

Every visualization with an editable full-input control MUST provide an
"Examples…" dropdown that remembers the user's inputs in localStorage.

## How
1. Controls: render the dropdown with `buildExamplesSelect(methodId, defaultText)`
   (js/app.js) — a `<select class="ex-select">` listing "Examples…" (placeholder),
   "Default", and previously-saved inputs.
2. Save on Apply/Build: after a valid input is applied, call
   `saveExample(methodId, text, defaultText)`. Inputs are stored per method at
   `dsvisual:examples:<methodId>` (dedupe, newest-first, cap 8, default skipped).
3. Restore on select: the `.ex-select` `onchange` loads the selected value into the
   input(s) and re-renders.

The load/save logic lives in the pure, unit-tested `js/examples_store.js`
(`ExamplesStore.load/save/key`); `js/app.js` wraps it with `localStorage`
(`loadExamples`, `saveExample`, `buildExamplesSelect`).

## Multi-field inputs
When a viz has more than one input field, serialize the whole input to a single
string for the example value and deserialize on select. Reference:
`list-equivalence` serializes `{n, pairs}` as `"<n>|<pairs>"` (see
`renderListEquivalence`).

## References
- `matrix-sparse-list` — single matrix-text input.
- `list-equivalence` — multi-field (n + pairs) via serialization.
- (`matrix-sparse` predates this helper and keeps its own equivalent implementation.)
