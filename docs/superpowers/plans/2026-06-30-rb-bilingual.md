# Red-Black Tree Bilingual (zh/en) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Red-Black Tree visualization's UI text and step-log descriptions bilingual (switch with the app language), replacing the hardcoded Traditional Chinese.

**Architecture:** In `js/tree_rb_viz.js`, change `_emit`'s `title`/`detail` (and the 6 PRESET names) from Chinese strings to `{zh, en}` objects — keep the existing zh verbatim, add faithful CLRS English. In `renderTreeRB` (js/app.js), add a local `langOf` and render every UI string + step-log entry through it; ensure a language switch re-renders tree-rb. Update the tests to be language-stable and add an English check.

**Tech Stack:** Vanilla browser JS, `node --test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-30-rb-bilingual-design.md`

## Global Constraints

- `_emit(type, title, detail, nodes)`: `title` and `detail` become `{zh, en}` objects (zh kept verbatim, en added). `step.type` and node labels (`_lbl`) stay language-neutral. This is a contract change; the ONLY consumer is `renderTreeRB` (updated in Task 2) + the unit test.
- English must be technically correct and match the zh meaning, using CLRS terminology (see glossary).
- Do NOT change RB algorithm logic, slides (already bilingual), other viz, or method/group counts.
- `langOf` pattern: `(msg) => (window.I18N && I18N.getCurrentLanguage() === 'zh') ? msg.zh : msg.en`.
- Do NOT touch `js/cloud-config.js`.

## CLRS Glossary (use consistently for `en`)
- 左旋 → left-rotate; 右旋 → right-rotate; 旋轉 → rotation
- 變色 / 重新著色 → recolor; 塗紅 → color red; 塗黑 / 轉黑 → color black; 轉紅 → color red
- 紅紅衝突 → red-red violation; 黑高度 → black-height
- 叔叔 → uncle; 父 → parent; 祖父 → grandparent; 兄弟 → sibling; 侄 → nephew; 後繼 → successor
- 內側 → inner (triangle) case; 外側 → outer (line) case; LL/LR/RL/RR kept as-is
- 往上丟 / 上竄 → propagate up; 修復 → fix-up; 哨兵 → sentinel (NIL); 根 → root; 子樹 → subtree; β 子樹 → the β subtree
- Case labels keep their numbers: 「Case 1」→ "Case 1", 「Delete Case 2」→ "Delete Case 2".

---

## Task 1: `js/tree_rb_viz.js` — bilingual step text + presets

**Files:** Modify `js/tree_rb_viz.js`; Test `tests/unit/tree_rb_viz.test.js`

**Interfaces:**
- Produces: every emitted `step.title` and `step.detail` is `{zh:string, en:string}` (both non-empty). `PRESETS[i]` gains `{ id:string, name:{zh,en} }` (plus its existing op/seq fields). `step.type` unchanged.

- [ ] **Step 1: Convert every `_emit(type, title, detail, nodes)` call** so `title` and `detail` are `{zh, en}`. Keep the existing Chinese verbatim as `.zh`; add faithful English as `.en` (glossary above). The interpolated `_lbl(node)` is used inside both language strings. Worked examples (apply the same transformation to ALL `_emit` sites — rotations, insert Case 1/2/3 + both mirrors, root-black, delete cases 1–4 + mirrors, delete grafts, "no fix-up needed", etc.):

  leftRotate (js/tree_rb_viz.js ~79):
  ```js
  this._emit('rotate',
    { zh: (note ? note + '｜' : '') + `左旋 @ ${this._lbl(x)}`,
      en: (note ? note + ' | ' : '') + `Left-rotate @ ${this._lbl(x)}` },
    { zh: `${this._lbl(y)} 升上來當這棵小樹的根，${this._lbl(x)} 下沉成它的左子` + (b ? `；中間子樹 β（根 ${this._lbl(b)}）換邊，改掛到 ${this._lbl(x)} 的右側` : `；β 子樹是空的，不用搬`),
      en: `${this._lbl(y)} rises to the subtree root and ${this._lbl(x)} sinks to be its left child` + (b ? `; the middle subtree β (root ${this._lbl(b)}) switches sides, re-attaching as ${this._lbl(x)}'s right child` : `; the β subtree is empty, nothing to move`) },
    /* nodes... unchanged */);
  ```

  insert Case 1 (js/tree_rb_viz.js ~130):
  ```js
  this._emit('recolor',
    { zh: `Case 1：叔叔 ${this._lbl(u)} 也是紅的 → 只變色`,
      en: `Case 1: uncle ${this._lbl(u)} is also red → recolor only` },
    { zh: `父 ${this._lbl(p)}、叔 ${this._lbl(u)} 轉黑，祖父 ${this._lbl(g)} 轉紅。紅紅衝突沒有消失，而是往上丟給 ${this._lbl(g)} —— 這就是會一路往上竄的那種修復`,
      en: `Parent ${this._lbl(p)} and uncle ${this._lbl(u)} become black, grandparent ${this._lbl(g)} becomes red. The red-red violation isn't gone — it propagates up to ${this._lbl(g)}, the kind of fix-up that can climb all the way up` },
    /* nodes */);
  ```

  root-black (js/tree_rb_viz.js ~168):
  ```js
  this._emit('recolor',
    { zh: `根一律塗黑`, en: `Always color the root black` },
    { zh: `衝突竄到最頂了：把根 ${this._lbl(this.root)} 塗黑收尾，整棵樹黑高度 +1`,
      en: `The violation reached the top: color the root ${this._lbl(this.root)} black to finish; the whole tree's black-height increases by 1` },
    [this.root]);
  ```

  Apply the SAME pattern to every remaining `_emit` (insert Case 2/3 + RL/LR/LL/RR notes, delete `摘掉`/graft messages, Delete Case 1–4 + mirrors, `不用修復`). Keep zh verbatim; translate en faithfully per glossary.

- [ ] **Step 2: PRESETS** (js/tree_rb_viz.js ~648) — give each preset a stable `id` and make `name` bilingual:
  ```js
  { id: 'grow-1-15',       name: { zh: '樹的成長：依序插入 1–15', en: 'Tree growth: insert 1–15 in order' }, /* existing fields */ },
  { id: 'recolor-18',      name: { zh: '深樹連鎖 I：變色一路爬頂（18 顆）', en: 'Recolor cascade I: recolor climbs to the root (18 nodes)' }, ... },
  { id: 'recolor-38',      name: { zh: '深樹連鎖 II：更深更長（38 顆）', en: 'Recolor cascade II: deeper and longer (38 nodes)' }, ... },
  { id: 'delete-3rot',     name: { zh: '刪除三連旋（31 顆）', en: 'Delete → three consecutive rotations (31 nodes)' }, ... },
  { id: 'delete-recolor',  name: { zh: '刪除變色上竄（16 顆）', en: 'Delete: recolor propagates up (16 nodes)' }, ... },
  { id: 'random-15',       name: { zh: '隨機 15 顆', en: 'Random 15 nodes' }, ... },
  ```
  (Keep each preset's existing operation/sequence fields unchanged; only add `id` and wrap `name`.)

- [ ] **Step 3: Unit test** — add to `tests/unit/tree_rb_viz.test.js` a test that runs an insert-then-delete sequence, collects every emitted step, and asserts each `step.title` and `step.detail` is a `{zh, en}` object with non-empty strings; and that every PRESET has a string `id` and `name.zh`/`name.en`:
```js
test('every emitted step has bilingual {zh,en} title and detail', () => {
  const V = require('../../js/tree_rb_viz.js');
  const t = new V.RBTree();
  const steps = [];
  t.onStep = (s) => steps.push(s);
  [10, 20, 30, 15, 25, 5, 1].forEach((k) => t.insert(k));
  [20, 10, 30].forEach((k) => t.delete(k));
  assert.ok(steps.length > 0);
  for (const s of steps) {
    for (const f of ['title', 'detail']) {
      assert.ok(s[f] && typeof s[f].zh === 'string' && s[f].zh.length > 0, f + '.zh');
      assert.ok(s[f] && typeof s[f].en === 'string' && s[f].en.length > 0, f + '.en');
    }
  }
});

test('presets have stable id and bilingual name', () => {
  const V = require('../../js/tree_rb_viz.js');
  assert.ok(V.PRESETS.length >= 6);
  for (const p of V.PRESETS) {
    assert.strictEqual(typeof p.id, 'string');
    assert.ok(p.name && typeof p.name.zh === 'string' && typeof p.name.en === 'string');
  }
});
```
IMPORTANT: first read the actual `RBTree`/`onStep`/`_emit` API and PRESET shape in the file to match exact names (the test above assumes `new V.RBTree()` with `.onStep`, `.insert`, `.delete`, and `V.PRESETS`). Adjust the test to the real API if names differ. Run `node --test tests/unit/tree_rb_viz.test.js` — it should FAIL before Steps 1–2 (title/detail are strings) and PASS after.

- [ ] **Step 4: Commit**
```bash
git add js/tree_rb_viz.js tests/unit/tree_rb_viz.test.js
git commit -m "feat: bilingual {zh,en} step text + presets in RB tree module

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `renderTreeRB` (app.js) langOf-ize UI + step log; language-switch re-render; tests

**Files:** Modify `js/app.js` (renderTreeRB + the RB step-log rendering + language-switch path), `tests/tree_rb.spec.js`.

**Interfaces:**
- Consumes: bilingual `step.title`/`step.detail` and `PRESETS[i].{id,name}` from Task 1.

- [ ] **Step 1: Add `langOf` + convert UI strings.** In `renderTreeRB()` (js/app.js ~6079), add at the top:
```js
        const langOf = (msg) => (window.I18N && I18N.getCurrentLanguage() === 'zh') ? msg.zh : msg.en;
```
Replace each hardcoded Chinese UI string with `langOf({ zh, en })` (set placeholder/aria via property assignment, not attribute literal, where needed):
  - placeholder / aria-label `鍵值` → `{ zh:'鍵值', en:'Key' }`
  - button `插入` → `{ zh:'插入', en:'Insert' }`; `刪除` → `{ zh:'刪除', en:'Delete' }`; `清空` → `{ zh:'清空', en:'Clear' }`
  - presets label `劇本` → `{ zh:'劇本', en:'Scenarios' }`
  - hint `點節點可把鍵值帶入輸入框；← → 鍵逐步前進 / 倒帶，空白鍵播放 / 暫停` → `{ zh:'<verbatim>', en:'Click a node to load its key; ← → to step / rewind, Space to play / pause' }`
  - legend: `紅節點`→`Red node`, `黑節點`→`Black node`, `本步驟主角`→`Active node`, `β 子樹（旋轉時換邊的那包）`→`β subtree (switches sides on rotation)`
  - step-log heading `步驟紀錄` → `{ zh:'步驟紀錄', en:'Step Log' }`
  - emptyText `空樹 —— 插入一個值，或載入一個劇本` → `{ zh:'<verbatim>', en:'Empty tree — insert a value, or load a scenario' }`
  - statuses: `先輸入一個整數`→`Enter an integer first`; `節點太多了（上限 63），先刪一些吧`→`Too many nodes (max 63) — delete some first`; `${v} 已經在樹裡了`→`${v} is already in the tree`; `樹裡沒有 ${v}`→`${v} is not in the tree`
  - runOp op labels: `插入 ${v}`→`Insert ${v}`; `刪除 ${v}`→`Delete ${v}` — pass `langOf({zh:'插入 '+v, en:'Insert '+v})` (History stores the label as a plain string chosen at call time — OK since it's re-derived on each op; if the label must survive a language switch in the log, store `{zh,en}` and langOf at render — see Step 3).
  - drawer toggle button / any panel titles that are Chinese → same treatment.

- [ ] **Step 2: Preset buttons use id + bilingual label.** Where preset buttons (`.rbviz-preset`) are built from `PRESETS`, set `data-preset="<p.id>"` and the button text to `langOf(p.name)`; on click, resolve the preset by `id` (not by label text).

- [ ] **Step 3: Step-log rendering via langOf.** Find where the step log renders `step.title` / `step.detail` (the `.rbviz-logcol` list) and the runOp group label. Change those reads to `langOf(step.title)` / `langOf(step.detail)`. If the History op-group label was stored as a plain string, either (a) store it as `{zh,en}` and `langOf` at render, or (b) accept it reflects the language at creation time — prefer (a) for correctness so a language switch re-renders the whole log in the new language.

- [ ] **Step 4: Re-render on language switch.** Confirm the app's language-change path re-renders the active viz (grep for `languagechange` / where `switchMode`/`renderAll` runs on language toggle). If tree-rb is not re-rendered on language change, add a call so switching language re-runs `renderTreeRB()` while tree-rb is active. Manually reason: after toggling language, the buttons + step log must show the other language.

- [ ] **Step 5: Update E2E `tests/tree_rb.spec.js` to be language-stable.**
  - In `beforeEach`, pin the language deterministically so existing Chinese assertions hold: `await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'zh'); } catch (e) {} });` (confirm the exact language localStorage key the app uses — grep `dsvisual-lang` / how I18N persists language; use the real key).
  - Change the preset selector from Chinese `hasText` to the stable id: `sec.locator('.rbviz-preset[data-preset="delete-3rot"]').click()` (was `{ hasText: '刪除三連旋' }`).
  - Keep the other zh assertions (`步驟紀錄`, `已經在樹裡了`) — valid under pinned zh.
  - Add ONE English test: set language to en (`localStorage.setItem('dsvisual-lang','en')`), load tree-rb, assert the Insert button reads `Insert` (or `.rbviz-insert` hasText 'Insert') and, after an insert, a step-log entry contains English (e.g. `/Insert|rotate|Case|red|black/`).

- [ ] **Step 6: Verify + commit**
Run: `node --test tests/unit/*.test.js` (still all pass); `npx playwright test tests/tree_rb.spec.js` (PASS — zh assertions + new en test).
```bash
git add js/app.js tests/tree_rb.spec.js
git commit -m "feat: bilingual RB tree UI + step log (langOf); language-switch re-render

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Full suite

**Files:** none (verification).

- [ ] **Step 1: Run** `npm run test:all`. Expect all green (unit incl. the two new bilingual assertions; Playwright incl. tree_rb zh + en). No count change (no method/group added).

- [ ] **Step 2: Secret check** — `git status --porcelain js/cloud-config.js` empty (else `git checkout js/cloud-config.js`).

- [ ] **Step 3: (only if a count test unexpectedly fails)** investigate — should not happen; do not blindly edit counts. If green, nothing to commit here.

---

## Self-Review (completed by plan author)

**Spec coverage:** §3.1 module `_emit` title/detail → {zh,en} + presets → Task 1 (glossary + 3 worked examples + convert-all + preset ids) ✓. §3.2 renderTreeRB langOf-ize UI + step log → Task 2 Steps 1-3 (enumerated strings with en) ✓. §3.3 language-switch re-render → Task 2 Step 4 ✓. §3.4 test updates (pin zh, preset by id, add en) + unit bilingual assertion → Task 1 Step 3 + Task 2 Step 5 ✓. §5 counts unchanged → Task 3 ✓.

**Placeholder scan:** No TBD/TODO. The dozens of `_emit` translations are authored-from-source (each zh string is in the file) with an explicit transformation + CLRS glossary + 3 fully-worked examples + "apply to all remaining sites"; UI strings are individually enumerated with exact en. This is authoring-from-reference translation, not a placeholder. Test code is concrete (with an "adjust to real API/lang-key" verification note where the exact symbol must be read from the file).

**Type/name consistency:** `_emit(type, title, detail, nodes)` with title/detail as `{zh,en}` is consistent across module, unit test, and render consumption (`langOf(step.title)`). `PRESETS[i].{id, name:{zh,en}}` consistent between Task 1 (definition) and Task 2 (button data-preset + label). `langOf` signature identical to the existing app pattern. E2E preset selection switched to `data-preset` id, matching the id added in Task 1. Language localStorage key flagged to confirm against the real key before use.
