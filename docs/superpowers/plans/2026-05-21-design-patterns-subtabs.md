# Design Patterns Sub-Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Design Patterns category into three GoF sub-tabs (Creational / Structural / Behavioral) shown as a second nav row, redistributing the existing 6 pattern methods — no new patterns.

**Architecture:** The single `patterns` group in `METHOD_GROUPS` becomes three child groups each tagged with `parent: 'patterns'`. `renderCategoryNav` renders one top-level "Design Patterns" pill plus a `.category-subtab-row` of three `.category-subtab-btn` tabs (shown only when a pattern group is active). `setActiveCategory` highlights the parent pill + active sub-tab and toggles the sub-tab row. No `.cpp`, slide, or visualizer changes — `renderPattern()`/`updateLayout` key off the `pattern-` prefix in `currentMode`, independent of nav grouping.

**Tech Stack:** Vanilla browser JS (no build step), Playwright + `node:test`.

---

## Background the engineer must know

dsvisual is a browser-based C++ data-structure/algorithm visualizer opened from `file://`. Navigation facts:

- **`app.js`** is one large file; most functions named below live inside a `document.addEventListener('DOMContentLoaded', () => { ... })` closure. `METHOD_GROUPS`, `getMethodGroupById`, `getMethodGroupForMode` are at module top level (~lines 96-222).
- **`METHOD_GROUPS`** (array, ~line 96) — each entry is `{ id, title, methods: [...] }`. The `patterns` group (~line 203) is currently the last entry, with 6 method objects.
- **`getMethodGroupById(groupId)`** (line 216) and **`getMethodGroupForMode(mode)`** (line 220) — `.find()` over the flat `METHOD_GROUPS` array; both keep working when the array holds the 3 child groups as ordinary flat entries.
- **`#category-nav`** — `<nav id="category-nav" data-testid="category-nav">`, a `display:flex; flex-wrap:wrap` sticky bar.
- **`categoryButtons`** (`const`, line 307) — a `Map<groupId, buttonElement>`.
- **`setActiveCategory(groupId)`** (line 309) — toggles `.active` + `aria-current` on each `categoryButtons` entry by id match.
- **`renderCategoryNav()`** (line 674) — clears `#category-nav`, makes one `.category-nav-btn` per `METHOD_GROUPS` entry; nested `activateGroup(groupId, methodId)` calls `setActiveCategory` + `selectMethod` + `scrollToCategory`.
- **`renderMethodSections(groupId)`** (line 398) — builds the `[data-testid="method-select"]` dropdown for a group. Unchanged by this plan; it works on any group id.
- **`renderPattern()`** and the `updateLayout` `currentMode.includes('pattern-')` branch are NOT touched — they identify pattern methods by the `pattern-` prefix in `currentMode`, not by nav group.
- **Tests:** `npm run test:all` = `node --test tests/unit/*.test.js` (44 unit) + `playwright test` (70 Playwright) = **114 currently**. `tests/visualizer.spec.js` has a `loadMethod(page, methodId)` helper (lines 4-20) that clicks each top-level `.category-nav-btn` and checks the method dropdown.

---

## File Structure

**Modified files:**
- `app.js` — `METHOD_GROUPS` (split `patterns` into 3), a new `subTabButtons` Map, `setActiveCategory` (parent + sub-tab awareness), `renderCategoryNav` (parent pill + sub-tab row)
- `style.css` — appended `.category-subtab-row` / `.category-subtab-btn` rules
- `tests/visualizer.spec.js` — `loadMethod` helper made sub-tab-aware; one new test

No new files. No `.cpp`, `code_db.js`, `build_db.js`, `slides_db.js`, or `index.html` changes.

---

## Task 1: METHOD_GROUPS restructure + sub-tab navigation + sub-tab-aware `loadMethod`

These changes are interdependent — splitting `METHOD_GROUPS` without the nav rewrite would render 3 stray top-level pills, and the nav rewrite without the `loadMethod` update would break the existing Adapter/Decorator/Observer/Strategy tests. They land together so the suite stays green.

**Files:**
- Modify: `app.js`, `style.css`, `tests/visualizer.spec.js`

- [ ] **Step 1: Split the `patterns` group in `METHOD_GROUPS` into 3 child groups**

In `app.js`, replace the entire `patterns` group object (the `{ id: 'patterns', title: 'Design Patterns', methods: [ ...6 methods... ] }` entry, ~lines 202-213) with these three entries:

```js
    {
        id: 'patterns-creational',
        title: 'Creational',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: [
            { id: 'pattern-singleton', title: 'Singleton', file: 'pattern_singleton.cpp', visualizer: 'pattern', controls: 'pattern' },
            { id: 'pattern-factory', title: 'Factory Method', file: 'pattern_factory.cpp', visualizer: 'pattern', controls: 'pattern' },
        ],
    },
    {
        id: 'patterns-structural',
        title: 'Structural',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: [
            { id: 'pattern-adapter', title: 'Adapter', file: 'pattern_adapter.cpp', visualizer: 'pattern', controls: 'pattern' },
            { id: 'pattern-decorator', title: 'Decorator', file: 'pattern_decorator.cpp', visualizer: 'pattern', controls: 'pattern' },
        ],
    },
    {
        id: 'patterns-behavioral',
        title: 'Behavioral',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: [
            { id: 'pattern-observer', title: 'Observer', file: 'pattern_observer.cpp', visualizer: 'pattern', controls: 'pattern' },
            { id: 'pattern-strategy', title: 'Strategy', file: 'pattern_strategy.cpp', visualizer: 'pattern', controls: 'pattern' },
        ],
    },
```

The 6 method objects are unchanged — only redistributed. The 3 child groups are the last 3 entries of `METHOD_GROUPS`.

- [ ] **Step 2: Add the `subTabButtons` Map**

In `app.js`, find `const categoryButtons = new Map();` (~line 307). Immediately after it, add:

```js
    const subTabButtons = new Map();
```

- [ ] **Step 3: Rewrite `setActiveCategory` to handle the parent pill + sub-tabs**

Replace the entire `setActiveCategory` function (~lines 309-315) with:

```js
    function setActiveCategory(groupId) {
        const group = getMethodGroupById(groupId);
        const parentId = group && group.parent;
        categoryButtons.forEach((button, id) => {
            const isActive = id === groupId || id === parentId;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
        subTabButtons.forEach((button, id) => {
            button.classList.toggle('active', id === groupId);
        });
        const subTabRow = categoryNav && categoryNav.querySelector('.category-subtab-row');
        if (subTabRow) subTabRow.classList.toggle('visible', !!parentId);
    }
```

For a normal group `parentId` is `undefined` → the sub-tab row is hidden and only that group's pill is active. For a child group (e.g. `patterns-structural`) the parent pill keyed `'patterns'` and the matching sub-tab both go active, and the row shows.

- [ ] **Step 4: Rewrite `renderCategoryNav` to render the parent pill + sub-tab row**

Replace the entire `renderCategoryNav` function (~lines 674-703) with:

```js
    function renderCategoryNav() {
        if (!categoryNav) return;
        categoryNav.innerHTML = '';
        categoryButtons.clear();
        subTabButtons.clear();

        function activateGroup(groupId, methodId) {
            const group = getMethodGroupById(groupId);
            if (!group) return;
            const nextMethod = methodId || group.methods[0]?.id;
            setActiveCategory(group.id);
            if (nextMethod) {
                selectMethod(nextMethod);
            }
            scrollToCategory(group.id);
        }

        const subTabRow = document.createElement('div');
        subTabRow.className = 'category-subtab-row';
        subTabRow.dataset.testid = 'category-subtab-row';
        const renderedParents = new Set();

        METHOD_GROUPS.forEach((group) => {
            if (group.parent) {
                if (!renderedParents.has(group.parent)) {
                    renderedParents.add(group.parent);
                    const firstChild = METHOD_GROUPS.find((g) => g.parent === group.parent);
                    const parentBtn = document.createElement('button');
                    parentBtn.type = 'button';
                    parentBtn.className = 'category-nav-btn';
                    parentBtn.dataset.group = group.parent;
                    parentBtn.textContent = group.parentTitle;
                    parentBtn.addEventListener('click', () => activateGroup(firstChild.id));
                    categoryButtons.set(group.parent, parentBtn);
                    categoryNav.appendChild(parentBtn);
                }
                const tabBtn = document.createElement('button');
                tabBtn.type = 'button';
                tabBtn.className = 'category-subtab-btn';
                tabBtn.dataset.subgroup = group.id;
                tabBtn.dataset.parent = group.parent;
                tabBtn.textContent = group.title;
                tabBtn.addEventListener('click', () => activateGroup(group.id));
                subTabButtons.set(group.id, tabBtn);
                subTabRow.appendChild(tabBtn);
            } else {
                const groupBtn = document.createElement('button');
                groupBtn.type = 'button';
                groupBtn.className = 'category-nav-btn';
                groupBtn.dataset.group = group.id;
                groupBtn.textContent = group.title;
                groupBtn.addEventListener('click', () => activateGroup(group.id));
                categoryButtons.set(group.id, groupBtn);
                categoryNav.appendChild(groupBtn);
            }
        });

        categoryNav.appendChild(subTabRow);

        const initialGroup = getMethodGroupForMode('stack-array');
        setActiveCategory(initialGroup.id);
    }
```

The 8 non-pattern groups render one pill each; the 3 pattern child groups produce a single "Design Patterns" pill (created once) plus three sub-tab buttons collected in `subTabRow`, which is appended last so it wraps onto its own line. Total top-level `.category-nav-btn` count stays 9.

- [ ] **Step 5: Append the sub-tab CSS to `style.css`**

Append at the end of `style.css`:

```css
/* ----- Design Patterns sub-tabs ----- */
.category-subtab-row {
    display: none;
    flex-basis: 100%;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 20px 2px;
}
.category-subtab-row.visible {
    display: flex;
}
.category-subtab-btn {
    flex: 0 0 auto;
    padding: 4px 12px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--primary-hover);
    cursor: pointer;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
}
.category-subtab-btn:hover {
    color: var(--primary-color);
}
.category-subtab-btn.active {
    border-bottom-color: var(--primary-hover);
    color: var(--primary-hover);
}
```

- [ ] **Step 6: Make the `loadMethod` test helper sub-tab-aware**

In `tests/visualizer.spec.js`, replace the entire `loadMethod` function (lines 4-20) with:

```js
async function loadMethod(page, methodId) {
    const categoryButtons = page.locator('[data-testid="category-nav"] .category-nav-btn');
    const methodSelect = page.locator('[data-testid="method-select"]');
    const count = await categoryButtons.count();

    async function trySelect() {
        const hasOption = await methodSelect.locator(`option[value="${methodId}"]`).count();
        if (!hasOption) return false;
        await methodSelect.selectOption(methodId);
        const card = page.locator(`[data-method-section="${methodId}"]`);
        await expect(card).toHaveAttribute('data-runtime-state', 'active');
        return true;
    }

    for (let i = 0; i < count; i++) {
        await categoryButtons.nth(i).click();
        if (await trySelect()) return;
        const subTabs = page.locator('.category-subtab-row.visible .category-subtab-btn');
        const tabCount = await subTabs.count();
        for (let t = 0; t < tabCount; t++) {
            await subTabs.nth(t).click();
            if (await trySelect()) return;
        }
    }
    throw new Error(`Method ${methodId} not found in method dropdown`);
}
```

The new inner loop only runs when the just-clicked category exposes a visible sub-tab row (the `.visible` class is set by `setActiveCategory`); for non-pattern categories the locator matches nothing and the loop is a no-op.

- [ ] **Step 7: Run the full test suite**

Run: `npm run test:all`
Expected: 114 passing (44 unit + 70 Playwright). The existing pattern tests (Singleton/Factory/Adapter/Decorator/Observer/Strategy) now reach their methods through the sub-tabs; `Phase 1 category nav` still sees 9 `.category-nav-btn`; `Phase 5 regression` still works because clicking "Design Patterns" activates the Creational child and selects `pattern-singleton`.

If anything fails, diagnose and fix before committing — do not commit a red suite.

- [ ] **Step 8: Browser smoke check**

Open `index.html` in a browser. Verify: 9 top-level pills; clicking "Design Patterns" reveals a 3-tab row (Creational / Structural / Behavioral) and lands on Creational → Singleton; clicking "Structural" / "Behavioral" switches the method dropdown; clicking any other top-level category hides the sub-tab row.

- [ ] **Step 9: Self-review, then commit**

Self-review: `METHOD_GROUPS` has 3 pattern child groups with `parent`/`parentTitle`; `subTabButtons` declared; `setActiveCategory` toggles parent pill + sub-tab + row; `renderCategoryNav` makes one "Design Patterns" pill + 3 sub-tabs; CSS appended; `loadMethod` walks visible sub-tabs; suite green at 114.

```bash
git add app.js style.css tests/visualizer.spec.js
git commit -m "feat: Design Patterns sub-tabs (Creational/Structural/Behavioral)"
```

---

## Task 2: Sub-tab behavior Playwright test

**Files:**
- Modify: `tests/visualizer.spec.js`

- [ ] **Step 1: Add the sub-tab test**

In `tests/visualizer.spec.js`, add this test inside the `test.describe('Data Structure Visualizer Full Suite', ...)` block — place it immediately after the `Phase 5 regression` test (the test whose name starts `Phase 5 regression: every top-level category`):

```js
    test('Design Patterns sub-tabs: switch the method list by GoF category', async ({ page }) => {
        const nav = page.locator('[data-testid="category-nav"]');
        await nav.getByRole('button', { name: 'Design Patterns', exact: true }).click();

        const subTabs = page.locator('.category-subtab-row.visible .category-subtab-btn');
        await expect(subTabs).toHaveCount(3);

        const methodSelect = page.locator('[data-testid="method-select"]');
        // Default sub-tab is Creational.
        await expect(methodSelect.locator('option[value="pattern-singleton"]')).toHaveCount(1);

        await subTabs.getByText('Structural', { exact: true }).click();
        await expect(methodSelect.locator('option[value="pattern-adapter"]')).toHaveCount(1);
        await expect(methodSelect.locator('option[value="pattern-singleton"]')).toHaveCount(0);

        await subTabs.getByText('Behavioral', { exact: true }).click();
        await expect(methodSelect.locator('option[value="pattern-observer"]')).toHaveCount(1);

        // Leaving Design Patterns hides the sub-tab row.
        await nav.getByRole('button', { name: 'Sorting', exact: true }).click();
        await expect(page.locator('.category-subtab-row.visible')).toHaveCount(0);
    });
```

- [ ] **Step 2: Run the full test suite**

Run: `npm run test:all`
Expected: 115 passing (44 unit + 71 Playwright).

- [ ] **Step 3: Commit**

```bash
git add tests/visualizer.spec.js
git commit -m "test: Design Patterns sub-tab navigation behavior"
```

---

## Task 3: Final verification + idempotency

**Files:**
- No expected modifications.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:all`
Expected: 115 passing (44 unit + 71 Playwright).

- [ ] **Step 2: Idempotency check**

This feature touches no `.cpp` files and no slide decks, so the generator pipelines should produce no diff.

Run: `npm run format:code && git status --short`
Expected: only untracked files (e.g. `?? .claude/`).

Run: `npm run build:slides && git status --short`
Expected: only untracked files.

If either produces a tracked-file diff, investigate — this feature should not have changed any `.cpp` or slide content.

- [ ] **Step 3: Browser smoke check**

Open `index.html`. Confirm the full sub-tab flow once more: 9 top-level pills, "Design Patterns" reveals 3 sub-tabs defaulting to Creational, each sub-tab switches the method list, other categories hide the sub-tab row, and each pattern visualizer still renders (the visualizer code is unchanged).

If Steps 1-3 pass, the branch is ready. If any regression surfaces, fix it and commit with a descriptive message.

---

## Notes for the executor

- **Tasks 1's changes are interdependent.** The `METHOD_GROUPS` split, the nav rewrite, and the `loadMethod` update must all land in the same commit — any subset leaves the test suite red. That is why Task 1 bundles them.
- **No visualizer / `.cpp` / slide changes.** `renderPattern()` and `updateLayout`'s `currentMode.includes('pattern-')` branch already handle every `pattern-*` method regardless of nav grouping. Do not touch them.
- **Top-level pill count stays 9.** The 3 pattern child groups collapse into one "Design Patterns" pill; the 3 sub-tabs use the separate class `.category-subtab-btn`, so `Phase 1 category nav`'s `toHaveCount(9)` on `.category-nav-btn` still holds.
- **Sub-tab row lives inside `#category-nav`.** It is appended as the last child with `flex-basis: 100%`, so it wraps onto its own line below the pills and shares the sticky header.
