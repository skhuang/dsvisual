# ipynb Slide-Structure-Preserving Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `parseLecture` segment by Marp slide (split on `---`, strip front-matter) so the generated notebook preserves slide structure, while keeping runnable code cells.

**Architecture:** Localized change to `pipeline/parse-lecture.js`: skip the leading YAML front-matter by advancing the line index (preserving original line numbers for bindings), and treat a standalone `---` line as a slide boundary that flushes the current markdown cell. Within-slide fence/directive segmentation is unchanged. Then regenerate the chap03 notebooks.

**Tech Stack:** Node (CommonJS, `node --test`); existing `pipeline/{parse-lecture,build-notebook,gen-ipynb}.js`.

## Global Constraints

- CommonJS; unit tests `node --test tests/unit/*.test.js`; no new deps.
- Change is confined to `pipeline/parse-lecture.js`. Consumers (`build-notebook.js`, `gen-ipynb.js`, `lint.js`, `bind-viz.js`) and the `Cell`/`Binding` shapes are unchanged.
- `Cell = { kind:'markdown'|'code', source, lang, runnable, codeRef }`; `Binding = { type, value, title, line }`. `binding.line` must remain the **original 1-based file line number** (do not shift it by stripping front-matter — skip via index, don't slice).
- Front-matter detection: only when the document's **first line** is exactly `---`; strip up to and including the next `---`. If there's no closing `---`, do not strip.
- A line that is exactly `---` (trimmed) is a slide separator: it flushes the current markdown buffer and never appears in a cell. Empty slides yield no cell.
- Within a slide, the existing rules hold: a fenced block → code cell; a `<!-- runnable -->`/`<!-- code -->` directive attaches to the fence immediately below it; `viz`/`oj` directives become bindings.
- Work from `/Users/skhuang/course/dsvisual` (branch `feat/ipynb-slide-structure`). chap03 md path: `${DS2026_DIR:-../ds2026}`.
- Spec: `docs/specs/2026-06-20-ipynb-slide-structure-design.md`.

---

## File Structure

| File | Responsibility |
|---|---|
| `pipeline/parse-lecture.js` (modify) | Add front-matter skip + `---` slide-boundary flush in `parseLecture`. |
| `tests/unit/parse-lecture.test.js` (modify) | Add slide-structure tests; keep existing ones. |
| `../ds2026/notebooks/chap03_stacks_queues_core.ipynb` (regenerated) | Output, committed in ds2026. |
| `../ds2026/notebooks/chap03_stacks_queues_modern_cpp.ipynb` (regenerated) | Output, committed in ds2026. |

---

### Task 1: Slide-aware `parseLecture`

**Files:**
- Modify: `pipeline/parse-lecture.js`
- Test: `tests/unit/parse-lecture.test.js`

**Interfaces:**
- Produces: `parseLecture(md)` — same `{cells, bindings}` shape; cells now bounded by `---` slides, front-matter excluded, `binding.line` still original.

- [ ] **Step 1: Add the failing tests (append to `tests/unit/parse-lecture.test.js`)**

```javascript
test('strips leading YAML front-matter (not present in any cell)', () => {
  const md = ['---', 'marp: true', 'theme: default', '---', '# Title', 'body'].join('\n');
  const { cells } = parseLecture(md);
  assert.ok(!cells.some((c) => c.source.includes('marp: true')), 'front-matter leaked');
  assert.equal(cells[0].kind, 'markdown');
  assert.equal(cells[0].source, '# Title\nbody');
});

test('splits adjacent prose slides on --- into separate cells (no merge)', () => {
  const md = ['# Slide A', 'alpha', '', '---', '', '# Slide B', 'beta'].join('\n');
  const { cells } = parseLecture(md);
  assert.equal(cells.length, 2);
  assert.equal(cells[0].source, '# Slide A\nalpha');
  assert.equal(cells[1].source, '# Slide B\nbeta');
  assert.ok(cells.every((c) => !c.source.split('\n').includes('---')), '--- leaked into a cell');
});

test('within a slide, a runnable fence splits md+code+md; trailing prose stays in-slide', () => {
  const md = [
    '# S1', 'intro',
    '<!-- runnable -->',
    '```cpp', 'int x=1;', '```',
    'after-code prose',
    '---',
    '# S2', 'next',
  ].join('\n');
  const { cells } = parseLecture(md);
  // S1: md(intro) + code + md(after-code prose); S2: md
  assert.equal(cells.length, 4);
  assert.equal(cells[0].source, '# S1\nintro');
  assert.equal(cells[1].kind, 'code');
  assert.equal(cells[1].runnable, true);
  assert.equal(cells[2].source, 'after-code prose');   // did NOT merge with S2
  assert.equal(cells[3].source, '# S2\nnext');
});

test('binding line numbers stay original after front-matter is stripped', () => {
  const md = ['---', 'marp: true', '---', '<!-- viz: deque -->', 'body'].join('\n');
  const { bindings } = parseLecture(md);
  const viz = bindings.find((b) => b.type === 'viz');
  assert.equal(viz.line, 4);   // 1-based original file line, not shifted by stripping
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test tests/unit/parse-lecture.test.js`
Expected: the new tests FAIL (front-matter currently leaks into cell 0; `---` lines currently land inside a single merged cell; merged prose).

- [ ] **Step 3: Replace `parseLecture` in `pipeline/parse-lecture.js`**

Replace the `parseLecture` function (lines 27–73) with:

```javascript
function parseLecture(md) {
  const lines = String(md).split('\n');
  const cells = [];
  const bindings = [];
  let mdBuf = [];
  let pending = { codeRef: null, runnable: false }; // directives waiting for the next fence
  let i = 0;

  // Skip a leading YAML front-matter block (first line '---' .. next '---').
  // Advance the index rather than slicing, so binding line numbers stay original.
  if (lines.length && lines[0].trim() === '---') {
    let close = -1;
    for (let j = 1; j < lines.length; j += 1) {
      if (lines[j].trim() === '---') { close = j; break; }
    }
    if (close !== -1) i = close + 1;
  }

  while (i < lines.length) {
    const line = lines[i];
    // Marp slide separator: flush the current markdown cell. Not a cell itself.
    if (line.trim() === '---') {
      pushMarkdown(cells, mdBuf);
      mdBuf = [];
      pending = { codeRef: null, runnable: false };
      i += 1;
      continue;
    }
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
    pending = { codeRef: null, runnable: false };
    i += 1;
  }
  pushMarkdown(cells, mdBuf);
  return { cells, bindings };
}
```

- [ ] **Step 4: Run the full parser test file**

Run: `node --test tests/unit/parse-lecture.test.js`
Expected: PASS — the 4 new tests plus all pre-existing ones (directive adjacency, fence handling, viz/oj bindings).

- [ ] **Step 5: Run the whole unit suite (no regression in consumers)**

Run: `node --test tests/unit/*.test.js`
Expected: all pass (build-notebook, code-library, lint, viz-link, dsvisual_render unaffected).

- [ ] **Step 6: Commit**

```bash
git add pipeline/parse-lecture.js tests/unit/parse-lecture.test.js
git commit -m "fix(pipeline): parse by Marp slide (--- boundary + strip front-matter)"
```

---

### Task 2: Regenerate the chap03 notebooks + verify slide structure

**Files:**
- Output (regenerated, committed in ds2026): `notebooks/chap03_stacks_queues_core.ipynb`, `notebooks/chap03_stacks_queues_modern_cpp.ipynb`

**Interfaces:**
- Consumes: the slide-aware `parseLecture` (Task 1) via `gen-ipynb.js`.

- [ ] **Step 1: Regenerate both notebooks**

Run:
```bash
cd /Users/skhuang/course/dsvisual
node pipeline/gen-ipynb.js ../ds2026/chap03_stacks_queues_core.md
node pipeline/gen-ipynb.js ../ds2026/chap03_stacks_queues_modern_cpp.md
```
Expected: each prints `wrote ... (N cells, M code)`.

- [ ] **Step 2: Verify slide structure is preserved (the acceptance check)**

Run:
```bash
node -e '
const fs=require("fs");
for (const f of ["core","modern_cpp"]) {
  const p="../ds2026/notebooks/chap03_stacks_queues_"+f+".ipynb";
  const nb=JSON.parse(fs.readFileSync(p,"utf8"));
  const md=nb.cells.filter(c=>c.cell_type==="markdown");
  const withRule=md.filter(c=>c.source.join("").split("\n").some(l=>l.trim()==="---")).length;
  const maxLines=Math.max(...md.map(c=>c.source.join("").split("\n").length));
  const code=nb.cells.filter(c=>c.cell_type==="code").length;
  const fm=nb.cells.some(c=>c.source.join("").includes("marp: true"));
  console.log(f,"| cells",nb.cells.length,"code",code,"| md cells with ---:",withRule,"| max md lines:",maxLines,"| front-matter present:",fm);
}'
```
Expected: for BOTH files — `md cells with ---: 0`, `front-matter present: false`, and `max md lines` far below the old 143/120 (a single slide's worth). `modern_cpp` keeps a non-zero `code` count (runnable cells preserved). If any `---`-containing cell remains or front-matter leaks, the parser fix is incomplete — return to Task 1.

- [ ] **Step 3: Validate the notebooks are still well-formed**

Run:
```bash
node -e 'const fs=require("fs");for(const f of ["core","modern_cpp"]){const nb=JSON.parse(fs.readFileSync("../ds2026/notebooks/chap03_stacks_queues_"+f+".ipynb","utf8"));if(nb.metadata.kernelspec.name!=="xcpp17"||nb.nbformat!==4)throw new Error("bad nb "+f);}console.log("both valid xcpp17 nbformat-4")'
```
Expected: `both valid xcpp17 nbformat-4`.

- [ ] **Step 4: Commit (ds2026)**

```bash
cd /Users/skhuang/course/ds2026
git add notebooks/chap03_stacks_queues_core.ipynb notebooks/chap03_stacks_queues_modern_cpp.ipynb
git commit -m "chore(notebooks): regenerate chap03 with slide-structure-preserving parsing"
```

(ds2026 branch: do this on a feature branch off ds2026 `main` — `git -C ../ds2026 checkout -b chore/chap03-slide-structure` before committing, since `main` is the default branch.)

---

## Self-Review

**Spec coverage:** strip front-matter (spec §5.1, Q2) → Task 1 (front-matter skip + `test strips leading YAML front-matter`). Split on `---` (spec §5.2) → Task 1 (`---` boundary + `test splits adjacent prose slides`). Within-slide segmentation incl. runnable code cell (spec §5.3, Q1) → Task 1 (`test within a slide ... md+code+md`). `binding.line` stays original (spec §4 constraint) → Task 1 (`test binding line numbers stay original`). Regenerate both notebooks + acceptance (spec §3, §7, Q3) → Task 2 Steps 1–2. Consumers unchanged (spec §4) → only `parse-lecture.js` modified; Task 1 Step 5 runs the full suite.

**Placeholder scan:** No TBD. Every code/command step is complete. Task 2's acceptance is a concrete node one-liner with exact expected output, not a vague "looks right".

**Type consistency:** `parseLecture(md) => {cells, bindings}` unchanged; `Cell`/`Binding` shapes identical to the pre-change contract (the diff only changes *where* boundaries fall, plus front-matter skipping). `pushMarkdown`/`parseDirectiveLine`/`FENCE_RE` are reused unchanged. The front-matter skip uses the index `i` (not slicing), so `parseDirectiveLine(line, i+1)` keeps original 1-based line numbers — consistent with the linter's `binding.line` usage.
