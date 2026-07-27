# Viz refinements: trie edge labels, two-tier difficulty, fullscreen auto-fit — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Three independent refinements arising from the trie-viz preview, shipping in ONE branch
  (`feat/viz-refinements`) / one PR:
  1. Make the trie's edge character labels visible (contrast fix).
  2. Two-tier random-input difficulty: a global setting (⚙ drawer, all viz) plus a per-viz override
     inline next to the examples select; add a random-input button to the trie viz.
  3. Fullscreen (focus mode) auto-scales the visualization to fit the window, for all viz.

## 1. Trie edge-char visibility

The character labels already render on the edges (`js/viz/viz_trie.js` `svgFor`), but
`.trie-edge-label { fill: #cbd5e1 }` is near-white on the light viz canvas → invisible. Fix is
CSS-only in `style.css`:

- `.trie-edge-label`: `fill: #1e293b` (dark slate), `font-weight: 800`, add a legibility halo via
  `paint-order: stroke; stroke: #ffffff; stroke-width: 3px; stroke-linejoin: round;` so the glyph
  stays readable where it overlaps an edge line.

Chars stay on the edges (no node labels). Root node needs no label. The current/tree edge keeps its
`.trie-edge-cur` accent (unchanged). No JS change.

## 2. Two-tier difficulty + inline selector + trie random input

### Model change (`js/app.js`)

Difficulty is currently stored **per method-group** (`DIFFICULTY_KEY_PREFIX + groupId`) and only
editable in the ⚙ settings drawer. Replace with a two-tier model:

- **Global** difficulty — one localStorage key `dsvisual-difficulty-global`, default `'normal'`,
  applies to every viz. The ⚙ settings `#input-difficulty` select edits this.
- **Per-viz override** — key `dsvisual-difficulty-viz-<methodId>`. When set to one of
  `normal|special|edge|large` it overrides the global for THAT method only; when unset/empty the viz
  follows global.
- Resolution: `getInputDifficulty()` returns `override(currentMode) ?? global` — the value is
  resolved for `currentMode`. All existing consumers (search/sort/etc.) are unchanged since they
  call `getInputDifficulty()` with no args.

Exact helpers (replace the current `getInputDifficulty`/`setInputDifficulty`/`syncDifficultySelect`/
`bindDifficultySelect`):
- `const DIFFICULTY_GLOBAL_KEY = 'dsvisual-difficulty-global';`
  `const DIFFICULTY_VIZ_PREFIX = 'dsvisual-difficulty-viz-';`
  (`DIFFICULTY_VALUES = ['normal','special','edge','large']` already exists.)
- `getGlobalDifficulty()` → read `DIFFICULTY_GLOBAL_KEY`; invalid/missing → `'normal'`.
- `getVizOverride(methodId)` → read `DIFFICULTY_VIZ_PREFIX + methodId`; return the value if in
  `DIFFICULTY_VALUES`, else `null`.
- `getInputDifficulty()` → `getVizOverride(currentMode) || getGlobalDifficulty()`.
- `setGlobalDifficulty(value)` / `setVizOverride(methodId, value)` (value `''`/null clears the
  per-viz key).

### Settings drawer (global)

`index.html` `#input-difficulty` select stays but its meaning becomes global. Relabel via i18n
`settings.difficulty` → en `Random input difficulty (all visualizers)`, zh
`隨機輸入難度（全部視覺化）`. Its `change` handler calls `setGlobalDifficulty(sel.value)`;
`syncDifficultySelect()` sets `sel.value = getGlobalDifficulty()` (and keeps the group caption).

### Inline per-viz selector (generic injection)

A `.viz-difficulty` `<select>` is injected right after the viz's `.ex-select`, generically for every
viz that has an examples select — NO per-viz renderer edits. Because viz re-render internally
(their Apply rebuilds `.ex-select`), use a **MutationObserver** on the persistent
`runtimeVisualizer` container (set up once at init):

- On any subtree mutation, for each `.ex-select` in `runtimeVisualizer` that has no immediately
  following `.viz-difficulty` sibling, insert one. Idempotent (only inserts when missing) so it does
  not loop.
- The injected select options: `<option value="">{t('difficulty.follow-global')}</option>` then
  Normal/Special/Edge/Large (reuse `difficulty.normal|special|edge|large`). Its value initializes to
  `getVizOverride(currentMode) || ''`. `change` → `setVizOverride(currentMode, ev.target.value)`.
- Styling: reuse `.ex-select` look via a shared class in `style.css` (`.viz-difficulty` mirrors
  `.ex-select`), placed inline.

### Trie random input (`js/trie_viz.js` + `js/viz/viz_trie.js`)

- `js/trie_viz.js`: add pure `randomInput(difficulty) → { words: string[], query: string }` (uses
  `Math.random`; browser + node ok). Bounds per difficulty:
  - `normal`: 4–6 words, length 3–5, alphabet `A–F` (so prefixes tend to share).
  - `special`: prefix-heavy — pick one 2–3 char stem, emit 4–6 words that all start with it.
  - `edge`: extremes — mix of 1-char words, one length-8 word, and a duplicate.
  - `large`: 10–12 words, length 4–8, alphabet `A–H`.
  All words uppercase `A–Z`, deduped only if identical is unwanted (keep at most one accidental dup
  except in `edge`). Query: with ~1/3 probability each — an existing word (hit), a proper prefix of
  one (prefix-only), or a random 2–4 char string (likely miss). Respect the viz clamps (≤12 words,
  len ≤8) so it round-trips through `parseWords`/`parseQuery`.
- `js/viz/viz_trie.js`: add a `🎲` button `.trie-random` next to `套用 Apply`. Click →
  `const d = K().getInputDifficulty(); const r = global.TrieViz.randomInput(d);
  _st.words = r.words; _st.query = r.query; saveExample('tree-trie', serialize(_st),
  DEFAULT_SERIALIZED); render();`. (Trie's inline `.viz-difficulty` — injected generically — thus
  drives its random generation.)

### i18n (`js/i18n.js`)

- Update `settings.difficulty` in both dicts (text above).
- Add `difficulty.follow-global`: en `Follow global`, zh `跟隨全域`.
- (Existing `difficulty.normal|special|edge|large` reused.)

## 3. Fullscreen auto-fit (RB-tree pattern)

The RB tree viz (`js/tree_rb_viz.js:414-424`) already fits its drawing to the container: it computes
the natural drawing size `W,H`, reads `host.clientWidth/clientHeight`, `scale = min(hostW/W, hostH/H,
cap)` clamped, and sets the SVG `viewBox="0 0 W H"` + `width=W*scale` / `height=H*scale`. So when the
host grows (fullscreen) the SVG fills it **crisply** (viewBox, not a blurry CSS transform). Adopt the
same mechanism (drop the earlier `--viz-fit` transform idea — no `.viz-body-scaled` change):

- **Trie renderer (`js/viz/viz_trie.js`)** — size the SVG to the host in `paint()` instead of using
  the fixed `layout.width`/`layout.height`. Let `natW = layout.width`, `natH = layout.height`; read
  the available box from the scroll host (`scrollEl.clientWidth`/`clientHeight`, i.e. `.trie-scroll`);
  `scale = clamp(min(hostW/natW, hostH/natH), 0.5, 2.5)`; emit the SVG with
  `viewBox="0 0 natW natH"`, `width=Math.round(natW*scale)`, `height=Math.round(natH*scale)`. Every
  paint fits the current host; `.trie-scroll { overflow:auto }` still covers the clamp-floor case.
- **Generic re-fit trigger (`buildFrameControls`, `js/app.js`)** — add a `window` `resize` handler
  that **repaints the current frame** (`paint(frames[idx], idx)` at the current index — no cursor
  change), coalesced via `requestAnimationFrame`, and self-removes when the control detaches (reuse
  the existing `isConnected` guard that already stops the play timer). This lets every frame-based
  viz re-fit on resize **without resetting its VCR cursor**.
- **Focus dispatches resize (`js/app.js` `initVizFocus`)** — on `enterFocus` and `exitFocus`,
  `requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))`, so the host-size change
  from entering/leaving focus triggers the re-fit. (The viz's manual zoom transform on
  `.viz-body-scaled` still applies on top of the viewBox fit.)

Scope note: this delivers crisp host-fit for viz that size their SVG to the host — RB tree already,
and the trie now. The resize→repaint + focus→resize-dispatch infra is generic (all `buildFrameControls`
viz get a cursor-safe repaint on resize); viz with fixed-size drawings are visually unchanged, and can
adopt host-fit incrementally.

## Tests

- **Unit** (`tests/unit/trie_viz.test.js`, extend): `randomInput('normal'|'special'|'edge'|'large')`
  — for each, `words` non-empty, count and lengths within the documented bounds, all chars `A–Z`,
  and the result round-trips through `parseWords`/`parseQuery` unchanged (≤12 words, len ≤8);
  `special` words share a common prefix; `query` is a string. (Determinism not required — assert
  invariants/bounds over a few draws.)
- **e2e** (`tests/viz_refinements.spec.js`, new):
  1. **Edge labels:** load `#m=tree-trie`; a `.trie-edge-label` exists and its computed `fill` is the
     dark color (`rgb(30, 41, 59)`), not the old light one.
  2. **Two-tier difficulty:** load `#m=tree-trie`; a `.viz-difficulty` select appears next to
     `.ex-select`; open ⚙ settings, set global to `large`; the inline select still shows
     `Follow global` (empty); set the inline select to `edge`; reload / re-open settings → global is
     still `large` (independent). (Assert via the selects' values + localStorage keys.)
  3. **Trie random:** capture `.trie-words` value; click `.trie-random` (🎲); `.trie-words` changes
     to a valid A–Z word list and the trie re-renders (`.trie-node` count > 1).
  4. **Fullscreen fit (RB-style):** load `#m=tree-trie`; step to a mid frame and record the
     `.trie-svg` `width` attribute + the `步 i/N` count; enter focus via `.viz-focus-toggle`; after a
     rAF the `.trie-svg` `width` attribute **increases** (SVG fits the enlarged host) and the step
     count is **unchanged** (cursor preserved — resize repaints, doesn't reset); exit focus → the
     `.trie-svg` `width` returns to the smaller value. Assert width grows/shrinks numerically, not
     pixel-exact.
- Existing `tests/trie.spec.js`, `tests/viz_fullscreen.spec.js`, `tests/zoom_gesture.spec.js`, and
  the difficulty-consuming viz specs must stay green (`buildFrameControls` resize-repaint is a no-op
  cursor-wise; `getInputDifficulty()` signature unchanged).

## Verification

`npm run test:unit` green; `npm test` (FULL Playwright) green incl. the new spec + no regression;
browser spot-check zh + en: trie edge chars now readable; ⚙ global difficulty vs inline per-viz
override independence; trie 🎲 across the four difficulties; focus-mode auto-fit on trie + a couple
other viz (scale up small, scale down large) + resize + manual zoom still multiplies.

## Global constraints

- Concurrent refactor sessions — targeted `git add` by explicit path only; never `-A`/`.`/`-u`;
  verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Traditional Chinese (zh-Hant) for all zh copy; trie viz labels stay inline bilingual.
- One branch (`feat/viz-refinements`) + one PR. No new category/method ⇒ overview counts unchanged.

## Out of scope

- Moving chars onto nodes (rejected — edge labels made visible instead).
- Per-viz difficulty for viz without an examples select (they stay global-only — no examples select
  to anchor the inline control).
- Random-input buttons for other viz that lack one (only trie gains one here).
- Converting every viz to host-fit its drawing (only trie does so here; RB tree already did). The
  generic resize→repaint + focus→resize infra is in place for others to adopt incrementally.
- A "fit vs 100%" toggle (manual zoom already composes with the viewBox fit).

## Success criteria

Trie edge characters are legible; a global difficulty (⚙, all viz) and an inline per-viz override
(next to Example, this-viz-only) coexist with correct precedence and the trie gains a difficulty-aware
🎲 random-input button; and entering fullscreen auto-scales every viz to fit the window (composing
with manual zoom, recomputing on resize/re-render). Unit + full Playwright green; one review-passed
PR.
