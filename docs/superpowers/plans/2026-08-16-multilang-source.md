# Multi-Language Source Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Dijkstra source drawer switch between C++, Python, Rust, Go, and PHP implementations (C++ default), for cross-language comparison.

**Architecture:** New per-language source files under `src/<lang>/` are compiled by `build_multilang.js` into a generated `js/code_multilang.js` (`window.CODE_MULTILANG = { 'graph-dijkstra': { python, rust, go, php } }`). C++ still comes from the existing `code_db` path. The source drawer renders a row of language pills when `CODE_MULTILANG[methodId]` exists; clicking one swaps the `<code>` content + `language-*` class and re-highlights via Prism (new python/rust/go/php components added). Only Dijkstra has extra sources, so only it shows the pills; every other method is unchanged.

**Tech Stack:** Vanilla JS (`js/app.js`), a Node build script, Prism.js components, `style.css`; Playwright.

## Global Constraints

- Branch `feat/multilang-source` (dsvisual).
- The four ports MUST mirror `cpp/graph_dijkstra.cpp` exactly in behavior: V=5; undirected weighted edges (0,1,4)(0,2,1)(1,2,2)(1,3,3)(2,3,1)(3,4,3)(2,4,5); source=0; min-priority-queue Dijkstra skipping visited nodes; and the SAME textual output — lines `Dijkstra's Shortest Path from node 0:`, a `===…` divider, `Processing node <u> (distance = <d>)`, `  Updated distance to node <v>: <dist>`, a blank line per node, `Final shortest distances from node 0:`, then `Node <i>: <dist>` or `Node <i>: INF (unreachable)`. Each is a full, runnable, idiomatic program.
- `code_multilang.js` holds ONLY non-C++ languages (C++ stays on `getCodeForMethod`). Keyed by methodId; a language file that's absent is simply omitted.
- Do NOT modify `cpp/` or `js/code_db.js`. `js/code_multilang.js` is generated (committed) — never hand-edit; regenerate via `node build_multilang.js`.
- The language pills render ONLY when `window.CODE_MULTILANG[methodId]` exists; default selection is always C++. Other methods' drawers must be byte-for-byte unchanged.
- Escape backticks / `$` / backslash when embedding source into the generated template literal (mirror `build_db.js`).
- Run `npm run test:all` (unit deterministic gate; re-run a flaky Playwright spec in isolation and note it).
- Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Per-language Dijkstra sources + build + Prism components

**Files:** Create `src/python/graph_dijkstra.py`, `src/rust/graph_dijkstra.rs`, `src/go/graph_dijkstra.go`, `src/php/graph_dijkstra.php`, `build_multilang.js`, `js/code_multilang.js` (generated), `vendor/prism/prism-{python,rust,go,php}.min.js`; Modify `index.html`, `package.json`; Test `tests/unit/code_multilang.test.js`.

**Interfaces:** Produces `window.CODE_MULTILANG` (also `module.exports` for the unit test): `{ 'graph-dijkstra': { python: '<src>', rust: '<src>', go: '<src>', php: '<src>' } }`. Consumed by Task 2.

- [ ] **Step 1: Capture the golden output** — build & run the C++ reference to get the exact expected output: `g++ -std=c++17 cpp/graph_dijkstra.cpp -o /tmp/dj && /tmp/dj > /tmp/dj.golden.txt` (from the repo root). This is the byte-for-byte target every port must reproduce.

- [ ] **Step 2: Author the four ports** to reproduce `/tmp/dj.golden.txt` exactly, each idiomatic:
  - `src/python/graph_dijkstra.py` — `heapq`; a `main()`; same graph/output.
  - `src/rust/graph_dijkstra.rs` — `std::collections::BinaryHeap` with `std::cmp::Reverse`; `fn main()`.
  - `src/go/graph_dijkstra.go` — `package main`; `container/heap` (or a simple index-min scan) ; `func main()`.
  - `src/php/graph_dijkstra.php` — `<?php`; `SplPriorityQueue` (invert priorities for a min-queue) or an array-based min extract; a `dijkstra()` function.
  Verify each against the golden output where a runtime is available: `python3 src/python/graph_dijkstra.py | diff - /tmp/dj.golden.txt`; and if present, `rustc`/`go`/`php` similarly (report which runtimes existed and which were diff-verified vs. structurally-verified). NOTE: iteration order over a node's neighbours must match the C++ (edges pushed in the addEdge order) so the trace lines match — preserve insertion order in the adjacency lists.

- [ ] **Step 3: Write the failing unit test** — `tests/unit/code_multilang.test.js` (node:test): `require('../../js/code_multilang.js')` won't set `window`, so have the build ALSO `module.exports` the object (guard: `if (typeof module!=='undefined') module.exports = CODE_MULTILANG;`). Assert `CODE_MULTILANG['graph-dijkstra']` has keys `python,rust,go,php`, each a non-empty string containing a language token (`def `, `fn main`, `func main`, `<?php`).

- [ ] **Step 4: Run it — expect FAIL** (`code_multilang.js` doesn't exist). `node --test tests/unit/code_multilang.test.js`

- [ ] **Step 5: Write `build_multilang.js`** — a `METHOD_SRC = { 'graph-dijkstra': 'graph_dijkstra' }` map; for each methodId and each lang in `['python','rust','go','php']` (ext `py,rs,go,php`), read `src/<lang>/<base>.<ext>` if it exists, escape (`\\`, backtick, `$` → mirror `build_db.js`), and emit `js/code_multilang.js`:
  ```js
  // Auto-generated multi-language code DB — edit src/<lang>/*, then run: node build_multilang.js
  const CODE_MULTILANG = { 'graph-dijkstra': { python: `…`, rust: `…`, go: `…`, php: `…` } };
  if (typeof window !== 'undefined') window.CODE_MULTILANG = CODE_MULTILANG;
  if (typeof module !== 'undefined' && module.exports) module.exports = CODE_MULTILANG;
  ```
  Add `"build:multilang": "node build_multilang.js"` to `package.json` scripts. Run `node build_multilang.js`.

- [ ] **Step 6: Add Prism components** — copy `node_modules/prismjs/components/prism-{python,rust,go,php}.min.js` into `vendor/prism/`, and in `index.html` add their `<script>` tags right after the `prism-cpp.min.js` line (`index.html:402`), and add `<script src="js/code_multilang.js"></script>` near the `js/code_db.js` line (`index.html:407`).

- [ ] **Step 7: Run — expect PASS** (`node --test tests/unit/code_multilang.test.js`), and confirm the ports match the golden output (report the diffs / which were verified).

- [ ] **Step 8: Commit** `git commit -m "feat(source): Dijkstra in Python/Rust/Go/PHP + build + Prism components"`

---

### Task 2: Source-drawer language pills + switching

**Files:** Modify `js/app.js`, `style.css`; Test `tests/multilang_source.spec.js` (new).

**Interfaces:** Consumes `window.CODE_MULTILANG` (Task 1) and the existing `getCodeForMethod`/drawer render (`js/app.js:273/574/621-703`).

- [ ] **Step 1: Write the failing Playwright test** — `tests/multilang_source.spec.js`. Read `tests/tree_rb.spec.js:33-47` first for the drawer-open idiom. Assert for `graph-dijkstra`: open the drawer → `<code>` has class `language-cpp` and contains a C++ token (e.g. `priority_queue`); pills `[data-testid="srclang-cpp"]` (active) + `srclang-python/rust/go/php` exist. Click Python → `<code>` class `language-python`, contains `def`, filename shows `graph_dijkstra.py`, and a `.token` element exists (Prism ran). Repeat for Rust (`fn main`), Go (`func main`), PHP (`<?php` / `function`); click C++ → back to `language-cpp`. Then load a C++-only codeDrawer method (e.g. `tree-rb`) → assert `[data-testid^="srclang-"]` count is 0.

- [ ] **Step 2: Run it — expect FAIL** (no pills). `npx playwright test tests/multilang_source.spec.js --reporter=line`

- [ ] **Step 3: Implement in `js/app.js`** — where the code panel/drawer is built for a `codeDrawer` method (around `:621-666`), when `window.CODE_MULTILANG && window.CODE_MULTILANG[method.id]` exists, render a `.srclang-pills` row in the drawer header: a `cpp` pill (active) plus one per available language, each `<button class="srclang-pill" data-lang="<lang>" data-testid="srclang-<lang>">`. Add a click handler (scoped to this section's drawer) that:
  - resolves the source: `cpp` → `getCodeForMethod(method.id)`; else `window.CODE_MULTILANG[method.id][lang]`.
  - updates the `<code>` element: set `className = 'language-' + (lang==='cpp'?'cpp':lang)`, set `textContent` to the source, call `Prism.highlightElement(codeEl)`, then rebuild the `.code-line` gutter (reuse the same wrapping used at `:698-703` — factor it into a small helper if convenient).
  - updates the drawer filename (`.code-panel-filename` and/or the header `<h3>`) to `graph_dijkstra.<ext>` (`cpp/py/rs/go/php`).
  - toggles the `.active` pill class.
  - Default on open is C++ (the initial render already shows `language-cpp`).
  - Guard so methods WITHOUT `CODE_MULTILANG[id]` render no pills and are unchanged.

- [ ] **Step 4: Add CSS** in `style.css`: `.srclang-pills` (flex row, gap, wrap, small margin) and `.srclang-pill` / `.srclang-pill.active` (small pill buttons, using existing theme tokens; active state visually distinct). Keep consistent with the drawer styling.

- [ ] **Step 5: Run — expect PASS**, then the full suite. `npx playwright test tests/multilang_source.spec.js --reporter=line` then `npm run test:all`.

- [ ] **Step 6: Commit** `git commit -m "feat(source): language switcher pills in the Dijkstra source drawer"`

---

## Final gate (after both tasks)

- [ ] `npm run test:all` green.
- [ ] Manual check: open the Dijkstra source drawer → C++ by default; pills switch to Python/Rust/Go/PHP with correct highlighting, content, and filename; another codeDrawer method shows no pills.
- [ ] Grep: pills guarded by `window.CODE_MULTILANG[...]`; `cpp/` and `js/code_db.js` untouched; generated `js/code_multilang.js` present and committed; Prism component `<script>`s added.
- [ ] Open a PR to `main` and merge on green.
