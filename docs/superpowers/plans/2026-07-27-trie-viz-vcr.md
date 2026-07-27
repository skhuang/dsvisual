# Trie Visualization on VCR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the `tree-trie` method from the shared one-shot `text-tree` renderer to a dedicated VizRegistry viz that steps through building a trie from a word list and searching a query, one character at a time, on the `buildFrameControls` VCR bar.

**Architecture:** A pure frame-generator (`js/trie_viz.js`) produces build/search frames; a renderer (`js/viz/viz_trie.js`) re-attaches behavior under the method id `tree-trie`, drawing an SVG trie with a stable reveal-only layout on the VCR control. The Trie branches are removed from `js/domains/tree.js`, leaving Radix/Ternary on the shared `renderAdvTrees`.

**Tech Stack:** Vanilla JS (dual-export IIFE + `global.VizRegistry.attach`), plain CSS/SVG, `node:test` unit tests, Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first (concurrent sessions).
- Never hand-edit generated `js/code_db.js` (regen via `node build_db.js` only if needed).
- Traditional Chinese (zh-Hant) for all zh copy; viz control labels are inline bilingual (e.g. `套用 Apply`).
- Honest stepping: nodes/edges/marks/highlights map straight from frame fields; layout is stable (computed from the full trie), frames only reveal/highlight.
- `VizRegistry.attach` keys by the **method id** (`tree-trie`); `renderAll()` resolves `behavior(currentMode).render()`. The `visualizer`/`controls` fields on the method row are cosmetic.
- e2e MUST assert on robust locators (`.trie-node` count, `.trie-node-end` count, banner text) — NEVER on the visibility of an SVG edge (a vertical/horizontal `<line>` has a zero bbox → `toBeVisible()` reports hidden).
- Radix Tree and Ternary Search Tree must stay fully functional; the `tree.js` edits touch only Trie branches.
- One branch (`feat/trie-viz-vcr`, already created) + one PR.

---

### Task 1: Pure frame-generator `js/trie_viz.js`

**Files:**
- Create: `js/trie_viz.js`
- Test: `tests/unit/trie_viz.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (on `module.exports` and `global.TrieViz`):
  - `SAMPLE = { words: ['CAT','CAR','CARD','DO','DOG'], query: 'CAR' }`
  - `parseWords(str) → string[]`
  - `parseQuery(str) → string`
  - `buildTrie(words) → { nodes, root:0 }`, `nodes[i] = { id, parent, char, depth, endOfWord, children:{ch:id} }`
  - `buildFrames({ words, query, mode }) → { frames }` — build frame `{ op:'build', action:'init'|'follow'|'create'|'mark-end'|'done', word, ci, cur, edge:{from,to,ch}|null, revealed:number[], ends:number[], msg:{zh,en} }`; search frame `{ op:'search', action:'start'|'match'|'mismatch'|'found'|'prefix-only', query, ci, cur, path:number[], verdict:null|'found'|'prefix-only'|'not-found', msg:{zh,en} }`

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/trie_viz.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const T = require('../../js/trie_viz.js');

test('buildTrie shares a common prefix', () => {
  const { nodes } = T.buildTrie(['CAT', 'CAR']);
  assert.strictEqual(nodes.length, 5);                 // root + C + A + T + R
  const c = nodes[0].children['C'];
  const a = nodes[c].children['A'];
  assert.deepStrictEqual(Object.keys(nodes[a].children).sort(), ['R', 'T']);
  assert.strictEqual(nodes[nodes[a].children['T']].endOfWord, true);
  assert.strictEqual(nodes[nodes[a].children['R']].endOfWord, true);
  assert.strictEqual(nodes[a].endOfWord, false);       // 'CA' is not a word
});

test('build frames reveal monotonically and end with done + all nodes', () => {
  const words = ['CAT', 'CAR', 'CARD', 'DO', 'DOG'];
  const { frames } = T.buildFrames({ words, mode: 'build' });
  assert.strictEqual(frames[0].action, 'init');
  assert.strictEqual(frames[frames.length - 1].action, 'done');
  for (let i = 1; i < frames.length; i++) {
    assert.ok(frames[i].revealed.length >= frames[i - 1].revealed.length);  // monotone
  }
  const total = T.buildTrie(words).nodes.length;
  assert.strictEqual(frames[frames.length - 1].revealed.length, total);     // 9
  assert.strictEqual(frames[frames.length - 1].ends.length, 5);             // 5 word terminals
});

test('snapshot isolation: mutating a later frame does not touch an earlier one', () => {
  const { frames } = T.buildFrames({ words: ['CAT', 'CAR'], mode: 'build' });
  const firstLen = frames[0].revealed.length;
  frames[frames.length - 1].revealed.push(999);
  assert.strictEqual(frames[0].revealed.length, firstLen);
});

test('search verdicts: found / prefix-only / not-found', () => {
  const words = ['CAT', 'CAR', 'CARD', 'DO', 'DOG'];
  const found = T.buildFrames({ words, query: 'CAR', mode: 'search' }).frames;
  assert.strictEqual(found[found.length - 1].verdict, 'found');
  const prefix = T.buildFrames({ words, query: 'CA', mode: 'search' }).frames;
  assert.strictEqual(prefix[prefix.length - 1].verdict, 'prefix-only');
  const miss = T.buildFrames({ words, query: 'CARE', mode: 'search' }).frames;
  assert.strictEqual(miss[miss.length - 1].verdict, 'not-found');
  assert.strictEqual(miss[miss.length - 1].action, 'mismatch');
  const missX = T.buildFrames({ words, query: 'X', mode: 'search' }).frames;
  assert.strictEqual(missX[missX.length - 1].verdict, 'not-found');
});

test('every frame carries a bilingual message', () => {
  const all = []
    .concat(T.buildFrames({ words: ['CAT', 'CAR'], mode: 'build' }).frames)
    .concat(T.buildFrames({ words: ['CAT', 'CAR'], query: 'CAR', mode: 'search' }).frames);
  for (const f of all) { assert.ok(f.msg.zh && f.msg.en); }
});

test('parseWords/parseQuery normalize + clamp', () => {
  assert.deepStrictEqual(T.parseWords('cat, ca9r  Dog!'), ['CAT', 'CAR', 'DOG']);
  assert.strictEqual(T.parseWords('abcdefghij')[0].length, 8);   // length clamp
  assert.ok(T.parseWords(Array(30).fill('AB').join(',')).length <= 12);  // count clamp
  assert.strictEqual(T.parseQuery('  car dog '), 'CAR');         // first token
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/trie_viz.test.js`
Expected: FAIL — `Cannot find module '../../js/trie_viz.js'`.

- [ ] **Step 3: Implement `js/trie_viz.js`**

Create `js/trie_viz.js`:

```js
(function (global) {
  'use strict';

  var SAMPLE = { words: ['CAT', 'CAR', 'CARD', 'DO', 'DOG'], query: 'CAR' };

  function parseWords(str) {
    var toks = String(str == null ? '' : str).toUpperCase().split(/[^A-Z]+/);
    var out = [];
    for (var i = 0; i < toks.length && out.length < 12; i++) {
      var w = toks[i];
      if (!w) continue;
      if (w.length > 8) w = w.slice(0, 8);
      out.push(w);
    }
    return out;
  }

  function parseQuery(str) {
    var toks = String(str == null ? '' : str).toUpperCase().split(/[^A-Z]+/).filter(Boolean);
    var q = toks.length ? toks[0] : '';
    return q.length > 8 ? q.slice(0, 8) : q;
  }

  function newNode(id, parent, char, depth) {
    return { id: id, parent: parent, char: char, depth: depth, endOfWord: false, children: {} };
  }

  function buildTrie(words) {
    var nodes = [newNode(0, -1, '', 0)];
    for (var i = 0; i < words.length; i++) {
      var cur = 0, w = words[i];
      for (var j = 0; j < w.length; j++) {
        var ch = w[j];
        if (nodes[cur].children[ch] == null) {
          var id = nodes.length;
          nodes.push(newNode(id, cur, ch, nodes[cur].depth + 1));
          nodes[cur].children[ch] = id;
        }
        cur = nodes[cur].children[ch];
      }
      nodes[cur].endOfWord = true;
    }
    return { nodes: nodes, root: 0 };
  }

  function buildFramesBuild(words) {
    var nodes = [newNode(0, -1, '', 0)];
    var revealed = [0], ends = [], frames = [];
    frames.push({ op: 'build', action: 'init', word: '', ci: -1, cur: 0, edge: null,
      revealed: revealed.slice(), ends: ends.slice(),
      msg: { zh: '開始建立 trie（僅有根節點）', en: 'Start building the trie (root only)' } });
    for (var i = 0; i < words.length; i++) {
      var w = words[i], cur = 0;
      for (var j = 0; j < w.length; j++) {
        var ch = w[j], action, to;
        if (nodes[cur].children[ch] == null) {
          var id = nodes.length;
          nodes.push(newNode(id, cur, ch, nodes[cur].depth + 1));
          nodes[cur].children[ch] = id;
          revealed.push(id); action = 'create'; to = id;
        } else { action = 'follow'; to = nodes[cur].children[ch]; }
        var edge = { from: cur, to: to, ch: ch };
        cur = to;
        frames.push({ op: 'build', action: action, word: w, ci: j, cur: cur, edge: edge,
          revealed: revealed.slice(), ends: ends.slice(),
          msg: action === 'create'
            ? { zh: '「' + w + '」第 ' + (j + 1) + " 字元 '" + ch + "'：新建節點", en: 'Word "' + w + '" char ' + (j + 1) + " '" + ch + "': create node" }
            : { zh: '「' + w + '」第 ' + (j + 1) + " 字元 '" + ch + "'：沿用既有節點", en: 'Word "' + w + '" char ' + (j + 1) + " '" + ch + "': follow existing node" } });
      }
      if (ends.indexOf(cur) === -1) ends.push(cur);
      nodes[cur].endOfWord = true;
      frames.push({ op: 'build', action: 'mark-end', word: w, ci: w.length - 1, cur: cur, edge: null,
        revealed: revealed.slice(), ends: ends.slice(),
        msg: { zh: '標記「' + w + '」結尾（endOfWord）', en: 'Mark end of word "' + w + '" (endOfWord)' } });
    }
    frames.push({ op: 'build', action: 'done', word: '', ci: -1, cur: 0, edge: null,
      revealed: revealed.slice(), ends: ends.slice(),
      msg: { zh: '完成：共 ' + nodes.length + ' 個節點', en: 'Done: ' + nodes.length + ' nodes total' } });
    return frames;
  }

  function buildFramesSearch(words, query) {
    var nodes = buildTrie(words).nodes;
    var frames = [], path = [0], cur = 0, mismatched = false;
    frames.push({ op: 'search', action: 'start', query: query, ci: -1, cur: 0, path: path.slice(), verdict: null,
      msg: { zh: '開始搜尋「' + query + '」（從根節點）', en: 'Start searching "' + query + '" (from root)' } });
    for (var j = 0; j < query.length; j++) {
      var ch = query[j], next = nodes[cur].children[ch];
      if (next == null) {
        frames.push({ op: 'search', action: 'mismatch', query: query, ci: j, cur: cur, path: path.slice(), verdict: 'not-found',
          msg: { zh: '第 ' + (j + 1) + " 字元 '" + ch + "'：無對應邊 → 找不到", en: 'Char ' + (j + 1) + " '" + ch + "': no matching edge → not found" } });
        mismatched = true; break;
      }
      cur = next; path.push(cur);
      frames.push({ op: 'search', action: 'match', query: query, ci: j, cur: cur, path: path.slice(), verdict: null,
        msg: { zh: '第 ' + (j + 1) + " 字元 '" + ch + "'：符合，往下走", en: 'Char ' + (j + 1) + " '" + ch + "': match, descend" } });
    }
    if (!mismatched) {
      if (nodes[cur].endOfWord) {
        frames.push({ op: 'search', action: 'found', query: query, ci: query.length - 1, cur: cur, path: path.slice(), verdict: 'found',
          msg: { zh: '「' + query + '」存在於 trie（命中）', en: '"' + query + '" is in the trie (found)' } });
      } else {
        frames.push({ op: 'search', action: 'prefix-only', query: query, ci: query.length - 1, cur: cur, path: path.slice(), verdict: 'prefix-only',
          msg: { zh: '「' + query + '」只是前綴，非完整單字', en: '"' + query + '" is only a prefix, not a full word' } });
      }
    }
    return frames;
  }

  function buildFrames(st) {
    var words = (st && st.words) || [];
    var mode = (st && st.mode === 'search') ? 'search' : 'build';
    var frames = mode === 'search' ? buildFramesSearch(words, (st && st.query) || '') : buildFramesBuild(words);
    return { frames: frames };
  }

  var api = { SAMPLE: SAMPLE, parseWords: parseWords, parseQuery: parseQuery, buildTrie: buildTrie, buildFrames: buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TrieViz = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/trie_viz.test.js`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Run the full unit suite (no regression)**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/trie_viz.js tests/unit/trie_viz.test.js
git commit -m "feat(dsvisual): trie-viz pure frame generator (build + search stepping)"
```

---

### Task 2: Renderer + wiring + tree.js cleanup

**Files:**
- Create: `js/viz/viz_trie.js`
- Modify: `index.html` (two `<script defer>` tags before `js/app.js`)
- Modify: `js/app.js:79` (repoint the `tree-trie` method row)
- Modify: `js/domains/tree.js` (remove the Trie branches — decl, reset, render branch, insert branch, attach)
- Modify: `style.css` (append a `.trie-*` block)
- Modify: `js/desc_db.js` (refresh the `tree-trie` description)
- Test: `tests/trie.spec.js` (Playwright e2e)

**Interfaces:**
- Consumes (from Task 1): `global.TrieViz.{SAMPLE,parseWords,parseQuery,buildTrie,buildFrames}`; `global.VizKit.{acquireDynamicVizHost,buildFrameControls,langOf,showStatus,t}`; `global.ExamplesStore`; `global.VizRegistry.attach`.
- Produces: `VizRegistry.attach('tree-trie', {render, code, layout})`; DOM classes `.trie-wrap/.trie-controls/.trie-words/.trie-query/.trie-mode/.trie-apply/.trie-scroll/.trie-svg/.trie-node/.trie-node-end/.trie-node-cur/.trie-edge/.trie-edge-cur/.trie-edge-label/.trie-banner/.trie-msg`.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/trie.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-trie (VCR stepping)', () => {
  test('build default: scrub to end reveals all 9 nodes + 5 word-ends', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await expect(page.locator('.trie-wrap')).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-svg .trie-node')).toHaveCount(9);
    await expect(page.locator('.trie-svg .trie-node-end')).toHaveCount(5);
    await expect(page.locator('.trie-banner')).toContainText('Done');
  });

  test('search mode: CAR → FOUND; miss demo → NOT FOUND', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await page.selectOption('.trie-mode', 'search');
    let scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-banner')).toContainText('FOUND');

    await page.selectOption('.ex-select', { label: 'Miss demo' });
    await page.selectOption('.trie-mode', 'search');
    scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-banner')).toContainText('NOT FOUND');
  });

  test('custom words + Apply updates the trie and saves an example; code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await page.fill('.trie-words', 'AB, AC');
    await page.click('.trie-apply');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-svg .trie-node')).toHaveCount(3);   // root + A + B + C? -> root,A,B,C = 4? see note
    await expect(page.locator('[data-method-section="tree-trie"] .code-drawer')).toBeHidden();
  });
});
```

Note on the custom-words count: `AB, AC` → root(0) + A(1) + B(2) + C(3) = **4** nodes. Fix the assertion to `toHaveCount(4)` when you write the test (the value above is a deliberate reminder to compute it, not ship it).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/trie.spec.js`
Expected: FAIL — `.trie-wrap` never appears (the old `text-tree` renderer is still wired).

- [ ] **Step 3: Implement the renderer `js/viz/viz_trie.js`**

Create `js/viz/viz_trie.js`:

```js
(function (global) {
  'use strict';
  var K = function () { return global.VizKit; };

  // Examples-helper trio — duplicated per program convention; do NOT refactor.
  function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
  function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) {} }
  function buildExamplesSelect(methodId, defaultText) {
    var lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    var escA = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
    var escT = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var trunc = function (s) { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
    var h = '<select class="ex-select" data-method="' + escA(methodId) + '">';
    h += '<option value="">' + (lang === 'zh' ? '範例…' : 'Examples…') + '</option>';
    h += '<option value="' + escA(defaultText) + '">' + (lang === 'zh' ? '預設' : 'Default') + '</option>';
    loadExamples(methodId).forEach(function (e) { if (e.text === defaultText) return;
      h += '<option value="' + escA(e.text) + '">' + escT(trunc(e.text)) + '</option>'; });
    return h + '</select>';
  }

  function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function serialize(st) { return st.words.join(',') + '|' + st.query; }
  function deserialize(text) {
    var parts = String(text).split('|');
    return { words: global.TrieViz.parseWords(parts[0] || ''), query: global.TrieViz.parseQuery(parts[1] || '') };
  }
  var DEFAULT_SERIALIZED = global.TrieViz.SAMPLE.words.join(',') + '|' + global.TrieViz.SAMPLE.query;
  var MISS_SERIALIZED = 'CAR,CARD|CARE';
  var _st = { words: global.TrieViz.SAMPLE.words.slice(), query: global.TrieViz.SAMPLE.query, mode: 'build' };

  function computeLayout(nodes) {
    var pos = {}, LEVEL_H = 70;
    function place(id, x, y, dx) {
      pos[id] = { x: x, y: y };
      var keys = Object.keys(nodes[id].children);
      if (!keys.length) return;
      var startX = x - (keys.length - 1) * dx / 2;
      keys.forEach(function (k, i) { place(nodes[id].children[k], startX + i * dx, y + LEVEL_H, Math.max(dx / 1.6, 30)); });
    }
    place(0, 0, 30, 150);
    var ids = Object.keys(pos);
    var xs = ids.map(function (id) { return pos[id].x; });
    var ys = ids.map(function (id) { return pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), maxY = Math.max.apply(null, ys);
    var MARGIN = 30, shift = MARGIN - minX;
    ids.forEach(function (id) { pos[id].x += shift; });
    return { pos: pos, width: Math.max((maxX - minX) + 2 * MARGIN, 320), height: Math.max(maxY + 60, 200) };
  }

  function svgFor(nodes, fr, layout) {
    var pos = layout.pos, present = {}, endSet = {};
    if (fr.op === 'build') {
      fr.revealed.forEach(function (id) { present[id] = true; });
      fr.ends.forEach(function (id) { endSet[id] = true; });
    } else {
      nodes.forEach(function (n) { present[n.id] = true; if (n.endOfWord) endSet[n.id] = true; });
    }
    var curEdge = null;
    if (fr.op === 'build' && fr.edge) curEdge = fr.edge.from + '>' + fr.edge.to;
    else if (fr.op === 'search' && fr.path && fr.path.length >= 2) { var p = fr.path; curEdge = p[p.length - 2] + '>' + p[p.length - 1]; }
    var s = '<svg class="trie-svg" width="' + layout.width + '" height="' + layout.height + '" viewBox="0 0 ' + layout.width + ' ' + layout.height + '">';
    nodes.forEach(function (n) {
      if (n.parent < 0 || !present[n.id] || !present[n.parent]) return;
      var a = pos[n.parent], b = pos[n.id], key = n.parent + '>' + n.id;
      s += '<line class="trie-edge' + (key === curEdge ? ' trie-edge-cur' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
      s += '<text class="trie-edge-label" x="' + ((a.x + b.x) / 2) + '" y="' + ((a.y + b.y) / 2) + '">' + n.char + '</text>';
    });
    nodes.forEach(function (n) {
      if (!present[n.id]) return;
      var pp = pos[n.id];
      var cls = 'trie-node' + (endSet[n.id] ? ' trie-node-end' : '') + (n.id === fr.cur ? ' trie-node-cur' : '');
      s += '<circle class="' + cls + '" cx="' + pp.x + '" cy="' + pp.y + '" r="14"/>';
    });
    return s + '</svg>';
  }

  function render() {
    var host = K().acquireDynamicVizHost();
    var lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    host.innerHTML =
      '<div class="trie-wrap">' +
        '<div class="trie-controls">' +
          '<label>' + (lang === 'zh' ? '單字' : 'words') + ' <input type="text" class="trie-words" value="' + escAttr(_st.words.join(',')) + '"></label>' +
          '<label>' + (lang === 'zh' ? '搜尋' : 'query') + ' <input type="text" class="trie-query" value="' + escAttr(_st.query) + '"></label>' +
          '<select class="trie-mode">' +
            '<option value="build"' + (_st.mode === 'build' ? ' selected' : '') + '>' + (lang === 'zh' ? '建立 Build' : 'Build') + '</option>' +
            '<option value="search"' + (_st.mode === 'search' ? ' selected' : '') + '>' + (lang === 'zh' ? '搜尋 Search' : 'Search') + '</option>' +
          '</select>' +
          '<button type="button" class="trie-apply">' + (lang === 'zh' ? '套用 Apply' : 'Apply') + '</button>' +
          buildExamplesSelect('tree-trie', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="trie-banner" data-testid="trie-banner">&nbsp;</div>' +
        '<div class="trie-scroll"></div>' +
        '<div class="trie-msg" data-testid="trie-msg">&nbsp;</div>' +
      '</div>';
    var wrap = host.querySelector('.trie-wrap');
    var scrollEl = wrap.querySelector('.trie-scroll');
    var bannerEl = wrap.querySelector('.trie-banner');
    var msgEl = wrap.querySelector('.trie-msg');

    var exSelect = wrap.querySelector('.ex-select');
    if (exSelect && !Array.from(exSelect.options).some(function (o) { return o.value === MISS_SERIALIZED; })) {
      var opt = document.createElement('option');
      opt.value = MISS_SERIALIZED; opt.textContent = lang === 'zh' ? '未命中示範' : 'Miss demo';
      exSelect.insertBefore(opt, exSelect.options[2] || null);
    }

    var fullTrie = global.TrieViz.buildTrie(_st.words);
    var layout = computeLayout(fullTrie.nodes);
    var frames = global.TrieViz.buildFrames(_st).frames;

    function bannerText(fr) {
      var L = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      if (fr.op === 'build') {
        if (fr.action === 'done') return (L === 'zh' ? '完成 · ' : 'Done · ') + fullTrie.nodes.length + (L === 'zh' ? ' 個節點' : ' nodes');
        if (fr.action === 'init') return (L === 'zh' ? '建立 trie' : 'Build trie');
        return (L === 'zh' ? '建立 ' : 'Build ') + fr.word + " · '" + (fr.word[fr.ci] || '') + "'";
      }
      var verdict = { 'found': L === 'zh' ? '命中 FOUND' : 'FOUND', 'prefix-only': L === 'zh' ? '前綴 PREFIX-ONLY' : 'PREFIX-ONLY', 'not-found': L === 'zh' ? '找不到 NOT FOUND' : 'NOT FOUND' };
      return (L === 'zh' ? '搜尋 ' : 'Search ') + fr.query + (fr.verdict ? ' → ' + verdict[fr.verdict] : '');
    }
    function paint(fr) {
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout);
      bannerEl.textContent = bannerText(fr);
      msgEl.textContent = K().langOf(fr.msg);
      var color = '#60a5fa';
      if (fr.verdict === 'found' || fr.action === 'done') color = '#34d399';
      else if (fr.verdict === 'not-found' || fr.action === 'mismatch') color = '#f87171';
      else if (fr.verdict === 'prefix-only') color = '#f59e0b';
      K().showStatus(K().langOf(fr.msg), color);
    }
    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 650 }));

    wrap.querySelector('.trie-apply').addEventListener('click', function () {
      _st.words = global.TrieViz.parseWords(wrap.querySelector('.trie-words').value);
      _st.query = global.TrieViz.parseQuery(wrap.querySelector('.trie-query').value);
      saveExample('tree-trie', serialize(_st), DEFAULT_SERIALIZED);
      render();
    });
    wrap.querySelector('.trie-mode').addEventListener('change', function (ev) {
      _st.mode = ev.target.value === 'search' ? 'search' : 'build';
      render();
    });
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      var v = ev.target.value; if (!v) return;
      var d = deserialize(v); _st.words = d.words; _st.query = d.query;
      render();
    });
  }

  global.VizRegistry.attach('tree-trie', {
    render: render,
    code: function () { return (global.CODE_DB && global.CODE_DB['tree-trie']) || ''; },
    layout: null
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

- [ ] **Step 4: Remove the Trie branches from `js/domains/tree.js`**

(a) Delete the `trieRoot` declaration (near line 10):
```js
  let trieRoot = { children: {}, endOfWord: false };
```

(b) In `onModeSwitch` (near line 301), drop the `trieRoot` reset — change:
```js
      trieRoot = { children: {}, endOfWord: false }; radixRoot = { edges: {} }; tstRoot = null; btreeData = []; bplusData = [];
```
to:
```js
      radixRoot = { edges: {} }; tstRoot = null; btreeData = []; bplusData = [];
```

(c) Delete the Trie render branch (near lines 116–130) — change:
```js
      if(currentMode === 'tree-trie') {
          function drawTrie(node, x, y, dx) {
              const el = document.createElement('div'); el.className = 'tree-node' + (node.endOfWord ? ' trie-end' : '');
              el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = '20px'; el.style.height = '20px';
              if(node.endOfWord) el.style.backgroundColor = '#ec4899';
              advTreeContainer.appendChild(el);
              let keys = Object.keys(node.children);
              if(keys.length === 0) return;
              let startX = x - (keys.length-1)*dx/2;
              keys.forEach((k, i) => {
                  let nx = startX + i*dx; let ny = y + 60;
                  drawLine(x, y, nx, ny, k); drawTrie(node.children[k], nx, ny, dx/1.5);
              });
          }
          drawTrie(trieRoot, cx, cy, 150);
      } else if (currentMode === 'tree-radix') {
```
to:
```js
      if (currentMode === 'tree-radix') {
```

(d) Delete the Trie insert branch (near lines 347–349) — change:
```js
              if(currentMode === 'tree-trie') {
                  let curr = trieRoot; for(let char of str) { if(!curr.children[char]) curr.children[char] = { children: {}, endOfWord: false }; curr = curr.children[char]; }
                  curr.endOfWord = true; renderAdvTrees(); showStatus("Trie Inserted: " + str, "#34d399");
              } else if (currentMode === 'tree-radix') {
```
to:
```js
              if (currentMode === 'tree-radix') {
```

(e) Delete the Trie attach (near line 380):
```js
  R().attach('tree-trie', { render: renderAdvTrees, code: () => codeTreeTrie, layout: null });
```

(Leave `drawLine`, `codeTreeTrie`, and all Radix/Ternary code untouched.)

- [ ] **Step 5: Repoint the `tree-trie` method row in `js/app.js:79`**

Change:
```js
            { id: 'tree-trie', title: 'Trie', file: 'tree_trie.cpp', visualizer: 'text-tree', controls: 'text-tree' },
```
to:
```js
            { id: 'tree-trie', title: 'Trie', file: 'tree_trie.cpp', visualizer: 'trie', controls: 'trie', codeDrawer: true },
```

- [ ] **Step 6: Add the two `<script defer>` tags to `index.html`**

Find the line `<script src="js/viz/viz_dsu.js" defer></script>` (immediately before `<script src="js/app.js" defer></script>`) and insert after it:
```html
    <script src="js/trie_viz.js" defer></script>
    <script src="js/viz/viz_trie.js" defer></script>
```
(Both load after `js/code_db.js` and `js/domains/tree.js`, before `js/app.js` — defer preserves order.)

- [ ] **Step 7: Append the `.trie-*` CSS block to `style.css`**

At the end of `style.css`, append:
```css

/* ---- Trie viz (tree-trie, VCR stepping) ----------------------------- */
.trie-wrap { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.trie-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.trie-controls input[type="text"] { text-transform: uppercase; }
.trie-scroll { overflow: auto; max-height: 520px; border: 1px solid var(--card-border); border-radius: 8px; background: var(--surface-muted); }
.trie-svg { display: block; }
.trie-edge { stroke: #94a3b8; stroke-width: 2; }
.trie-edge-cur { stroke: #f59e0b; stroke-width: 3.5; }
.trie-edge-label { fill: #cbd5e1; font-size: 12px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
.trie-node { fill: #1e293b; stroke: #64748b; stroke-width: 2; }
.trie-node-end { fill: #ec4899; stroke: #f472b6; }
.trie-node-cur { stroke: #f59e0b; stroke-width: 4; }
.trie-banner { font-weight: 800; color: var(--text-main); }
.trie-msg { color: var(--text-subtle); font-size: 0.85rem; }
```

- [ ] **Step 8: Refresh the `tree-trie` description in `js/desc_db.js`**

Locate the `'tree-trie'` entry and replace its English description value with:
```
A trie (prefix tree) stores strings along paths of single-character edges, so words that share a prefix share a path. Insertion walks the word character by character, creating a node where none exists and marking the final node as end-of-word. Search descends the same way: a hit ends on an end-of-word node, a matched path with no end-of-word mark is a prefix only, and a missing edge means the word is absent. Each insert or search is O(L) in the word length L.
```
Keep the entry's existing key/shape (only change the description text). If the entry has separate zh/en fields, update the English one; leave zh as-is.

- [ ] **Step 9: Fix the custom-words assertion, then run the e2e**

In `tests/trie.spec.js` (Task 2 Step 1), set the custom-words assertion to the true count: `AB, AC` → root + A + B + C = **4** → `await expect(page.locator('.trie-svg .trie-node')).toHaveCount(4);`

Run: `npx playwright test tests/trie.spec.js`
Expected: PASS — all 3 tests green (build reveals 9 nodes / 5 ends; search FOUND + NOT FOUND; custom Apply → 4 nodes, code drawer hidden).

- [ ] **Step 10: Verify the code drawer has source, and no code_db churn**

Run: `grep -c "tree-trie" js/code_db.js`
Expected: ≥ 1 (the C++ is present for the drawer). If 0, run `node build_db.js` and re-check (should add only `tree-trie`).

- [ ] **Step 11: Run the full suites (no regression)**

Run: `npm run test:unit && npm test`
Expected: unit green; full Playwright green — including `smoke_modes` (tree-trie still loads), Radix (`tree-radix`) and Ternary (`tree-ternary`) still function, no regressions.

- [ ] **Step 12: Commit**

```bash
git add js/viz/viz_trie.js index.html js/app.js js/domains/tree.js style.css js/desc_db.js tests/trie.spec.js
git commit -m "feat(dsvisual): trie viz on VCR — renderer + wiring; remove trie from tree.js"
```

---

## Self-Review

**1. Spec coverage:**
- Build (follow/create/mark-end) + Search (match/mismatch → found/prefix-only/not-found) stepping → Task 1 `buildFrames`. ✓
- Stable reveal-only layout from full trie → Task 2 `computeLayout` + `svgFor` gating by `fr.revealed`. ✓
- Mode selector → Task 2 `.trie-mode` + change handler. ✓
- VCR + codeDrawer + ExamplesStore + built-in miss example + scroll → Task 2 renderer + app.js row + CSS. ✓
- Re-attach `tree-trie`, remove from tree.js, Radix/Ternary intact → Task 2 Steps 3–5. ✓
- Default sample + counts (9 nodes / 5 ends) + miss demo `CAR,CARD|CARE` → Task 1 SAMPLE + Task 2 e2e. ✓
- Traditional-zh bilingual inline labels + `msg` → Tasks 1 & 2. ✓
- e2e asserts counts/banner, not edge visibility → Task 2 e2e. ✓

**2. Placeholder scan:** No TBD/TODO; all code complete. The one computed value (custom-words node count) is called out explicitly in Task 2 Steps 1 & 9 with the resolved value (4). ✓

**3. Type/name consistency:** Frame fields (`op/action/word/ci/cur/edge/revealed/ends/query/path/verdict/msg`) identical between Task 1 producer and Task 2 `svgFor`/`bannerText`/`paint` consumers; DOM classes (`.trie-node`, `.trie-node-end`, `.trie-node-cur`, `.trie-edge-cur`, `.trie-banner`, `.trie-scroll`, `.trie-mode`, `.ex-select`) identical across renderer, CSS, and e2e; attach id `tree-trie` consistent with `renderAll()` resolution; `DEFAULT_SERIALIZED`/`MISS_SERIALIZED` format matches `deserialize`. ✓
