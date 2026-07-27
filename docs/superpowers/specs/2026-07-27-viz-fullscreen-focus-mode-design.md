# Fullscreen / Focus mode — design

- Date: 2026-07-27
- Repo: `/Users/skhuang/course/dsvisual`
- App-shell feature (not a viz): a toggle that collapses the page to only the active
  visualization window, hiding all surrounding chrome, with a control to restore normal mode.

## Goal

A **全螢幕 / 專注模式 (fullscreen focus mode)** for the visualizer: one click hides the Title,
Top Menu, and Source code (and the surrounding card chrome), leaving **only the active
visualization window**, expanded to fill the screen. A restore control (button + Esc) returns to
normal mode. "Both combined" mechanism: an in-page CSS focus layer **plus** a real OS-level
`requestFullscreen()`, kept in sync so exiting either exits both.

## Behaviour

- **Enter:** from the active method card, click the fullscreen toggle. The page enters focus mode:
  - Hidden: `.app-header` (Title), `.app-category-nav` (Top Menu), `.method-sections-heading`,
    the per-card `.method-section-header` (which carries the zoom controls, code-drawer trigger,
    and Slides button), the `.code-drawer` aside, and any side-by-side code panel — i.e. the
    Source code and all surrounding chrome.
  - Shown & expanded: the active card's `.method-section-visual` (the live viz **and its own
    controls** — VCR transport bar, inputs, examples select — all render inside it) fills the
    viewport and scrolls internally for oversized graphs/matrices.
  - On top of the CSS layer, `document.documentElement.requestFullscreen()` is requested for true
    OS fullscreen. If it rejects (permissions / headless), focus mode still applies via the CSS
    layer — the two are independent.
- **Exit:** a persistent floating button (top-right, visible only in focus mode) **or** the **Esc**
  key. Exiting removes the CSS class and, if an OS fullscreen is active, calls `exitFullscreen()`.
  Leaving OS fullscreen by the browser's own means (Esc / F11) fires `fullscreenchange`, whose
  handler also drops the CSS class — so the two layers never desync.
- **Availability:** the toggle lives inside the active method card's header, so focus mode is only
  reachable when a live visualization is on screen. Overview / no-active-method states have no
  toggle.

## Architecture (files)

- **`index.html`** (modify): add ONE persistent floating exit button as a direct child of
  `.app-container` (or `<body>`), hidden by default:
  ```html
  <button type="button" id="viz-focus-exit" class="viz-focus-exit" hidden
          data-i18n-key="btn.exit-fullscreen"
          data-i18n-aria-label="aria.exit-fullscreen"
          aria-label="Exit fullscreen">✕ Exit fullscreen</button>
  ```
  Its visibility is driven by CSS (`body.viz-focus`); it is NOT toggled via the `hidden` attribute
  at runtime (the attribute is just the pre-focus default). No new `<script>` tags — logic lives in
  the existing `js/app.js`.

- **`js/app.js`** (modify) — two edits:
  1. In `renderMethodSections`, inside the `.method-section-actions` markup (the same block that
     renders the zoom controls, code-drawer toggle, and Slides button), add the toggle button
     **before** the Slides button:
     ```html
     <button type="button" class="btn secondary viz-focus-toggle" data-testid="viz-focus-toggle"
             aria-pressed="false" title="${t('btn.fullscreen')}">⛶ ${t('btn.fullscreen')}</button>
     ```
     Using `t()` at render time localises it; `languagechange` already re-renders sections.
  2. A small self-contained **focus module** (top-level in the app IIFE, wired once during init).
     Exact interface:
     - `fsRequest(el)` / `fsExit()` / `fsElement()` — cross-browser helpers covering unprefixed +
       `webkit*` (Safari): e.g. `el.requestFullscreen || el.webkitRequestFullscreen`,
       `document.exitFullscreen || document.webkitExitFullscreen`,
       `document.fullscreenElement || document.webkitFullscreenElement`.
     - `enterFocus()` → `document.body.classList.add('viz-focus')`; set the active toggle's
       `aria-pressed="true"`; `try { const p = fsRequest(document.documentElement); if (p) p.catch(()=>{}); } catch (_) {}`.
     - `exitFocus()` → `document.body.classList.remove('viz-focus')`; set toggle `aria-pressed="false"`;
       `if (fsElement()) { try { fsExit(); } catch (_) {} }`.
     - `onFsChange()` (bound to `fullscreenchange` + `webkitfullscreenchange`) → if `!fsElement()`
       **and** `document.body.classList.contains('viz-focus')`, call `exitFocus()`. (No recursion:
       `fsElement()` is already null here, so `exitFocus` won't call `fsExit`.)
     - `onKeydown(e)` (added on `document` on enter, removed on exit) → `if (e.key === 'Escape') exitFocus()`.
       Covers the case where OS fullscreen was never entered; when it was, the browser's Esc→exit
       path is handled by `onFsChange`.
     - Toggle click handler (delegated): a `click` listener that matches `.viz-focus-toggle` →
       `document.body.classList.contains('viz-focus') ? exitFocus() : enterFocus()`. Delegation (one
       `document`-level listener) avoids re-wiring on every `renderMethodSections` re-render.
     - The `#viz-focus-exit` button's `click` → `exitFocus()` (wired once at init).
     - `fullscreenchange`/`webkitfullscreenchange` listeners wired once at init.

- **`style.css`** (modify) — a `body.viz-focus` block:
  - `body.viz-focus .app-header,
     body.viz-focus .app-category-nav,
     body.viz-focus .method-sections-heading,
     body.viz-focus .method-section-header,
     body.viz-focus .code-drawer,
     body.viz-focus .method-section-code,
     body.viz-focus .method-section-card:not(.active) { display: none !important; }`
    (`!important` guards against the inline/`.active` specificity already on those elements.)
  - `body.viz-focus .method-section-card.active .method-section-visual {
        position: fixed; inset: 0; z-index: 2000; border-radius: 0; margin: 0;
        max-height: none; overflow: auto; }`
  - `.viz-focus-exit { display: none; }` normally; `body.viz-focus .viz-focus-exit {
        display: inline-flex; position: fixed; top: 12px; right: 12px; z-index: 2100; }`
    (z above the fixed visual so it stays clickable), plus button styling consistent with `.btn`.
  - Confirm no ancestor of `.method-section-visual` establishes a transform/filter containing block
    that would break `position: fixed` (checked: `.app-container` has none; the zoom transform is
    applied to a wrapper *inside* the visual, not an ancestor). If a problem surfaces, fall back to
    `position: fixed` on the card with the visual stretched — but the direct approach is expected to
    work.

- **`js/i18n.js`** (modify) — add to BOTH `en` and `zh` dicts (Traditional zh-Hant):
  - `btn.fullscreen`: en `Fullscreen`, zh `全螢幕`
  - `btn.exit-fullscreen`: en `✕ Exit fullscreen`, zh `✕ 離開全螢幕`
  - `aria.fullscreen-toggle`: en `Toggle fullscreen focus mode`, zh `切換全螢幕專注模式`
  - `aria.exit-fullscreen`: en `Exit fullscreen`, zh `離開全螢幕`

- **`tests/viz_fullscreen.spec.js`** (new, Playwright e2e).

## Tests

e2e (`tests/viz_fullscreen.spec.js`) — assert ONLY the CSS-focus layer, never OS-fullscreen state
(headless Chromium fullscreen is flaky; `requestFullscreen` is wrapped so the focus layer is
independent of it):
- Load `#m=graph-scc`; the `.viz-focus-toggle` button is present and `body` lacks `viz-focus`.
- The `.app-header` and `.app-category-nav` are visible; `#viz-focus-exit` is hidden.
- Click `.viz-focus-toggle` → `body` has class `viz-focus`; `.app-header` and `.app-category-nav`
  are now hidden (not visible); `#viz-focus-exit` is visible; the active
  `.method-section-visual` is still visible.
- Click `#viz-focus-exit` → `body` no longer has `viz-focus`; `.app-header` visible again;
  `#viz-focus-exit` hidden again.
- Re-enter, then press `Escape` → `body` no longer has `viz-focus` (Esc exit path).
- (Optional) toggle `aria-pressed` reflects state.

No unit test — this is DOM/CSS behaviour with no extractable pure-logic module.

## Verification

`npm test` (FULL Playwright) green incl. the new spec + no regression to existing specs
(smoke_modes, code-drawer, category-nav, overview). Browser spot-check in zh + en: enter via the
card button (OS fullscreen engages), only the viz + its VCR controls remain, large graph scrolls;
exit via floating button, via Esc, and via the browser's native fullscreen-exit — all three restore
the full chrome and stay in sync. Confirm the toggle localises on language switch.

## Global constraints

- Concurrent refactor sessions in this repo — targeted `git add` by explicit path only; never
  `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`); this
  feature touches none of them.
- One branch + PR. No new category ⇒ `.overview-category` count unchanged.

## Out of scope

- Keeping the zoom controls / Slides button reachable while in focus mode (the whole
  `.method-section-header` is hidden by request — "其餘都隱藏").
- A remembered/persisted focus preference across reloads (focus mode is transient per session).
- A per-viz "present" mode with narration, auto-advance, or a distinct focus layout.
- Fullscreening the overview or non-live states.

## Success criteria

A fullscreen focus toggle ships in the app shell: one click hides Title, Top Menu, Source code, and
card chrome and expands the active visualization (with its VCR/input/examples controls) to fill the
screen at both the CSS-focus and OS-fullscreen levels; a floating button and Esc restore normal
mode; the CSS and OS layers stay in sync (exiting either exits both); toggle + exit labels are
bilingual (Traditional zh) and localise live; full Playwright green (new spec asserts the CSS layer
only); one review-passed PR.
