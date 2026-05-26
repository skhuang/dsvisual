# Manual smoke test — slide-style alignment (PR #71)

**Branch:** `feat/slide-style-align`
**Estimated time:** ~10 minutes
**Reference:** [spec](../specs/2026-05-26-slide-style-align-design.md) · [plan](../plans/2026-05-26-slide-style-align.md)

## Setup

```bash
cd /Users/skhuang/course/dsvisual
git checkout feat/slide-style-align
npm run build:slides    # if you haven't already
npx http-server -p 8080 # or any static server; open http://localhost:8080
```

For side-by-side comparison, open https://skhuang.github.io/rdvisual/ in another tab. The slide modal in dsvisual after this PR should look essentially the same as rdvisual.

If anything fails: **don't merge**. Comment on PR #71 with what you saw, and re-dispatch a fix.

---

## Part A — Visual acceptance criteria (13 items from spec)

Pick a public method to test most of these. Recommended: **Trees → 二元搜尋樹 (BST)** — has code blocks, math, lists.

Open the BST page → click the **Slides** mode/tab to launch the modal.

- [ ] **1. Modal centered, semi-transparent dark backdrop** — the modal sits in the middle of the viewport with a translucent dark overlay (`rgba(15,23,42,0.72)`) over the page behind it. Not a full-bleed drawer.

- [ ] **2. 16:9 stage with gray background** — the slide is contained inside a centered white frame surrounded by a gray stage (`#e2e8f0`). The slide's width/height ratio is 16:9.

- [ ] **3. White slide with subtle shadow + light border** — the slide itself has a thin `#cbd5e1` border, soft shadow, white `#fff` background.

- [ ] **4. macOS traffic-light dots on code blocks** — navigate to a slide that has a code block. In the top-left of the dark code panel you should see a small gradient bar with red / amber / green dots (`#f87171 / #fbbf24 / #34d399`).

- [ ] **5. Math centered, larger font, slate color** — if the slide has any LaTeX math (e.g., complexity analysis like `$O(\log n)$`), it should be centered, slightly larger than body text, dark slate color.

- [ ] **6. Images: padded white card with shadow** — if the slide has an image, it has small padding, light border, soft shadow, white `#f8fafc` background frame.

- [ ] **7. Tables: slate header + zebra stripes** — if the slide has a table, the header row is light gray `#f1f5f9` with bold dark text; even rows are subtly lighter `#fbfdff`.

- [ ] **8. Blockquotes: blue left border, light-blue background** — if any slide has `> quote text`, it should have a 3px blue left border (`#1d4ed8`) and a light blue `#eff6ff` background.

- [ ] **9. Foot nav buttons: outline + accent border** — the "Previous" / "Next" buttons in the foot are white with `#1d4ed8` blue border and blue text (outline style, not filled).

- [ ] **10. Counter in foot right side** — the "Slide 1 / 8" text appears in the bottom-right of the modal (in foot meta), not in the top header where it used to be.

- [ ] **11. Notes panel on private Marp deck** — [see Part B item 2 below] requires a Drive-fetched deck.

- [ ] **12. Notes toggle hidden on public deck** — when viewing BST (public method), the "Notes" / "備註" button in the foot's right side should be **hidden** (`display: none`). You should NOT see it on any of the 8 slides.

- [ ] **13. Mobile drawer layout at ≤680px** — [see Part C below].

---

## Part B — User-facing behavior changes (final reviewer risks #1-2)

- [ ] **B1. Multi-deck button layout in bar** — find a method that has multiple decks. (If unsure: in Settings or via `dsvisualCloudConfig.drive.privateSlidesFolderId` set to a fake value to force a sign-in row.) When the bar has multiple decks, confirm the order from left to right is:
  
  `[deck buttons (slideviewer-decks)] [EN/中 lang toggle] [×]`
  
  And that the bar wraps gracefully if titles + decks are long. Title (`Method slides` / actual slide title) is suppressed in the multi-deck case (rdvisual behavior).

- [ ] **B2. Speaker notes panel on a private deck** — requires Drive auth + a private `.md` with `<!-- speaker notes -->`.
  
  1. Sign in via the ☁ cloud button.
  2. Open a method that has a private deck attached (e.g., `method: "tree-bst"` per the example manifest).
  3. In the foot's right side, the **"Notes" / "備註"** button should now be visible (previously hidden).
  4. Click it. An amber strip (`#fffbeb` bg, `#78350f` text) should appear between the slide stage and the foot, containing the parsed `<!-- -->` content.
  5. Click again — strip collapses.
  6. Navigate to next slide — the panel state should persist (still open / still closed).
  7. Switch from private deck back to public deck — the "Notes" button should disappear, panel should be hidden.
  8. Re-open the slide modal (close × → click Slides again) — notes panel should be reset to hidden even if the new slide has notes (per `openSlides()` reset logic).

---

## Part C — Mobile (final reviewer risk #3)

- [ ] **C1. ≤680px responsive layout** — DevTools (Cmd+Opt+I), toggle device toolbar, set width to **375px** (iPhone) or **600px**:
  
  1. Open any slide.
  2. Modal becomes a **full-height drawer** (no centering, no gray stage padding, fills entire viewport).
  3. The bar's `.slideviewer-decks` (if present) reflows with horizontal scroll, `order: 2`.
  4. The slide loses its `aspect-ratio: 16/9` — fills available space, scrolls vertically.
  5. The foot stacks vertically: `nav` row above `meta` row.
  6. Prev/Next buttons stretch to equal widths (`flex: 1 1 0`).
  7. `h1` / `h2` shrink to `1.4rem` / `1.14rem`.

- [ ] **C2. Resize back to desktop (>680px)** — layout should restore cleanly with no glitches.

---

## Part D — New interaction patterns (final reviewer risks #4-5)

- [ ] **D1. Click outside panel to close** — open the slide modal, click on the gray-ish darkened area OUTSIDE the white panel but inside the modal overlay. The modal should close.
  
  Negative case: click INSIDE the panel (e.g., on the gray stage border between the panel border and the slide). Modal should NOT close — `e.target` check only fires on direct overlay clicks.
  
  Negative case 2: click directly on the slide content. Modal should NOT close.

- [ ] **D2. Language switch while viewer is open** — open the modal. Click the EN/中 button in the bar. The deck bar (if visible) should repopulate with translated titles, slide content stays the same (slides themselves are language-specific via `slides[lang]`).

---

## Part E — Removed behavior (final reviewer risk #6)

- [ ] **E1. Removed nav button hint text** — the old footer had `→ Space` and `← ←` keyboard hints via CSS `::after` on Next/Prev. These are GONE in the new design (matches rdvisual). Confirm keyboard nav still works:
  
  - `→` / `Space` / `PageDown` advances to next slide
  - `←` / `PageUp` goes back
  - `Home` jumps to first slide
  - `End` jumps to last slide
  - `Esc` closes the modal
  
  Functionality preserved; only the visible hint label is removed. Verify you don't miss the hint label cognitively.

---

## Part F — A11y spot-check (final reviewer risk #7)

- [ ] **F1. Screen reader / DevTools accessibility tree** — open DevTools → Accessibility tab → inspect the `.slideviewer-notes` element on a public deck (when it's `hidden`).
  
  - Verify it has `role="region"` and `aria-label="Slide speaker notes"`.
  - When `hidden`, it should NOT be announced (browser respects `hidden`).
  - When toggled visible (on a private deck with notes), it should be in the a11y tree as a labeled region.
  
  Optional with VoiceOver (macOS): toggle on (Cmd+F5), navigate the modal, ensure announcements are coherent.

- [ ] **F2. Dialog contract preserved** — confirm `.slideviewer-panel` has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="slide-viewer-title"`, `tabindex="-1"`. Open modal, press Tab — focus should be trapped inside (jumps from last focusable element back to first).

---

## Verdict

After running through Parts A-F:

- [ ] All checks passed → **merge PR #71** (\`gh -R skhuang/dsvisual pr merge 71 --merge --delete-branch\`)
- [ ] Some checks failed → **do NOT merge**. List what failed in a PR review comment. Re-dispatch a fix-up implementer with the specifics.

## Post-merge verification

After merge, GitHub Pages will redeploy. Once it does:

- [ ] Visit https://skhuang.github.io/dsvisual/ — repeat Parts A item 1, 2, 4 (the visually obvious ones) on the live site to confirm CDN cache cleared and the new CSS is live.
- [ ] Visit https://skhuang.github.io/rdvisual/ side by side — slide modals should look essentially identical (modulo dsvisual having the EN/中 toggle inside the bar).
