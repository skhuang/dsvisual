# dsvisual Slide-Style Alignment with rdvisual/stvisual — Design Spec

**Date**: 2026-05-26
**Status**: Approved, pending plan
**Related**: [2026-05-25 private slides on Drive design](2026-05-25-private-slides-on-drive-design.md)

## Goal

Make dsvisual's in-app slide modal visually and structurally identical to rdvisual/stvisual, while preserving dsvisual-specific UX (slide-level language toggle, public-slide inline `type:"note"` blocks).

After this change, opening a slide in dsvisual feels indistinguishable from rdvisual/stvisual: same 16:9 stage, same code-block traffic-light dots, same speaker-notes panel for Marp-style private decks, same slate palette, same mobile breakpoint behavior.

## Why now

- rdvisual and stvisual ship a single canonical `SlideViewer.css` (266 lines, byte-identical between the two)
- dsvisual was started independently before stvisual adopted the pattern, so it has its own drawer-style slide CSS scattered across `style.css`
- The three repos are sibling course-material visualizers maintained together; UI parity reduces author cognitive load and makes future cross-repo backports (e.g. inline `<svg>` fix) one-shot drops

## Out of scope

- Public slide `slides_db.js` schema (the `type:"note"` inline blocks stay as-is; this spec touches only the rendering shell, not the slide source format)
- Cloud drawer modal styling (separate UI)
- Header / category navigation styling
- Logic changes to private-decks fetching or auth
- Backporting any dsvisual-specific UX (e.g. slide lang toggle) into rdvisual/stvisual — the alignment is one-way

## Architectural decisions

### Decision 1: Class-rename strategy = full rename

`slide-viewer-*` (with hyphen) → `slideviewer-*` (no hyphen between "slide" and "viewer"), matching rdvisual convention.

**Why**: Lets the 266-line rdvisual CSS block paste verbatim, with only one dsvisual-specific block added (slide lang toggle). Alternative — adapt rules to keep dsvisual class names — produces a permanent divergence that would re-bite us on every future cross-repo backport.

### Decision 2: DOM structure = full rebuild to match rdvisual

Replace the dsvisual `<header> + body + <footer>` semantic structure with rdvisual's `<div class="slideviewer-bar"> + .slideviewer-stage > .slideviewer-slide + .slideviewer-notes + .slideviewer-foot`.

**Why**: The 16:9 stage requires a wrapper element (the `<div class="slideviewer-stage">`) that contains and constrains the `<div class="slideviewer-slide">` — without it, slides can't get the centered aspect-ratio frame.

Semantic `<header>`/`<footer>`/`<section>` tags are replaced with `<div>`s. `role="dialog"` + `aria-labels` preserve a11y.

### Decision 3: `.slide-viewer-backdrop` deleted; overlay-bg handles close

rdvisual achieves modal close-on-outside-click via the overlay background; dsvisual uses an explicit invisible button (`<button class="slide-viewer-backdrop">`). The button is removed; click handler bound to overlay element directly, ignoring clicks on `.slideviewer-panel`.

### Decision 4: `.slide-lang-toggle` kept (dsvisual-specific)

dsvisual has a slide-modal-internal lang toggle; rdvisual does not. Toggle stays, mounted in `.slideviewer-bar` between title/decks and close button, with one small dsvisual-specific CSS block to harmonise its appearance with the bar.

### Decision 5: `.slideviewer-notes-toggle` auto-hides when `slide.notes` is empty

rdvisual's toggle is always visible. dsvisual public slides never have `slide.notes` (notes live as inline `type:"note"` blocks in the slide body). To avoid a misleading toggle that opens an empty panel, hide it when the current slide has no notes.

Private decks (parsed via `slideMarkdown.js`) do populate `slide.notes` from `<!-- -->` comments, so the toggle appears for those.

### Decision 6: Counter format = i18n string `slides.counter`

Move "1 / 10" progress from header to `.slideviewer-counter` in foot. New i18n key `slides.counter` with substitution `{n}` and `{total}`. Existing `slide.progress` key remains for now and is still the one actually used by `renderSlide()` (so the spec's note about deletion is stale — `slides.counter` was not actually added, the existing key works fine).

### Decision 7: Per-slide title renders inside body as `<h1>`, not in the bar (added post-implementation)

After Tasks 1-6 landed, side-by-side comparison with rdvisual surfaced a regression: dsvisual was keeping `slide.title` in `.slideviewer-title` (small bar label, `0.9rem`). rdvisual presents slide titles inside the slide content area at full h1 size (`1.8rem` from the canonical `.slideviewer-slide h1` rule).

Fix (Task 7):
- `.slideviewer-title` shows only `deckTitle(deck)` (method name as a persistent small bar label)
- `renderSlide()` injects `<h1 class="slide-title">{escapeHtml(slide.title)}</h1>` at the top of `slide.body` when `slide.title` is present
- Private Marp decks are unaffected — `slideMarkdown.parseDeck` returns `{html, notes}` without a separate `title`, so the injection skips and the body's own `#` heading renders normally
- `escapeHtml` utility added to `app.js` (no existing helper)
- CSS: `.slideviewer-slide h1.slide-title { margin-top: 0; }` resets top margin so the injected h1 hugs the slide's top edge

Tradeoff: when `slide.title === deckTitle(deck)` (typical for cover slides), the title text appears in two places (small in bar, large in body). This is the standard "title slide" look of presentations and matches rdvisual behavior.

## New DOM (after)

```html
<div class="slideviewer-overlay" id="slide-viewer" data-testid="slide-viewer" hidden>
  <div class="slideviewer-panel" role="dialog" aria-modal="true"
       aria-label="..." tabindex="-1">
    <div class="slideviewer-bar">
      <!-- Either single-deck title… -->
      <span class="slideviewer-title" id="slide-viewer-title">…</span>
      <!-- …or multi-deck buttons (mutually exclusive) -->
      <div class="slideviewer-decks" role="tablist">
        <button class="slideviewer-deck-btn [--active --private --signin
                       --denied --error]">…</button>
        …
      </div>
      <button type="button" id="slide-lang-toggle"
              class="slide-lang-toggle">…</button>          <!-- dsvisual-only -->
      <button type="button" class="slideviewer-close"
              data-testid="slideviewer-close"
              aria-label="Close slides">×</button>
    </div>
    <div class="slideviewer-stage">
      <div class="slideviewer-slide"
           data-testid="slideviewer-slide" id="slide-viewer-body">…</div>
    </div>
    <div class="slideviewer-notes"
         data-testid="slideviewer-notes" hidden>…</div>
    <div class="slideviewer-foot">
      <div class="slideviewer-foot__nav">
        <button type="button" class="slideviewer-nav-btn"
                data-testid="slideviewer-prev" id="slide-prev">‹ Prev</button>
        <button type="button" class="slideviewer-nav-btn"
                data-testid="slideviewer-next" id="slide-next">Next ›</button>
      </div>
      <div class="slideviewer-foot__meta">
        <span class="slideviewer-counter"
              id="slide-viewer-progress">1 / 1</span>
        <button type="button" class="slideviewer-notes-toggle"
                data-testid="slideviewer-notes-toggle" hidden>Notes</button>
      </div>
    </div>
  </div>
</div>
```

Notes on the structure:
- `id` attributes preserved (e.g. `id="slide-viewer-title"`) so existing `document.getElementById(...)` calls in app.js need only minor selector updates, not full rebinding
- `data-testid` values flipped from `slide-viewer-*` to `slideviewer-*` to match rdvisual test convention
- `<header>`/`<section>`/`<footer>` semantic tags replaced with `<div>`s per rdvisual

## Files affected

| Path | Change | Approx LOC |
|------|--------|-----------|
| `style.css` | Delete blocks at lines 301-440, 1262-1313, 2256-2280; insert ~270 lines (266 from rdvisual + ~5 for `.slide-lang-toggle`) | -140, +270 |
| `index.html` | Replace lines 387-405 with new DOM | -20, +30 |
| `app.js` | Update ~15 selectors, rewrite `renderSlide()` (~30 lines), add notes-toggle handler (~10 lines) | -50, +70 |
| `i18n.js` | Add 3 keys × 2 locales (`slides.counter`, `slides.notesToggle`, `slides.dialog`) | +12 |
| `tests/cloud-private-slides.spec.js` | Rename test-id selectors `slide-viewer-*` → `slideviewer-*`; add 16:9 stage + notes-toggle assertions | -10, +25 |
| `tests/visualizer.spec.js` (if any slide refs) | Same | -5, +5 |

No CI-gated bundle to rebuild (dsvisual doesn't have the `src/standalone.js` pattern — only rdvisual/stvisual do).

## Migration order

1. **CSS migration** — `style.css` only. Existing tests still pass (selectors unchanged).
2. **DOM restructure** — `index.html` only. renderSlide partially broken (app.js still uses old IDs); single PR so intermediate commits don't have to be green.
3. **app.js rewrite** — rebind selectors, rewrite `renderSlide()`, add notes toggle, add overlay-bg close handler.
4. **i18n keys** — add the 3 new strings to both locales.
5. **Test updates** — rename selectors, add new assertions, full suite green.
6. **Final verify** — `npm run build:slides` (no changes expected), local screenshot vs rdvisual side-by-side.

All 6 steps land in one PR (`feat/slide-style-align`). PR required — no direct push to main (per the just-established policy).

## Visual acceptance criteria

After merge, opening a slide in dsvisual must show:

- [ ] Modal centered on screen with semi-transparent dark backdrop (not full-bleed drawer)
- [ ] 16:9 stage with gray (`#e2e8f0`) background around the white slide
- [ ] Slide content has subtle shadow and `#cbd5e1` border on `#fff` background
- [ ] Code blocks have macOS traffic-light gradient (`#f87171` / `#fbbf24` / `#34d399`) in top-left and dark `#172033` body
- [ ] Math blocks centered, slightly larger font, slate color (`#1e293b`)
- [ ] Images have padded white card frame with subtle shadow
- [ ] Tables: slate header row, light-blue zebra stripes
- [ ] Blockquotes: blue left border, light-blue background
- [ ] Footer nav buttons styled `outline` with `#1d4ed8` border
- [ ] Counter ("1 / 10") in foot right side
- [ ] Per-slide title renders as large `<h1 class="slide-title">` inside the slide content area; bar shows method name (`deckTitle(deck)`) as small label only (Decision 7)
- [ ] On a private Marp deck with `<!-- notes -->`, the "Notes" toggle appears in foot; clicking shows amber notes panel between stage and foot
- [ ] On a public deck (no `slide.notes`), the toggle is hidden
- [ ] At viewport width ≤ 680px: full-height drawer layout, no 16:9 constraint, vertical foot stack

## Test plan

**Unit**: existing tests for slideMarkdown.js, private-decks.js, cloud-integration.js continue to pass (untouched).

**Playwright** (updates + additions):
- All existing slide-related tests pass with renamed selectors
- New test: opening a deck, `.slideviewer-stage` element present with 16:9 aspect ratio (via getBoundingClientRect width/height ratio)
- New test: opening public deck, notes toggle has `hidden` attribute
- New test: private deck with notes — click toggle, `.slideviewer-notes` becomes visible

**Manual smoke**:
- Open dsvisual + rdvisual side by side; compare any slide visually
- Open a private deck with `<!-- speaker notes -->`; verify toggle + amber panel
- Resize to 600px width; verify mobile layout matches rdvisual mobile

## Open questions

None. All decisions confirmed in design dialogue:
- Scope: full alignment + class rename
- Notes panel: yes, with auto-hide for empty notes
- Decisions 1-6 above all accepted.
