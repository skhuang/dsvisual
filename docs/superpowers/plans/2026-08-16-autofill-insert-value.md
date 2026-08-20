# Auto-fill Insert Value Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-populate the single insert-value field with a fresh random value (on mount + after each successful insert/clear) for heap, hash, deque, Bloom, skip-list, and CMS — matching the existing stack/queue/tree behavior.

**Architecture:** In each of the six viz modules, set the insert-value input to a random value (numeric `1..99` for heap/hash/deque/skip-list; a short random word for Bloom/CMS) at three moments: when the control is first built, after a successful insert, and after clear/reset (where present). Mirror the existing `randStdValue()`/`randKey()` idiom. Do NOT touch search/query fields, algorithms, rendering, the batch 🎲, or the heap tutorial's own value-setting.

**Tech Stack:** Vanilla JS; `js/domains/heap.js`, `js/domains/hash.js`, `js/domains/linear.js`, `js/viz/viz_bloom.js`, `js/viz/viz_skiplist.js`, `js/viz/viz_cms.js`; Playwright.

## Global Constraints

- Branch `feat/autofill-insert-value` (dsvisual).
- Numeric fields (heap `#heap-val`, hash `#hash-val`, deque `data-deque-val`, skip-list `data-skiplist-val`): random int `1..99` (mirror `randStdValue()` in `js/domains/linear.js:7`). Text fields (Bloom `data-bloom-val`, CMS `data-cms-val`): a short random lowercase word (reuse the module's existing word generator if present, else a small pool).
- **Plain random, NOT difficulty-aware** (consistent with the existing auto-fills — it's a single value).
- Set the insert field at: (a) control build/mount, (b) after a SUCCESSFUL insert, (c) after clear/reset where the viz has such a button.
- Do NOT touch search/query/delete inputs (skip-list's `data-skiplist-search` stays put), the batch 🎲 (`.rand-btn`/`.legacy-rand-btn`), any algorithm/render code, or generated files (`js/code_db.js`, `js/*_rendered.js`).
- **HEAP SPECIAL:** the tutorial sets `#heap-val` to guided step values (`js/domains/heap.js:222`). Auto-fill only the normal user-insert path and initial mount — do NOT alter the tutorial's value-setting, and the auto-fill must not fire while the tutorial is driving values (read heap.js to see how tutorial mode is detected; if unsure, only refill in the `btn-heap-insert` click handler after a real insert and at mount).
- **HASH ANIMATION:** insert runs through `K().executeAnimWrapper(...)` (`js/domains/hash.js:126-128`). Read the value before the wrapper; refill `#hash-val` after the insert completes — don't interrupt the animation sequence.
- Run `npm run test:all` (unit deterministic gate; re-run any Playwright flake in isolation and note it).
- Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Auto-fill the insert value in all six modules

**Files:** Modify `js/domains/heap.js`, `js/domains/hash.js`, `js/domains/linear.js`, `js/viz/viz_bloom.js`, `js/viz/viz_skiplist.js`, `js/viz/viz_cms.js`; Test `tests/autofill_insert.spec.js` (new).

**Interfaces:** No new global surface — behavioral change to existing insert handlers. Reference idiom: `js/domains/linear.js:134` (`dom.stdVal.value = String(randStdValue())`) and `js/domains/tree.js:255` (`if (rbInsert(+input.value)) input.value = randKey()`).

- [ ] **Step 1: Write the failing e2e test** — `tests/autofill_insert.spec.js`. For each of the six methods, load it and assert: (a) the insert field is non-empty on load (numeric in 1..99 for the four numeric ones; non-empty word for bloom/cms); (b) after performing one insert, the field changes to a new valid value. Mirror the `expectRandomizes` retry helper from `tests/random_input.spec.js` to avoid same-random-value coincidences. Verify the exact methodIds + insert-button/field selectors by reading each module first (heap `#heap-val` + `#btn-heap-insert`; hash `#hash-val` + the add button; deque `[data-deque-val]` + deque insert; bloom `[data-bloom-val]` + `[data-action="bloom-insert"]`; skiplist `[data-skiplist-val]` + `[data-action="skiplist-insert"]`; cms `[data-cms-val]` + its insert/increment action). Also add a heap tutorial-safety assertion: when the heap tutorial is active and drives a step value, `#heap-val` shows the tutorial's value (auto-fill did not override it).

- [ ] **Step 2: Run it — expect FAIL** (fields keep their fixed/old value after insert). `npx playwright test tests/autofill_insert.spec.js --reporter=line`

- [ ] **Step 3: Implement per module** (read each module's insert handler + mount/init first):
  - **heap** (`js/domains/heap.js`): add a `randInsertVal()` (int 1..99). In the `btn-heap-insert` click handler, after a successful user insert, set `dom.heapValInput.value = randInsertVal()`. At control mount/first render, set it once. Do NOT touch the tutorial path at `:222` and do NOT auto-fill while the tutorial is driving values.
  - **hash** (`js/domains/hash.js`): read the value before `executeAnimWrapper`; after the insert completes, set `dom.hashVal.value = randInsertVal()`. Set it at mount too.
  - **deque** (`js/domains/linear.js`): the deque path currently renders `value="42"`. Set the deque insert field to `randStdValue()` at build and after a successful deque insert (mirror the stack/queue `stdVal` handling in the same file).
  - **Bloom** (`js/viz/viz_bloom.js`): random short word at build (replace the sticky/default) and after `bloom-insert` succeeds.
  - **skip-list** (`js/viz/viz_skiplist.js`): random int at build (replace `value="15"`) and after `skiplist-insert` succeeds. Leave `data-skiplist-search` untouched.
  - **CMS** (`js/viz/viz_cms.js`): random short word at build (replace `value="apple"`) and after its insert/increment succeeds.

- [ ] **Step 4: Run — expect PASS**, then the full suite. `npx playwright test tests/autofill_insert.spec.js --reporter=line` then `npm run test:all`.
Expected: the new spec passes; full suite green (existing heap/hash/deque/bloom/skiplist/cms specs unaffected; heap tutorial specs still pass).

- [ ] **Step 5: Commit** `git commit -m "feat(viz): auto-fill random insert value (heap/hash/deque/bloom/skiplist/cms)"`

---

## Final gate

- [ ] `npm run test:all` green.
- [ ] Grep: each of the six modules sets its insert field to a random value at mount and after insert; search/query fields untouched; heap tutorial value-setting (`:222`) unchanged; batch 🎲 handlers unchanged.
- [ ] Generated files untouched.
- [ ] Open a PR to `main` and merge on green.
