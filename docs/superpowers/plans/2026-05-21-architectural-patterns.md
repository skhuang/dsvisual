# Architectural Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 architectural patterns (MVC, Layered, Publish-Subscribe, Pipe-and-Filter, Dependency Injection) as a new "Architectural" sub-tab under the Design Patterns category — each with a C++ source, an SVG component-diagram visualizer, and a bilingual slide deck.

**Architecture:** A new `METHOD_GROUPS` child group `patterns-architectural` (tagged `parent: 'patterns'`) makes the 4th sub-tab appear automatically — the PR #62 sub-tab nav already iterates all `parent`-tagged groups. Each method follows the established pattern-category mold: `.cpp` → `build_db.js` mapping → `code_db.js` constant → `METHOD_GROUPS` entry → `getCodeForMethod` mapping → a static `<div id="pattern-*-view">` in `index.html` → an `<option>` in `#pattern-mode-select` → an `updateLayout` branch → a `renderPattern()` dispatch branch → a render function → a `visualizePattern()` branch. The render functions draw SVG with the shared `drawOopBox()` helpers.

**Tech Stack:** Vanilla browser JS (no build step), CommonJS Node scripts (`build_db.js`, `build_slides.js`), Playwright + `node:test`, Marp slide pipeline.

---

## Background the engineer must know

dsvisual is a browser-based C++ data-structure/algorithm visualizer opened from `file://`. Design Patterns facts:

- **`app.js`** is one large file; `METHOD_GROUPS`/`getMethodGroupById`/`getCodeForMethod` are near module top; most other functions live in a `DOMContentLoaded` closure.
- **`METHOD_GROUPS`** — the Design Patterns area is 3 child groups `patterns-creational`/`patterns-structural`/`patterns-behavioral`, each `{ id, title, parent: 'patterns', parentTitle: 'Design Patterns', methods: [...] }`. `patterns-behavioral` (~lines 222-231) is currently the LAST entry of `METHOD_GROUPS`.
- **`build_db.js`** — a `mappings` table (`.cpp` → `code*` constant). `code_db.js` is auto-generated; **a mapping must exist before regeneration** or the constant is silently dropped.
- **`getCodeForMethod`** (~line 224) — maps method id → `code*` constant; the pattern entries are at ~lines 301-306.
- **Pattern visualizer mechanism:** `#pattern-container` > `#pattern-visualization` holds one static `<div id="pattern-*-view" class="pattern-view hidden">` per method (each: `<h3>`, `<svg id="pattern-*-svg">`, optional legend). The dropdown `#pattern-mode-select` (JS const `patternModeSelect`) selects the view.
- **`updateLayout()`** — its `currentMode.includes('pattern-')` branch (~line 1846) reveals `patternContainer`+`patternActions`, hides ALL `.pattern-view` via `querySelectorAll`, then a per-method `else if` un-hides one view, sets `codeTitle`/`codeDisplay`, sets `patternModeSelect.value`.
- **`renderPattern()`** (~line 4120) — `const mode = currentMode.replace('pattern-', '')` then `if (mode === 'singleton') renderPatternSingleton()` ... dispatch chain.
- **`visualizePattern(mode)`** (~line 4534) — an `if (mode === 'singleton') { ... } else if ...` chain of `showStatus(...)` + `await sleep(...)` narrations; invoked by the "Visualize Pattern" button (`btn-pattern-demo`, ~line 4523) via `executeAnimWrapper`. A mode with no branch is a silent no-op — so each new method needs a `visualizePattern` branch for the button to do something.
- **`drawOopBox` helpers** — `app.js` has `oopSvgEl(tag, attrs)`, `drawOopBox(svg, opts)`, `drawOopLabel(svg, x, y, text, color)`, `drawOopLine(svg, x1, y1, x2, y2)` (added in the OOP expansion, immediately before `function renderOOP()`). They are generic SVG helpers — reuse them for the architectural diagrams. `drawOopBox` opts: `{ x, y, w, h, title, titleColor, lines:[{text,color}], dashed }`.
- **`showStatus(msg, color)`** and **`sleep(ms)`** — existing helpers, in scope.
- **Tests:** `npm run test:all` = `node --test tests/unit/*.test.js` (44 unit) + `playwright test` (71 Playwright) = **115 currently**. `tests/visualizer.spec.js`'s `loadMethod` helper already traverses sub-tabs (PR #62), so the Architectural tab is reachable automatically.

**Final Design Patterns sub-tabs:** Creational, Structural, Behavioral, **Architectural** (new, 5 methods).

---

## File Structure

**New files (5 C++ sources):** `pattern_mvc.cpp`, `pattern_layered.cpp`, `pattern_pubsub.cpp`, `pattern_pipefilter.cpp`, `pattern_di.cpp`.

**Modified files:**
- `build_db.js` — 5 new mappings
- `code_db.js` — regenerated
- `index.html` — 5 new `pattern-*-view` divs + 5 new `#pattern-mode-select` options
- `app.js` — METHOD_GROUPS (new `patterns-architectural` group), getCodeForMethod, updateLayout, renderPattern, 5 render functions, 5 `visualizePattern` branches
- `slides_db.js` — 5 new decks
- `slides_rendered.js`, `slides/{zh,en}/*.md` — regenerated
- `tests/visualizer.spec.js` — 5 new tests

No `style.css` change — the new SVG boxes reuse the `oop-class-rect` class via `drawOopBox`.

---

## Task 1: Foundation — `build_db.js` mappings + 5 `.cpp` files + regenerated `code_db.js`

**Files:**
- Modify: `build_db.js`
- Create: `pattern_mvc.cpp`, `pattern_layered.cpp`, `pattern_pubsub.cpp`, `pattern_pipefilter.cpp`, `pattern_di.cpp`
- Regenerate: `code_db.js`

- [ ] **Step 1: Add the 5 mappings to `build_db.js`**

In `build_db.js`, in the `mappings` object, after `'pattern_strategy.cpp': 'codePatternStrategy',`, add:

```js
    'pattern_mvc.cpp': 'codePatternMVC',
    'pattern_layered.cpp': 'codePatternLayered',
    'pattern_pubsub.cpp': 'codePatternPubSub',
    'pattern_pipefilter.cpp': 'codePatternPipeFilter',
    'pattern_di.cpp': 'codePatternDI',
```

(Ensure `'pattern_strategy.cpp'` line ends with a comma.)

- [ ] **Step 2: Create `pattern_mvc.cpp`**

```cpp
#include <iostream>
#include <string>
using namespace std;

// Model — owns the data.
class Model {
    string data;
public:
    void setData(const string& d) { data = d; }
    string getData() const { return data; }
};

// View — renders the model.
class View {
public:
    void render(const Model& m) {
        cout << "[View] " << m.getData() << endl;
    }
};

// Controller — handles input, updates the model, refreshes the view.
class Controller {
    Model& model;
    View& view;
public:
    Controller(Model& m, View& v) : model(m), view(v) {}
    void handleInput(const string& input) {
        model.setData(input);
        view.render(model);
    }
};

int main() {
    Model model;
    View view;
    Controller controller(model, view);
    controller.handleInput("Hello, MVC");    // [View] Hello, MVC
    controller.handleInput("Updated text");  // [View] Updated text
    return 0;
}
```

- [ ] **Step 3: Create `pattern_layered.cpp`**

```cpp
#include <iostream>
#include <string>
using namespace std;

// Data layer — lowest layer, returns raw data.
class DataLayer {
public:
    string fetch() { return "raw record"; }
};

// Business layer — applies rules; calls only the layer below.
class BusinessLayer {
    DataLayer data;
public:
    string process() {
        return "[validated] " + data.fetch();
    }
};

// Presentation layer — formats output; calls only the layer below.
class PresentationLayer {
    BusinessLayer business;
public:
    void show() {
        cout << "Display: " << business.process() << endl;
    }
};

int main() {
    PresentationLayer ui;
    ui.show();   // Display: [validated] raw record
    return 0;
}
```

- [ ] **Step 4: Create `pattern_pubsub.cpp`**

```cpp
#include <iostream>
#include <string>
#include <functional>
#include <vector>
using namespace std;

// Event bus — decouples publishers from subscribers.
class EventBus {
    vector<function<void(const string&)>> subscribers;
public:
    void subscribe(function<void(const string&)> handler) {
        subscribers.push_back(handler);
    }
    void publish(const string& event) {
        for (auto& handler : subscribers) handler(event);
    }
};

int main() {
    EventBus bus;
    // Two subscribers — neither knows the publisher or each other.
    bus.subscribe([](const string& e) { cout << "Subscriber A got: " << e << endl; });
    bus.subscribe([](const string& e) { cout << "Subscriber B got: " << e << endl; });
    // Publisher emits through the bus.
    bus.publish("user.signed_in");
    return 0;
}
```

- [ ] **Step 5: Create `pattern_pipefilter.cpp`**

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cctype>
using namespace std;

// Filter — one transformation stage.
class Filter {
public:
    virtual string process(const string& input) const = 0;
    virtual ~Filter() {}
};

class TrimFilter : public Filter {
public:
    string process(const string& s) const override {
        size_t a = s.find_first_not_of(' ');
        size_t b = s.find_last_not_of(' ');
        return (a == string::npos) ? "" : s.substr(a, b - a + 1);
    }
};

class UpperFilter : public Filter {
public:
    string process(const string& s) const override {
        string r = s;
        transform(r.begin(), r.end(), r.begin(), ::toupper);
        return r;
    }
};

class ExclaimFilter : public Filter {
public:
    string process(const string& s) const override { return s + "!"; }
};

// Pipeline — chains filters; data flows through each pipe.
class Pipeline {
    vector<Filter*> filters;
public:
    void add(Filter* f) { filters.push_back(f); }
    string run(const string& input) const {
        string data = input;
        for (Filter* f : filters) data = f->process(data);
        return data;
    }
};

int main() {
    TrimFilter trim;
    UpperFilter upper;
    ExclaimFilter exclaim;
    Pipeline pipeline;
    pipeline.add(&trim);
    pipeline.add(&upper);
    pipeline.add(&exclaim);
    cout << pipeline.run("  hello  ") << endl;   // HELLO!
    return 0;
}
```

- [ ] **Step 6: Create `pattern_di.cpp`**

```cpp
#include <iostream>
#include <string>
using namespace std;

// Service — an abstraction the consumer depends on.
class Service {
public:
    virtual string fetch() const = 0;
    virtual ~Service() {}
};

// A concrete implementation.
class ConsoleService : public Service {
public:
    string fetch() const override { return "data from ConsoleService"; }
};

// Consumer — receives its dependency; never constructs it.
class Consumer {
    Service& service;   // depends on the abstraction
public:
    Consumer(Service& s) : service(s) {}   // constructor injection
    void run() {
        cout << "Consumer used: " << service.fetch() << endl;
    }
};

int main() {
    // Composition root — wires concrete implementations to abstractions.
    ConsoleService service;
    Consumer consumer(service);   // dependency injected, not hard-coded
    consumer.run();
    return 0;
}
```

- [ ] **Step 7: Verify all 5 files compile**

Run: `for f in pattern_mvc pattern_layered pattern_pubsub pattern_pipefilter pattern_di; do g++ -std=c++17 -fsyntax-only $f.cpp && echo "$f OK"; done`
Expected: five `OK` lines.

- [ ] **Step 8: Regenerate `code_db.js`**

Run: `node build_db.js`
Then verify: `grep -c "codePatternMVC\|codePatternLayered\|codePatternPubSub\|codePatternPipeFilter\|codePatternDI" code_db.js`
Expected: `5`.

- [ ] **Step 9: Run the full test suite**

Run: `npm run test:all`
Expected: 115 passing (44 unit + 71 Playwright) — unchanged; the new files are not yet referenced.

- [ ] **Step 10: Self-review, then commit**

Self-review: 5 mappings present and comma-correct; 5 `.cpp` files verbatim; all compile; `code_db.js` regenerated; tests still 115.

```bash
git add build_db.js code_db.js pattern_mvc.cpp pattern_layered.cpp pattern_pubsub.cpp pattern_pipefilter.cpp pattern_di.cpp
git commit -m "feat: add 5 architectural-pattern C++ sources + build_db mappings"
```

---

## Task 2: `pattern-mvc` method — new `patterns-architectural` group + visualizer + test

**Files:** Modify `app.js`, `index.html`, `tests/visualizer.spec.js`

- [ ] **Step 1: Create the `patterns-architectural` group in `METHOD_GROUPS`**

In `app.js`, after the entire `patterns-behavioral` group object (the last entry of `METHOD_GROUPS`, ~line 231 — its closing `},`), add a new group entry:

```js
    {
        id: 'patterns-architectural',
        title: 'Architectural',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: [
            { id: 'pattern-mvc', title: 'MVC (Model-View-Controller)', file: 'pattern_mvc.cpp', visualizer: 'pattern', controls: 'pattern' },
        ],
    },
```

This makes the 4th sub-tab "Architectural" appear automatically. Tasks 3-6 append more method objects to this group's `methods` array.

- [ ] **Step 2: Add the `getCodeForMethod` mapping**

In `getCodeForMethod`, after `'pattern-strategy': codePatternStrategy,`, add:

```js
        'pattern-mvc': codePatternMVC,
```

- [ ] **Step 3: Add the `index.html` view div**

In `index.html`, inside `<div id="pattern-visualization">`, after the last existing `pattern-*-view` div, add:

```html
                                <div id="pattern-mvc-view" class="pattern-view hidden">
                                    <h3 style="color: #f59e0b; margin-bottom: 1rem;">MVC — Model-View-Controller</h3>
                                    <svg id="pattern-mvc-svg" width="100%" height="320" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.2);"></svg>
                                </div>
```

- [ ] **Step 4: Add the `#pattern-mode-select` option**

In `index.html`, inside `<select id="pattern-mode-select">`, after the last existing option, add:

```html
                            <option value="mvc">MVC (Model-View-Controller)</option>
```

- [ ] **Step 5: Add the `updateLayout` branch**

In `app.js`, in the `currentMode.includes('pattern-')` branch, after the `else if (currentMode === 'pattern-strategy') { ... }` block, add:

```js
            else if (currentMode === 'pattern-mvc') {
                codeTitle.textContent = 'pattern_mvc.cpp';
                codeDisplay.textContent = codePatternMVC;
                document.getElementById('pattern-mvc-view').classList.remove('hidden');
                patternModeSelect.value = 'mvc';
            }
```

- [ ] **Step 6: Add the `renderPattern` dispatch branch + `renderPatternMVC`**

In `renderPattern()`, after `else if (mode === 'strategy') renderPatternStrategy();`, add:

```js
        else if (mode === 'mvc') renderPatternMVC();
```

Then add this function immediately after `renderPatternStrategy()` (search for `function renderPatternStrategy` and place the new function after its closing brace). It reuses the existing `drawOopBox` / `drawOopLine` / `drawOopLabel` helpers:

```js
    function renderPatternMVC() {
        const svg = document.getElementById('pattern-mvc-svg');
        if (!svg) return;
        svg.innerHTML = '';
        drawOopBox(svg, { x: 190, y: 26, w: 140, h: 56, title: 'Controller', titleColor: '#f59e0b',
            lines: [ { text: 'handles input', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 40, y: 200, w: 140, h: 56, title: 'Model', titleColor: '#34d399',
            lines: [ { text: 'data + state', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 340, y: 200, w: 140, h: 56, title: 'View', titleColor: '#60a5fa',
            lines: [ { text: 'renders model', color: '#cbd5e1' } ] });
        drawOopLine(svg, 225, 82, 120, 200);   // Controller -> Model
        drawOopLine(svg, 180, 228, 340, 228);  // Model -> View
        drawOopLine(svg, 400, 200, 295, 82);   // View -> Controller
        drawOopLabel(svg, 150, 150, 'updates', '#f59e0b');
        drawOopLabel(svg, 260, 246, 'notifies', '#34d399');
        drawOopLabel(svg, 372, 150, 'user input', '#60a5fa');
    }
```

- [ ] **Step 7: Add the `visualizePattern` branch**

In `app.js`, in `visualizePattern(mode)`, add a branch to the `if/else if` chain (after the last existing `else if`):

```js
        else if (mode === 'mvc') {
            showStatus('User input arrives at the Controller...', '#f59e0b');
            await sleep(700);
            showStatus('Controller updates the Model (data + state)', '#34d399');
            await sleep(700);
            showStatus('Model change notifies the View, which re-renders', '#60a5fa');
        }
```

- [ ] **Step 8: Add a Playwright test**

In `tests/visualizer.spec.js`, add after the last existing Design Patterns test (search for the `Design Patterns: Strategy` test and place this after it):

```js
    test('Architectural: MVC renders the Model-View-Controller diagram', async ({ page }) => {
        await loadMethod(page, 'pattern-mvc');
        const card = page.locator('[data-method-section="pattern-mvc"]');
        await expect(card).toHaveAttribute('data-runtime-state', 'active');
        await expect(card.locator('.code-panel-filename')).toContainText('pattern_mvc.cpp');
        await expect(card.locator('#pattern-mvc-svg rect')).toHaveCount(3);
    });
```

- [ ] **Step 9: Run tests**

Run: `npm run test:all`
Expected: 116 passing (44 unit + 72 Playwright).

- [ ] **Step 10: Self-review, then commit**

Self-review: the `patterns-architectural` group exists with the mvc method; getCodeForMethod / index.html view + option / updateLayout / renderPattern dispatch / visualizePattern all wired; `renderPatternMVC` draws exactly 3 boxes; test passes; 116 total.

```bash
git add app.js index.html tests/visualizer.spec.js
git commit -m "feat: pattern-mvc architectural method (new Architectural sub-tab)"
```

---

## Task 3: `pattern-layered` method — visualizer + test

**Files:** Modify `app.js`, `index.html`, `tests/visualizer.spec.js`

- [ ] **Step 1: Append the `pattern-layered` entry to the `patterns-architectural` group**

In `app.js`, in the `patterns-architectural` group's `methods` array, after the `pattern-mvc` entry, add:

```js
            { id: 'pattern-layered', title: 'Layered Architecture', file: 'pattern_layered.cpp', visualizer: 'pattern', controls: 'pattern' },
```

- [ ] **Step 2: Add the `getCodeForMethod` mapping**

After `'pattern-mvc': codePatternMVC,`:

```js
        'pattern-layered': codePatternLayered,
```

- [ ] **Step 3: Add the `index.html` view div**

In `<div id="pattern-visualization">`, after `pattern-mvc-view`, add:

```html
                                <div id="pattern-layered-view" class="pattern-view hidden">
                                    <h3 style="color: #a78bfa; margin-bottom: 1rem;">Layered Architecture</h3>
                                    <svg id="pattern-layered-svg" width="100%" height="320" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.2);"></svg>
                                </div>
```

- [ ] **Step 4: Add the `#pattern-mode-select` option**

After the `mvc` option:

```html
                            <option value="layered">Layered Architecture</option>
```

- [ ] **Step 5: Add the `updateLayout` branch**

After the `else if (currentMode === 'pattern-mvc') { ... }` block:

```js
            else if (currentMode === 'pattern-layered') {
                codeTitle.textContent = 'pattern_layered.cpp';
                codeDisplay.textContent = codePatternLayered;
                document.getElementById('pattern-layered-view').classList.remove('hidden');
                patternModeSelect.value = 'layered';
            }
```

- [ ] **Step 6: Add the `renderPattern` dispatch branch + `renderPatternLayered`**

In `renderPattern()`, after `else if (mode === 'mvc') renderPatternMVC();`:

```js
        else if (mode === 'layered') renderPatternLayered();
```

Add this function immediately after `renderPatternMVC()`:

```js
    function renderPatternLayered() {
        const svg = document.getElementById('pattern-layered-svg');
        if (!svg) return;
        svg.innerHTML = '';
        drawOopBox(svg, { x: 150, y: 24, w: 200, h: 58, title: 'Presentation', titleColor: '#60a5fa',
            lines: [ { text: 'formats output', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 150, y: 122, w: 200, h: 58, title: 'Business', titleColor: '#f59e0b',
            lines: [ { text: 'applies rules', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 150, y: 220, w: 200, h: 58, title: 'Data', titleColor: '#34d399',
            lines: [ { text: 'raw records', color: '#cbd5e1' } ] });
        drawOopLine(svg, 250, 82, 250, 122);    // Presentation -> Business
        drawOopLine(svg, 250, 180, 250, 220);   // Business -> Data
        drawOopLabel(svg, 320, 106, 'calls', '#94a3b8');
        drawOopLabel(svg, 320, 204, 'calls', '#94a3b8');
    }
```

- [ ] **Step 7: Add the `visualizePattern` branch**

After the `else if (mode === 'mvc') { ... }` block:

```js
        else if (mode === 'layered') {
            showStatus('Presentation layer formats a request...', '#60a5fa');
            await sleep(700);
            showStatus('Business layer applies rules, calls the layer below', '#f59e0b');
            await sleep(700);
            showStatus('Data layer returns raw records — each layer calls only downward', '#34d399');
        }
```

- [ ] **Step 8: Add a Playwright test**

After the `Architectural: MVC` test:

```js
    test('Architectural: Layered renders the 3-layer stack', async ({ page }) => {
        await loadMethod(page, 'pattern-layered');
        const card = page.locator('[data-method-section="pattern-layered"]');
        await expect(card).toHaveAttribute('data-runtime-state', 'active');
        await expect(card.locator('.code-panel-filename')).toContainText('pattern_layered.cpp');
        await expect(card.locator('#pattern-layered-svg rect')).toHaveCount(3);
    });
```

- [ ] **Step 9: Run tests**

Run: `npm run test:all`
Expected: 117 passing (44 unit + 73 Playwright).

- [ ] **Step 10: Self-review, then commit**

Self-review: all integration points wired; `renderPatternLayered` draws exactly 3 boxes; test passes; 117 total.

```bash
git add app.js index.html tests/visualizer.spec.js
git commit -m "feat: pattern-layered architectural method"
```

---

## Task 4: `pattern-pubsub` method — visualizer + test

**Files:** Modify `app.js`, `index.html`, `tests/visualizer.spec.js`

- [ ] **Step 1: Append the `pattern-pubsub` entry to the `patterns-architectural` group**

After the `pattern-layered` entry in the group's `methods` array:

```js
            { id: 'pattern-pubsub', title: 'Publish-Subscribe', file: 'pattern_pubsub.cpp', visualizer: 'pattern', controls: 'pattern' },
```

- [ ] **Step 2: Add the `getCodeForMethod` mapping**

After `'pattern-layered': codePatternLayered,`:

```js
        'pattern-pubsub': codePatternPubSub,
```

- [ ] **Step 3: Add the `index.html` view div**

After `pattern-layered-view`:

```html
                                <div id="pattern-pubsub-view" class="pattern-view hidden">
                                    <h3 style="color: #22d3ee; margin-bottom: 1rem;">Publish-Subscribe</h3>
                                    <svg id="pattern-pubsub-svg" width="100%" height="320" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.2);"></svg>
                                </div>
```

- [ ] **Step 4: Add the `#pattern-mode-select` option**

After the `layered` option:

```html
                            <option value="pubsub">Publish-Subscribe</option>
```

- [ ] **Step 5: Add the `updateLayout` branch**

After the `else if (currentMode === 'pattern-layered') { ... }` block:

```js
            else if (currentMode === 'pattern-pubsub') {
                codeTitle.textContent = 'pattern_pubsub.cpp';
                codeDisplay.textContent = codePatternPubSub;
                document.getElementById('pattern-pubsub-view').classList.remove('hidden');
                patternModeSelect.value = 'pubsub';
            }
```

- [ ] **Step 6: Add the `renderPattern` dispatch branch + `renderPatternPubSub`**

In `renderPattern()`, after `else if (mode === 'layered') renderPatternLayered();`:

```js
        else if (mode === 'pubsub') renderPatternPubSub();
```

Add this function immediately after `renderPatternLayered()`:

```js
    function renderPatternPubSub() {
        const svg = document.getElementById('pattern-pubsub-svg');
        if (!svg) return;
        svg.innerHTML = '';
        drawOopBox(svg, { x: 24, y: 130, w: 120, h: 58, title: 'Publisher', titleColor: '#f59e0b',
            lines: [ { text: 'emits events', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 196, y: 130, w: 120, h: 58, title: 'EventBus', titleColor: '#a78bfa',
            lines: [ { text: 'broker', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 372, y: 36, w: 116, h: 50, title: 'Subscriber A', titleColor: '#34d399' });
        drawOopBox(svg, { x: 372, y: 134, w: 116, h: 50, title: 'Subscriber B', titleColor: '#34d399' });
        drawOopBox(svg, { x: 372, y: 232, w: 116, h: 50, title: 'Subscriber C', titleColor: '#34d399' });
        drawOopLine(svg, 144, 159, 196, 159);   // Publisher -> EventBus
        drawOopLine(svg, 316, 159, 372, 61);    // EventBus -> A
        drawOopLine(svg, 316, 159, 372, 159);   // EventBus -> B
        drawOopLine(svg, 316, 159, 372, 257);   // EventBus -> C
        drawOopLabel(svg, 170, 150, 'publish', '#f59e0b');
        drawOopLabel(svg, 344, 110, 'notify', '#34d399');
    }
```

- [ ] **Step 7: Add the `visualizePattern` branch**

After the `else if (mode === 'layered') { ... }` block:

```js
        else if (mode === 'pubsub') {
            showStatus('Publisher emits an event to the EventBus...', '#f59e0b');
            await sleep(700);
            showStatus('EventBus fans the event out to every subscriber', '#a78bfa');
            await sleep(700);
            showStatus('Subscribers A, B, C all receive it — fully decoupled', '#34d399');
        }
```

- [ ] **Step 8: Add a Playwright test**

After the `Architectural: Layered` test:

```js
    test('Architectural: Publish-Subscribe renders publisher, bus, subscribers', async ({ page }) => {
        await loadMethod(page, 'pattern-pubsub');
        const card = page.locator('[data-method-section="pattern-pubsub"]');
        await expect(card).toHaveAttribute('data-runtime-state', 'active');
        await expect(card.locator('.code-panel-filename')).toContainText('pattern_pubsub.cpp');
        await expect(card.locator('#pattern-pubsub-svg rect')).toHaveCount(5);
    });
```

- [ ] **Step 9: Run tests**

Run: `npm run test:all`
Expected: 118 passing (44 unit + 74 Playwright).

- [ ] **Step 10: Self-review, then commit**

Self-review: all integration points wired; `renderPatternPubSub` draws exactly 5 boxes (Publisher + EventBus + 3 Subscribers); test passes; 118 total.

```bash
git add app.js index.html tests/visualizer.spec.js
git commit -m "feat: pattern-pubsub architectural method"
```

---

## Task 5: `pattern-pipefilter` method — visualizer + test

**Files:** Modify `app.js`, `index.html`, `tests/visualizer.spec.js`

- [ ] **Step 1: Append the `pattern-pipefilter` entry to the `patterns-architectural` group**

After the `pattern-pubsub` entry:

```js
            { id: 'pattern-pipefilter', title: 'Pipe-and-Filter', file: 'pattern_pipefilter.cpp', visualizer: 'pattern', controls: 'pattern' },
```

- [ ] **Step 2: Add the `getCodeForMethod` mapping**

After `'pattern-pubsub': codePatternPubSub,`:

```js
        'pattern-pipefilter': codePatternPipeFilter,
```

- [ ] **Step 3: Add the `index.html` view div**

After `pattern-pubsub-view`:

```html
                                <div id="pattern-pipefilter-view" class="pattern-view hidden">
                                    <h3 style="color: #34d399; margin-bottom: 1rem;">Pipe-and-Filter</h3>
                                    <svg id="pattern-pipefilter-svg" width="100%" height="320" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.2);"></svg>
                                </div>
```

- [ ] **Step 4: Add the `#pattern-mode-select` option**

After the `pubsub` option:

```html
                            <option value="pipefilter">Pipe-and-Filter</option>
```

- [ ] **Step 5: Add the `updateLayout` branch**

After the `else if (currentMode === 'pattern-pubsub') { ... }` block:

```js
            else if (currentMode === 'pattern-pipefilter') {
                codeTitle.textContent = 'pattern_pipefilter.cpp';
                codeDisplay.textContent = codePatternPipeFilter;
                document.getElementById('pattern-pipefilter-view').classList.remove('hidden');
                patternModeSelect.value = 'pipefilter';
            }
```

- [ ] **Step 6: Add the `renderPattern` dispatch branch + `renderPatternPipeFilter`**

In `renderPattern()`, after `else if (mode === 'pubsub') renderPatternPubSub();`:

```js
        else if (mode === 'pipefilter') renderPatternPipeFilter();
```

Add this function immediately after `renderPatternPubSub()`:

```js
    function renderPatternPipeFilter() {
        const svg = document.getElementById('pattern-pipefilter-svg');
        if (!svg) return;
        svg.innerHTML = '';
        const stages = [
            { x: 12, title: 'Input', color: '#94a3b8' },
            { x: 110, title: 'Trim', color: '#34d399' },
            { x: 208, title: 'Upper', color: '#34d399' },
            { x: 306, title: 'Exclaim', color: '#34d399' },
            { x: 404, title: 'Output', color: '#60a5fa' },
        ];
        stages.forEach((s) => {
            drawOopBox(svg, { x: s.x, y: 132, w: 80, h: 56, title: s.title, titleColor: s.color });
        });
        for (let i = 0; i < stages.length - 1; i++) {
            drawOopLine(svg, stages[i].x + 80, 160, stages[i + 1].x, 160);
        }
        drawOopLabel(svg, 250, 220, 'data flows through each filter via pipes', '#94a3b8');
    }
```

- [ ] **Step 7: Add the `visualizePattern` branch**

After the `else if (mode === 'pubsub') { ... }` block:

```js
        else if (mode === 'pipefilter') {
            showStatus('Input enters the pipeline...', '#94a3b8');
            await sleep(700);
            showStatus('Each filter transforms the data and passes it on', '#34d399');
            await sleep(700);
            showStatus('Trim -> Upper -> Exclaim -> Output', '#60a5fa');
        }
```

- [ ] **Step 8: Add a Playwright test**

After the `Architectural: Publish-Subscribe` test:

```js
    test('Architectural: Pipe-and-Filter renders the filter chain', async ({ page }) => {
        await loadMethod(page, 'pattern-pipefilter');
        const card = page.locator('[data-method-section="pattern-pipefilter"]');
        await expect(card).toHaveAttribute('data-runtime-state', 'active');
        await expect(card.locator('.code-panel-filename')).toContainText('pattern_pipefilter.cpp');
        await expect(card.locator('#pattern-pipefilter-svg rect')).toHaveCount(5);
    });
```

- [ ] **Step 9: Run tests**

Run: `npm run test:all`
Expected: 119 passing (44 unit + 75 Playwright).

- [ ] **Step 10: Self-review, then commit**

Self-review: all integration points wired; `renderPatternPipeFilter` draws exactly 5 boxes; test passes; 119 total.

```bash
git add app.js index.html tests/visualizer.spec.js
git commit -m "feat: pattern-pipefilter architectural method"
```

---

## Task 6: `pattern-di` method — visualizer + test

**Files:** Modify `app.js`, `index.html`, `tests/visualizer.spec.js`

- [ ] **Step 1: Append the `pattern-di` entry to the `patterns-architectural` group**

After the `pattern-pipefilter` entry (this is the last method in the group):

```js
            { id: 'pattern-di', title: 'Dependency Injection', file: 'pattern_di.cpp', visualizer: 'pattern', controls: 'pattern' },
```

- [ ] **Step 2: Add the `getCodeForMethod` mapping**

After `'pattern-pipefilter': codePatternPipeFilter,`:

```js
        'pattern-di': codePatternDI,
```

- [ ] **Step 3: Add the `index.html` view div**

After `pattern-pipefilter-view`:

```html
                                <div id="pattern-di-view" class="pattern-view hidden">
                                    <h3 style="color: #ec4899; margin-bottom: 1rem;">Dependency Injection</h3>
                                    <svg id="pattern-di-svg" width="100%" height="320" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.2);"></svg>
                                </div>
```

- [ ] **Step 4: Add the `#pattern-mode-select` option**

After the `pipefilter` option:

```html
                            <option value="di">Dependency Injection</option>
```

- [ ] **Step 5: Add the `updateLayout` branch**

After the `else if (currentMode === 'pattern-pipefilter') { ... }` block:

```js
            else if (currentMode === 'pattern-di') {
                codeTitle.textContent = 'pattern_di.cpp';
                codeDisplay.textContent = codePatternDI;
                document.getElementById('pattern-di-view').classList.remove('hidden');
                patternModeSelect.value = 'di';
            }
```

- [ ] **Step 6: Add the `renderPattern` dispatch branch + `renderPatternDI`**

In `renderPattern()`, after `else if (mode === 'pipefilter') renderPatternPipeFilter();`:

```js
        else if (mode === 'di') renderPatternDI();
```

Add this function immediately after `renderPatternPipeFilter()`:

```js
    function renderPatternDI() {
        const svg = document.getElementById('pattern-di-svg');
        if (!svg) return;
        svg.innerHTML = '';
        drawOopBox(svg, { x: 150, y: 24, w: 210, h: 56, title: 'Composition Root', titleColor: '#ec4899',
            lines: [ { text: 'wires dependencies', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 50, y: 192, w: 180, h: 70, title: 'ConsoleService', titleColor: '#34d399',
            lines: [ { text: 'concrete Service', color: '#cbd5e1' } ] });
        drawOopBox(svg, { x: 290, y: 192, w: 180, h: 70, title: 'Consumer', titleColor: '#60a5fa',
            lines: [ { text: 'depends on Service', color: '#cbd5e1' }, { text: 'never calls new', color: '#cbd5e1' } ] });
        drawOopLine(svg, 210, 80, 140, 192);   // Composition Root -> Service
        drawOopLine(svg, 300, 80, 380, 192);   // Composition Root -> Consumer
        drawOopLine(svg, 230, 227, 290, 227);  // Service injected -> Consumer
        drawOopLabel(svg, 150, 150, 'creates', '#34d399');
        drawOopLabel(svg, 360, 150, 'injects', '#60a5fa');
        drawOopLabel(svg, 260, 248, 'inject', '#ec4899');
    }
```

- [ ] **Step 7: Add the `visualizePattern` branch**

After the `else if (mode === 'pipefilter') { ... }` block:

```js
        else if (mode === 'di') {
            showStatus('Composition root creates the concrete ConsoleService...', '#34d399');
            await sleep(700);
            showStatus('Service is injected into the Consumer constructor', '#60a5fa');
            await sleep(700);
            showStatus('Consumer depends only on the Service abstraction — easy to test', '#ec4899');
        }
```

- [ ] **Step 8: Add a Playwright test**

After the `Architectural: Pipe-and-Filter` test:

```js
    test('Architectural: Dependency Injection renders the wiring diagram', async ({ page }) => {
        await loadMethod(page, 'pattern-di');
        const card = page.locator('[data-method-section="pattern-di"]');
        await expect(card).toHaveAttribute('data-runtime-state', 'active');
        await expect(card.locator('.code-panel-filename')).toContainText('pattern_di.cpp');
        await expect(card.locator('#pattern-di-svg rect')).toHaveCount(3);
    });
```

- [ ] **Step 9: Run tests**

Run: `npm run test:all`
Expected: 120 passing (44 unit + 76 Playwright).

- [ ] **Step 10: Self-review, then commit**

Self-review: all 5 architectural methods now wired; `renderPatternDI` draws exactly 3 boxes; test passes; 120 total.

```bash
git add app.js index.html tests/visualizer.spec.js
git commit -m "feat: pattern-di architectural method"
```

---

## Task 7: Slide deck — `pattern-mvc` (reference deck, fully authored)

**Files:** Modify `slides_db.js`; regenerate `slides_rendered.js`, `slides/{zh,en}/*.md`

- [ ] **Step 1: Add the `pattern-mvc` deck to `SLIDES_DB`**

In `slides_db.js`, insert the following deck near the other `pattern-*` deck entries (order does not affect generation). Authoring in compact form is fine — Task 9 runs `format:code` to canonicalize.

```js
  "pattern-mvc": {
    "category": "Design Patterns",
    "title": { "zh": "MVC 模式", "en": "MVC Pattern" },
    "slides": [
      {
        "heading": { "zh": "MVC（Model-View-Controller）", "en": "MVC (Model-View-Controller)" },
        "blocks": [
          { "type": "paragraph", "text": {
              "zh": "MVC 把應用拆成三個角色:Model（資料與狀態）、View（呈現）、Controller（處理輸入),以分離關注點。",
              "en": "MVC splits an application into three roles — Model (data and state), View (presentation), and Controller (input handling) — to separate concerns." } }
        ]
      },
      {
        "heading": { "zh": "核心概念", "en": "Core Concept" },
        "blocks": [
          { "type": "paragraph", "text": {
              "zh": "Controller 接收使用者輸入並更新 Model;Model 改變後通知 View 重新呈現。三者各司其職,可獨立替換與測試。",
              "en": "The Controller receives user input and updates the Model; when the Model changes, the View re-renders. Each role has one job and can be replaced or tested independently." } },
          { "type": "bullets", "items": [
              { "zh": "Model 不知道 View 或 Controller —— 只管資料與規則。", "en": "The Model knows nothing of the View or Controller — it owns data and rules only." },
              { "zh": "View 只負責呈現,從 Model 讀資料。", "en": "The View only renders, reading data from the Model." },
              { "zh": "Controller 是輸入與更新的協調者。", "en": "The Controller coordinates input and updates." }
          ] }
        ]
      },
      {
        "heading": { "zh": "運作流程", "en": "Operation Flow" },
        "blocks": [
          { "type": "steps", "items": [
              { "zh": "使用者輸入抵達 Controller。", "en": "User input reaches the Controller." },
              { "zh": "Controller 更新 Model 的資料與狀態。", "en": "The Controller updates the Model's data and state." },
              { "zh": "Model 變更後,View 從 Model 讀取並重新呈現。", "en": "After the Model changes, the View reads from it and re-renders." }
          ] },
          { "type": "mermaid", "code": "flowchart LR\n  U[\"User input\"] --> C[\"Controller\"]\n  C --> M[\"Model\"]\n  M --> V[\"View\"]\n  V --> U" }
        ]
      },
      {
        "heading": { "zh": "示意圖", "en": "Layout" },
        "blocks": [
          { "type": "svg", "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 150\" width=\"360\"><g font-family=\"monospace\" font-size=\"12\"><rect x=\"120\" y=\"10\" width=\"120\" height=\"34\" fill=\"none\" stroke=\"#f59e0b\"/><text x=\"180\" y=\"31\" text-anchor=\"middle\" fill=\"#f59e0b\">Controller</text><rect x=\"20\" y=\"100\" width=\"120\" height=\"34\" fill=\"none\" stroke=\"#34d399\"/><text x=\"80\" y=\"121\" text-anchor=\"middle\" fill=\"#34d399\">Model</text><rect x=\"220\" y=\"100\" width=\"120\" height=\"34\" fill=\"none\" stroke=\"#60a5fa\"/><text x=\"280\" y=\"121\" text-anchor=\"middle\" fill=\"#60a5fa\">View</text><line x1=\"140\" y1=\"44\" x2=\"80\" y2=\"100\" stroke=\"#64748b\"/><line x1=\"140\" y1=\"117\" x2=\"220\" y2=\"117\" stroke=\"#64748b\"/><line x1=\"280\" y1=\"100\" x2=\"220\" y2=\"44\" stroke=\"#64748b\"/></g></svg>" },
          { "type": "note", "text": {
              "zh": "visualizer 以三角佈局呈現:Controller 在上,Model 與 View 在下,箭頭表示 updates / notifies / user input。",
              "en": "The visualizer uses a triangle layout: Controller on top, Model and View below, with arrows for updates / notifies / user input." } }
        ]
      },
      {
        "heading": { "zh": "取捨與使用時機", "en": "Trade-offs & When to Use" },
        "blocks": [
          { "type": "table",
            "headers": [ { "zh": "面向", "en": "Aspect" }, { "zh": "說明", "en": "Notes" } ],
            "rows": [
              [ { "zh": "關注點分離", "en": "Separation of concerns" }, { "zh": "資料、呈現、輸入各自獨立", "en": "Data, presentation, input are independent" } ],
              [ { "zh": "可測試性", "en": "Testability" }, { "zh": "Model 可不靠 UI 單獨測試", "en": "The Model can be tested without a UI" } ],
              [ { "zh": "成本", "en": "Cost" }, { "zh": "小程式會顯得過度設計", "en": "Overkill for very small programs" } ]
            ] }
        ]
      },
      {
        "heading": { "zh": "程式碼", "en": "Source Code" },
        "blocks": [
          { "type": "code", "lang": "cpp", "code": "class Controller {\n    Model& model;\n    View& view;\npublic:\n    Controller(Model& m, View& v) : model(m), view(v) {}\n    void handleInput(const string& input) {\n        model.setData(input);\n        view.render(model);\n    }\n};" }
        ]
      },
      {
        "heading": { "zh": "優缺點與使用時機", "en": "Pros, Cons & When to Use" },
        "blocks": [
          { "type": "bullets", "items": [
              { "zh": "優點:三個角色可獨立開發、替換、測試。", "en": "Pro: the three roles can be developed, replaced, and tested independently." },
              { "zh": "優點:同一 Model 可搭配多個 View。", "en": "Pro: one Model can drive multiple Views." },
              { "zh": "缺點:角色間的協調對小程式而言是額外負擔。", "en": "Con: the coordination between roles is overhead for small programs." },
              { "zh": "適用:具使用者介面、需長期維護的應用。", "en": "Use for applications with a user interface that need long-term maintenance." }
          ] }
        ]
      },
      {
        "heading": { "zh": "小結", "en": "Summary" },
        "blocks": [
          { "type": "bullets", "items": [
              { "zh": "Model / View / Controller 分離資料、呈現、輸入。", "en": "Model / View / Controller separate data, presentation, and input." },
              { "zh": "Controller 更新 Model,Model 通知 View。", "en": "The Controller updates the Model; the Model notifies the View." },
              { "zh": "是 UI 架構的經典基礎,衍生出 MVP、MVVM。", "en": "The classic UI-architecture foundation; MVP and MVVM derive from it." }
          ] }
        ]
      }
    ]
  },
```

**Preserve exactly:** full-width Chinese punctuation, the mermaid `flowchart LR` with rectangular `[...]` nodes, the inline SVG, the `\n` newlines in code/mermaid strings. 8 slides.

- [ ] **Step 2: Regenerate slides**

Run: `npm run build:slides`
Expected: `Generated N decks for zh, en` with N up by 1. No mermaid parse error.

- [ ] **Step 3: Confirm tests still pass**

Run: `npm run test:all`
Expected: 120 passing (decks do not change test counts).

- [ ] **Step 4: Self-review, then commit**

Self-review: 8 slides; mermaid `flowchart LR` rectangular nodes; `slides/{zh,en}/pattern-mvc.md` generated.

```bash
git add slides_db.js slides_rendered.js slides
git commit -m "feat: author pattern-mvc slide deck"
```

---

## Task 8: Slide decks — `pattern-layered`, `pattern-pubsub`, `pattern-pipefilter`, `pattern-di`

**Files:** Modify `slides_db.js`; regenerate `slides_rendered.js`, `slides/{zh,en}/*.md`

Use the `pattern-mvc` deck from Task 7 as the structural template. Each deck has the SAME 8-slide structure: (1) Overview paragraph, (2) Core Concept paragraph + bullets, (3) Operation Flow steps + mermaid, (4) Layout svg + note, (5) Trade-offs & When to Use table, (6) Source Code code block, (7) Pros/Cons bullets, (8) Summary bullets.

**Authoring constraints (all 4 decks):**
- `category: "Design Patterns"`.
- Full-width Chinese punctuation in `zh` strings.
- Mermaid blocks use `flowchart` with rectangular `[...]` nodes — **never `([...])` stadium nodes** (non-deterministic rendering breaks `build:slides` idempotency). Quote labels containing brackets/parens.
- Exactly 8 slides per deck.
- `code` blocks (`"lang": "cpp"`) embed the key class(es) from the corresponding `.cpp` file — read `pattern_layered.cpp` / `pattern_pubsub.cpp` / `pattern_pipefilter.cpp` / `pattern_di.cpp`.

- [ ] **Step 1: Author the `pattern-layered` deck**

Key `"pattern-layered"`. Title zh `分層架構` / en `Layered Architecture`.
- **Overview:** organizes a system into horizontal layers (Presentation, Business, Data); each layer uses only the layer directly below.
- **Core Concept:** strict downward dependency — a layer never calls upward or skips a layer. Bullets: each layer has one responsibility; lower layers are unaware of higher ones; swapping a layer's implementation doesn't ripple upward.
- **Operation Flow:** 3 steps — a request enters at Presentation, flows down through Business (rules), reaches Data; results flow back up. Mermaid (`flowchart TD`, rectangular nodes): Presentation → Business → Data.
- **Layout:** an svg of the 3 stacked layers with downward arrows. Note: the visualizer stacks Presentation/Business/Data with "calls" arrows.
- **Trade-offs & When to Use:** table — separation/maintainability (good), testability per layer (good), cost (requests are passed layer-to-layer; can add indirection / "sinkhole" anti-pattern when layers just pass through).
- **Source Code:** embed `BusinessLayer` + `PresentationLayer` from `pattern_layered.cpp`.
- **Pros/Cons:** pro — clear structure, each layer independently maintainable/testable; con — extra indirection, risk of pass-through layers. Use for business applications with clear horizontal concerns.
- **Summary:** layers + strict downward dependency; the classic n-tier structure.

- [ ] **Step 2: Author the `pattern-pubsub` deck**

Key `"pattern-pubsub"`. Title zh `發布-訂閱` / en `Publish-Subscribe`.
- **Overview:** publishers emit events to a broker (event bus); subscribers receive them — publishers and subscribers never reference each other.
- **Core Concept:** the event bus decouples both sides; one event fans out to many subscribers; subscribers can be added/removed at runtime. Bullets covering decoupling, fan-out, runtime flexibility.
- **Operation Flow:** 3 steps — subscribers register handlers with the bus; a publisher publishes an event; the bus invokes every handler. Mermaid (`flowchart LR`): Publisher → EventBus → Subscriber A / B / C.
- **Layout:** an svg of Publisher → EventBus → 3 Subscribers. Note describing the visualizer.
- **Trade-offs & When to Use:** table — decoupling (good), fan-out (good), cost (event flow is harder to trace; ordering/delivery guarantees need care).
- **Source Code:** embed the `EventBus` class from `pattern_pubsub.cpp`.
- **Pros/Cons:** pro — total decoupling, easy fan-out, dynamic subscribers; con — indirect control flow is harder to debug. Use for event-driven systems, UI events, decoupled modules.
- **Summary:** broker-mediated events; publishers and subscribers fully decoupled.

- [ ] **Step 3: Author the `pattern-pipefilter` deck**

Key `"pattern-pipefilter"`. Title zh `管道與過濾器` / en `Pipe-and-Filter`.
- **Overview:** data flows through a chain of independent filters connected by pipes; each filter transforms its input and passes it on.
- **Core Concept:** each filter has a single responsibility and a uniform interface, so filters compose and reorder freely. Bullets: uniform `input -> output` interface; filters are independent and reusable; the pipeline is just an ordered list.
- **Operation Flow:** 3 steps — build a pipeline by adding filters; feed input to the first; each filter transforms and forwards. Mermaid (`flowchart LR`): Input → Trim → Upper → Exclaim → Output.
- **Layout:** an svg of the horizontal filter chain. Note describing the visualizer.
- **Trade-offs & When to Use:** table — composability/reuse (good), each stage testable in isolation (good), cost (per-stage copying overhead; not ideal for tight feedback loops).
- **Source Code:** embed the `Filter` interface + `Pipeline` class from `pattern_pipefilter.cpp`.
- **Pros/Cons:** pro — composable, reorderable, each filter independently testable; con — copying between stages, awkward for non-linear flows. Use for stream/batch transformation (compilers, data pipelines, text processing).
- **Summary:** chained single-responsibility filters; uniform interface enables free composition.

- [ ] **Step 4: Author the `pattern-di` deck**

Key `"pattern-di"`. Title zh `依賴注入` / en `Dependency Injection`.
- **Overview:** instead of an object constructing its own dependencies, they are supplied from outside (typically via the constructor) — an application of Inversion of Control.
- **Core Concept:** the consumer depends on an abstraction (interface), and a composition root wires the concrete implementation in. Bullets: the consumer never calls `new` on its dependency; depends on an interface, not a concrete class; the composition root is the single wiring place.
- **Operation Flow:** 3 steps — define a `Service` abstraction; the `Consumer` takes a `Service&` in its constructor; the composition root (`main`) creates the concrete service and injects it. Mermaid (`flowchart LR`): Composition Root → ConsoleService, Composition Root → Consumer, with an "injects" edge.
- **Layout:** an svg with the Composition Root creating ConsoleService and injecting it into Consumer. Note describing the visualizer.
- **Trade-offs & When to Use:** table — testability (excellent — inject a mock/fake), flexibility (swap implementations without touching the consumer), cost (more wiring code; a composition root to maintain).
- **Source Code:** embed the `Service` interface + `Consumer` class from `pattern_di.cpp`.
- **Pros/Cons:** pro — hugely improves testability (mock injection) and flexibility; con — wiring boilerplate, indirection. Use whenever a class has external dependencies you want to test or swap. Note that DI is the practical mechanism behind Inversion of Control.
- **Summary:** dependencies supplied from outside; consumer depends on an abstraction; composition root wires it — the foundation of testable, loosely-coupled code.

- [ ] **Step 5: Regenerate slides**

Run: `npm run build:slides`
Expected: `Generated N decks for zh, en` with N up by 4 from the Task 7 value.
Verify: `grep -c '"pattern-layered":\|"pattern-pubsub":\|"pattern-pipefilter":\|"pattern-di":' slides_db.js`
Expected: `4`.

- [ ] **Step 6: Confirm tests still pass**

Run: `npm run test:all`
Expected: 120 passing.

- [ ] **Step 7: Commit**

```bash
git add slides_db.js slides_rendered.js slides
git commit -m "feat: author layered, pubsub, pipefilter, di slide decks"
```

---

## Task 9: Final verification + idempotency

**Files:** No expected modifications beyond a possible normalization commit.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:all`
Expected: 120 passing (44 unit + 76 Playwright).

- [ ] **Step 2: Browser smoke check — the 5 new methods render without page errors**

Write this temporary file at the repo root:

```js
// /Users/skhuang/course/dsvisual/check_arch.js
const { chromium } = require('@playwright/test');
const path = require('path');

const expected = [
  { id: 'pattern-mvc',        selector: '#pattern-mvc-svg rect',        count: 3 },
  { id: 'pattern-layered',    selector: '#pattern-layered-svg rect',    count: 3 },
  { id: 'pattern-pubsub',     selector: '#pattern-pubsub-svg rect',     count: 5 },
  { id: 'pattern-pipefilter', selector: '#pattern-pipefilter-svg rect', count: 5 },
  { id: 'pattern-di',         selector: '#pattern-di-svg rect',         count: 3 },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.resolve(process.cwd(), 'index.html'));
  await page.waitForSelector('[data-method-section]');
  for (const e of expected) {
    const cats = page.locator('[data-testid="category-nav"] .category-nav-btn');
    const count = await cats.count();
    let found = false;
    for (let i = 0; i < count && !found; i++) {
      await cats.nth(i).click();
      const sel = page.locator('[data-testid="method-select"]');
      if (await sel.locator('option[value="' + e.id + '"]').count()) {
        await sel.selectOption(e.id);
        found = true;
        break;
      }
      const tabs = page.locator('.category-subtab-row.visible .category-subtab-btn');
      const tc = await tabs.count();
      for (let t = 0; t < tc && !found; t++) {
        await tabs.nth(t).click();
        if (await sel.locator('option[value="' + e.id + '"]').count()) {
          await sel.selectOption(e.id);
          found = true;
        }
      }
    }
    await page.waitForSelector('[data-method-section="' + e.id + '"][data-runtime-state="active"]');
    const actual = await page.locator('[data-method-section="' + e.id + '"] ' + e.selector).count();
    console.log(e.id.padEnd(20), 'expected', e.count, 'actual', actual, actual === e.count ? 'OK' : 'FAIL');
  }
  console.log('errors:', errors);
  await browser.close();
})();
```

Run: `node check_arch.js`
Then: `rm check_arch.js`
Expected: every line prints `OK` and `errors: []`.

- [ ] **Step 3: Idempotency — normalize and verify**

Run: `npm run format:code`
Then: `git status --short`

`format:code` clang-formats the 5 `.cpp` files (and the C++ embedded in the new decks) and rebuilds slides — a diff in the 5 `.cpp` files, `code_db.js`, `slides_db.js`, `slides_rendered.js`, and `slides/` is expected on this first run. If there is a diff, verify it is formatting-only (`npm run test:all` still 120), then commit it:

```bash
git add pattern_mvc.cpp pattern_layered.cpp pattern_pubsub.cpp pattern_pipefilter.cpp pattern_di.cpp code_db.js slides_db.js slides_rendered.js slides
git commit -m "chore: normalize architectural-pattern sources and decks to canonical format:code output"
```

Then verify idempotency:

```bash
npm run format:code && git status --short
npm run build:slides && git status --short
```

Expected after each: only untracked files (e.g. `?? .claude/`).

- [ ] **Step 4: Final test run**

Run: `npm run test:all`
Expected: 120 passing (44 unit + 76 Playwright).

If Steps 1-4 pass, the branch is ready. If any regression surfaces, fix it and commit.

---

## Notes for the executor

- **`build_db.js` mappings come first (Task 1).** Without the mapping, `code_db.js` regeneration silently drops the constant and the app breaks with a `ReferenceError`.
- **Task 2 creates the `patterns-architectural` group;** Tasks 3-6 append method objects to its `methods` array. The 4th sub-tab appears automatically — PR #62's `renderCategoryNav` already iterates every `parent`-tagged group.
- **Each new method needs a `visualizePattern` branch.** The "Visualize Pattern" button calls `visualizePattern(mode)`, not `renderAll` — a mode with no branch makes the button a silent no-op.
- **No `style.css` change.** The SVG boxes reuse `oop-class-rect` via the shared `drawOopBox` helper.
- **Mermaid: rectangular `[...]` nodes only.** `([...])` stadium nodes render non-deterministically and break `build:slides` idempotency.
- **Slide decks: author then normalize.** Author decks in Tasks 7-8, then Task 9 runs `format:code` to canonicalize `slides_db.js` and commits the result.
- **`loadMethod` already handles sub-tabs** (PR #62) — the Architectural tab's methods are reachable in tests without any helper change.
