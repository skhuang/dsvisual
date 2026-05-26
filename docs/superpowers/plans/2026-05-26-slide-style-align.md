# Slide-Style Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dsvisual's slide modal visually + structurally identical to rdvisual/stvisual, while preserving dsvisual's slide-level lang toggle.

**Architecture:** Rename classes `slide-viewer-*` → `slideviewer-*`, rebuild the slide-viewer DOM to match rdvisual's `overlay > panel > {bar, stage, notes, foot}`, replace the slide CSS rules in `style.css` with the canonical 266-line block from rdvisual's `SlideViewer.css`, rewrite `renderSlide()` in `app.js` to drive the new DOM, add a speaker-notes panel (toggleable, auto-hidden when current slide has no notes), and update Playwright test selectors.

**Tech Stack:** Vanilla JS / CommonJS (no bundler), single `app.js` at repo root, Playwright + `node --test`, no React.

**Reference:** [docs/superpowers/specs/2026-05-26-slide-style-align-design.md](../specs/2026-05-26-slide-style-align-design.md)

---

## Task 1: CSS migration — replace slide-viewer rules with rdvisual canonical block

**Files:**
- Modify: `style.css` (delete rules at lines ~301-440, ~1262-1313, ~2256-2280; append new block at end)

**Why first**: Pure additive replacement of CSS rules. Selectors don't match new DOM yet (DOM rebuild happens in Task 2), so visually broken until then — but no JS reference resolution depends on CSS, so this commit is safe in isolation.

- [ ] **Step 1: Verify the exact line ranges to delete**

Run:
```bash
grep -nE '^\.slide-viewer|^#slide-viewer|^\.slide-deck-bar|^\.slide-deck-btn|^\.slide-lang-toggle' style.css
```

Expected output: ~3 contiguous blocks plus the mobile media-query overrides. Note line ranges; they will be roughly:
- 301-440 (main slide-viewer styles)
- 912-916 (mobile override of `.slide-viewer-panel`)
- 1171 (mobile override of `.slide-viewer-body code`)
- 1262-1313 (slide-lang-toggle + body table/note/figure/math)
- 2256-2280 (slide-deck-bar + variants)

- [ ] **Step 2: Read each block and confirm scope before delete**

Use the Read tool on each block (e.g. `Read style.css` with offset/limit) to confirm what each contains. Document the actual line ranges found (line numbers may have shifted since the spec was written).

- [ ] **Step 3: Delete the old slide-viewer rules**

Use Edit tool to delete each block individually. Preserve any non-slide rules within the same numeric range. After all deletes, verify:

```bash
grep -nE 'slide-viewer|slide-deck-bar|slide-deck-btn|slide-lang-toggle' style.css | wc -l
```

Expected: `0`.

- [ ] **Step 4: Append the canonical block at end of style.css**

Add this block at the end of `style.css`:

```css
/* ============================================================
   Slide viewer — aligned with rdvisual/stvisual SlideViewer.css.
   See docs/superpowers/specs/2026-05-26-slide-style-align-design.md
   ============================================================ */
.slideviewer-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15, 23, 42, 0.72);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.slideviewer-overlay[hidden] { display: none; }
.slideviewer-panel {
  background: #f8fafc; border-radius: 10px; width: min(1100px, 100%);
  max-height: 92vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 22px 60px rgba(2, 6, 23, 0.28);
}
.slideviewer-bar {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0; background: #fff;
}
.slideviewer-title {
  color: #1f2a44;
  font-size: 0.9rem;
  font-weight: 800;
}
.slideviewer-decks {
  display: flex; gap: 0;
  flex-wrap: wrap; overflow: hidden;
  border: 1px solid #cbd5e1; border-radius: 8px;
}
.slideviewer-deck-btn {
  padding: 0.34rem 0.7rem; border: 0; border-right: 1px solid #cbd5e1;
  background: #fff; color: #475569; font-size: 0.78rem; cursor: pointer;
}
.slideviewer-deck-btn:last-child { border-right: 0; }
.slideviewer-deck-btn--active { background: #1d4ed8; color: #fff; font-weight: 700; }
.slideviewer-close {
  margin-left: auto; width: 34px; height: 34px;
  border: 1px solid #cbd5e1; border-radius: 8px;
  background: #fff; font-size: 1rem; cursor: pointer; color: #475569;
}
.slideviewer-stage {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: clamp(14px, 2.2vw, 28px);
  background: #e2e8f0;
}
.slideviewer-slide {
  width: min(100%, calc((92vh - 120px) * 16 / 9));
  aspect-ratio: 16 / 9;
  overflow-y: auto;
  padding: clamp(1rem, 2.1vw, 2rem);
  color: #1f2a44;
  line-height: 1.65;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.14);
}
.slideviewer-slide h1 { font-size: 1.8rem; margin: 0 0 0.75rem; }
.slideviewer-slide h2 { font-size: 1.35rem; margin: 0 0 0.65rem; }
.slideviewer-slide h3, .slideviewer-slide h4 { font-size: 1rem; margin: 0.75rem 0 0.45rem; }
.slideviewer-slide p,
.slideviewer-slide ul,
.slideviewer-slide ol,
.slideviewer-slide table,
.slideviewer-slide blockquote,
.slideviewer-slide pre { margin-top: 0.62rem; }
.slideviewer-slide ul,
.slideviewer-slide ol {
  padding-left: 1.4rem;
}
.slideviewer-slide li + li {
  margin-top: 0.22rem;
}
.slideviewer-slide code {
  border-radius: 4px;
  background: #eef2f7;
  color: #334155;
  font-size: 0.92em;
  padding: 0.08rem 0.24rem;
}
.slideviewer-slide img {
  display: block; max-width: 100%; height: auto; margin: 0.85rem auto 0;
  padding: 8px;
  border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}
.slideviewer-slide pre.slide-code {
  position: relative;
  background: #172033; color: #d4d4d4; border-radius: 8px; padding: 1rem 0.8rem 0.8rem;
  overflow-x: auto; font-size: 0.82rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.slideviewer-slide pre.slide-code::before {
  content: '';
  position: absolute;
  top: 0.45rem;
  left: 0.8rem;
  width: 42px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f87171 0 8px, transparent 8px 14px, #fbbf24 14px 22px, transparent 22px 28px, #34d399 28px 36px);
}
.slideviewer-slide pre.slide-code code {
  display: block;
  margin-top: 0.35rem;
  background: transparent;
  color: inherit;
  padding: 0;
}
.slideviewer-slide table.slide-table {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.slideviewer-slide table.slide-table thead,
.slideviewer-slide table.slide-table tbody,
.slideviewer-slide table.slide-table tr {
  width: 100%;
}
.slideviewer-slide table.slide-table th {
  background: #f1f5f9;
  color: #1e293b;
  font-weight: 800;
}
.slideviewer-slide table.slide-table th, .slideviewer-slide table.slide-table td {
  border: 1px solid #e2e8f0; padding: 0.3rem 0.55rem; text-align: left;
}
.slideviewer-slide table.slide-table tbody tr:nth-child(even) td {
  background: #fbfdff;
}
/* LaTeX math rendered by slideMarkdown.js */
.slideviewer-slide .slide-math-block {
  margin: 0.7rem 0;
  text-align: center;
  font-size: 1.2rem;
  color: #1e293b;
}
.slideviewer-slide .slide-math { white-space: nowrap; }
.slideviewer-slide .tex-text { font-style: normal; }
.slideviewer-slide .tex-frac {
  display: inline-flex;
  flex-direction: column;
  vertical-align: middle;
  text-align: center;
  margin: 0 0.2rem;
}
.slideviewer-slide .tex-frac-num { padding: 0 0.45rem; }
.slideviewer-slide .tex-frac-den {
  padding: 0.05rem 0.45rem 0;
  border-top: 1.5px solid currentColor;
}
.slideviewer-slide .slide-math sup,
.slideviewer-slide .slide-math sub,
.slideviewer-slide .slide-math-block sup,
.slideviewer-slide .slide-math-block sub { font-size: 0.7em; }
.slideviewer-slide blockquote {
  margin: 0.5rem 0; padding: 0.4rem 0.8rem; border-left: 3px solid #1d4ed8;
  background: #eff6ff; color: #1e3a8a;
}
.slideviewer-notes {
  border-top: 1px dashed #cbd5e1; background: #fffbeb; color: #78350f;
  max-height: 18vh; overflow-y: auto;
  padding: 0.6rem 1rem; font-size: 0.83rem; white-space: pre-wrap;
}
.slideviewer-notes[hidden] { display: none; }
.slideviewer-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;
  padding: 0.6rem 0.85rem; border-top: 1px solid #e2e8f0; background: #fff;
}
.slideviewer-foot__nav,
.slideviewer-foot__meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.slideviewer-nav-btn {
  padding: 0.3rem 0.85rem; border: 1px solid #1d4ed8; border-radius: 6px;
  background: #fff; color: #1d4ed8; font-size: 0.82rem; cursor: pointer;
}
.slideviewer-nav-btn:disabled { opacity: 0.4; cursor: default; }
.slideviewer-counter { font-size: 0.82rem; color: #475569; }
.slideviewer-notes-toggle {
  padding: 0.3rem 0.7rem; border: 1px solid #cbd5e1;
  border-radius: 6px; background: #fff; color: #475569; font-size: 0.8rem; cursor: pointer;
}

/* dsvisual-only: slide-level language toggle (no rdvisual equivalent) */
.slide-lang-toggle {
  padding: 0.3rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px;
  background: #fff; color: #475569; font-size: 0.78rem; cursor: pointer;
  margin-left: auto;
}
.slide-lang-toggle:hover { background: #f1f5f9; }

@media (max-width: 680px) {
  .slideviewer-overlay {
    align-items: stretch;
    padding: 0;
  }

  .slideviewer-panel {
    width: 100%;
    max-height: none;
    height: 100vh;
    border-radius: 0;
  }

  .slideviewer-bar {
    gap: 0.45rem;
    padding: 0.55rem;
  }

  .slideviewer-decks {
    flex: 1 1 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    order: 2;
  }

  .slideviewer-deck-btn {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .slideviewer-stage {
    align-items: start;
    padding: 12px;
  }

  .slideviewer-slide {
    width: 100%;
    aspect-ratio: auto;
    min-height: 100%;
    padding: 1rem;
  }

  .slideviewer-slide h1 { font-size: 1.4rem; }
  .slideviewer-slide h2 { font-size: 1.14rem; }

  .slideviewer-slide img { padding: 5px; }
  .slideviewer-slide table.slide-table { white-space: nowrap; }

  .slideviewer-foot {
    align-items: stretch;
    flex-direction: column;
    gap: 0.45rem;
  }

  .slideviewer-foot__nav,
  .slideviewer-foot__meta {
    justify-content: space-between;
    width: 100%;
  }

  .slideviewer-nav-btn {
    flex: 1 1 0;
  }
}

/* Private slides (Drive-gated) */
.slideviewer-deck-btn--private { background: #faf5ff; color: #6b21a8; }
.slideviewer-deck-btn--private.slideviewer-deck-btn--active {
  background: #6b21a8; color: #fff;
}
.slideviewer-deck-btn--signin {
  background: #fef3c7; color: #92400e; font-style: italic; font-weight: 600;
}
.slideviewer-deck-btn--signin:hover { background: #fde68a; }
.slideviewer-deck-btn--denied,
.slideviewer-deck-btn--error {
  background: #f1f5f9; color: #94a3b8; cursor: not-allowed;
}
.slideviewer-deck-btn__sub { font-size: 0.72rem; opacity: 0.85; margin-left: 0.25rem; }
```

- [ ] **Step 5: Sanity-check CSS file parseable**

Run:
```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('style.css','utf8'); const op=(s.match(/{/g)||[]).length; const cl=(s.match(/}/g)||[]).length; console.log('open=',op,'close=',cl); if (op!==cl) process.exit(1);"
```

Expected: `open=N close=N` with the two numbers equal.

- [ ] **Step 6: Commit**

```bash
git add style.css
git commit -m "$(cat <<'EOF'
refactor(style): replace slide-viewer-* rules with rdvisual canonical block

Pure CSS swap — DOM rebuild and app.js rewiring follow. Selectors
referenced by the new block don't yet exist in markup, so the
slide modal will look broken until index.html (Task 2) and app.js
(Task 3) catch up. Single PR — fine for intermediate commits to be
broken on this branch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: DOM restructure in index.html

**Files:**
- Modify: `index.html` (replace lines ~387-405)

- [ ] **Step 1: Read the current slide-viewer DOM block**

Read `index.html` lines 385-410 to confirm exact content.

- [ ] **Step 2: Replace the entire slide-viewer block**

Use Edit tool with this exact transformation. OLD = current block (~lines 387-405); NEW = below.

OLD (verify exact match before edit):
```html
        <div id="slide-viewer" class="slide-viewer" data-testid="slide-viewer" hidden>
            <button type="button" class="slide-viewer-backdrop" data-slide-close aria-label="Close slides"></button>
            <section class="slide-viewer-panel" role="dialog" aria-modal="true" aria-labelledby="slide-viewer-title" tabindex="-1">
                <header class="slide-viewer-header">
                    <div>
                        <p id="slide-viewer-progress">Slide 1 / 1</p>
                        <h2 id="slide-viewer-title">Method slides</h2>
                    </div>
                    <div class="slide-viewer-header-actions">
                        <button type="button" id="slide-lang-toggle" class="slide-lang-toggle"
                                data-i18n-key="aria.lang-toggle" aria-label="Toggle slide language"
                                data-lang="zh">EN</button>
                        <button type="button" class="slide-viewer-close" data-slide-close aria-label="Close slides">×</button>
                    </div>
                </header>
                <div id="slide-viewer-body" class="slide-viewer-body"></div>
                <footer class="slide-viewer-footer">
                    <button type="button" id="slide-prev" class="btn secondary">‹ Prev</button>
                    <button type="button" id="slide-next" class="btn primary">Next ›</button>
                </footer>
            </section>
        </div>
```

(If the actual current block differs from above — likely subtly different button order, classes, or attributes — adapt the OLD string to match exactly. Read the file first.)

NEW:
```html
        <div id="slide-viewer" class="slideviewer-overlay" data-testid="slide-viewer" hidden>
            <div class="slideviewer-panel" role="dialog" aria-modal="true" aria-labelledby="slide-viewer-title" tabindex="-1">
                <div class="slideviewer-bar">
                    <h2 id="slide-viewer-title" class="slideviewer-title">Method slides</h2>
                    <button type="button" id="slide-lang-toggle" class="slide-lang-toggle"
                            data-i18n-key="aria.lang-toggle" aria-label="Toggle slide language"
                            data-lang="zh">EN</button>
                    <button type="button" class="slideviewer-close" data-slide-close
                            data-testid="slideviewer-close" aria-label="Close slides">×</button>
                </div>
                <div class="slideviewer-stage">
                    <div id="slide-viewer-body" class="slideviewer-slide" data-testid="slideviewer-slide"></div>
                </div>
                <div class="slideviewer-notes" data-testid="slideviewer-notes" hidden></div>
                <div class="slideviewer-foot">
                    <div class="slideviewer-foot__nav">
                        <button type="button" id="slide-prev" class="slideviewer-nav-btn"
                                data-testid="slideviewer-prev">‹ Prev</button>
                        <button type="button" id="slide-next" class="slideviewer-nav-btn"
                                data-testid="slideviewer-next">Next ›</button>
                    </div>
                    <div class="slideviewer-foot__meta">
                        <span id="slide-viewer-progress" class="slideviewer-counter">Slide 1 / 1</span>
                        <button type="button" class="slideviewer-notes-toggle"
                                data-testid="slideviewer-notes-toggle" hidden>Notes</button>
                    </div>
                </div>
            </div>
        </div>
```

Key changes:
- `class="slide-viewer"` → `class="slideviewer-overlay"` on root
- `data-testid="slide-viewer"` preserved (so existing tests still find the root)
- `<section class="slide-viewer-panel">` → `<div class="slideviewer-panel">`
- Removed: `<button class="slide-viewer-backdrop">` (overlay handles click-close)
- `<header class="slide-viewer-header">` → `<div class="slideviewer-bar">`
- Title `<h2>` keeps `id="slide-viewer-title"`, adds class `slideviewer-title`
- Progress `<p>` removed from bar; replaced by `<span id="slide-viewer-progress">` in foot meta
- Body now wrapped in `.slideviewer-stage > .slideviewer-slide` (id+class preserved on inner div for backward compat)
- Notes panel added (`hidden` initially)
- Footer rewritten as `.slideviewer-foot` with nav + meta sections
- Nav buttons: id preserved (`slide-prev`/`slide-next`), class changed to `slideviewer-nav-btn`, added `data-testid` attributes
- Notes-toggle button added (`hidden` initially)

- [ ] **Step 3: Verify HTML parseable**

Run:
```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const open = (html.match(/<div\b/g) || []).length;
const close = (html.match(/<\/div>/g) || []).length;
console.log('div open=', open, 'close=', close);
if (open !== close) process.exit(1);
"
```

Expected: open and close counts equal.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
refactor(html): rebuild slide-viewer DOM to match rdvisual structure

bar + stage + slide + notes + foot. Class names renamed slide-viewer-*
→ slideviewer-* (no hyphen in middle). Removed .slide-viewer-backdrop
(overlay click-close instead). Progress span moved from header to foot
meta. Notes panel + notes-toggle added (hidden by default).

IDs preserved for backward compat with app.js JS selectors and test
selectors that use #slide-viewer-title / #slide-viewer-progress /
#slide-viewer-body / #slide-prev / #slide-next. JS rewiring follows
in Task 3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: app.js — rewire selectors + rewrite renderSlide

**Files:**
- Modify: `app.js` (~15 selectors + renderSlide rewrite + notes-toggle handler + overlay-bg click handler)

- [ ] **Step 1: Audit current slide-related selectors**

Run:
```bash
grep -nE "slide-viewer|slide-deck-bar|slide-deck-btn|slide-signin-row|slide-viewer-backdrop" app.js
```

Note every reference. Expected: about 15-20 hits.

- [ ] **Step 2: Update class-based selectors to new names**

Use Edit tool with `replace_all: true` (safe — these are unique class strings):
- `'slide-viewer-panel'` → `'slideviewer-panel'`
- `'.slide-viewer-panel'` → `'.slideviewer-panel'`
- `'slide-deck-bar'` → `'slideviewer-decks'`
- `'slide-deck-btn'` → `'slideviewer-deck-btn'` (replace_all true; covers `--active --private --signin --denied --error` variants)
- `'slide-signin-row'` → `'slideviewer-signin-row'`

Do NOT rename id-based selectors (`#slide-viewer-title`, `#slide-viewer-progress`, `#slide-viewer-body`, `#slide-prev`, `#slide-next`) — those IDs are preserved in the new DOM.

- [ ] **Step 3: Add element references for new DOM**

In the slide-viewer setup section (around `slideViewer = document.getElementById('slide-viewer')`), add:

```js
const slideViewerNotes = slideViewer.querySelector('.slideviewer-notes');
const slideNotesToggle = slideViewer.querySelector('.slideviewer-notes-toggle');
```

- [ ] **Step 4: Rewrite renderSlide() — deck-bar moves to bar, slide content into stage, notes populate panel**

Locate `function renderSlide()` (currently around line 756). Replace its body with:

```js
function renderSlide() {
    if (!slideViewer || slideDeckList.length === 0) return;
    const deck = slideDeckList[slideDeckIndex];
    const slide = deck.slides[slideIndex] || { title: '', body: '', notes: '' };

    // Title — stays in bar, shows deck title for multi-deck, slide title fallback
    slideViewerTitle.textContent = slide.title || deckTitle(deck);

    // Progress / counter — now in foot meta
    slideViewerProgress.textContent = t('slide.progress', {
        n: slideIndex + 1,
        total: deck.slides.length,
    });

    // Deck bar — rendered into bar between title and lang-toggle.
    // Single-deck case: omit (title stands alone, matching rdvisual).
    const bar = slideViewer.querySelector('.slideviewer-bar');
    const existingDecks = bar.querySelector('.slideviewer-decks');
    if (existingDecks) existingDecks.remove();
    if (slideDeckList.length > 1 || slidePrivateSignInNeeded) {
        const decksHtml = renderDeckBar();
        // renderDeckBar returns '<div class="slideviewer-decks">…</div>'; insert
        // after title so order is: title, decks, lang-toggle, close.
        slideViewerTitle.insertAdjacentHTML('afterend', decksHtml);
        bar.querySelectorAll('[data-deck-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-deck-index'), 10);
                if (slideDeckList[idx] &&
                    !(slideDeckList[idx].kind === 'private' &&
                      (slideDeckList[idx].access === 'denied' || slideDeckList[idx].access === 'error'))) {
                    slideDeckIndex = idx;
                    slideIndex = 0;
                    renderSlide();
                }
            });
        });
        const signinRow = bar.querySelector('[data-testid="slideviewer-signin-row"]');
        if (signinRow) {
            signinRow.addEventListener('click', () => {
                closeSlides();
                if (typeof window.openCloudDrawer === 'function') window.openCloudDrawer();
            });
        }
    }

    // Slide body — directly into .slideviewer-slide (slideViewerBody has that class)
    slideViewerBody.innerHTML = slide.body;
    slideViewerBody.scrollTop = 0;

    // Notes panel — show if slide has notes, hide otherwise
    const hasNotes = Boolean(slide.notes && slide.notes.trim());
    if (hasNotes) {
        slideViewerNotes.textContent = slide.notes;
        slideNotesToggle.hidden = false;
        // Respect current toggle state — don't auto-open on slide change
        // (notes panel visibility tracked via slideViewerNotes.hidden)
    } else {
        slideViewerNotes.textContent = '';
        slideViewerNotes.hidden = true;
        slideNotesToggle.hidden = true;
    }

    slidePrev.disabled = slideIndex === 0;
    slideNext.disabled = slideIndex >= deck.slides.length - 1;
}
```

- [ ] **Step 5: Update renderDeckBar() to emit new class names**

Locate `function renderDeckBar()` (currently around line 727). Update the wrapper class and button classes:
- Wrapper: `<div class="slide-deck-bar">` → `<div class="slideviewer-decks" data-testid="slideviewer-decks">`
- Button base: `slide-deck-btn` → `slideviewer-deck-btn`
- Modifier classes: `slide-deck-btn--active` → `slideviewer-deck-btn--active`, etc.
- Sign-in row testid: `slide-signin-row` → `slideviewer-signin-row`
- Sub-text span: `slide-deck-btn__sub` → `slideviewer-deck-btn__sub`

Read the current function body, then Edit to apply all renames.

- [ ] **Step 6: Add notes-toggle click handler**

Near the other slide event-listener setup (after `slidePrev`/`slideNext` listeners), add:

```js
if (slideNotesToggle) {
    slideNotesToggle.addEventListener('click', () => {
        slideViewerNotes.hidden = !slideViewerNotes.hidden;
    });
}
```

- [ ] **Step 7: Add overlay-background click handler (replaces backdrop button)**

Near the close-button setup (search for `data-slide-close`), find where the close handler is wired and add an overlay-bg handler:

```js
// Click anywhere on overlay background (but not the panel) closes the modal.
// Replaces the old .slide-viewer-backdrop button.
slideViewer.addEventListener('click', (e) => {
    if (e.target === slideViewer) closeSlides();
});
```

- [ ] **Step 8: Remove backdrop reference**

Search for any remaining `data-slide-close` handlers that targeted the old backdrop button:
```bash
grep -nE "data-slide-close|slide-viewer-backdrop" app.js
```

The `data-slide-close` handler binds to multiple elements (close button + backdrop); the backdrop is gone but the close button still uses `data-slide-close`. Keep the handler as-is; it will simply find one element instead of two.

- [ ] **Step 9: Quick syntax check**

Run:
```bash
node -c app.js
```

Expected: no output (syntax valid).

- [ ] **Step 10: Commit**

```bash
git add app.js
git commit -m "$(cat <<'EOF'
refactor(app): rewire slide-viewer to new DOM + add notes panel

- Update ~10 class-based selectors slide-viewer-* / slide-deck-* →
  slideviewer-* / slideviewer-deck-*
- IDs preserved (#slide-viewer-title, #slide-viewer-progress,
  #slide-viewer-body, #slide-prev, #slide-next) for backward compat
- renderSlide(): deck-bar moves from inside body to inside .slideviewer-bar
  (single-deck case: omit decks, title stands alone, matching rdvisual)
- Notes panel: populated from slide.notes; toggle button + panel both
  hidden when current slide has no notes
- Overlay-background click closes modal (replaces removed
  .slide-viewer-backdrop button)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: i18n keys for new UI strings

**Files:**
- Modify: `i18n.js` (add 3 keys × 2 locales)

- [ ] **Step 1: Add English keys**

Locate the `en` block (around line 141). Add after `'slide.no-slides'`:

```js
            'slide.notes-toggle':           'Speaker notes',
            'slide.dialog-label':           'Slides for {method}',
            'slide.bar-label':              'Slide controls',
```

Actually — keep it minimal. The notes-toggle button is the only new string strictly needed (counter format is already `slide.progress`; aria labels are inline). Just add:

```js
            'slide.notes-toggle':           'Notes',
```

- [ ] **Step 2: Add Chinese key**

Locate the `zh` block (around line 334). Add after `'slide.no-slides'`:

```js
            'slide.notes-toggle':           '備註',
```

- [ ] **Step 3: Update index.html notes-toggle button text + add i18n hook**

Edit `index.html` Task 2's NEW block: change

```html
<button type="button" class="slideviewer-notes-toggle"
        data-testid="slideviewer-notes-toggle" hidden>Notes</button>
```

to

```html
<button type="button" class="slideviewer-notes-toggle"
        data-testid="slideviewer-notes-toggle"
        data-i18n-key="slide.notes-toggle" hidden>Notes</button>
```

The walker that processes `data-i18n-key` will swap the text when language changes.

- [ ] **Step 4: Commit**

```bash
git add i18n.js index.html
git commit -m "$(cat <<'EOF'
i18n(dsvisual): add slide.notes-toggle key (zh + en)

For the new speaker-notes toggle button in .slideviewer-foot.
data-i18n-key hook on the button lets the i18n walker swap text
on language change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Test selector updates + new assertions

**Files:**
- Modify: `tests/responsive_viewport.spec.js`
- Modify: `tests/cloud-private-slides.spec.js`
- Modify: `tests/heap_visualizer.spec.js`
- Modify: `tests/slides_viewer.spec.js`
- Modify: `tests/visualizer.spec.js`

- [ ] **Step 1: Replace `.slide-viewer-close` with `.slideviewer-close` across all test files**

Run:
```bash
grep -rn "\.slide-viewer-close" tests/
```

Use Edit `replace_all: true` on each file to replace `.slide-viewer-close` → `.slideviewer-close`.

- [ ] **Step 2: Replace `getByTestId('slide-deck-bar')` with `getByTestId('slideviewer-decks')`**

```bash
grep -rn "slide-deck-bar" tests/
```

Edit each occurrence: `'slide-deck-bar'` → `'slideviewer-decks'`.

- [ ] **Step 3: Replace `getByTestId('slide-signin-row')` with `getByTestId('slideviewer-signin-row')`**

```bash
grep -rn "slide-signin-row" tests/
```

Edit each: `'slide-signin-row'` → `'slideviewer-signin-row'`.

- [ ] **Step 4: Add new Playwright test — 16:9 stage present**

Append to `tests/slides_viewer.spec.js`:

```js
test('slide stage has 16:9 aspect ratio', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-method="stack-array"]').click();
  await page.locator('[data-mode="slides"]').click();
  await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();

  const stage = page.locator('.slideviewer-stage');
  await expect(stage).toBeVisible();

  const slide = page.locator('.slideviewer-slide').first();
  const box = await slide.boundingBox();
  // Allow ±2% tolerance for browser rounding
  const ratio = box.width / box.height;
  expect(ratio).toBeGreaterThan(16/9 * 0.98);
  expect(ratio).toBeLessThan(16/9 * 1.02);
});

test('notes toggle hidden on public deck (no notes)', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-method="stack-array"]').click();
  await page.locator('[data-mode="slides"]').click();
  await expect(page.locator('[data-testid="slideviewer-notes-toggle"]')).toBeHidden();
});
```

(Adjust the method/mode selectors above to match dsvisual's actual interaction pattern — verify by running the new test locally and adjusting the click selectors if they don't exist.)

- [ ] **Step 5: Run unit tests first (fast)**

```bash
node --test tests/unit/
```

Expected: all unit tests pass (they don't reference slide DOM).

- [ ] **Step 6: Run full Playwright suite**

```bash
npm test
```

Expected: 107+ tests pass (existing count plus the 2 new ones). If any fail, debug the specific failure.

- [ ] **Step 7: Commit**

```bash
git add tests/
git commit -m "$(cat <<'EOF'
test(dsvisual): update selectors for slide-style alignment

- Rename .slide-viewer-close → .slideviewer-close (5 occurrences across
  tests)
- Rename test-ids slide-deck-bar → slideviewer-decks,
  slide-signin-row → slideviewer-signin-row
- New tests: 16:9 stage aspect ratio, notes-toggle hidden on public deck

ID-based selectors (#slide-viewer-title, #slide-viewer-progress,
#slide-viewer-body, #slide-prev, #slide-next) preserved on new DOM —
no test changes needed for those.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Final verify + manual smoke + PR

**Files:** none modified

- [ ] **Step 1: Build slides (no functional change expected, but verify pipeline still works)**

```bash
npm run build:slides
```

Expected: `Generated 78 decks for zh, en`.

- [ ] **Step 2: Run full test suite one more time**

```bash
npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 3: Manual visual smoke (controller-only step — defer to user)**

The user should:
- Open the dsvisual app locally (`npx http-server -p 8080` or similar)
- Click any method, open Slides mode
- Verify each item from the design spec's visual acceptance criteria (13 checkboxes)
- Open https://skhuang.github.io/rdvisual/ in another tab; compare any deck side-by-side
- Test resize to mobile (DevTools 375px width); verify mobile layout

Document any visual deviations as follow-up tickets; this plan doesn't include another iteration.

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin feat/slide-style-align
gh pr create --base main --head feat/slide-style-align \
  --title "feat(dsvisual): align slide-modal style with rdvisual/stvisual" \
  --body "$(cat <<'BODY'
## Summary

Makes the in-app slide modal visually + structurally identical to rdvisual/stvisual:
- 16:9 stage with gray backdrop (`#e2e8f0`)
- macOS traffic-light dots on code blocks
- Speaker-notes panel (toggleable, auto-hidden when current slide has no notes)
- Slate color palette, `#1d4ed8` accent, image card frame, math styling
- Mobile-responsive at 680px breakpoint
- Class names renamed `slide-viewer-*` → `slideviewer-*` (no hyphen) matching rdvisual convention

Preserves dsvisual-specific UX:
- Slide-level language toggle (no rdvisual equivalent) — stays in bar
- Public-slide inline `type:"note"` blocks render unchanged (separate from new speaker-notes panel which only populates from Marp `<!-- -->` comments)

Spec: [docs/superpowers/specs/2026-05-26-slide-style-align-design.md](docs/superpowers/specs/2026-05-26-slide-style-align-design.md)

## Changes

| Area | Action |
|------|--------|
| `style.css` | Delete old `.slide-viewer-*` rules; append canonical 266-line block from rdvisual SlideViewer.css + dsvisual-specific lang toggle block |
| `index.html` | Rebuild slide-viewer DOM: `overlay > panel > {bar, stage, notes, foot}`; IDs preserved for backward compat |
| `app.js` | Update class selectors; rewrite `renderSlide()` to drive new DOM; deck-bar moves to bar; notes panel populates from `slide.notes`; overlay-bg click closes modal |
| `i18n.js` | New key `slide.notes-toggle` (zh + en) |
| `tests/` | Selector updates + 2 new tests (16:9 stage, notes-toggle hidden on public deck) |

## Test plan

- [x] `node --test tests/unit/` — all unit tests pass
- [x] `npm test` — all Playwright tests pass (existing + 2 new)
- [x] `npm run build:slides` — generates 78 decks for zh, en
- [ ] Visual smoke vs rdvisual side-by-side (defer to reviewer)
- [ ] Mobile (<680px) responsive layout

## Risks

- Intermediate commits on this branch are not green (CSS rules don't match DOM until Task 2; renderSlide breaks until Task 3). Final commit on the branch is green. CI runs only on the final SHA.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

- [ ] **Step 5: Watch CI**

Once PR is open, monitor:
```bash
gh pr checks <PR#>
```

Expected: unit-test ✓, browser-test ✓ (whichever workflows dsvisual has). Wait for all green before requesting review.

- [ ] **Step 6: Update todo list — execution complete**

Mark all execution todos completed. Plan is done; PR awaits user review.
