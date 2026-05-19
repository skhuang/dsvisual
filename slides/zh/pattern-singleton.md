---
marp: true
theme: default
paginate: true
math: katex
title: "Singleton 模式"
---

## Singleton 模式

Singleton 是一種 Creational 設計模式,確保一個類別在整個程式執行期間只存在唯一一個實例,並提供全域存取點。

---

## 核心概念

以 `private` 建構子防止外部直接建立物件;以 `static` 成員指標儲存唯一實例;透過 `static getInstance()` 實現延遲初始化(lazy initialization),並以 `mutex` 保護執行緒安全。

- Private constructor:阻止外部以 `new` 或直接宣告建立物件。
- Copy constructor / assignment operator deleted:防止複製產生第二份實例。
- Static member pointer (`m_instance`):指向唯一實例,初始為 `nullptr`。
- `getInstance()` 搭配 `lock_guard`:雙重保護確保多執行緒安全。

---

## 運作流程

1. 第一次呼叫 `Singleton::getInstance()`:進入臨界區,`m_instance == nullptr` 成立,建立唯一實例。
2. 後續呼叫:同樣進入臨界區,但 `m_instance != nullptr`,直接回傳既有指標。
3. 所有呼叫者持有相同指標,對實例的修改對全域可見。
4. 程式結束時解構子被呼叫,清理單一實例資源。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 691.984px; background-color: transparent;" viewBox="0 0 691.984375 175.59375" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M123.875,35.797L135.931,35.797C147.987,35.797,172.099,35.797,198.968,40.86C225.837,45.923,255.463,56.05,270.276,61.113L285.089,66.176" id="my-svg-L_C1_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C1_G_0" data-points="W3sieCI6MTIzLjg3NSwieSI6MzUuNzk2ODc1fSx7IngiOjE5Ni4yMTA5Mzc1LCJ5IjozNS43OTY4NzV9LHsieCI6Mjg4Ljg3NDAyMTA4Mjg5NjQsInkiOjY3LjQ2OTcyODkxNzEwMzZ9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M123.875,139.797L135.931,139.797C147.987,139.797,172.099,139.797,198.968,134.734C225.837,129.671,255.463,119.544,270.276,114.481L285.089,109.418" id="my-svg-L_C2_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C2_G_0" data-points="W3sieCI6MTIzLjg3NSwieSI6MTM5Ljc5Njg3NX0seyJ4IjoxOTYuMjEwOTM3NSwieSI6MTM5Ljc5Njg3NX0seyJ4IjoyODguODc0MDIxMDgyODk2NCwieSI6MTA4LjEyNDAyMTA4Mjg5NjR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M417.606,77.262L430.169,75.351C442.732,73.44,467.858,69.619,490.572,69.453C513.285,69.288,533.585,72.779,543.736,74.525L553.886,76.271" id="my-svg-L_G_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_G_I_0" data-points="W3sieCI6NDE3LjYwNTc5MTQzMjI1NTA1LCJ5Ijo3Ny4yNjIwNDE0MzIyNTUwNX0seyJ4Ijo0OTIuOTg0Mzc1LCJ5Ijo2NS43OTY4NzV9LHsieCI6NTU3LjgyODEyNSwieSI6NzYuOTQ4NzAxMDY1NzEzOTN9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M417.606,98.332L430.169,100.243C442.732,102.153,467.858,105.975,490.572,106.14C513.285,106.306,533.585,102.814,543.736,101.069L553.886,99.323" id="my-svg-L_G_I_2" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_G_I_2" data-points="W3sieCI6NDE3LjYwNTc5MTQzMjI1NTA1LCJ5Ijo5OC4zMzE3MDg1Njc3NDQ5NX0seyJ4Ijo0OTIuOTg0Mzc1LCJ5IjoxMDkuNzk2ODc1fSx7IngiOjU1Ny44MjgxMjUsInkiOjk4LjY0NTA0ODkzNDI4NjA3fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(196.2109375, 35.796875)"><g class="label" data-id="L_C1_G_0" transform="translate(-47.3359375, -12)"><foreignObject width="94.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>getInstance()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(196.2109375, 139.796875)"><g class="label" data-id="L_C2_G_0" transform="translate(-47.3359375, -12)"><foreignObject width="94.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>getInstance()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(487.81887, 66.58255)"><g class="label" data-id="L_G_I_0" transform="translate(-39.84375, -12)"><foreignObject width="79.6875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>Yes: create</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(487.81887, 109.0112)"><g class="label" data-id="L_G_I_2" transform="translate(-37.2421875, -12)"><foreignObject width="74.484375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>No: return</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-C1-0" data-look="classic" transform="translate(65.9375, 35.796875)"><rect class="basic label-container" style="" x="-57.9375" y="-27" width="115.875" height="54"/><g class="label" style="" transform="translate(-27.9375, -12)"><rect/><foreignObject width="55.875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Client 1</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-G-1" data-look="classic" transform="translate(348.34375, 87.796875)"><polygon points="79.796875,0 159.59375,-79.796875 79.796875,-159.59375 0,-79.796875" class="label-container" transform="translate(-79.296875, 79.796875)"/><g class="label" style="" transform="translate(-40.796875, -24)"><rect/><foreignObject width="81.59375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>m_instance<br />== nullptr?</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C2-2" data-look="classic" transform="translate(65.9375, 139.796875)"><rect class="basic label-container" style="" x="-57.9375" y="-27" width="115.875" height="54"/><g class="label" style="" transform="translate(-27.9375, -12)"><rect/><foreignObject width="55.875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Client 2</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-I-5" data-look="classic" transform="translate(620.90625, 87.796875)"><rect class="basic label-container" style="" x="-63.078125" y="-39" width="126.15625" height="78"/><g class="label" style="" transform="translate(-33.078125, -24)"><rect/><foreignObject width="66.15625" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Singleton<br />Instance</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML 結構示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160"><g font-family="sans-serif" font-size="12"><rect x="80" y="20" width="160" height="120" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="160" y="40" text-anchor="middle" font-weight="bold" fill="#1e3a8a">Singleton</text><line x1="80" y1="48" x2="240" y2="48" stroke="#2563eb" stroke-width="1"/><text x="90" y="65" font-size="11" fill="#374151">- static m_instance: Singleton*</text><text x="90" y="80" font-size="11" fill="#374151">- static m_mutex: mutex</text><text x="90" y="95" font-size="11" fill="#374151">- m_value: int</text><line x1="80" y1="100" x2="240" y2="100" stroke="#2563eb" stroke-width="1"/><text x="90" y="115" font-size="11" fill="#374151">+ static getInstance(): Singleton*</text><text x="90" y="130" font-size="11" fill="#374151">- Singleton() [private ctor]</text><text x="160" y="155" text-anchor="middle" font-size="10" fill="#6b7280">Copy ctor &amp; operator= deleted</text></g></svg>

> `m_instance` 與 `m_mutex` 為 static 成員,儲存於靜態記憶體區,所有呼叫者共用。`getInstance()` 是唯一合法的建立/取得入口。

---

## 模式屬性

| 屬性 | 說明 |
| --- | --- |
| GoF 分類 | Creational(創建型) |
| 參與者 | Singleton 類別本身 |
| 意圖 | 確保唯一實例並提供全域存取點 |
| 初始化時機 | 延遲初始化(首次呼叫時) |
| 執行緒安全 | 需以 mutex 保護 |

$$|\{\text{instances of } C\}| = 1$$

Singleton 的核心不變式:類別 $C$ 的實例集合大小恆等於 1。

---

## 程式碼

```cpp
class Singleton {
private:
    static Singleton* m_instance;
    static mutex m_mutex;
    int m_value;

    Singleton() : m_value(0) {}

public:
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

    static Singleton* getInstance() {
        lock_guard<mutex> lock(m_mutex);
        if (m_instance == nullptr) {
            m_instance = new Singleton();
        }
        return m_instance;
    }

    void setValue(int val) { m_value = val; }
    int getValue() const { return m_value; }
};

Singleton* Singleton::m_instance = nullptr;
mutex Singleton::m_mutex;

int main() {
    Singleton* s1 = Singleton::getInstance();
    s1->setValue(42);
    Singleton* s2 = Singleton::getInstance();
    cout << (s1 == s2 ? "Same" : "Different") << endl; // Same
}
```

---

## 優缺點與使用時機

- 優點:保證全域唯一實例,避免多份物件的資源競爭或狀態不一致。
- 優點:延遲初始化節省資源,僅在真正需要時建立。
- 缺點:全域狀態使單元測試困難,需注意測試間的狀態污染。
- 缺點:隱藏依賴關係,違反顯式依賴原則(Explicit Dependency Principle)。
- 適用:Logger、設定管理器(Configuration manager)、資料庫連線池等需唯一實例的場景。

---

## 小結

- Singleton 是 Creational 模式:以 private constructor + static getInstance() 確保唯一實例。
- 延遲初始化 + mutex 保護是多執行緒環境的標準做法。
- 複製建構子與賦值運算子須明確 delete,防止意外複製。
- 謹慎使用全域狀態;現代 C++ 推薦以 Meyers Singleton(static local variable)取代裸指標版本。
