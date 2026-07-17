# app.js Stage 4 Phase B — Plan #1: hash domain (template)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extract the hash domain (hash-chain / hash-open / hash-bucket) out of `js/app.js` into `js/domains/hash.js`, establishing the reusable Phase B seam: a `VizCore` (domain registry + `getMode`), `VizKit` gaining the shared `showStatus`/`executeAnimWrapper` primitives, and `switchMode` resetting via per-domain `onModeSwitch` hooks. This is the TEMPLATE the other domains (linear/graph/tree/heap) follow. Zero behavior change; tests green each step.

**Architecture:** IIFE + globals, no bundler. `js/domains/hash.js` owns its state (`hashChData`/`hashOaData`/`hashBucketData`), its renderer (`renderHashes`), its animation logic (`runHashInsert`), and its action handler (`btnHashAdd`), self-registering its 3 renderers via `VizRegistry.attach` and itself via `VizCore.registerDomain`.

## Global Constraints

- No bundler; IIFE + `<script defer>`; load order: `registry.js` → `core/domains.js` → `domains/hash.js` → `app.js` (last).
- Zero behavior/styling/feature change; all suites green after every task.
- `code:` uses BARE code const (`() => codeHashChain`), never `global.codeX`.
- Core primitives resolved at call time via `const K = () => global.VizKit`, `const C = () => global.VizCore`.
- `sleep` is already a module-global function (app.js:5) — domains may call it directly.
- `updateLayout`'s hash container/action show-hide stays in app.js (shell concern) — do NOT move it; the hash DOM consts it uses (`hashChContainer`/`hashOaContainer`/`hashBucketContainer`/`hashActions`) STAY in app.js. The hash domain looks up its own element references in `init()`.

---

### Task 1: VizCore + VizKit primitives (the reusable seam)

**Files:** create `js/core/domains.js`, `tests/unit/domains.test.js`; modify `index.html`, `js/app.js`.

**Interfaces produced:**
- `window.VizCore`: `registerDomain(d)`, `domains()` (registration order), `getMode()`, `setMode(m)`, `bindMode(getter, setter)`.
- `window.VizKit` gains `showStatus` and `executeAnimWrapper` (in addition to the existing acquireDynamicVizHost/buildStepControls/getInputDifficulty/langOf/t).

- [ ] **Step 1: Failing test for VizCore**

Create `tests/unit/domains.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { VizCore } = require('../../js/core/domains');

test('registerDomain + domains() preserve registration order', () => {
  const a = { id: 'a' }, b = { id: 'b' };
  VizCore.registerDomain(a); VizCore.registerDomain(b);
  const ids = VizCore.domains().map((d) => d.id);
  assert.ok(ids.indexOf('a') !== -1 && ids.indexOf('b') !== -1);
  assert.ok(ids.indexOf('a') < ids.indexOf('b'));
});

test('bindMode wires getMode/setMode to the host accessors', () => {
  let mode = 'x';
  VizCore.bindMode(() => mode, (m) => { mode = m; });
  assert.equal(VizCore.getMode(), 'x');
  VizCore.setMode('y');
  assert.equal(mode, 'y');
  assert.equal(VizCore.getMode(), 'y');
});
```

- [ ] **Step 2: Run → fails** (`node --test tests/unit/domains.test.js`, module missing).

- [ ] **Step 3: Implement `js/core/domains.js`**

```js
(function (global) {
  const _domains = [];
  let _get = () => null;
  let _set = () => {};
  function registerDomain(d) { if (d) _domains.push(d); }
  function domains() { return _domains.slice(); }
  function bindMode(getter, setter) { if (getter) _get = getter; if (setter) _set = setter; }
  function getMode() { return _get(); }
  function setMode(m) { _set(m); }
  const api = { registerDomain, domains, bindMode, getMode, setMode };
  if (typeof module !== 'undefined' && module.exports) module.exports = { VizCore: api };
  global.VizCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run → passes** (`node --test tests/unit/domains.test.js`).

- [ ] **Step 5: Load it in index.html** — add after `js/core/registry.js`, before the viz/domain modules and app.js:

```html
    <script src="js/core/domains.js" defer></script>
```

- [ ] **Step 6: Extend VizKit + wire VizCore in app.js startup**

In `js/app.js`, in the `window.VizKit = { ... }` object (line ~1409), add two members:

```js
        showStatus,
        executeAnimWrapper,
```

(both are existing closure functions — `showStatus` at ~2247, `executeAnimWrapper` at 2181; adding references is safe, they keep their closures.)

Immediately after the `window.VizKit = {...}` assignment, wire the mode accessor and run domain `init`s (place BEFORE `registerBehaviors();` at line 1416):

```js
        if (window.VizCore) {
            window.VizCore.bindMode(() => currentMode, (m) => { currentMode = m; });
            window.VizCore.domains().forEach((d) => { if (d.init) d.init(); });
        }
```

- [ ] **Step 7: Route switchMode resets through onModeSwitch (no-op until a domain registers)**

In `switchMode` (app.js:1779), at the END of the reset block (right after the existing `if(currentMode.includes('heap-')) {...}` block, before `renderMethodSections(...)`), add:

```js
        if (window.VizCore) window.VizCore.domains().forEach((d) => { if (d.onModeSwitch) d.onModeSwitch(currentMode); });
```

Do NOT remove any existing reset lines yet (no domain is registered, so the forEach is a no-op — behavior identical).

- [ ] **Step 8: Verify no behavior change**

Run: `node --test tests/unit/*.test.js` (all pass) and `npx playwright test tests/smoke_modes.spec.js` (pass). `node -c js/app.js`.

- [ ] **Step 9: Commit**

```bash
git add js/core/domains.js tests/unit/domains.test.js index.html js/app.js
git commit -m "feat: add VizCore domain registry + VizKit anim/status primitives"
```

---

### Task 2: Extract the hash domain

**Files:** create `js/domains/hash.js`; modify `js/app.js`, `index.html`.

**Interfaces consumed:** `VizRegistry.attach`, `VizCore.registerDomain/getMode`, `VizKit.showStatus/executeAnimWrapper`, global `sleep`, global `codeHashChain/codeHashOpen/codeHashBucket`.

- [ ] **Step 1: Create `js/domains/hash.js`**

Move the hash state, `renderHashes`, and `runHashInsert` verbatim into this IIFE; convert `currentMode`→`C().getMode()`, `showStatus`→`K().showStatus`, and look up the containers in `init()`. Register the 3 renderers + the domain.

```js
(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  let hashChData = Array.from({ length: 5 }, () => []);
  let hashOaData = new Array(5).fill(null);
  let hashBucketData = Array.from({ length: 4 }, () => []);
  let dom = null; // { hashChContainer, hashOaContainer, hashBucketContainer, btnHashAdd, hashVal }

  function renderHashes() {
    const currentMode = C().getMode();
    // <-- paste the body of app.js renderHashes VERBATIM, with:
    //     currentMode already declared above;
    //     hashChContainer/hashOaContainer/hashBucketContainer -> dom.hashChContainer/...  -->
  }

  async function runHashInsert(val) {
    const currentMode = C().getMode();
    const showStatus = K().showStatus;
    // <-- paste the body of app.js runHashInsert VERBATIM, with:
    //     currentMode from getMode(); showStatus from VizKit; sleep() is a global;
    //     renderHashes() is the local one above -->
  }

  function onModeSwitch(mode) {
    if (mode === 'hash-chain') hashChData = Array.from({ length: 5 }, () => []);
    else if (mode === 'hash-open') hashOaData = new Array(5).fill(null);
    else if (mode === 'hash-bucket') hashBucketData = Array.from({ length: 4 }, () => []);
  }

  function init() {
    dom = {
      hashChContainer: document.getElementById('hash-ch-container'),
      hashOaContainer: document.getElementById('hash-oa-container'),
      hashBucketContainer: document.getElementById('hash-bucket-container'),
      btnHashAdd: document.getElementById('btn-hash-add'),
      hashVal: document.getElementById('hash-val'),
    };
    dom.btnHashAdd.addEventListener('click', () => {
      const val = parseInt(dom.hashVal.value);
      if (isNaN(val)) return K().showStatus('Enter valid number.', '#f87171');
      K().executeAnimWrapper(async () => await runHashInsert(val));
    });
  }

  R().attach('hash-chain', { render: renderHashes, code: () => codeHashChain, layout: null });
  R().attach('hash-open', { render: renderHashes, code: () => codeHashOpen, layout: null });
  R().attach('hash-bucket', { render: renderHashes, code: () => codeHashBucket, layout: null });
  C().registerDomain({ id: 'hash', init: init, onModeSwitch: onModeSwitch });
})(typeof window !== 'undefined' ? window : globalThis);
```

Note: `runHashInsert` builds element ids via `document.getElementById("hoa-slot-"+idx)` / `"hb-block-"+idx` — those stay as-is (global document lookup).

- [ ] **Step 2: Remove hash bits from app.js**

- Delete `hashChData`/`hashOaData`/`hashBucketData` declarations (lines ~1441-1443).
- Delete `renderHashes` function (~3287) and `runHashInsert` function (~3257).
- Delete the `btnHashAdd.addEventListener(...)` handler (~2206).
- In `switchMode`, delete the three hash reset lines (`if(currentMode === 'hash-chain') hashChData = ...` etc.) — now handled by the domain's `onModeSwitch` (invoked by the forEach added in Task 1).
- In `registerBehaviors`, delete the three `reg('hash-chain'|'hash-open'|'hash-bucket', ...)` lines (the domain registers them).
- In `renderAll`, delete the `else if (currentMode.includes('hash-')) renderHashes();` arm.
- KEEP in app.js: `hashChContainer`/`hashOaContainer`/`hashBucketContainer`/`hashActions` consts and their `updateLayout` show/hide (shell). KEEP `btnHashAdd`/`hashVal` consts ONLY if still referenced elsewhere — grep; if now unreferenced in app.js, remove them (the domain looks up its own).

After removal: `grep -n "renderHashes\|runHashInsert\|hashChData\|hashOaData\|hashBucketData" js/app.js` must be 0.

- [ ] **Step 3: Load the domain module** — in index.html add after `js/core/domains.js` (and after `code_db.js`), before `js/app.js`:

```html
    <script src="js/domains/hash.js" defer></script>
```

- [ ] **Step 4: Verify hash works end-to-end**

- `node -c js/app.js && node -c js/domains/hash.js`; grep clean.
- Run hash e2e if present (`grep -rl hash tests/*.spec.js`) + `npx playwright test tests/smoke_modes.spec.js`.
- Manual/scripted check (open index.html, select each hash mode): insert values into hash-chain (chains grow), hash-open (linear probing animates on collision), hash-bucket (overflow to next bucket); switching modes resets the table. Report the check.
- Full: `npx playwright test` + `node --test tests/unit/*.test.js`.

- [ ] **Step 5: Commit**

```bash
git add js/domains/hash.js js/app.js index.html
git commit -m "refactor: extract hash domain to js/domains/hash.js"
```

---

### Task 3: Verify + document the domain recipe

- [ ] **Step 1:** Full suite `npm run test:all` — all pass; report counts + `wc -l js/app.js`.
- [ ] **Step 2:** Confirm the seam: hash renderers dispatch via registry, `switchMode` resets hash via `onModeSwitch`, handler wired via `init()`. No hash references remain in app.js except the shell container/action show-hide in `updateLayout`.
- [ ] **Step 3:** Add a short "Adding/So moving a stateful domain" note to the Phase B design doc (or a `js/domains/README`): the `init()`/`onModeSwitch()`/`VizCore.registerDomain` + `VizRegistry.attach` recipe, so linear/graph/tree/heap plans reuse it. Commit.

---

## Self-Review

- **Spec coverage:** Phase B design's core seam (VizCore, VizKit primitives, onModeSwitch) → Task 1; hash domain (the template) → Task 2; verify + recipe doc → Task 3. Other domains are separate future plans.
- **Placeholder scan:** VizCore + module skeleton + all app.js edit points are concrete; the two large verbatim bodies (`renderHashes`, `runHashInsert`) are explicitly "paste verbatim with these substitutions" rather than re-transcribed — same approach proven in Phase A, exact substitutions listed.
- **Consistency:** `K()`/`C()`/`R()` accessors, bare code consts, `VizCore.registerDomain`, `onModeSwitch`, `init()` self-lookup — all consistent. The Task 1 `onModeSwitch` forEach is a no-op until Task 2 registers the hash domain, so each task is independently behavior-preserving.
- **Risk:** Task 1 adds the seam with zero behavior change (no domains registered). Task 2 flips hash over atomically (register domain + remove old paths together) so there's never a double-render or missing renderer. The other stateful domains stay untouched.
