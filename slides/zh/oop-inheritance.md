---
marp: true
theme: default
paginate: true
math: katex
title: "類別繼承"
---

## 類別繼承

繼承(Inheritance)是 OOP 的核心機制之一,允許 derived class(衍生類別)繼承 base class(基底類別)的成員與行為,以 `public` 繼承表達「is-a」關係並實現程式碼重用。

---

## 核心概念

Base class 定義共用介面(可含 `virtual` 方法);derived class 繼承後以 `override` 覆寫並擴充功能。建構順序為由上至下(base → derived),解構順序相反。

- `public` 繼承:base class 的 `public`/`protected` 成員保持原存取層級。
- `virtual` 解構子:透過 base pointer 刪除物件時確保 derived class 解構子被正確呼叫。
- 建構子鏈結(constructor chaining):建立 derived 物件時先執行 base constructor。
- `override` 關鍵字:在編譯期確認方法確實覆寫 base class 的 `virtual` 函式。

---

## 運作流程

1. 宣告 base class `Animal`,包含 `virtual speak()` 與 `virtual ~Animal()`。
2. 宣告 derived class `Dog : public Animal`,以 `override` 覆寫 `speak()`。
3. 透過 `Animal*` 指標建立 `Dog` 物件;呼叫 `speak()` 透過 vtable 動態分派。
4. `delete` 時先執行 `Dog::~Dog()`,再執行 `Animal::~Animal()`。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 446.344px; background-color: transparent;" viewBox="0 0 446.34375 270" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M160.391,98.733L150.84,104.778C141.289,110.822,122.188,122.911,112.637,132.456C103.086,142,103.086,149,103.086,152.5L103.086,156" id="my-svg-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTYwLjM5MDYyNSwieSI6OTguNzMzMDAzNzA4MjgxODN9LHsieCI6MTAzLjA4NTkzNzUsInkiOjEzNX0seyJ4IjoxMDMuMDg1OTM3NSwieSI6MTYwfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M285.953,98.733L295.504,104.778C305.055,110.822,324.156,122.911,333.707,132.456C343.258,142,343.258,149,343.258,152.5L343.258,156" id="my-svg-L_A_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_C_0" data-points="W3sieCI6Mjg1Ljk1MzEyNSwieSI6OTguNzMzMDAzNzA4MjgxODN9LHsieCI6MzQzLjI1NzgxMjUsInkiOjEzNX0seyJ4IjozNDMuMjU3ODEyNSwieSI6MTYwfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_A_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-A-0" data-look="classic" transform="translate(223.171875, 59)"><rect class="basic label-container" style="" x="-62.78125" y="-51" width="125.5625" height="102"/><g class="label" style="" transform="translate(-32.78125, -36)"><rect/><foreignObject width="65.5625" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Animal<br />+ speak()<br />+ dtor</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-1" data-look="classic" transform="translate(103.0859375, 211)"><rect class="basic label-container" style="" x="-95.0859375" y="-51" width="190.171875" height="102"/><g class="label" style="" transform="translate(-65.0859375, -36)"><rect/><foreignObject width="130.171875" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Dog<br />+ speak() override<br />+ dtor override</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-3" data-look="classic" transform="translate(343.2578125, 211)"><rect class="basic label-container" style="" x="-95.0859375" y="-51" width="190.171875" height="102"/><g class="label" style="" transform="translate(-65.0859375, -36)"><rect/><foreignObject width="130.171875" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Cat<br />+ speak() override<br />+ dtor override</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 類別階層示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160"><g font-family="sans-serif" font-size="12"><rect x="100" y="10" width="120" height="50" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="160" y="30" text-anchor="middle" font-weight="bold">Animal</text><text x="160" y="46" text-anchor="middle" font-size="11">+ speak() virtual</text><rect x="20" y="100" width="110" height="50" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="75" y="120" text-anchor="middle" font-weight="bold">Dog</text><text x="75" y="136" text-anchor="middle" font-size="11">+ speak() override</text><rect x="190" y="100" width="110" height="50" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="245" y="120" text-anchor="middle" font-weight="bold">Cat</text><text x="245" y="136" text-anchor="middle" font-size="11">+ speak() override</text><line x1="75" y1="100" x2="148" y2="63" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr)"/><line x1="245" y1="100" x2="172" y2="63" stroke="#64748b" stroke-width="1.5" marker-end="url(#arr)"/><defs><marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L0,10 L9,5 z" fill="#ffffff" stroke="#64748b" stroke-width="1"/></marker></defs></g></svg>

> 空心三角形箭頭由 derived class 指向 base class,代表「is-a」繼承關係。`Dog` 與 `Cat` 均為 `Animal`,可透過 `Animal*` 統一操作。

---

## 繼承存取規則

| Base 成員 | public 繼承 | protected 繼承 | private 繼承 |
| --- | --- | --- | --- |
| `public` | `public` | `protected` | `private` |
| `protected` | `protected` | `protected` | `private` |
| `private` | 不可存取 | 不可存取 | 不可存取 |

$$D \subseteq B \implies \forall\, b \in B,\; d \in D :\; d.\text{is-a}(b)$$

`public` 繼承嚴格滿足 Liskov Substitution Principle(LSP):derived 物件可在任何需要 base 物件之處替代使用。

---

## 程式碼

```cpp
class Animal {
public:
    Animal() { cout << "Animal constructor" << endl; }
    virtual ~Animal() { cout << "Animal destructor" << endl; }

    virtual void speak() { cout << "Animal sound" << endl; }
};

class Dog : public Animal {
public:
    Dog() { cout << "Dog constructor" << endl; }
    ~Dog() override { cout << "Dog destructor" << endl; }

    void speak() override { cout << "Woof" << endl; }
};

int main() {
    Animal* a = new Dog(); // is-a: Dog is an Animal
    a->speak();            // calls Dog::speak via vtable
    delete a;              // Dog::~Dog then Animal::~Animal
}
```

---

## 優缺點與使用時機

- 優點:程式碼重用 — derived class 自動取得 base class 所有非私有成員。
- 優點:多型基礎 — `virtual` 方法搭配繼承實現執行期動態分派。
- 缺點:深層繼承鏈(> 3 層)增加理解與維護難度,易形成脆弱基底類別問題。
- 缺點:濫用繼承可能違反 LSP;應優先考慮組合(composition over inheritance)。
- 適用:確實存在「is-a」語意的場景,如 Animal/Dog/Cat、Shape/Circle/Rectangle。

---

## 小結

- 繼承以「is-a」關係建立類別階層,實現程式碼重用與多型。
- `virtual` 解構子是使用 base pointer 管理 derived 物件的必要條件。
- `public` 繼承遵守 LSP;`protected`/`private` 繼承則為實作繼承。
- 建構順序 base → derived;解構順序 derived → base。
