# OOP Concepts Expansion — 設計文件

## 目標與背景

dsvisual 的 OOP Concepts 分類目前有 3 個方法(Class Inheritance、Polymorphism (Virtual)、Encapsulation & Access)。本 spec 補上 3 個方法,讓 OOP 教學更完整:

- **Abstraction** —— 補齊「OOP 四大支柱」(目前只有 4 缺 1)。
- **Ad-hoc Polymorphism** 與 **Parametric Polymorphism** —— 與既有的 Polymorphism (Virtual)(子型別多型)一起,補齊「三種多型」。

本 spec 同時為新簡報加入 Go 語言對照(名義 vs 結構化型別、subtype 不需繼承),並順手更新既有 `oop-polymorphism` 簡報加一句 Go 對照。

執行方法論:brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch。

## 方法清單

新增 **3 個方法**,附加在 OOP 分類 `oop-encapsulation` 之後(僅附加,不重排既有項目):

| id | 標題 | C++ 檔 | visualizer | controls |
|---|---|---|---|---|
| `oop-abstraction` | Abstraction (Abstract Classes) | `oop_abstraction.cpp` | `oop` | `oop` |
| `oop-adhoc` | Ad-hoc Polymorphism (Overloading) | `oop_adhoc.cpp` | `oop` | `oop` |
| `oop-templates` | Parametric Polymorphism (Templates) | `oop_templates.cpp` | `oop` | `oop` |

最終 OOP 分類順序:Inheritance → Polymorphism → Encapsulation → Abstraction → Ad-hoc → Templates。

標題刻意讓「三種多型」清楚:既有 Polymorphism (Virtual) = 子型別多型,新增 Ad-hoc 與 Parametric 補齊另外兩種。

## 架構決策

**採方案 A:沿用既有 OOP 靜態檢視模式。** OOP 分類現有 3 個方法都用 `index.html` 中的靜態 `<div id="oop-*-view" class="oop-view hidden">` 骨架(內含 `<h3>` 標題、`<svg id="oop-*-svg">`、legend),由 JS 以程式繪製 SVG 圖,經 `renderOOP()` 依 `oopModeSelect.value` dispatch,共用 `oop-actions` 的「Visualize Concept」按鈕。3 個新方法照此模式,維持整個分類內部一致。

不採動態 `acquireDynamicVizHost()` 模式 —— 那會讓 OOP 分類變成靜態 / 動態兩種機制並存,內部不一致。OOP 概念本來就適合用 SVG 類別圖呈現,靜態檢視模式完全合適。

## C++ 檔案

### `oop_abstraction.cpp`

抽象基底類別 `Shape`,含純虛擬函式 `virtual double area() const = 0;`(以及虛擬解構子)。具體衍生類別 `Circle`、`Rectangle` 各自 `override` 實作 `area()`。`main()` 以 `Shape*`(或 `vector<Shape*>`)多型呼叫 `area()`。以註解標明 `Shape s;` 會編譯失敗(抽象類別不可實例化)。

### `oop_adhoc.cpp`

函式多載:`print(int)`、`print(double)`、`print(const string&)` 三個同名但簽章不同的函式。運算子多載:`struct Vector2D` 含 `Vector2D operator+(const Vector2D&) const`。`main()` 示範同一個 `print` 呼叫名因引數型別在編譯期解析到不同版本,以及 `v1 + v2`。

### `oop_templates.cpp`

函式樣板 `template<typename T> T maximum(T a, T b)`,類別樣板 `template<typename T> class Box`(持有一個 `T value`,含 `get()` / `set()`)。`main()` 以 `int`、`double`、`string` 多種型別實例化並使用。

三個檔案皆須通過 `g++ -std=c++17 -fsyntax-only` 編譯閘。

## 視覺化器

每個新方法在 `index.html` 的 `#oop-visualization` 內新增一個檢視區塊,結構比照既有 `oop-inheritance-view`:一個 `<h3>` 標題、一個 `<svg id="oop-*-svg">`、一個 legend `<div>`。`renderOOP()` 依 `oopModeSelect.value` 新增 3 個 dispatch 分支,呼叫對應的新 render 函式。風格比照 `renderOOPInheritance()`(以 `document.createElementNS` 程式繪製 SVG 方框、文字、連線)。

### `renderOOPAbstraction()` — svg `oop-abstraction-svg`

抽象基底類別 `Shape` 方框以虛線邊框 + 斜體類別名 + «abstract» 標記畫出,內容顯示純虛擬 `+ area() = 0`。兩個具體衍生方框 `Circle`、`Rectangle`,各顯示 `+ area() override`,繼承箭頭由衍生指向基底。加上註記:`Shape s;` ✗(不可實例化)對比 `Shape* p = new Circle();` ✓。

### `renderOOPAdhoc()` — svg `oop-adhoc-svg`

左側三個呼叫點 `print(42)`、`print(3.14)`、`print("hi")`;編譯期解析箭頭分別指向右側三個獨立函式方框 `print(int)`、`print(double)`、`print(string)`。下方另一小區塊示範運算子多載:`v1 + v2` → `Vector2D::operator+`。標註「編譯期由引數的靜態型別決定」。

### `renderOOPTemplates()` — svg `oop-templates-svg`

頂端一個樣板「藍圖」方框 `template<typename T> class Box`(虛線高亮)。箭頭往下指向三個具體實例化方框 `Box<int>`、`Box<double>`、`Box<string>`。標註「編譯器為每個用到的型別生成一個具體類別」。

## 整合檢查清單(每個方法)

1. `build_db.js` 加入 `.cpp → code 常數` mapping(`codeOOPAbstraction` / `codeOOPAdhoc` / `codeOOPTemplates`)——須先於 `.cpp` 建立。
2. `METHOD_GROUPS` 的 `oop` group 附加條目。
3. `getCodeForMethod` 加入 mapping。
4. `index.html` 的 `#oop-visualization` 內新增 `<div id="oop-*-view" class="oop-view hidden">` 檢視區塊。
5. `oopModeSelect`(下拉選單)新增 3 個 `<option>`:`abstraction`、`adhoc`、`templates`。
6. `updateLayout()` 的 `currentMode.includes('oop-')` 分支新增 3 個 `else if`(設 `codeTitle` / `codeDisplay`、顯示對應檢視、設 `oopModeSelect.value`)。
7. `renderOOP()` 新增 3 個 dispatch 分支。
8. 在 `app.js` 實作 3 個 render 函式。
9. 新增的 CSS(抽象類別虛線方框樣式等)附加至 `style.css` 末端,沿用既有 `oop-*` 命名前綴。

## 簡報

**3 份新雙語(zh/en)8 頁簡報**,結構同既有參考 deck:

1. 概述(paragraph)
2. 核心概念(paragraph + bullets)
3. 運作流程(steps + mermaid)
4. 示意圖(svg + note)
5. 成本與取捨(table + math/說明)
6. 程式碼(code,`lang: cpp`)
7. 優缺點與使用時機(bullets)
8. 小結(bullets)

OOP 概念沒有演算法式 big-O,第 5 頁改框為「執行期/空間成本與取捨」:
- `oop-abstraction`:虛擬呼叫一次 vtable 指標間接;抽象類別本身零額外成本。
- `oop-adhoc`:編譯期解析,零執行期成本;多載不影響執行期效能。
- `oop-templates`:每個型別實例化生成一份具體程式碼(code size 增長 / code bloat),但零執行期成本、無虛擬間接。

**各 deck 的 Go 對照:**
- `oop-abstraction`:純抽象類別 = C++ 的 interface(名義型別);對照 Go interface 的結構化(鴨子)型別;兩者皆屬 subtype polymorphism。
- `oop-adhoc`:明確點出 ad-hoc 是編譯期多載,「這不是 Go interface —— Go interface 是執行期 subtype 分派」。
- `oop-templates`:templates = 編譯期結構化鴨子型別,精神上最接近 Go interface 的結構化;提及 C++20 `concepts`。**小結頁放入三種多型對照表**:

| 多型 | 決定時機 | C++ | Go |
|---|---|---|---|
| Subtype | 執行期動態分派 | 抽象類別 + 繼承(名義) | interface(結構化,無繼承) |
| Ad-hoc | 編譯期,看引數靜態型別 | 函式/運算子多載 | 不支援(無函式多載) |
| Parametric | 編譯期,結構化鴨子型別 | templates / C++20 concepts | generics(Go 1.18+) |

**更新既有 `oop-polymorphism` 簡報:** 在核心概念或小結頁加一句 Go 對照 —— Polymorphism (Virtual) 是執行期 subtype 動態分派;Go interface 是其「結構化子型別、無繼承」的等價物。這是本 spec 唯一更動既有簡報之處。

簡報的 mermaid 須用 `flowchart`(非裸 `graph`),不可用 `([...])` stadium 節點(渲染不確定,會破壞 `build:slides` 冪等性 —— 用矩形 `[...]` 節點);LaTeX 反斜線在 JS 字串中寫成 `\\`;中文用全形標點。

## 測試

- 每個新方法 1 個 Playwright render 測試(共 3 個),比照既有 OOP 測試模式(載入方法 → 檢視渲染 → 「Visualize Concept」demo 按鈕可運作 → 對應 `oop-*-svg` 有繪製內容)。
- 最終 `npm run test:all`:111 → **114**(44 unit + 70 Playwright)。
- OOP 用靜態檢視、非動態 host,無跨導覽容器摧毀疑慮,無需擴充回歸測試。
- 冪等性:`npm run format:code` 與 `npm run build:slides` 重跑後 `git status` 乾淨。

## 不在範圍內

- Composition over inheritance(本輪未選入)。
- 其他 Spec 3 / Spec 4 的項目。
- OOP 視覺化器改用動態 host 模式(刻意維持靜態檢視一致性)。
- 既有 `oop-inheritance` / `oop-encapsulation` 簡報的內容變更(只動 `oop-polymorphism` 加 Go 對照)。

## 預期產出

3 個新方法、3 個 `.cpp` 檔、3 份新雙語簡報、1 份既有簡報更新、3 個新 Playwright 測試。
