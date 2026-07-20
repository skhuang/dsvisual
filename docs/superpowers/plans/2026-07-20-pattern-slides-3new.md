# Bilingual slide decks for Builder/Command/Composite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 3 new design patterns (Builder, Command, Composite) bilingual 8-slide decks in `slides_db.js`, matching the existing pattern decks, then regenerate `slides/{en,zh}/*.md` + `slides_rendered.js`.

**Architecture:** Append 3 `SLIDES_DB["pattern-<id>"] = {…}` entries (same append style as the chap05 decks / gc-memory), then `npm run build:slides` (renders mermaid via `mmdc`, generates bilingual md + `slides_rendered.js`).

**Tech Stack:** `slides_db.js` (bilingual deck data), `build_slides.js` (mmdc/puppeteer), Playwright.

## Global Constraints

- Concurrent refactor session — `git add` only each task's named files; never `-A`/`.`/`-u`; `git status` first.
- **Only `slides_db.js` is source** — never hand-edit generated `slides/**` or `js/slides_rendered.js`; regenerate.
- Every translatable leaf is `{zh, en}`; `mermaid.code`, `svg.svg`, `code.code`, `math.tex` are single untranslated strings.
- Run FULL Playwright (`npm test`) before merge.
- Append entries as `SLIDES_DB["pattern-<id>"] = {…};` AFTER the existing assignments, before `module.exports = SLIDES_DB;` (do NOT edit inside the big object literal).

## Deck template (all 3 decks mirror this — 8 slides)

`SLIDES_DB["pattern-<id>"] = { category: "Design Patterns", title: {zh,en}, slides: [ … ] };`
with 8 slides (bilingual `heading`), block types verbatim from existing pattern decks:

1. `<Pattern> Pattern` — `paragraph` (GoF intent, names the category).
2. `Core Concept` — `paragraph` + `bullets` (participants/roles).
3. `Operation Flow` — `steps` + `mermaid` (`{type:"mermaid", code:"flowchart LR\n…"}`).
4. `UML Structure Diagram` — `svg` (`{type:"svg", svg:"<svg …>…</svg>"}`) + `note` (`{type:"note", text:{zh,en}}`).
5. `Pattern Properties` — `table` (`{type:"table", headers:[{zh,en},{zh,en}], rows:[[{zh,en},{zh,en}], …]}`) + `math` (`{type:"math", tex:"…", caption:{zh,en}}`).
6. `Source Code` — `code` (`{type:"code", lang:"cpp", code:"…"}`) — focused excerpt from `cpp/pattern_<id>.cpp`.
7. `Pros, Cons & When to Use` — `bullets`.
8. `Summary` — `bullets`.

Block leaf shapes: `paragraph`/`note` → `{text:{zh,en}}`; `bullets`/`steps` → `{items:[{zh,en}]}`; `table` cells → `{zh,en}`; `math` → `{tex, caption:{zh,en}}`; `mermaid`/`svg`/`code` → untranslated string fields.

## Bilingual-completeness validator (used by Tasks 1–3)

Save as the check each authoring task runs (no build needed):

```bash
node -e '
const S=require("./slides_db.js"); const id=process.argv[1];
const d=S[id]; if(!d){console.error("MISSING "+id);process.exit(1);}
if(d.slides.length!==8){console.error("want 8 slides, got "+d.slides.length);process.exit(1);}
let bad=0;
function chk(o){ if(o && typeof o==="object"){
  if(("zh" in o)||("en" in o)){ if(!o.zh||!o.en){bad++;console.error("half-translated leaf:",JSON.stringify(o).slice(0,80));} return; }
  for(const k in o) chk(o[k]);
}}
chk(d.title); d.slides.forEach(s=>{chk(s.heading); s.blocks.forEach(b=>{
  if(b.text)chk(b.text); if(b.items)b.items.forEach(chk); if(b.headers)b.headers.forEach(chk);
  if(b.rows)b.rows.forEach(r=>r.forEach(chk)); if(b.caption)chk(b.caption);
});});
console.log(bad===0 ? id+" OK: 8 slides, all leaves bilingual" : id+" FAIL: "+bad+" half-translated");
process.exit(bad===0?0:1);
' "$1"
```

---

### Task 1: `pattern-builder` deck (Creational)

**Files:** Modify `slides_db.js`.

**Interfaces:** Produces `SLIDES_DB["pattern-builder"]` = an 8-slide bilingual deck.

- [ ] **Step 1: Author the entry.** Append `SLIDES_DB["pattern-builder"] = {…};` before `module.exports`. Mirror the structure/tone of an existing Creational deck (read `slides_db.js` `"pattern-factory"` / `"pattern-singleton"`). Content (GoF-accurate):
  - Intent: separate the construction of a complex object from its representation so the same construction process can create different representations.
  - Participants: Director, Builder (interface), ConcreteBuilder, Product.
  - Operation Flow + `mermaid`: `flowchart LR` Director → Builder (`buildPartA`, `buildPartB`) → Product; `getResult()` returns the Product.
  - UML `svg`: hand-drawn boxes Director / Builder (abstract) / ConcreteBuilder / Product with the standard arrows (mirror the compact UML svg style in `pattern-factory`).
  - Properties `table`: GoF Category=Creational; Participants=Director/Builder/ConcreteBuilder/Product; Intent; Construction=step-by-step; Principle=single responsibility for assembly. `math`: e.g. `\text{Product} = \text{getResult}\circ\text{buildB}\circ\text{buildA}`.
  - Source Code: focused C++ excerpt from `cpp/pattern_builder.cpp`.
  - Pros/Cons + Summary bullets.
  All translatable leaves `{zh,en}`.

- [ ] **Step 2: Validate.** Run the bilingual validator (above) with `pattern-builder`.
  Expected: `pattern-builder OK: 8 slides, all leaves bilingual`.

- [ ] **Step 3: Commit.**
```bash
git add slides_db.js
git commit -m "feat(dsvisual): bilingual slide deck for the Builder pattern"
```

---

### Task 2: `pattern-command` deck (Behavioral)

**Files:** Modify `slides_db.js`.

**Interfaces:** Consumes nothing from Task 1. Produces `SLIDES_DB["pattern-command"]`.

- [ ] **Step 1: Author the entry.** Append `SLIDES_DB["pattern-command"] = {…};`. Mirror an existing Behavioral deck (read `"pattern-strategy"` / `"pattern-observer"`). Content:
  - Intent: encapsulate a request as an object, letting you parameterize clients, queue/log requests, and support undo.
  - Participants: Invoker, Command (interface), ConcreteCommand, Receiver.
  - Flow + `mermaid`: Invoker → Command (`execute()`) → Receiver (`action()`); note undo via a command history.
  - UML `svg`: Invoker / Command (abstract, `execute()`) / ConcreteCommand / Receiver.
  - Properties `table`: GoF=Behavioral; Participants; Intent; Decoupling=Invoker↔Receiver; Extras=queue/log/undo. `math`: e.g. `\text{invoker.run}() \equiv \text{cmd.execute}() \to \text{receiver.action}()`.
  - Source Code: excerpt from `cpp/pattern_command.cpp`.
  - Pros/Cons + Summary.

- [ ] **Step 2: Validate.** Validator with `pattern-command` → `OK`.

- [ ] **Step 3: Commit.**
```bash
git add slides_db.js
git commit -m "feat(dsvisual): bilingual slide deck for the Command pattern"
```

---

### Task 3: `pattern-composite` deck (Structural)

**Files:** Modify `slides_db.js`.

**Interfaces:** Produces `SLIDES_DB["pattern-composite"]`.

- [ ] **Step 1: Author the entry.** Append `SLIDES_DB["pattern-composite"] = {…};`. Mirror an existing Structural deck (read `"pattern-adapter"` / `"pattern-decorator"`). Content:
  - Intent: compose objects into tree structures to represent whole-part hierarchies; let clients treat individual objects and compositions uniformly.
  - Participants: Component (interface), Leaf, Composite (holds `children`).
  - Flow + `mermaid`: Client → Component; `Composite.operation()` recurses into children; `Leaf.operation()` does work (show a small tree).
  - UML `svg`: Component (abstract `operation()`) with Leaf and Composite; Composite aggregates Component (0..*).
  - Properties `table`: GoF=Structural; Participants; Intent; Structure=recursive tree; Uniformity=Leaf & Composite share the Component interface. `math`: e.g. `\text{Composite.op}() = \sum_{c\in\text{children}} c.\text{op}()`.
  - Source Code: excerpt from `cpp/pattern_composite.cpp`.
  - Pros/Cons + Summary.

- [ ] **Step 2: Validate.** Validator with `pattern-composite` → `OK`.

- [ ] **Step 3: Commit.**
```bash
git add slides_db.js
git commit -m "feat(dsvisual): bilingual slide deck for the Composite pattern"
```

---

### Task 4: Regenerate slides + full verification

**Files:** Regenerate `slides/{en,zh}/pattern-{builder,command,composite}.md` + `js/slides_rendered.js`.

- [ ] **Step 1: Build.** Run `npm run build:slides`.
  Expected: completes without error (mermaid rendered via `mmdc`).

- [ ] **Step 2: Confirm the 6 md + rendered keys.**
```bash
ls slides/en/pattern-{builder,command,composite}.md slides/zh/pattern-{builder,command,composite}.md
node -e 'require("./js/slides_rendered.js"); const R=global.window?window.SLIDES_RENDERED:SLIDES_RENDERED; ["pattern-builder","pattern-command","pattern-composite"].forEach(k=>console.log(k, !!R[k]));'
```
Expected: all 6 files listed; all 3 keys `true`.

- [ ] **Step 3: No unrelated churn.** `git status --short` shows ONLY: `slides_db.js` (from Tasks 1–3, already committed), the 6 new `slides/**` md, and `js/slides_rendered.js`. If any OTHER `slides/**/*.md` changed (i.e. the committed `slides_rendered.js`/md were stale vs `slides_db.js`), **STOP and report** — do not commit unrelated regen.

- [ ] **Step 4: Full verification.**
  - `npm run test:unit` → green.
  - `npm test` (FULL Playwright) → green (no regression; smoke_modes/patterns still pass).
  - Browser spot-check (note in report): serve the site, load `#m=pattern-builder`, click **Slides** → deck renders (mermaid flow + UML + code); toggle language → zh renders. (If a browser isn't available in the task env, state that and rely on the generated-file + slides_rendered checks.)

- [ ] **Step 5: Commit.**
```bash
git add slides/en/pattern-builder.md slides/en/pattern-command.md slides/en/pattern-composite.md \
        slides/zh/pattern-builder.md slides/zh/pattern-command.md slides/zh/pattern-composite.md \
        js/slides_rendered.js
git commit -m "build(dsvisual): regenerate slides for Builder/Command/Composite decks"
```

---

## Self-Review

- **Spec coverage:** 3 authored decks (Tasks 1–3) + regenerate & verify (Task 4) — every spec section covered.
- **Placeholder scan:** authoring steps specify the exact 8-slide structure, block types/shapes, GoF-accurate per-pattern content, mirror decks, and the cpp source — concrete direction for content authoring (not hand-waved); the validator + build/verify commands are exact.
- **Type consistency:** all 3 decks use the identical block-shape vocabulary defined in the template; the validator checks 8 slides + bilingual leaves per deck; Task 4's `slides_rendered.js` key check matches the `pattern-<id>` ids. Append style (`SLIDES_DB["id"]=`) matches the file's existing assignment convention.
