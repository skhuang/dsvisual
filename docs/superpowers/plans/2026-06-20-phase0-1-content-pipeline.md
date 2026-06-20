# Phase 0 + Phase 1 — Content Pipeline (chap03 vertical slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the md→outputs pipeline geodatabase (directive parser, code-library resolver, consistency linter) and the first generator (ipynb), proven end-to-end on chap03 Stacks & Queues.

**Architecture:** ds2026 md lectures are the authoritative source. New Node (CommonJS) scripts under `dsvisual/pipeline/` read a lecture `.md` plus the canonical C++ in `dsvisual/cpp/`, and emit an xcpp17 Jupyter notebook. A consistency linter validates that every `<!-- code/viz/oj -->` directive points at something real. A small header-only C++ helper renders dsvisual-style static SVG snapshots inside the notebook.

**Tech Stack:** Node.js (CommonJS, `node --test`), no new npm deps (Node built-ins only). C++17 (g++) for the code library + SVG helper. xeus-cpp / xcpp17 kernel for executing the notebook.

## Global Constraints

- Module system: **CommonJS** (`require`/`module.exports`), matching `build_slides.js` / `build_db.js`. Verbatim from spec D3/§6.
- Unit tests: **`node --test`**, files at `tests/unit/*.test.js` (matches `package.json` `test:unit` glob `node --test tests/unit/*.test.js`).
- **No new npm dependencies** — use Node built-ins (`node:fs`, `node:path`, `node:test`, `node:assert`, `node:child_process`).
- Authoritative source repo: **ds2026** (sibling repo, default path `../ds2026`). Pipeline scripts live in **dsvisual**; they read ds2026 md via a configurable dir (`DS2026_DIR`, default `../ds2026`).
- Canonical C++ library: **`dsvisual/cpp/`** (decision D4; sustains "code single source"). Default `LIB_DIR=./cpp`.
- ipynb is **degraded presentation** (decision D5): only `cpp` fences tagged `<!-- runnable -->` become executable code cells; `sparks`/`text`/prose stay markdown. Each notebook defines any given type name at most once.
- Directive syntax (spec §5): HTML comments — `<!-- code: FILE[#SECTION] -->`, `<!-- runnable -->`, `<!-- viz: ID -->`, `<!-- oj: ID ["TITLE"] -->`.
- Phase 1 target chapter: **chap03 Stacks & Queues** (decision D7). Its binding targets already exist: `cpp/stack_array.cpp`, `cpp/stack_linkedlist.cpp`, `cpp/queue.cpp`, `cpp/deque.cpp`, `cpp/maze_stack.cpp`; viz ids `stack-array`/`queue`/`deque`; OJ ids `lab01-stack`/`lab02-queue`.
- Commit cadence: one commit per task. Spec lives at `dsvisual/docs/specs/2026-06-20-course-content-pipeline-design.md`.

---

## File Structure

| File | Responsibility |
|---|---|
| `pipeline/parse-lecture.js` (new) | Parse a lecture `.md` into ordered cells + a flat list of directive bindings. Pure, no I/O. |
| `pipeline/code-library.js` (new) | Resolve a `code:` ref (`FILE` or `FILE#SECTION`) against `LIB_DIR` to source text. |
| `pipeline/lint.js` (new) | CLI + pure core: validate all bindings (code file exists, viz id known, oj id known/warn). |
| `pipeline/build-notebook.js` (new) | Pure: turn parsed cells into a Jupyter notebook object (xcpp17 kernelspec). |
| `pipeline/gen-ipynb.js` (new) | CLI: read a chapter md, parse, build, write `.ipynb` (+ `--readonly` variant). |
| `cpp/viz/dsvisual_render.hpp` (new) | Header-only C++: `dsvisual::stack_svg(...)` / `queue_svg(...)` → SVG string; thin `mime_bundle_repr`. |
| `docs/pipeline/DIRECTIVES.md` (new) | Authoritative directive-syntax reference. |
| `tests/unit/parse-lecture.test.js` (new) | Unit tests for the parser. |
| `tests/unit/code-library.test.js` (new) | Unit tests for the resolver. |
| `tests/unit/lint.test.js` (new) | Unit tests for the linter core. |
| `tests/unit/build-notebook.test.js` (new) | Unit tests for the notebook builder. |
| `tests/unit/dsvisual_render.test.js` (new) | Compile+run test for the C++ SVG helper (gated on g++). |
| `ds2026: chap03_stacks_queues_core.md` (modify) | Add directive comments (cross-repo edit). |
| `ds2026: notebooks/chap03_stacks_queues.ipynb` (new, generated) | The Phase 1 deliverable notebook. |

---

## PHASE 0 — Geodatabase

### Task 1: Lecture parser (`parse-lecture.js`)

**Files:**
- Create: `pipeline/parse-lecture.js`
- Create: `docs/pipeline/DIRECTIVES.md`
- Test: `tests/unit/parse-lecture.test.js`

**Interfaces:**
- Produces: `parseLecture(md: string) => { cells: Cell[], bindings: Binding[] }`
  - `Cell = { kind: 'markdown' | 'code', source: string, lang: string|null, runnable: boolean, codeRef: string|null }`
  - `Binding = { type: 'code'|'runnable'|'viz'|'oj', value: string, title: string|null, line: number }`
- Rules: a fenced code block becomes a `code` cell (`lang` = the fence info string, or `null`). Everything between code fences becomes one `markdown` cell (whitespace-only spans are dropped). A directive HTML comment on its own line **immediately above** a fence attaches to that code cell: `code:` sets `codeRef`, `runnable` sets `runnable=true`. Every directive comment (anywhere) is also appended to `bindings`. The YAML front-matter block (first `---`…`---`) is kept as the first markdown cell verbatim.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/parse-lecture.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { parseLecture } = require('../../pipeline/parse-lecture.js');

test('splits prose and fenced code into ordered cells', () => {
  const md = [
    'Intro paragraph.',
    '',
    '```cpp',
    'int x = 1;',
    '```',
    '',
    'After paragraph.',
  ].join('\n');
  const { cells } = parseLecture(md);
  assert.equal(cells.length, 3);
  assert.equal(cells[0].kind, 'markdown');
  assert.equal(cells[1].kind, 'code');
  assert.equal(cells[1].lang, 'cpp');
  assert.equal(cells[1].source, 'int x = 1;');
  assert.equal(cells[2].kind, 'markdown');
});

test('runnable + code directives attach to the following code cell', () => {
  const md = [
    '<!-- code: stack_array.cpp#push -->',
    '<!-- runnable -->',
    '```cpp',
    's.push(10);',
    '```',
  ].join('\n');
  const { cells, bindings } = parseLecture(md);
  const code = cells.find((c) => c.kind === 'code');
  assert.equal(code.runnable, true);
  assert.equal(code.codeRef, 'stack_array.cpp#push');
  assert.ok(bindings.some((b) => b.type === 'code' && b.value === 'stack_array.cpp#push'));
  assert.ok(bindings.some((b) => b.type === 'runnable'));
});

test('viz and oj directives become bindings with optional title', () => {
  const md = [
    '<!-- viz: stack-array -->',
    '<!-- oj: lab01-stack "Stack 實作" -->',
    'Some prose.',
  ].join('\n');
  const { bindings } = parseLecture(md);
  const viz = bindings.find((b) => b.type === 'viz');
  const oj = bindings.find((b) => b.type === 'oj');
  assert.equal(viz.value, 'stack-array');
  assert.equal(oj.value, 'lab01-stack');
  assert.equal(oj.title, 'Stack 實作');
});

test('sparks fence keeps its language tag', () => {
  const md = ['```sparks', 'procedure ADD', '```'].join('\n');
  const { cells } = parseLecture(md);
  assert.equal(cells[0].kind, 'code');
  assert.equal(cells[0].lang, 'sparks');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/parse-lecture.test.js`
Expected: FAIL — `Cannot find module '../../pipeline/parse-lecture.js'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// pipeline/parse-lecture.js
'use strict';

const DIRECTIVE_RE = /^<!--\s*(code|runnable|viz|oj):?\s*(.*?)\s*-->\s*$/;
const FENCE_RE = /^```(.*)$/;

// Parse one directive comment line into a Binding, or null if not a directive.
function parseDirectiveLine(line, lineNo) {
  const m = line.match(/^<!--\s*(code|runnable|viz|oj)\b\s*:?\s*(.*?)\s*-->\s*$/);
  if (!m) return null;
  const type = m[1];
  let rest = m[2];
  let title = null;
  const titleMatch = rest.match(/"([^"]*)"\s*$/);
  if (titleMatch) {
    title = titleMatch[1];
    rest = rest.slice(0, titleMatch.index).trim();
  }
  return { type, value: rest, title, line: lineNo };
}

function pushMarkdown(cells, buf) {
  const text = buf.join('\n').replace(/^\n+|\n+$/g, '');
  if (text.trim() !== '') {
    cells.push({ kind: 'markdown', source: text, lang: null, runnable: false, codeRef: null });
  }
}

function parseLecture(md) {
  const lines = String(md).split('\n');
  const cells = [];
  const bindings = [];
  let mdBuf = [];
  let pending = { codeRef: null, runnable: false }; // directives waiting for the next fence
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const dir = parseDirectiveLine(line, i + 1);
    if (dir) {
      bindings.push(dir);
      if (dir.type === 'code') pending.codeRef = dir.value;
      if (dir.type === 'runnable') pending.runnable = true;
      i += 1;
      continue;
    }
    const fence = line.match(FENCE_RE);
    if (fence) {
      pushMarkdown(cells, mdBuf);
      mdBuf = [];
      const lang = fence[1].trim() === '' ? null : fence[1].trim();
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].match(FENCE_RE)) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // consume closing fence
      cells.push({
        kind: 'code',
        source: body.join('\n'),
        lang,
        runnable: pending.runnable,
        codeRef: pending.codeRef,
      });
      pending = { codeRef: null, runnable: false };
      continue;
    }
    mdBuf.push(line);
    i += 1;
  }
  pushMarkdown(cells, mdBuf);
  return { cells, bindings };
}

module.exports = { parseLecture, parseDirectiveLine };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/parse-lecture.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the directive reference doc**

```markdown
<!-- docs/pipeline/DIRECTIVES.md -->
# Lecture Directive Reference

Directives are HTML comments — invisible in Marp render, parsed by the pipeline.

| Directive | Placement | Effect |
|---|---|---|
| `<!-- code: FILE -->` | line above a code fence | the code is the canonical `cpp/FILE`; generators pull from the single source |
| `<!-- code: FILE#SECTION -->` | line above a code fence | pull only the marked section (`// >>> SECTION` … `// <<< SECTION`) |
| `<!-- runnable -->` | line above a `cpp` fence | this becomes an executable xcpp17 cell in the notebook |
| `<!-- viz: ID -->` | anywhere in a slide | binds to the dsvisual interactive viz `ID` |
| `<!-- oj: ID "TITLE" -->` | exercise section | binds to OJ problem `ID`; title optional |

The consistency linter (`pipeline/lint.js`) fails if any `code`/`viz`/`oj`
target does not exist.
```

- [ ] **Step 6: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add pipeline/parse-lecture.js tests/unit/parse-lecture.test.js docs/pipeline/DIRECTIVES.md
git commit -m "feat(pipeline): lecture directive parser + directive reference"
```

---

### Task 2: Code-library resolver (`code-library.js`)

**Files:**
- Create: `pipeline/code-library.js`
- Test: `tests/unit/code-library.test.js`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: `resolveCode(ref: string, libDir: string) => string`
  - `ref` is `FILE` (whole file) or `FILE#SECTION`. Section bounds are marker comments `// >>> SECTION` and `// <<< SECTION` (the marker lines themselves are excluded).
  - Throws `Error` if the file is missing or the section is not found.
- Produces: `resolveCodeSafe(ref, libDir) => { ok: boolean, error: string|null }` (existence check used by the linter; never throws).

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/code-library.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveCode, resolveCodeSafe } = require('../../pipeline/code-library.js');

function tmpLib() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-'));
  fs.writeFileSync(path.join(dir, 'stack_array.cpp'), [
    '#include <iostream>',
    '// >>> push',
    'bool push(int v){ return true; }',
    '// <<< push',
    'int main(){ return 0; }',
  ].join('\n'));
  return dir;
}

test('resolves a whole file', () => {
  const dir = tmpLib();
  const src = resolveCode('stack_array.cpp', dir);
  assert.ok(src.includes('#include <iostream>'));
  assert.ok(src.includes('int main()'));
});

test('resolves a marked section, excluding the marker lines', () => {
  const dir = tmpLib();
  const src = resolveCode('stack_array.cpp#push', dir);
  assert.equal(src.trim(), 'bool push(int v){ return true; }');
  assert.ok(!src.includes('>>>'));
});

test('throws on missing file', () => {
  const dir = tmpLib();
  assert.throws(() => resolveCode('nope.cpp', dir), /not found/i);
});

test('throws on missing section', () => {
  const dir = tmpLib();
  assert.throws(() => resolveCode('stack_array.cpp#ghost', dir), /section/i);
});

test('resolveCodeSafe reports without throwing', () => {
  const dir = tmpLib();
  assert.deepEqual(resolveCodeSafe('stack_array.cpp', dir), { ok: true, error: null });
  assert.equal(resolveCodeSafe('nope.cpp', dir).ok, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/code-library.test.js`
Expected: FAIL — `Cannot find module '../../pipeline/code-library.js'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// pipeline/code-library.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function splitRef(ref) {
  const hash = ref.indexOf('#');
  if (hash === -1) return { file: ref, section: null };
  return { file: ref.slice(0, hash), section: ref.slice(hash + 1) };
}

function extractSection(src, section) {
  const lines = src.split('\n');
  const begin = lines.findIndex((l) => l.trim() === `// >>> ${section}`);
  const end = lines.findIndex((l) => l.trim() === `// <<< ${section}`);
  if (begin === -1 || end === -1 || end <= begin) {
    throw new Error(`section not found: ${section}`);
  }
  return lines.slice(begin + 1, end).join('\n');
}

function resolveCode(ref, libDir) {
  const { file, section } = splitRef(ref);
  const full = path.join(libDir, file);
  if (!fs.existsSync(full)) throw new Error(`code file not found: ${file}`);
  const src = fs.readFileSync(full, 'utf8');
  return section ? extractSection(src, section) : src;
}

function resolveCodeSafe(ref, libDir) {
  try {
    resolveCode(ref, libDir);
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { resolveCode, resolveCodeSafe, splitRef };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/code-library.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add pipeline/code-library.js tests/unit/code-library.test.js
git commit -m "feat(pipeline): code-library resolver with section markers"
```

---

### Task 3: Consistency linter (`lint.js`)

**Files:**
- Create: `pipeline/lint.js`
- Test: `tests/unit/lint.test.js`

**Interfaces:**
- Consumes: `parseLecture` (Task 1), `resolveCodeSafe` (Task 2).
- Produces: `lintBindings({ bindings, libDir, vizIds, ojIds }) => { errors: string[], warnings: string[] }`
  - `code` binding → error if `resolveCodeSafe` fails.
  - `viz` binding → error if `value` not in `vizIds` (a `Set`).
  - `oj` binding → warning if `value` not in `ojIds` (a `Set`) — OJ problems may not exist until Phase 2, so missing oj is a warning, not an error.
  - `runnable` bindings are ignored (no target).
- Produces: CLI `node pipeline/lint.js <chapter.md>` — exit code 1 if any error, 0 otherwise; prints errors/warnings. Discovers `vizIds` from `slides/en/*.md` filenames, `ojIds` from `${DS_JUDGE_DIR:-../dsjudge}/problems/*` dir names (empty set if absent).

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/lint.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { lintBindings } = require('../../pipeline/lint.js');

function tmpLib() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-'));
  fs.writeFileSync(path.join(dir, 'stack_array.cpp'), 'int main(){return 0;}');
  return dir;
}

test('passes when all bindings resolve', () => {
  const dir = tmpLib();
  const out = lintBindings({
    bindings: [
      { type: 'code', value: 'stack_array.cpp', title: null, line: 1 },
      { type: 'viz', value: 'stack-array', title: null, line: 2 },
      { type: 'oj', value: 'lab01-stack', title: null, line: 3 },
    ],
    libDir: dir,
    vizIds: new Set(['stack-array']),
    ojIds: new Set(['lab01-stack']),
  });
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.warnings, []);
});

test('errors on missing code file and unknown viz id', () => {
  const dir = tmpLib();
  const out = lintBindings({
    bindings: [
      { type: 'code', value: 'ghost.cpp', title: null, line: 1 },
      { type: 'viz', value: 'nope', title: null, line: 2 },
    ],
    libDir: dir,
    vizIds: new Set(['stack-array']),
    ojIds: new Set(),
  });
  assert.equal(out.errors.length, 2);
});

test('warns (not errors) on unknown oj id', () => {
  const dir = tmpLib();
  const out = lintBindings({
    bindings: [{ type: 'oj', value: 'lab99-future', title: null, line: 1 }],
    libDir: dir,
    vizIds: new Set(),
    ojIds: new Set(),
  });
  assert.deepEqual(out.errors, []);
  assert.equal(out.warnings.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/lint.test.js`
Expected: FAIL — `Cannot find module '../../pipeline/lint.js'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// pipeline/lint.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseLecture } = require('./parse-lecture.js');
const { resolveCodeSafe } = require('./code-library.js');

function lintBindings({ bindings, libDir, vizIds, ojIds }) {
  const errors = [];
  const warnings = [];
  for (const b of bindings) {
    if (b.type === 'code') {
      const r = resolveCodeSafe(b.value, libDir);
      if (!r.ok) errors.push(`line ${b.line}: code: ${b.value} — ${r.error}`);
    } else if (b.type === 'viz') {
      if (!vizIds.has(b.value)) errors.push(`line ${b.line}: viz: unknown id "${b.value}"`);
    } else if (b.type === 'oj') {
      if (!ojIds.has(b.value)) warnings.push(`line ${b.line}: oj: "${b.value}" has no problem dir yet`);
    }
  }
  return { errors, warnings };
}

function discoverVizIds(dsvisualDir) {
  const dir = path.join(dsvisualDir, 'slides', 'en');
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));
}

function discoverOjIds(dsjudgeDir) {
  const dir = path.join(dsjudgeDir, 'problems');
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name));
}

function main() {
  const mdPath = process.argv[2];
  if (!mdPath) {
    console.error('usage: node pipeline/lint.js <chapter.md>');
    process.exit(2);
  }
  const dsvisualDir = __dirname.replace(/\/pipeline$/, '');
  const libDir = process.env.LIB_DIR || path.join(dsvisualDir, 'cpp');
  const dsjudgeDir = process.env.DS_JUDGE_DIR || path.join(dsvisualDir, '..', 'dsjudge');
  const { bindings } = parseLecture(fs.readFileSync(mdPath, 'utf8'));
  const out = lintBindings({
    bindings,
    libDir,
    vizIds: discoverVizIds(dsvisualDir),
    ojIds: discoverOjIds(dsjudgeDir),
  });
  for (const w of out.warnings) console.warn('WARN ' + w);
  for (const e of out.errors) console.error('ERR  ' + e);
  console.log(`${out.errors.length} error(s), ${out.warnings.length} warning(s)`);
  process.exit(out.errors.length ? 1 : 0);
}

module.exports = { lintBindings, discoverVizIds, discoverOjIds };

if (require.main === module) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/lint.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add pipeline/lint.js tests/unit/lint.test.js
git commit -m "feat(pipeline): consistency linter for code/viz/oj bindings"
```

---

### Task 4: Annotate chap03 and lint it green (cross-repo)

**Files:**
- Modify: `../ds2026/chap03_stacks_queues_core.md` (add directive comments)
- (No new unit test — this is an integration checkpoint using the Task 3 CLI.)

**Interfaces:**
- Consumes: the `pipeline/lint.js` CLI (Task 3), the existing `cpp/stack_array.cpp` etc.

**Note on viz ids:** confirm the exact viz slide names first — run `ls slides/en | grep -Ei 'stack|queue|deque'`. Use those exact basenames as the `viz:` values (e.g. `deque`). For stack/queue, if no dedicated slide exists, omit the `viz:` directive rather than inventing an id (the linter would otherwise error).

- [ ] **Step 1: Add section markers to the library files chap03 needs**

For each `cpp/` file chap03 will reference by section, wrap the relevant member with markers. Example for `cpp/stack_array.cpp` — wrap `push` and `pop`:

```cpp
    // >>> push
    bool push(int val) {
        if (topIndex >= MAX_SIZE - 1) { cout << "Stack Overflow!" << endl; return false; }
        arr[++topIndex] = val;
        cout << "Pushed " << val << endl;
        return true;
    }
    // <<< push
```

Add equivalent `// >>> pop` / `// <<< pop` around `pop`. (Whole-file refs need no markers.)

- [ ] **Step 2: Add directives to chap03 md**

Above the chapter's C++ implementation fences, add `<!-- code: ... -->` (+ `<!-- runnable -->` where the snippet is self-contained and meant to run). At the exercise sections add `<!-- oj: lab01-stack "Stack 實作" -->` and `<!-- oj: lab02-queue "Queue 實作" -->`. Add `<!-- viz: deque -->` (and stack/queue viz ids only if their slides exist) near the relevant slides. Example block in the md:

```markdown
# Stack 的陣列實作

<!-- code: stack_array.cpp -->
<!-- runnable -->
```cpp
class StackArray { /* ... canonical body lives in cpp/stack_array.cpp ... */ };
```
```

(The fence body may stay as-is for now; Phase 1's generator will replace it from the canonical file via the `code:` ref.)

- [ ] **Step 3: Run the linter and confirm zero errors**

Run: `cd /Users/skhuang/course/dsvisual && node pipeline/lint.js ../ds2026/chap03_stacks_queues_core.md`
Expected: `0 error(s), N warning(s)` and exit 0. (OJ warnings are fine — problems get created in Phase 2.) Fix any `ERR` lines (wrong filename, unknown viz id) until errors are zero.

- [ ] **Step 4: Commit (two repos)**

```bash
cd /Users/skhuang/course/dsvisual
git add cpp/stack_array.cpp cpp/stack_linkedlist.cpp cpp/queue.cpp
git commit -m "feat(cpp): section markers for chap03 code-library refs"

cd /Users/skhuang/course/ds2026
git add chap03_stacks_queues_core.md
git commit -m "docs(chap03): annotate code/viz/oj directives for pipeline"
```

---

## PHASE 1 — ipynb generator

### Task 5: Notebook builder (`build-notebook.js`)

**Files:**
- Create: `pipeline/build-notebook.js`
- Test: `tests/unit/build-notebook.test.js`

**Interfaces:**
- Consumes: `Cell[]` from `parseLecture` (Task 1); `resolveCode` (Task 2).
- Produces: `buildNotebook(cells: Cell[], opts?: { libDir?: string }) => NotebookObject`
  - Kernelspec: `{ name: 'xcpp17', display_name: 'C++17', language: 'C++17' }`; `nbformat: 4`, `nbformat_minor: 5`.
  - A cell becomes a **code cell** (`cell_type: 'code'`, `execution_count: null`, `outputs: []`, `metadata: {}`) only when `kind === 'code' && runnable && lang === 'cpp'`. Its `source` is taken from `resolveCode(codeRef, libDir)` when `codeRef` is set, else from the cell's own `source`.
  - Every other cell becomes a **markdown cell**. A non-runnable code cell is rendered as a fenced block inside markdown (```` ```<lang> ... ``` ````) so it shows highlighted but never executes.
  - `source` is stored as an array of lines each ending in `\n` (nbformat convention), except the last.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/build-notebook.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { buildNotebook } = require('../../pipeline/build-notebook.js');

test('runnable cpp cell becomes a code cell with xcpp17 kernel', () => {
  const nb = buildNotebook([
    { kind: 'code', source: 'int x=1;', lang: 'cpp', runnable: true, codeRef: null },
  ]);
  assert.equal(nb.metadata.kernelspec.name, 'xcpp17');
  assert.equal(nb.nbformat, 4);
  assert.equal(nb.cells[0].cell_type, 'code');
  assert.equal(nb.cells[0].execution_count, null);
  assert.deepEqual(nb.cells[0].outputs, []);
});

test('sparks (non-runnable) code becomes a fenced markdown cell', () => {
  const nb = buildNotebook([
    { kind: 'code', source: 'procedure ADD', lang: 'sparks', runnable: false, codeRef: null },
  ]);
  assert.equal(nb.cells[0].cell_type, 'markdown');
  assert.ok(nb.cells[0].source.join('').includes('```sparks'));
});

test('prose markdown passes through', () => {
  const nb = buildNotebook([
    { kind: 'markdown', source: 'Hello', lang: null, runnable: false, codeRef: null },
  ]);
  assert.equal(nb.cells[0].cell_type, 'markdown');
  assert.equal(nb.cells[0].source.join(''), 'Hello');
});

test('runnable cell with codeRef pulls from the library', () => {
  const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-'));
  fs.writeFileSync(path.join(dir, 'snippet.cpp'), 'int fromLib(){return 7;}');
  const nb = buildNotebook(
    [{ kind: 'code', source: 'PLACEHOLDER', lang: 'cpp', runnable: true, codeRef: 'snippet.cpp' }],
    { libDir: dir }
  );
  assert.ok(nb.cells[0].source.join('').includes('fromLib'));
  assert.ok(!nb.cells[0].source.join('').includes('PLACEHOLDER'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/build-notebook.test.js`
Expected: FAIL — `Cannot find module '../../pipeline/build-notebook.js'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// pipeline/build-notebook.js
'use strict';

const { resolveCode } = require('./code-library.js');

// nbformat stores source as a list of lines, each (except the last) ending '\n'.
function toSourceArray(text) {
  const lines = String(text).split('\n');
  return lines.map((l, i) => (i < lines.length - 1 ? l + '\n' : l));
}

function codeCell(text) {
  return { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: toSourceArray(text) };
}

function markdownCell(text) {
  return { cell_type: 'markdown', metadata: {}, source: toSourceArray(text) };
}

function buildNotebook(cells, opts = {}) {
  const libDir = opts.libDir || null;
  const out = [];
  for (const c of cells) {
    const isRunnable = c.kind === 'code' && c.runnable && c.lang === 'cpp';
    if (isRunnable) {
      const src = c.codeRef && libDir ? resolveCode(c.codeRef, libDir) : c.source;
      out.push(codeCell(src));
    } else if (c.kind === 'code') {
      out.push(markdownCell('```' + (c.lang || '') + '\n' + c.source + '\n```'));
    } else {
      out.push(markdownCell(c.source));
    }
  }
  return {
    cells: out,
    metadata: {
      kernelspec: { name: 'xcpp17', display_name: 'C++17', language: 'C++17' },
      language_info: { name: 'C++17', mimetype: 'text/x-c++src', file_extension: '.cpp' },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

module.exports = { buildNotebook, toSourceArray };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/build-notebook.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add pipeline/build-notebook.js tests/unit/build-notebook.test.js
git commit -m "feat(pipeline): notebook builder (xcpp17, runnable-cell rule)"
```

---

### Task 6: C++ SVG render helper (`dsvisual_render.hpp`)

**Files:**
- Create: `cpp/viz/dsvisual_render.hpp`
- Test: `tests/unit/dsvisual_render.test.js` (compiles a driver with g++, runs it, asserts on output)

**Interfaces:**
- Produces (C++): `std::string dsvisual::stack_svg(const std::vector<int>& items)` and `std::string dsvisual::queue_svg(const std::vector<int>& items)` — return a self-contained `<svg>…</svg>` string drawing the boxes left→right with the integer values as labels.
- The `mime_bundle_repr` wrapper is added later inside the notebook (it needs `nlohmann::json` from the xeus runtime); the header stays runtime-free so it compiles with plain g++.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/unit/dsvisual_render.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const hasGpp = spawnSync('g++', ['--version']).status === 0;

test('stack_svg emits an <svg> containing the values', { skip: !hasGpp && 'g++ not installed' }, () => {
  const repo = path.join(__dirname, '..', '..');
  const driver = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'svg-')), 'd.cpp');
  fs.writeFileSync(driver, [
    '#include "' + path.join(repo, 'cpp', 'viz', 'dsvisual_render.hpp') + '"',
    '#include <iostream>',
    'int main(){ std::cout << dsvisual::stack_svg({10,20,30}); return 0; }',
  ].join('\n'));
  const bin = driver.replace(/\.cpp$/, '');
  execFileSync('g++', ['-std=c++17', '-O0', '-o', bin, driver]);
  const out = execFileSync(bin).toString();
  assert.ok(out.includes('<svg'));
  assert.ok(out.includes('</svg>'));
  assert.ok(out.includes('10') && out.includes('20') && out.includes('30'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/dsvisual_render.test.js`
Expected: FAIL — g++ error: `dsvisual_render.hpp: No such file or directory` (or test skipped if g++ absent — if skipped, still create the header in Step 3 and re-run on a machine with g++).

- [ ] **Step 3: Write minimal implementation**

```cpp
// cpp/viz/dsvisual_render.hpp — runtime-free SVG snapshots, dsvisual node-box style.
#ifndef DSVISUAL_RENDER_HPP
#define DSVISUAL_RENDER_HPP
#include <string>
#include <vector>

namespace dsvisual {

inline std::string boxes_svg(const std::vector<int>& items, const std::string& title) {
    const int bw = 60, bh = 40, gap = 10, pad = 20;
    const int w = pad * 2 + (int)items.size() * (bw + gap);
    const int h = 90;
    std::string s = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" +
        std::to_string(w) + "\" height=\"" + std::to_string(h) + "\" viewBox=\"0 0 " +
        std::to_string(w) + " " + std::to_string(h) + "\">";
    s += "<text x=\"" + std::to_string(pad) + "\" y=\"18\" font-family=\"monospace\" font-size=\"14\">" + title + "</text>";
    for (size_t i = 0; i < items.size(); ++i) {
        int x = pad + (int)i * (bw + gap);
        s += "<rect x=\"" + std::to_string(x) + "\" y=\"35\" width=\"" + std::to_string(bw) +
             "\" height=\"" + std::to_string(bh) + "\" fill=\"#ECECFF\" stroke=\"#9370DB\"/>";
        s += "<text x=\"" + std::to_string(x + bw / 2) + "\" y=\"60\" font-family=\"monospace\" font-size=\"14\" "
             "text-anchor=\"middle\">" + std::to_string(items[i]) + "</text>";
    }
    s += "</svg>";
    return s;
}

inline std::string stack_svg(const std::vector<int>& items) { return boxes_svg(items, "stack (bottom -> top)"); }
inline std::string queue_svg(const std::vector<int>& items) { return boxes_svg(items, "queue (front -> back)"); }

} // namespace dsvisual
#endif
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/dsvisual_render.test.js`
Expected: PASS (or SKIP if g++ unavailable — then run on a g++ machine before merging).

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add cpp/viz/dsvisual_render.hpp tests/unit/dsvisual_render.test.js
git commit -m "feat(cpp/viz): runtime-free dsvisual-style SVG snapshot helper"
```

---

### Task 7: ipynb generator CLI (`gen-ipynb.js`)

**Files:**
- Create: `pipeline/gen-ipynb.js`
- Output (generated): `../ds2026/notebooks/chap03_stacks_queues.ipynb`
- (No new unit test; covered by Task 5. This task is the integration checkpoint that produces the deliverable.)

**Interfaces:**
- Consumes: `parseLecture` (Task 1), `buildNotebook` (Task 5).
- CLI: `node pipeline/gen-ipynb.js <chapter.md> [--out <path.ipynb>] [--readonly]`
  - Default `--out`: `${DS2026_DIR:-../ds2026}/notebooks/<basename>.ipynb`.
  - `--readonly`: convert every code cell to a fenced markdown cell (views in nbviewer without a kernel). Writes alongside with `.readonly.ipynb` suffix when combined with default out.
  - Writes pretty-printed JSON (2-space) so diffs are reviewable.

- [ ] **Step 1: Write the CLI**

```javascript
// pipeline/gen-ipynb.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseLecture } = require('./parse-lecture.js');
const { buildNotebook } = require('./build-notebook.js');

function toReadonly(nb) {
  const cells = nb.cells.map((c) => {
    if (c.cell_type !== 'code') return c;
    const body = c.source.join('');
    return { cell_type: 'markdown', metadata: {}, source: ['```cpp\n', body, '\n```'] };
  });
  return Object.assign({}, nb, { cells });
}

function main() {
  const args = process.argv.slice(2);
  const mdPath = args[0];
  if (!mdPath) { console.error('usage: node pipeline/gen-ipynb.js <chapter.md> [--out p] [--readonly]'); process.exit(2); }
  const readonly = args.includes('--readonly');
  const outIdx = args.indexOf('--out');
  const dsvisualDir = __dirname.replace(/\/pipeline$/, '');
  const ds2026Dir = process.env.DS2026_DIR || path.join(dsvisualDir, '..', 'ds2026');
  const libDir = process.env.LIB_DIR || path.join(dsvisualDir, 'cpp');
  const base = path.basename(mdPath).replace(/\.md$/, '');
  let outPath = outIdx !== -1 ? args[outIdx + 1] : path.join(ds2026Dir, 'notebooks', base + '.ipynb');
  if (readonly && outIdx === -1) outPath = outPath.replace(/\.ipynb$/, '.readonly.ipynb');

  const { cells } = parseLecture(fs.readFileSync(mdPath, 'utf8'));
  let nb = buildNotebook(cells, { libDir });
  if (readonly) nb = toReadonly(nb);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(nb, null, 2) + '\n');
  const codeCount = nb.cells.filter((c) => c.cell_type === 'code').length;
  console.log(`wrote ${outPath} (${nb.cells.length} cells, ${codeCount} code)`);
}

module.exports = { toReadonly };

if (require.main === module) main();
```

- [ ] **Step 2: Generate the chap03 notebook**

Run: `cd /Users/skhuang/course/dsvisual && node pipeline/gen-ipynb.js ../ds2026/chap03_stacks_queues_core.md`
Expected: `wrote ../ds2026/notebooks/chap03_stacks_queues.ipynb (N cells, M code)` with `M >= 1`.

- [ ] **Step 3: Validate the notebook is well-formed JSON with the right kernel**

Run:
```bash
node -e "const nb=require('/Users/skhuang/course/ds2026/notebooks/chap03_stacks_queues.ipynb'); console.log(nb.metadata.kernelspec.name, nb.nbformat, nb.cells.length)"
```
Expected: prints `xcpp17 4 <N>` with no JSON error.

- [ ] **Step 4: Commit (two repos)**

```bash
cd /Users/skhuang/course/dsvisual
git add pipeline/gen-ipynb.js
git commit -m "feat(pipeline): ipynb generator CLI (+readonly variant)"

cd /Users/skhuang/course/ds2026
git add notebooks/chap03_stacks_queues.ipynb
git commit -m "feat(notebooks): generated chap03 stacks & queues notebook"
```

---

### Task 8: Execution validation in xcpp17 (gated)

**Files:**
- (No code; verification + a short note appended to `docs/pipeline/DIRECTIVES.md`.)

**Interfaces:** none — this validates the Phase 1 deliverable end-to-end on a machine with the xeus-cpp kernel.

- [ ] **Step 1: Check the kernel is available**

Run: `jupyter kernelspec list | grep -i xcpp` 
Expected: an `xcpp17` entry. If absent, install via conda (`mamba install -c conda-forge xeus-cpp`) — record the exact command used in the doc note. If it cannot be installed in this environment, mark this task blocked and note it; the notebook still views via the `--readonly` variant.

- [ ] **Step 2: Execute the notebook headless**

Run:
```bash
jupyter nbconvert --to notebook --execute --inplace \
  /Users/skhuang/course/ds2026/notebooks/chap03_stacks_queues.ipynb
```
Expected: exit 0, no execution errors. If a cell fails with a redefinition error, split/merge the offending `runnable` cells in chap03 md (global constraint: each type defined once) and regenerate (Task 7).

- [ ] **Step 3: Append a "How to run" note and commit**

Append to `docs/pipeline/DIRECTIVES.md` a short "Running generated notebooks" section with the exact kernel-install + `nbconvert` commands that worked.

```bash
cd /Users/skhuang/course/dsvisual
git add docs/pipeline/DIRECTIVES.md
git commit -m "docs(pipeline): how to run generated xcpp17 notebooks"
```

---

## Self-Review

**Spec coverage (Phase 0 + Phase 1 scope):**
- Directive convention (spec §5) → Task 1 (parser) + DIRECTIVES.md.
- Code single source / `code:` resolution (D4, §3) → Task 2 + Task 5 (pull from library).
- Consistency linter / generator ⑤ (§6) → Task 3 + Task 4 (green on chap03).
- ipynb generator / generator ② (§6, §7) → Tasks 5, 7.
- `sparks` vs runnable rule, type-defined-once (§7) → Task 5 (rule) + Task 8 (redefinition remedy).
- SVG snapshot helper (§7.4) → Task 6.
- nbviewer read-only variant (§7.3) → Task 7 `--readonly`.
- code-library consolidation, chap03 only (D7) → Task 4 (markers only on chap03 refs).
- Out of Phase 0/1 scope (correctly deferred): OJ test-gen (§6.1, Phase 2), viz binding into slides (Phase 3), exam + Moodle quiz (Phase 4), reverse-generating slides_db.js (never).

**Placeholder scan:** the `class StackArray { /* ... */ }` in Task 4 Step 2 is an illustrative md edit, not a code deliverable — the real body lives in `cpp/stack_array.cpp` and is pulled via `code:`. No TBD/TODO steps; every code step shows full code.

**Type consistency:** `Cell`/`Binding` shapes are identical across Tasks 1, 3, 5. `resolveCode`/`resolveCodeSafe` signatures match between Tasks 2, 3, 5. `buildNotebook(cells, opts)` consistent between Tasks 5 and 7. Kernelspec name `xcpp17` consistent in Tasks 5, 7, 8.
