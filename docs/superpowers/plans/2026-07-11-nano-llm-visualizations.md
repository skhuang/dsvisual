# nano-LLM Visualizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 standalone dsvisual visualizations — one per nano-LLM OJ lab (`nano-bpe-encode`, `nano-compute-graph`, `nano-bpe-train`, `nano-ngram-next`) — grouped in a new "nano-LLM" menu category.

**Architecture:** Each viz follows the established `cache-lru` pattern: a pure DOM-free `js/<name>_viz.js` module exporting `buildFrames(...)` (unit-tested with `node:test`), wired into `js/app.js` (menu entry + code map + render dispatch + a `render<Name>()` that steps frames via `buildStepControls`), with the C++ panel from `js/code_db.js`, a description in `js/desc_db.js`, labels in `js/i18n.js`, a `<script>` tag in `index.html`, and a `slides/zh/<id>.md` slide.

**Tech Stack:** Vanilla ES5-ish browser JS (no framework), `node:test` for unit tests, Playwright for smoke tests.

## Global Constraints

- No backend; must work opening `index.html` directly in a browser.
- `buildFrames` is **pure and DOM-free**; sampling randomness takes an explicit seed/`r` arg (tests stay deterministic).
- Each frame carries a bilingual `msg: { en, zh }`; render shows it via `langOf(fr.msg)`.
- viz id == lab id (`nano-bpe-encode`, `nano-compute-graph`, `nano-bpe-train`, `nano-ngram-next`).
- Module shape: `(function (global) { … const api = { buildFrames }; if (typeof module !== 'undefined' && module.exports) module.exports = api; global.<Name>Viz = api; })(typeof window !== 'undefined' ? window : globalThis);`
- Unit tests run via `node --test tests/unit/`; full JS suite `npm test`; Playwright `npx playwright test`.
- Follow the light theme + existing CSS classes; do not restructure `app.js`.

## Wiring recap (per viz — all 7 points, modeled on `cache-lru`)

1. Create `js/<name>_viz.js` (buildFrames).
2. `index.html`: add `<script src="js/<name>_viz.js" defer></script>` near the other viz scripts (~line 480).
3. `js/app.js`: menu entry (nano-LLM category, near line 175), code-map entry (~371), code-title (~2432), render dispatch (~2679), and the `render<Name>()` function (near the other `render*` fns, ~5895+).
4. `js/code_db.js`: `const code<Name> = \`…\`;`
5. `js/desc_db.js`: description entry keyed by the mode id.
6. `js/i18n.js`: `'method.<id>'` in the `en` map (~line 81 region) and `zh` map (~line 309 region).
7. `slides/zh/<id>.md`.

**The nano-LLM category** is created in Task 1 and appended to in Tasks 2–4. In `app.js`'s category array (the structure holding `{ id:'cache-lru', … }` entries), add a new category object:
```js
{ id: 'nano-llm', title: 'nano-LLM', items: [ /* entries appended per task */ ] }
```
(Match the exact shape of the surrounding category objects — inspect the array around line 175 and mirror its key names, e.g. `title`/`label` and `items`/`methods`, before editing.)

---

### Task 1: `nano-bpe-encode` — trie longest-match tokenization

**Files:**
- Create: `js/nano_bpe_encode_viz.js`, `slides/zh/nano-bpe-encode.md`
- Test: `tests/unit/nano_bpe_encode_viz.test.js`
- Modify: `index.html`, `js/app.js`, `js/code_db.js`, `js/desc_db.js`, `js/i18n.js`

**Interfaces:**
- Produces: `NanoBpeEncodeViz.buildFrames(vocab: string[], input: string) → { frames, vocab, input }`
  where `frames[i] = { cursor:number, node:string, matchStart:number, matchEnd:number, lastToken:string|null, tokens:string[], status:'walk'|'emit'|'restart'|'done', msg:{en,zh} }`.

- [ ] **Step 1: Write the failing test** — `tests/unit/nano_bpe_encode_viz.test.js`

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFrames } = require('../../js/nano_bpe_encode_viz');

test('start frame has empty tokens and cursor 0', () => {
  const { frames } = buildFrames(['a', 'b', 'ab'], 'ab');
  assert.equal(frames[0].status, 'walk');
  assert.equal(frames[0].cursor, 0);
  assert.deepEqual(frames[0].tokens, []);
});

test('greedy longest match emits "ab" not "a"+"b"', () => {
  const { frames } = buildFrames(['a', 'b', 'ab'], 'ab');
  const final = frames[frames.length - 1];
  assert.equal(final.status, 'done');
  assert.deepEqual(final.tokens, ['ab']);
});

test('falls back to shorter token then continues', () => {
  const { frames } = buildFrames(['a', 'b', 'ab', 'c'], 'abc');
  assert.deepEqual(frames[frames.length - 1].tokens, ['ab', 'c']);
});

test('unknown char is emitted as a single-char token (byte fallback)', () => {
  const { frames } = buildFrames(['a'], 'ax');
  assert.deepEqual(frames[frames.length - 1].tokens, ['a', 'x']);
});
```

- [ ] **Step 2: Run it — fails**

Run: `node --test tests/unit/nano_bpe_encode_viz.test.js`
Expected: FAIL — `Cannot find module '../../js/nano_bpe_encode_viz'`.

- [ ] **Step 3: Implement `js/nano_bpe_encode_viz.js`**

```js
(function (global) {
  // Greedy longest-match BPE encode over a trie built from `vocab`.
  function buildTrie(vocab) {
    const root = {};
    for (const tok of vocab) {
      let n = root;
      for (const ch of tok) { n = (n[ch] = n[ch] || {}); }
      n.$ = tok; // token terminal
    }
    return root;
  }
  function buildFrames(vocab, input) {
    const root = buildTrie(vocab);
    const frames = [];
    const tokens = [];
    const push = (o) => frames.push(Object.assign(
      { cursor: 0, node: '', matchStart: 0, matchEnd: 0, lastToken: null, tokens: tokens.slice(), status: 'walk' }, o));
    push({ status: 'walk', msg: { en: 'start at position 0', zh: '從位置 0 開始' } });
    let i = 0;
    while (i < input.length) {
      let n = root, j = i, best = -1, bestTok = null;
      while (j < input.length && n[input[j]]) {
        n = n[input[j]];
        j++;
        push({ cursor: i, matchStart: i, matchEnd: j, node: input.slice(i, j), lastToken: n.$ || bestTok,
               status: 'walk', msg: { en: 'match "' + input.slice(i, j) + '"', zh: '比對 "' + input.slice(i, j) + '"' } });
        if (n.$) { best = j; bestTok = n.$; }
      }
      let tok, end;
      if (best >= 0) { tok = bestTok; end = best; }
      else { tok = input[i]; end = i + 1; } // byte fallback for unknown char
      tokens.push(tok);
      push({ cursor: i, matchStart: i, matchEnd: end, lastToken: tok, tokens: tokens.slice(),
             status: 'emit', msg: { en: 'emit token "' + tok + '"', zh: '輸出 token "' + tok + '"' } });
      i = end;
      if (i < input.length) push({ cursor: i, status: 'restart',
        msg: { en: 'restart at position ' + i, zh: '從位置 ' + i + ' 重新開始' } });
    }
    push({ cursor: input.length, tokens: tokens.slice(), status: 'done',
           msg: { en: 'done: ' + tokens.length + ' tokens', zh: '完成：' + tokens.length + ' 個 token' } });
    return { frames, vocab, input };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NanoBpeEncodeViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run it — passes**

Run: `node --test tests/unit/nano_bpe_encode_viz.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire into the app**

`index.html` (near line 480, with the other viz scripts):
```html
    <script src="js/nano_bpe_encode_viz.js" defer></script>
```

`js/app.js` — add the nano-LLM **category** with this first entry (near the category array, ~line 175; mirror the exact key names of neighbouring category objects):
```js
{ id: 'nano-bpe-encode', title: 'BPE Encode (trie)', file: 'nano-bpe-encode.cpp', visualizer: 'bpeEncode', controls: 'bpeEncode' },
```
code map (~line 371): `'nano-bpe-encode': codeNanoBpeEncode,`
code title (~line 2432): `else if (currentMode === 'nano-bpe-encode') { codeTitle.textContent = 'nano-bpe-encode.cpp'; }` (follow the existing else-if chain)
render dispatch (~line 2679): `else if (currentMode === 'nano-bpe-encode') renderNanoBpeEncode();`

`render*` function (place beside `renderLruCache`, ~line 5895):
```js
    let _bpeEncState = null;
    function renderNanoBpeEncode() {
        const host = acquireDynamicVizHost();
        if (!_bpeEncState) _bpeEncState = { vocab: ['a','b','ab','abc','c'], input: 'aabcabx' };
        const st = _bpeEncState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const frames = NanoBpeEncodeViz.buildFrames(st.vocab, st.input).frames;
        let idx = 0;
        host.innerHTML =
            '<div class="ss-controls">' +
              'vocab <input type="text" class="be-vocab" value="' + st.vocab.join(',') + '">' +
              'input <input type="text" class="be-input" value="' + st.input + '">' +
              '<button type="button" class="be-apply">Apply</button>' +
            '</div>' +
            '<div class="be-input-row" data-testid="be-input"></div>' +
            '<div class="be-tokens" data-testid="be-tokens"></div>' +
            '<div class="ss-phase be-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.be-input-row').innerHTML = st.input.split('').map((ch, i) => {
                let cls = 'be-ch';
                if (i >= fr.matchStart && i < fr.matchEnd) cls += ' match';
                if (i === fr.cursor) cls += ' cursor';
                return '<span class="' + cls + '">' + ch + '</span>';
            }).join('');
            host.querySelector('.be-tokens').innerHTML = fr.tokens.map((t) =>
                '<span class="be-token">' + t + '</span>').join('');
            host.querySelector('.be-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(buildStepControls(step, reset, 600));
        paint();
        host.querySelector('.be-apply').onclick = () => {
            const vocab = host.querySelector('.be-vocab').value.split(',').map((s) => s.trim()).filter(Boolean);
            const input = host.querySelector('.be-input').value.trim();
            if (vocab.length && input) { st.vocab = vocab; st.input = input; renderNanoBpeEncode(); }
        };
    }
```

`js/code_db.js` (near the other `const code…` blocks): add `const codeNanoBpeEncode` — a trimmed copy of the greedy longest-match `encode()` from `../ds2026/nano-llm/bpe_encoder.hpp` (vocab trie + longest-match loop; keep it a self-contained ~40-line excerpt). Confirm the file exports the same symbol name used in the code map.

`js/desc_db.js`: add an entry keyed `'nano-bpe-encode'` (mirror a neighbouring entry's shape) describing greedy longest-match tokenization; complexity: build O(Σ|token|), encode O(|input|·max token len).

`js/i18n.js`: `'method.nano-bpe-encode': 'BPE Encode (trie)'` in the en map; `'method.nano-bpe-encode': 'BPE 編碼（trie）'` in the zh map.

`slides/zh/nano-bpe-encode.md`: a short slide (mirror an existing `slides/zh/*.md`) explaining trie longest-match encoding.

- [ ] **Step 6: Run full JS suite + a Playwright smoke**

Run: `npm test` → green (new unit test included).
Run: `npx playwright test` → green (existing viewer specs still pass; the new mode is reachable). If a smoke spec for new modes doesn't exist, add one asserting the mode button appears and `data-testid="be-tokens"` renders after selecting `nano-bpe-encode` and clicking step.

- [ ] **Step 7: Commit**

```bash
git add js/nano_bpe_encode_viz.js tests/unit/nano_bpe_encode_viz.test.js slides/zh/nano-bpe-encode.md index.html js/app.js js/code_db.js js/desc_db.js js/i18n.js
git commit -m "feat(viz): nano-bpe-encode trie longest-match tokenization"
```

---

### Task 2: `nano-compute-graph` — DAG topological forward pass

**Files:**
- Create: `js/nano_compute_graph_viz.js`, `slides/zh/nano-compute-graph.md`
- Test: `tests/unit/nano_compute_graph_viz.test.js`
- Modify: `index.html`, `js/app.js`, `js/code_db.js`, `js/desc_db.js`, `js/i18n.js`

**Interfaces:**
- Consumes: the nano-LLM category created in Task 1 (append an entry).
- Produces: `NanoComputeGraphViz.buildFrames(graph: { nodes:[{id,op,val?}], edges:[[from,to]] }) → { frames, order }`
  where `frames[i] = { phase:'order'|'forward'|'done', order:string[], active:string|null, evaluated:string[], values:{[id]:number}, msg:{en,zh} }`.

- [ ] **Step 1: Write the failing test** — `tests/unit/nano_compute_graph_viz.test.js`

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFrames } = require('../../js/nano_compute_graph_viz');

const G = {
  nodes: [ { id: 'a', op: 'const', val: 2 }, { id: 'b', op: 'const', val: 3 },
           { id: 'm', op: 'mul' }, { id: 'c', op: 'const', val: 4 }, { id: 's', op: 'add' } ],
  edges: [ ['a','m'], ['b','m'], ['m','s'], ['c','s'] ],
};

test('topological order lists deps before dependents', () => {
  const { order } = buildFrames(G);
  assert.ok(order.indexOf('a') < order.indexOf('m'));
  assert.ok(order.indexOf('b') < order.indexOf('m'));
  assert.ok(order.indexOf('m') < order.indexOf('s'));
  assert.ok(order.indexOf('c') < order.indexOf('s'));
});

test('forward pass computes (2*3)+4 = 10 at s', () => {
  const { frames } = buildFrames(G);
  const final = frames[frames.length - 1];
  assert.equal(final.phase, 'done');
  assert.equal(final.values.m, 6);
  assert.equal(final.values.s, 10);
});
```

- [ ] **Step 2: Run it — fails**

Run: `node --test tests/unit/nano_compute_graph_viz.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/nano_compute_graph_viz.js`**

```js
(function (global) {
  function topo(nodes, edges) {
    const indeg = {}, adj = {};
    nodes.forEach((n) => { indeg[n.id] = 0; adj[n.id] = []; });
    edges.forEach(([u, v]) => { adj[u].push(v); indeg[v]++; });
    const q = nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id).sort();
    const order = [];
    while (q.length) {
      const u = q.shift(); order.push(u);
      for (const v of adj[u]) { if (--indeg[v] === 0) { q.push(v); q.sort(); } }
    }
    return order;
  }
  function buildFrames(graph) {
    const byId = {}; graph.nodes.forEach((n) => { byId[n.id] = n; });
    const preds = {}; graph.nodes.forEach((n) => { preds[n.id] = []; });
    graph.edges.forEach(([u, v]) => preds[v].push(u));
    const order = topo(graph.nodes, graph.edges);
    const frames = [];
    const evaluated = [];
    const values = {};
    order.forEach((id, k) => frames.push({ phase: 'order', order: order.slice(0, k + 1), active: id,
      evaluated: [], values: {}, msg: { en: 'topo #' + (k + 1) + ': ' + id, zh: '拓撲序 #' + (k + 1) + '：' + id } }));
    for (const id of order) {
      const n = byId[id], ins = preds[id].map((p) => values[p]);
      let val;
      if (n.op === 'const') val = n.val;
      else if (n.op === 'add') val = ins.reduce((a, b) => a + b, 0);
      else if (n.op === 'mul') val = ins.reduce((a, b) => a * b, 1);
      else val = ins.reduce((a, b) => a + b, 0);
      values[id] = val; evaluated.push(id);
      frames.push({ phase: 'forward', order, active: id, evaluated: evaluated.slice(),
        values: Object.assign({}, values), msg: { en: id + ' = ' + val, zh: id + ' = ' + val } });
    }
    frames.push({ phase: 'done', order, active: null, evaluated: evaluated.slice(),
      values: Object.assign({}, values), msg: { en: 'forward pass complete', zh: '前向傳遞完成' } });
    return { frames, order };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NanoComputeGraphViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run it — passes**

Run: `node --test tests/unit/nano_compute_graph_viz.test.js` → PASS (2 tests).

- [ ] **Step 5: Wire into the app**

`index.html`: `<script src="js/nano_compute_graph_viz.js" defer></script>`
`js/app.js`: append to the nano-LLM category:
```js
{ id: 'nano-compute-graph', title: 'Compute Graph (DAG)', file: 'nano-compute-graph.cpp', visualizer: 'computeGraph', controls: 'computeGraph' },
```
code map: `'nano-compute-graph': codeNanoComputeGraph,`; code title `'nano-compute-graph.cpp'`; dispatch `else if (currentMode === 'nano-compute-graph') renderNanoComputeGraph();`.

`render*` function (beside the others):
```js
    let _cgState = null;
    function renderNanoComputeGraph() {
        const host = acquireDynamicVizHost();
        if (!_cgState) _cgState = { preset: 'mul-add' };
        const presets = {
            'mul-add': { nodes: [ {id:'a',op:'const',val:2}, {id:'b',op:'const',val:3}, {id:'m',op:'mul'}, {id:'c',op:'const',val:4}, {id:'s',op:'add'} ],
                         edges: [ ['a','m'],['b','m'],['m','s'],['c','s'] ] },
        };
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const frames = NanoComputeGraphViz.buildFrames(presets[_cgState.preset]).frames;
        const nodes = presets[_cgState.preset].nodes;
        let idx = 0;
        host.innerHTML =
            '<div class="cg-nodes" data-testid="cg-nodes"></div>' +
            '<div class="cg-order" data-testid="cg-order"></div>' +
            '<div class="ss-phase cg-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.cg-nodes').innerHTML = nodes.map((n) => {
                let cls = 'cg-node';
                if (fr.evaluated.indexOf(n.id) >= 0) cls += ' done';
                if (n.id === fr.active) cls += ' active';
                const v = (fr.values[n.id] != null) ? ' = ' + fr.values[n.id] : '';
                return '<span class="' + cls + '">' + n.id + ':' + n.op + v + '</span>';
            }).join('');
            host.querySelector('.cg-order').textContent = 'topo: ' + fr.order.join(' → ');
            host.querySelector('.cg-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(buildStepControls(step, reset, 700));
        paint();
    }
```

`js/code_db.js`: `const codeNanoComputeGraph` — trimmed from `../ds2026/nano-llm/graph.hpp` (topological order + forward eval loop).
`js/desc_db.js`: entry `'nano-compute-graph'` — compute-graph forward pass via topological order; complexity O(V+E).
`js/i18n.js`: en `'method.nano-compute-graph': 'Compute Graph (DAG)'`; zh `'method.nano-compute-graph': '計算圖（DAG）'`.
`slides/zh/nano-compute-graph.md`: slide on DAG + topological forward pass.

- [ ] **Step 6: Run suites**

Run: `npm test` → green. `npx playwright test` → green (extend the smoke spec to cover `nano-compute-graph`, asserting `data-testid="cg-nodes"` renders).

- [ ] **Step 7: Commit**

```bash
git add js/nano_compute_graph_viz.js tests/unit/nano_compute_graph_viz.test.js slides/zh/nano-compute-graph.md index.html js/app.js js/code_db.js js/desc_db.js js/i18n.js
git commit -m "feat(viz): nano-compute-graph DAG topological forward pass"
```

---

### Task 3: `nano-bpe-train` — pair-count → merge (linked list + heap + hash)

**Files:**
- Create: `js/nano_bpe_train_viz.js`, `slides/zh/nano-bpe-train.md`
- Test: `tests/unit/nano_bpe_train_viz.test.js`
- Modify: `index.html`, `js/app.js`, `js/code_db.js`, `js/desc_db.js`, `js/i18n.js`

**Interfaces:**
- Consumes: the nano-LLM category (append an entry).
- Produces: `NanoBpeTrainViz.buildFrames(corpus: string[], numMerges: number) → { frames, merges }`
  where `frames[i] = { symbols:string[], pairCounts:[[string,number]], top:string|null, merged:string|null, round:number, status:'count'|'select'|'merge'|'done', msg:{en,zh} }` and `merges` is the ordered list of merged pairs (e.g. `'a b'`).

- [ ] **Step 1: Write the failing test** — `tests/unit/nano_bpe_train_viz.test.js`

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFrames } = require('../../js/nano_bpe_train_viz');

test('most frequent adjacent pair is merged first', () => {
  // corpus symbols: a b a b a b  -> pair "a b" appears 3x, "b a" 2x
  const { frames, merges } = buildFrames(['a','b','a','b','a','b'], 1);
  assert.equal(merges[0], 'a b');
  const final = frames[frames.length - 1];
  assert.equal(final.status, 'done');
  // after merging a+b -> "ab": ab ab ab
  assert.deepEqual(final.symbols, ['ab','ab','ab']);
});

test('two merges collapse "a b c" repeated into a single symbol', () => {
  const { merges } = buildFrames(['a','b','c','a','b','c'], 2);
  assert.equal(merges.length, 2);
  // first merge the most frequent pair, then a pair involving the new symbol
  assert.ok(merges[0] === 'a b' || merges[0] === 'b c');
});

test('numMerges is capped when no pair repeats', () => {
  const { merges } = buildFrames(['a','b','c'], 5);
  assert.ok(merges.length <= 2);
});
```

- [ ] **Step 2: Run it — fails**

Run: `node --test tests/unit/nano_bpe_train_viz.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/nano_bpe_train_viz.js`**

```js
(function (global) {
  function countPairs(symbols) {
    const counts = new Map();
    for (let i = 0; i + 1 < symbols.length; i++) {
      const key = symbols[i] + ' ' + symbols[i + 1];
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }
  // pick max count; tie-break by lexicographically smallest pair (deterministic "heap top")
  function best(counts) {
    let bk = null, bc = 0;
    for (const [k, c] of counts) {
      if (c > bc || (c === bc && bk !== null && k < bk)) { bk = k; bc = c; }
      else if (bk === null) { bk = k; bc = c; }
    }
    return bc >= 2 ? { pair: bk, count: bc } : null; // only merge pairs that repeat
  }
  function merge(symbols, pair) {
    const [l, r] = pair.split(' ');
    const out = [];
    for (let i = 0; i < symbols.length; i++) {
      if (i + 1 < symbols.length && symbols[i] === l && symbols[i + 1] === r) { out.push(l + r); i++; }
      else out.push(symbols[i]);
    }
    return out;
  }
  function buildFrames(corpus, numMerges) {
    let symbols = corpus.slice();
    const frames = [], merges = [];
    const snap = (o) => frames.push(Object.assign(
      { symbols: symbols.slice(), pairCounts: [], top: null, merged: null, round: merges.length, status: 'count' }, o));
    for (let round = 0; round < numMerges; round++) {
      const counts = countPairs(symbols);
      const pc = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
      snap({ pairCounts: pc, status: 'count', msg: { en: 'count adjacent pairs', zh: '統計相鄰配對' } });
      const b = best(counts);
      if (!b) break;
      snap({ pairCounts: pc, top: b.pair, status: 'select',
             msg: { en: 'heap top: "' + b.pair + '" ×' + b.count, zh: 'heap 最大："' + b.pair + '" ×' + b.count } });
      symbols = merge(symbols, b.pair); merges.push(b.pair);
      snap({ merged: b.pair, top: b.pair, status: 'merge',
             msg: { en: 'merge "' + b.pair + '" → ' + b.pair.replace(' ', ''), zh: '合併 "' + b.pair + '" → ' + b.pair.replace(' ', '') } });
    }
    snap({ status: 'done', msg: { en: merges.length + ' merges learned', zh: '學到 ' + merges.length + ' 個合併' } });
    return { frames, merges };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NanoBpeTrainViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run it — passes**

Run: `node --test tests/unit/nano_bpe_train_viz.test.js` → PASS (3 tests).

- [ ] **Step 5: Wire into the app**

`index.html`: `<script src="js/nano_bpe_train_viz.js" defer></script>`
`js/app.js`: append to nano-LLM category:
```js
{ id: 'nano-bpe-train', title: 'BPE Train (list+heap)', file: 'nano-bpe-train.cpp', visualizer: 'bpeTrain', controls: 'bpeTrain' },
```
code map `'nano-bpe-train': codeNanoBpeTrain,`; code title `'nano-bpe-train.cpp'`; dispatch `else if (currentMode === 'nano-bpe-train') renderNanoBpeTrain();`.

`render*` function:
```js
    let _bpeTrainState = null;
    function renderNanoBpeTrain() {
        const host = acquireDynamicVizHost();
        if (!_bpeTrainState) _bpeTrainState = { corpus: 'a,b,a,b,a,b,c', merges: 3 };
        const st = _bpeTrainState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const corpus = st.corpus.split(',').map((s) => s.trim()).filter(Boolean);
        const frames = NanoBpeTrainViz.buildFrames(corpus, st.merges).frames;
        let idx = 0;
        host.innerHTML =
            '<div class="ss-controls">' +
              'corpus <input type="text" class="bt-corpus" value="' + st.corpus + '">' +
              'merges <input type="number" class="bt-merges" min="1" max="10" value="' + st.merges + '" style="width:56px">' +
              '<button type="button" class="bt-apply">Apply</button>' +
            '</div>' +
            '<div class="bt-symbols" data-testid="bt-symbols"></div>' +
            '<div class="bt-pairs" data-testid="bt-pairs"></div>' +
            '<div class="ss-phase bt-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.bt-symbols').innerHTML = fr.symbols.map((s) => '<span class="bt-sym">' + s + '</span>').join('');
            host.querySelector('.bt-pairs').innerHTML = (fr.pairCounts || []).slice(0, 8).map(([p, c]) =>
                '<span class="bt-pair' + (p === fr.top ? ' top' : '') + '">' + p + ' ×' + c + '</span>').join('');
            host.querySelector('.bt-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(buildStepControls(step, reset, 800));
        paint();
        host.querySelector('.bt-apply').onclick = () => {
            const c = host.querySelector('.bt-corpus').value;
            const m = parseInt(host.querySelector('.bt-merges').value, 10);
            if (c && Number.isFinite(m) && m >= 1) { st.corpus = c; st.merges = m; renderNanoBpeTrain(); }
        };
    }
```

`js/code_db.js`: `const codeNanoBpeTrain` — trimmed from `../ds2026/nano-llm/bpe_trainer.hpp` (pair count + max-select + merge loop).
`js/desc_db.js`: entry `'nano-bpe-train'` — BPE training via pair counting + heap select + merge; complexity per round O(N).
`js/i18n.js`: en `'method.nano-bpe-train': 'BPE Train (list+heap)'`; zh `'method.nano-bpe-train': 'BPE 訓練（串列+heap）'`.
`slides/zh/nano-bpe-train.md`: slide on count→select→merge.

- [ ] **Step 6: Run suites**

Run: `npm test` → green. `npx playwright test` → green (smoke: `nano-bpe-train` shows `data-testid="bt-symbols"`).

- [ ] **Step 7: Commit**

```bash
git add js/nano_bpe_train_viz.js tests/unit/nano_bpe_train_viz.test.js slides/zh/nano-bpe-train.md index.html js/app.js js/code_db.js js/desc_db.js js/i18n.js
git commit -m "feat(viz): nano-bpe-train pair-count/merge with heap"
```

---

### Task 4: `nano-ngram-next` — n-gram counts → cumulative-distribution sampling

**Files:**
- Create: `js/nano_ngram_next_viz.js`, `slides/zh/nano-ngram-next.md`
- Test: `tests/unit/nano_ngram_next_viz.test.js`
- Modify: `index.html`, `js/app.js`, `js/code_db.js`, `js/desc_db.js`, `js/i18n.js`

**Interfaces:**
- Consumes: the nano-LLM category (append an entry).
- Produces: `NanoNgramNextViz.buildFrames(candidates: [string,number][], r: number) → { frames, picked }`
  where `candidates` is the next-token distribution for a fixed context, `r ∈ [0,1)` is the draw, and
  `frames[i] = { candidates, cumulative:number[], total:number, draw:number, lo:number, hi:number, mid:number, picked:string|null, status:'dist'|'cumsum'|'bsearch'|'pick'|'done', msg:{en,zh} }`.

- [ ] **Step 1: Write the failing test** — `tests/unit/nano_ngram_next_viz.test.js`

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFrames } = require('../../js/nano_ngram_next_viz');

const cand = [['the', 5], ['a', 3], ['cat', 2]]; // total 10

test('cumulative array is a prefix sum of counts', () => {
  const { frames } = buildFrames(cand, 0.0);
  const cum = frames.find((f) => f.status === 'cumsum').cumulative;
  assert.deepEqual(cum, [5, 8, 10]);
});

test('draw in the first bucket picks the first token', () => {
  const { picked } = buildFrames(cand, 0.1); // 0.1*10=1 -> bucket 0 (< 5)
  assert.equal(picked, 'the');
});

test('draw in the last bucket picks the last token', () => {
  const { picked } = buildFrames(cand, 0.95); // 9.5 -> bucket 2 (>=8)
  assert.equal(picked, 'cat');
});

test('bucket boundary picks the correct token', () => {
  const { picked } = buildFrames(cand, 0.5); // 5.0 -> first index with cum > 5 => bucket 1 ('a')
  assert.equal(picked, 'a');
});
```

- [ ] **Step 2: Run it — fails**

Run: `node --test tests/unit/nano_ngram_next_viz.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/nano_ngram_next_viz.js`**

```js
(function (global) {
  // Sample the next token from a count distribution via cumulative array + binary search.
  // Bucket rule: pick the first index i where target < cumulative[i], target = r*total.
  function buildFrames(candidates, r) {
    const frames = [];
    const total = candidates.reduce((a, [, c]) => a + c, 0);
    const cumulative = [];
    let run = 0;
    for (const [, c] of candidates) { run += c; cumulative.push(run); }
    frames.push({ candidates, cumulative: [], total, draw: r, lo: 0, hi: candidates.length - 1, mid: -1,
      picked: null, status: 'dist', msg: { en: 'distribution over ' + candidates.length + ' tokens', zh: candidates.length + ' 個候選 token 的分布' } });
    frames.push({ candidates, cumulative: cumulative.slice(), total, draw: r, lo: 0, hi: candidates.length - 1, mid: -1,
      picked: null, status: 'cumsum', msg: { en: 'cumulative counts', zh: '累積次數' } });
    const target = r * total;
    let lo = 0, hi = candidates.length - 1, ans = candidates.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      frames.push({ candidates, cumulative: cumulative.slice(), total, draw: target, lo, hi, mid,
        picked: null, status: 'bsearch', msg: { en: 'search target ' + target.toFixed(2) + ' at mid ' + mid, zh: '二分搜尋 target ' + target.toFixed(2) + '（mid ' + mid + '）' } });
      if (target < cumulative[mid]) { ans = mid; hi = mid - 1; } else { lo = mid + 1; }
    }
    const picked = candidates[ans][0];
    frames.push({ candidates, cumulative: cumulative.slice(), total, draw: target, lo, hi, mid: ans,
      picked, status: 'pick', msg: { en: 'pick "' + picked + '"', zh: '選出 "' + picked + '"' } });
    frames.push({ candidates, cumulative: cumulative.slice(), total, draw: target, lo, hi, mid: ans,
      picked, status: 'done', msg: { en: 'next token = "' + picked + '"', zh: '下一個 token = "' + picked + '"' } });
    return { frames, picked };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NanoNgramNextViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run it — passes**

Run: `node --test tests/unit/nano_ngram_next_viz.test.js` → PASS (4 tests).

- [ ] **Step 5: Wire into the app**

`index.html`: `<script src="js/nano_ngram_next_viz.js" defer></script>`
`js/app.js`: append to nano-LLM category:
```js
{ id: 'nano-ngram-next', title: 'n-gram Sampling (hash)', file: 'nano-ngram-next.cpp', visualizer: 'ngramNext', controls: 'ngramNext' },
```
code map `'nano-ngram-next': codeNanoNgramNext,`; code title `'nano-ngram-next.cpp'`; dispatch `else if (currentMode === 'nano-ngram-next') renderNanoNgramNext();`.

`render*` function:
```js
    let _ngramState = null;
    function renderNanoNgramNext() {
        const host = acquireDynamicVizHost();
        if (!_ngramState) _ngramState = { cand: 'the:5,a:3,cat:2', r: 0.5 };
        const st = _ngramState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const cand = st.cand.split(',').map((p) => { const [t, c] = p.split(':'); return [t.trim(), parseInt(c, 10)]; })
                        .filter(([t, c]) => t && Number.isFinite(c));
        const frames = NanoNgramNextViz.buildFrames(cand, st.r).frames;
        let idx = 0;
        host.innerHTML =
            '<div class="ss-controls">' +
              'dist <input type="text" class="ng-cand" value="' + st.cand + '">' +
              'r <input type="number" step="0.05" min="0" max="0.999" class="ng-r" value="' + st.r + '" style="width:70px">' +
              '<button type="button" class="ng-apply">Apply</button>' +
            '</div>' +
            '<div class="ng-bars" data-testid="ng-bars"></div>' +
            '<div class="ng-cum" data-testid="ng-cum"></div>' +
            '<div class="ss-phase ng-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.ng-bars').innerHTML = fr.candidates.map(([t, c], i) =>
                '<span class="ng-bar' + (fr.picked === t ? ' picked' : '') + '" style="height:' + (10 + c * 12) + 'px">' + t + ':' + c + '</span>').join('');
            host.querySelector('.ng-cum').innerHTML = (fr.cumulative || []).map((v, i) => {
                let cls = 'ng-cell';
                if (fr.status === 'bsearch' && i >= fr.lo && i <= fr.hi) cls += ' inrange';
                if (i === fr.mid) cls += ' mid';
                return '<span class="' + cls + '">' + v + '</span>';
            }).join('') + (fr.draw ? '<span class="ng-draw">draw=' + fr.draw.toFixed(2) + '</span>' : '');
            host.querySelector('.ng-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.ng-apply').onclick = () => {
            const c = host.querySelector('.ng-cand').value;
            const r = parseFloat(host.querySelector('.ng-r').value);
            if (c && Number.isFinite(r) && r >= 0 && r < 1) { st.cand = c; st.r = r; renderNanoNgramNext(); }
        };
    }
```

`js/code_db.js`: `const codeNanoNgramNext` — trimmed from `../ds2026/nano-llm/sampler.hpp` + `ngram_model.hpp` (cumulative array + binary-search sample).
`js/desc_db.js`: entry `'nano-ngram-next'` — n-gram counts (hash) + cumulative-distribution binary-search sampling; complexity build O(corpus), sample O(log k).
`js/i18n.js`: en `'method.nano-ngram-next': 'n-gram Sampling (hash)'`; zh `'method.nano-ngram-next': 'n-gram 取樣（hash）'`.
`slides/zh/nano-ngram-next.md`: slide on counts → cumulative → binary-search sampling.

- [ ] **Step 6: Run suites**

Run: `npm test` → green. `npx playwright test` → green (smoke: `nano-ngram-next` shows `data-testid="ng-bars"`).

- [ ] **Step 7: Commit**

```bash
git add js/nano_ngram_next_viz.js tests/unit/nano_ngram_next_viz.test.js slides/zh/nano-ngram-next.md index.html js/app.js js/code_db.js js/desc_db.js js/i18n.js
git commit -m "feat(viz): nano-ngram-next cumulative-distribution sampling"
```

---

## Notes for the implementer

- **Read `renderLruCache` in `js/app.js` first** — it is the exact template for the `render*` functions (host, `buildStepControls(step, reset, ms)`, `langOf(fr.msg)`, Apply/🎲 wiring, `data-testid` on stage divs).
- Before editing the `app.js` category array, inspect the surrounding category objects and match their exact key names (the entries above assume `{ id, title, file, visualizer, controls }` grouped under a category `{ id, title, items }` — adjust if the real shape differs).
- The `code_db.js` panels are illustrative excerpts of `../ds2026/nano-llm/*.hpp`; keep each self-contained and ≤ ~50 lines so it fits the panel. Do not import from ds2026 at runtime — paste a trimmed copy.
- Add minimal CSS for the new classes (`.be-*`, `.cg-*`, `.bt-*`, `.ng-*`) to `style.css`, reusing existing color variables; if a class isn't styled it still renders (text), so styling is polish, not a blocker.
- Keep the nano-LLM category last in the nav so it reads as the capstone group.

## Post-implementation (separate, noted — do not do in these tasks)

- ds2026 lectures: add `<!-- viz: nano-bpe-encode -->` (etc.) directives so the decks link to the viz.
- dsjudge: link each `nano-*` problem statement to its dsvisual viz.
