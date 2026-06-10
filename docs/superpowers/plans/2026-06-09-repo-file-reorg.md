# Repo File Reorganization (cpp/ + js/) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 87 algorithm `.cpp` files into `cpp/` and the 16 browser/module `.js` files into `js/`, remove tracked compiled binaries, and update every path reference so build, tests, and GitHub Pages keep working — with no logic changes.

**Architecture:** Pure file moves via `git mv` (preserve history) in three phases (cpp → js → binaries), each followed by updating the consumers that reference those paths and running tests. `code_db.js` and `slides_rendered.js` are regenerated into `js/` by the build scripts. `index.html`, `package.json`, `playwright.config.js`, the build scripts (`build_db.js`, `build_slides.js`, `format_code.js`), and `slides_db.js` stay at the repo root.

**Tech Stack:** Vanilla JS, Node build scripts, Playwright, macOS shell (`sed -i ''`), git.

**Spec:** `docs/superpowers/specs/2026-06-09-repo-file-reorg-design.md`

**Environment note:** macOS / BSD tools — `sed -i ''` (in-place with empty backup suffix). `git mv` to a directory requires the directory to exist first (`mkdir -p`).

---

## File Structure (after reorg)
- `cpp/` — all 87 `*.cpp` (consumed only by `build_db.js`)
- `js/` — `app.js`, `i18n.js`, `heap_models.js`, `slide-markdown.js`, `private-decks.js`, `cloud-config.js`, `cloud-drawer.js`, `cloud-integration.js`, 8 `*_viz.js`, plus generated `code_db.js`, `desc_db.js`, `slides_rendered.js`
- root (unchanged): `index.html`, `package.json`, `playwright.config.js`, `build_db.js`, `build_slides.js`, `format_code.js`, `slides_db.js`, README/config files
- removed: tracked compiled binaries (`search_binary`, `search_linear`, `*_test`)

---

## Task 1: Move `.cpp` → `cpp/` and update build_db read path

**Files:** Move all `*.cpp`; modify `build_db.js`.

- [ ] **Step 1: Branch**
```bash
cd /Users/skhuang/course/dsvisual
git checkout main && git pull --ff-only
git checkout -b chore/repo-file-reorg
git branch --show-current
```
Expected: `chore/repo-file-reorg`.

- [ ] **Step 2: Move all 87 .cpp into cpp/ (preserve history)**
```bash
cd /Users/skhuang/course/dsvisual
mkdir -p cpp
git mv *.cpp cpp/
echo "root .cpp left: $(ls *.cpp 2>/dev/null | wc -l) ; cpp/ count: $(ls cpp/*.cpp | wc -l)"
```
Expected: `root .cpp left: 0 ; cpp/ count: 87`.

- [ ] **Step 3: Update `build_db.js` to read from cpp/**

In `build_db.js`, find this loop body:
```js
for (const [file, varName] of Object.entries(mappings)) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
```
Replace those three lines with:
```js
for (const [file, varName] of Object.entries(mappings)) {
    const cpath = 'cpp/' + file;
    if (fs.existsSync(cpath)) {
        const content = fs.readFileSync(cpath, 'utf8');
```
(Leave the rest — the `out += ...` line and `fs.writeFileSync('code_db.js', out)` — unchanged in this task. `code_db.js` stays at root for now; Task 2 moves it.)

- [ ] **Step 4: Regenerate and verify code_db.js content is UNCHANGED**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js
node -c code_db.js && echo "code_db.js syntax OK"
git diff --quiet code_db.js && echo "code_db.js UNCHANGED (read path correct)" || echo "CHANGED — investigate"
```
Expected: `code_db.js syntax OK` and `code_db.js UNCHANGED (read path correct)`. If it says CHANGED, the read path is wrong — STOP and fix before committing.

- [ ] **Step 5: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add cpp build_db.js
git commit -m "chore(reorg): move .cpp into cpp/; build_db reads from cpp/"
```

---

## Task 2: Move `.js` → `js/` and update all consumers

**Files:** Move 16 `.js`; modify `build_db.js`, `build_slides.js`, `index.html`, `tests/unit/*.test.js`.

- [ ] **Step 1: Move the 16 browser/module .js into js/**
```bash
cd /Users/skhuang/course/dsvisual
mkdir -p js
git mv app.js i18n.js heap_models.js slide-markdown.js private-decks.js \
       cloud-config.js cloud-drawer.js cloud-integration.js \
       tree_traversal_viz.js huffman_viz.js graph_aoe_viz.js expr_infix_postfix_viz.js \
       tree_obst_viz.js sort_external_viz.js matrix_sparse_viz.js poly_padd_viz.js \
       code_db.js desc_db.js slides_rendered.js js/
echo "js/ count: $(ls js/*.js | wc -l)"
echo "build scripts still at root: $(ls build_db.js build_slides.js format_code.js slides_db.js 2>/dev/null | wc -l)"
```
Expected: `js/ count: 19`; `build scripts still at root: 4`.

- [ ] **Step 2: Update build script output paths**

In `build_db.js`, change the final write:
```js
fs.writeFileSync('code_db.js', out);
```
to:
```js
fs.writeFileSync('js/code_db.js', out);
```

In `build_slides.js`, change the rendered write:
```js
  fs.writeFileSync(path.join(__dirname, 'slides_rendered.js'), out);
```
to:
```js
  fs.writeFileSync(path.join(__dirname, 'js', 'slides_rendered.js'), out);
```

- [ ] **Step 3: Update `index.html` script srcs**

In `index.html`, prefix the 19 local script srcs with `js/`. Run this exact sed (macOS):
```bash
cd /Users/skhuang/course/dsvisual
for f in desc_db.js code_db.js tree_traversal_viz.js huffman_viz.js graph_aoe_viz.js \
         expr_infix_postfix_viz.js tree_obst_viz.js sort_external_viz.js matrix_sparse_viz.js \
         poly_padd_viz.js slides_rendered.js heap_models.js i18n.js cloud-config.js \
         cloud-integration.js slide-markdown.js private-decks.js cloud-drawer.js app.js; do
  sed -i '' "s#<script src=\"$f\"#<script src=\"js/$f\"#g" index.html
done
echo "remaining root-level local script srcs (should be 0):"
grep -cE '<script src="(desc_db|code_db|app|i18n|heap_models|cloud-|slide-markdown|private-decks|slides_rendered|[a-z_]+_viz)\.js"' index.html
echo "js/-prefixed script srcs (should be 19):"
grep -cE '<script src="js/' index.html
```
Expected: remaining root-level `0`; js/-prefixed `19`. (vendor/firebase CDN scripts are untouched.)

- [ ] **Step 4: Update tests/unit path references**

Two kinds: `require('../../<mod>')` (heap_models, i18n.js, 8 viz) and `readFileSync(path.join(__dirname, '../../<file>.js'))` (cloud-integration, private-decks, slide-markdown). Run:
```bash
cd /Users/skhuang/course/dsvisual/tests/unit
for m in heap_models i18n.js cloud-integration.js private-decks.js slide-markdown.js \
         tree_traversal_viz huffman_viz graph_aoe_viz expr_infix_postfix_viz \
         tree_obst_viz sort_external_viz matrix_sparse_viz poly_padd_viz; do
  sed -i '' "s#\.\./\.\./$m#../../js/$m#g" *.test.js
done
cd /Users/skhuang/course/dsvisual
echo "stale root-level test refs (should be only format_code & build_slides):"
grep -rhoE "\.\./\.\./[A-Za-z0-9_.-]+" tests/unit/*.test.js | sort -u
```
Expected: the only remaining `../../<x>` (without `js/`) are `../../format_code` and `../../build_slides`; everything else now shows `../../js/...`.

- [ ] **Step 5: Regenerate generated files into js/ and run the full suite**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js
npm run build:slides
node -c js/code_db.js && echo "js/code_db.js OK"
ls js/code_db.js js/slides_rendered.js
npm run test:all
```
Expected: build prints OK; `js/code_db.js` and `js/slides_rendered.js` exist; `npm run test:all` ALL PASS (unit require new paths + Playwright loads `js/*` via index.html). If a test fails with a module-not-found or a missing-global / 404, a path was missed — fix it and re-run. STOP/BLOCKED only if you cannot resolve.

- [ ] **Step 6: Confirm clean rebuild (no unexpected content diffs)**
```bash
cd /Users/skhuang/course/dsvisual
git add -A
git status --porcelain | grep -vE '^R|^A|^D|^M js/code_db.js|^M js/slides_rendered.js' || echo "(only moves + regenerated DBs)"
```
Expected: changes are the renames (R), the modified `index.html`/`build_db.js`/`build_slides.js`/tests, and the regenerated `js/code_db.js`/`js/slides_rendered.js`. No stray root `.js`.

- [ ] **Step 7: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git commit -m "chore(reorg): move app/module/generated .js into js/; update index.html, build outputs, test paths"
```

---

## Task 3: Remove tracked compiled binaries + .gitignore

**Files:** Delete tracked binaries; modify `.gitignore`.

- [ ] **Step 1: Identify the tracked compiled binaries, then remove them**

First list the candidates (tracked, root-level, no file extension):
```bash
cd /Users/skhuang/course/dsvisual
git ls-files | grep -vE '/' | grep -vE '\.'
```
Expected: ONLY compiled binaries, e.g. `search_binary`, `search_linear`, `list_array_test`, `list_linked_test`, `sort_bubble_test`, `sort_insert_test`, `sort_merge_test`, `sort_quick_test`, `sort_select_test`, `sort_shell_test`. **Eyeball this list** — if anything that is NOT a compiled binary appears (e.g. `LICENSE`, `Makefile`), STOP and report it; do not delete it.

Then remove exactly that list from both the index and the working tree (`git rm` operates only on the listed tracked files — no directory risk):
```bash
cd /Users/skhuang/course/dsvisual
BINS=$(git ls-files | grep -vE '/' | grep -vE '\.')
git rm $BINS
```

- [ ] **Step 2: Extend `.gitignore`**

Append to `.gitignore`:
```
# Compiled C++ binaries (additional)
*_test
search_binary
search_linear
```

- [ ] **Step 3: Verify no tracked binaries remain**
```bash
cd /Users/skhuang/course/dsvisual
echo "tracked extensionless root files (should be empty):"
git ls-files | grep -vE '/' | grep -vE '\.' || echo "(none)"
```
Expected: `(none)`.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add .gitignore
git commit -m "chore(reorg): drop tracked compiled binaries; ignore them"
```

---

## Task 4: Final verification + finish

- [ ] **Step 1: Full suite + clean-build check**
```bash
cd /Users/skhuang/course/dsvisual
npm run test:all
node build_db.js && npm run build:slides
git status --porcelain
```
Expected: `npm run test:all` ALL PASS; after rebuild, `git status` shows no diff to `js/code_db.js` / `js/slides_rendered.js` / `slides/` (committed artifacts already current). If a rebuild diff appears, `git add` it and amend/commit.

- [ ] **Step 2: Sanity-check the new layout**
```bash
cd /Users/skhuang/course/dsvisual
echo "root .cpp (0): $(ls *.cpp 2>/dev/null | wc -l)"
echo "cpp/ (87): $(ls cpp/*.cpp | wc -l)"
echo "js/ (19): $(ls js/*.js | wc -l)"
echo "root app .js still present (should be 0):"; ls app.js code_db.js i18n.js 2>&1 | grep -c 'No such file'
```
Expected: `0`, `87`, `19`, and `3` (those three not at root).

- [ ] **Step 3: Finish**

Use **superpowers:finishing-a-development-branch** for `chore/repo-file-reorg`.

---

## Self-Review notes
- **Spec coverage:** cpp move (Task 1), js move + all consumer updates §3 (Task 2: build_db read+write, build_slides output, index.html srcs, tests requires + readFileSync paths), binary removal §2 (Task 3), verification §5 (Task 4). 
- **Consumer completeness (verified against the repo):** index.html has exactly 19 local script srcs (listed). tests/unit `../../` references: `require` for heap_models, i18n.js, 8 viz (move) + format_code, build_slides (stay); `readFileSync('../../X.js')` for cloud-integration, private-decks, slide-markdown (move). All covered by Task 2 Steps 3–4.
- **No-placeholder check:** all steps are concrete commands/edits.
- **Risk控管:** Task 1 verifies code_db content is byte-identical after re-pointing the read path (proves correctness before any other change). Task 2 Step 5 runs the full suite (unit catches require/readFile path misses; Playwright catches index.html src misses). `sed -i ''` is macOS-correct.
- **Inter-module requires:** none among the moved .js (grep confirmed empty) — only tests/build reference them, both handled.
- **Stays at root (must not move):** `build_db.js`, `build_slides.js`, `format_code.js`, `slides_db.js`, `index.html`, `package.json`, `playwright.config.js` — none are in the Task 2 `git mv` list.
```
