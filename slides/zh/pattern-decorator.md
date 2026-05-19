---
marp: true
theme: default
paginate: true
math: katex
title: "Decorator 模式"
---

## Decorator 模式

Decorator 是一種 Structural 設計模式,動態地為物件附加額外職責,提供比繼承更靈活的功能擴展方式——裝飾者與被裝飾者實作相同介面,可任意鏈式組合。

---

## 核心概念

`Coffee` 介面是共用合約。`SimpleCoffee` 是基本實作。`CoffeeDecorator` 持有 `shared_ptr<Coffee>` 並實作相同介面,以組合包裝並委派呼叫,再疊加自己的行為。

- Component interface(`Coffee`):宣告 `getDescription()` 和 `getCost()`。
- Concrete Component(`SimpleCoffee`):無裝飾的原始物件。
- Decorator base(`CoffeeDecorator`):實作 `Coffee`,持有被包裝物件的指標。
- Concrete Decorators(`MilkDecorator`, `SugarDecorator`, `WhippedCreamDecorator`):各自疊加描述與費用。

---

## 運作流程

1. 建立基本 `SimpleCoffee` 物件(描述:"Simple Coffee",費用:$2.00)。
2. 以 `MilkDecorator` 包裝,呼叫 `getDescription()` 回傳 "Simple Coffee + Milk",費用增加 $0.50。
3. 再以 `SugarDecorator` 包裝,描述繼續追加 "+ Sugar",費用再加 $0.25。
4. 可繼續疊加任意 Decorator;每次呼叫都透過鏈式委派累積結果。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1418.08px; background-color: transparent;" viewBox="0 0 1418.078125 94" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M163.344,47L174.479,47C185.615,47,207.885,47,229.49,47C251.094,47,272.031,47,282.5,47L292.969,47" id="my-svg-L_SC_M_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SC_M_0" data-points="W3sieCI6MTYzLjM0Mzc1LCJ5Ijo0N30seyJ4IjoyMzAuMTU2MjUsInkiOjQ3fSx7IngiOjI5Ni45Njg3NSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M456.5,47L467.635,47C478.771,47,501.042,47,522.646,47C544.25,47,565.188,47,575.656,47L586.125,47" id="my-svg-L_M_S_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_M_S_0" data-points="W3sieCI6NDU2LjUsInkiOjQ3fSx7IngiOjUyMy4zMTI1LCJ5Ijo0N30seyJ4Ijo1OTAuMTI1LCJ5Ijo0N31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M760.047,47L771.182,47C782.318,47,804.589,47,826.193,47C847.797,47,868.734,47,879.203,47L889.672,47" id="my-svg-L_S_W_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_S_W_0" data-points="W3sieCI6NzYwLjA0Njg3NSwieSI6NDd9LHsieCI6ODI2Ljg1OTM3NSwieSI6NDd9LHsieCI6ODkzLjY3MTg3NSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M1133.109,47L1147.551,47C1161.992,47,1190.875,47,1219.091,47C1247.307,47,1274.857,47,1288.632,47L1302.406,47" id="my-svg-L_W_R_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_W_R_0" data-points="W3sieCI6MTEzMy4xMDkzNzUsInkiOjQ3fSx7IngiOjEyMTkuNzU3ODEyNSwieSI6NDd9LHsieCI6MTMwNi40MDYyNSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(230.15625, 47)"><g class="label" data-id="L_SC_M_0" transform="translate(-41.8125, -12)"><foreignObject width="83.625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>wrapped by</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(523.3125, 47)"><g class="label" data-id="L_M_S_0" transform="translate(-41.8125, -12)"><foreignObject width="83.625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>wrapped by</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(826.859375, 47)"><g class="label" data-id="L_S_W_0" transform="translate(-41.8125, -12)"><foreignObject width="83.625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>wrapped by</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1219.7578125, 47)"><g class="label" data-id="L_W_R_0" transform="translate(-61.6484375, -12)"><foreignObject width="123.296875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>getCost() = $3.50</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-SC-0" data-look="classic" transform="translate(85.671875, 47)"><rect class="basic label-container" style="" x="-77.671875" y="-39" width="155.34375" height="78"/><g class="label" style="" transform="translate(-47.671875, -24)"><rect/><foreignObject width="95.34375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>SimpleCoffee<br />$2.00</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-M-1" data-look="classic" transform="translate(376.734375, 47)"><rect class="basic label-container" style="" x="-79.765625" y="-39" width="159.53125" height="78"/><g class="label" style="" transform="translate(-49.765625, -24)"><rect/><foreignObject width="99.53125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>MilkDecorator<br />+$0.50</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-S-3" data-look="classic" transform="translate(675.0859375, 47)"><rect class="basic label-container" style="" x="-84.9609375" y="-39" width="169.921875" height="78"/><g class="label" style="" transform="translate(-54.9609375, -24)"><rect/><foreignObject width="109.921875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>SugarDecorator<br />+$0.25</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-W-5" data-look="classic" transform="translate(1013.390625, 47)"><rect class="basic label-container" style="" x="-119.71875" y="-39" width="239.4375" height="78"/><g class="label" style="" transform="translate(-89.71875, -24)"><rect/><foreignObject width="179.4375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>WhippedCreamDecorator<br />+$0.75</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-R-7" data-look="classic" transform="translate(1358.2421875, 47)"><rect class="basic label-container" style="" x="-51.8359375" y="-27" width="103.671875" height="54"/><g class="label" style="" transform="translate(-21.8359375, -12)"><rect/><foreignObject width="43.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Result</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML 結構示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 190" width="400" height="190"><g font-family="sans-serif" font-size="11"><rect x="140" y="10" width="120" height="45" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="200" y="28" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">Coffee</text><text x="200" y="43" text-anchor="middle" fill="#374151">+ getDescription()</text><text x="200" y="55" text-anchor="middle" fill="#374151">+ getCost()</text><rect x="30" y="95" width="110" height="35" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="85" y="116" text-anchor="middle" font-weight="bold" fill="#166534">SimpleCoffee</text><rect x="240" y="95" width="130" height="55" rx="4" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/><text x="305" y="113" text-anchor="middle" font-weight="bold" fill="#92400e">CoffeeDecorator</text><text x="305" y="128" text-anchor="middle" fill="#374151">- m_coffee: Coffee*</text><text x="305" y="143" text-anchor="middle" fill="#374151">+ getDescription()</text><line x1="85" y1="95" x2="180" y2="57" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="305" y1="95" x2="220" y2="57" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="305" y1="57" x2="305" y2="95" stroke="#ca8a04" stroke-width="1" stroke-dasharray="2,2"/><rect x="160" y="165" width="90" height="20" rx="3" fill="#fef9c3" stroke="#ca8a04" stroke-width="1"/><text x="205" y="179" text-anchor="middle" font-size="10" fill="#92400e">MilkDecorator …</text><line x1="305" y1="150" x2="205" y2="165" stroke="#ca8a04" stroke-width="1.2"/></g></svg>

> Decorator 與 Component 共用相同介面;Decorator base 持有 Component 指標形成自引用結構。具體裝飾者繼承 Decorator base,疊加行為後委派給內部物件。

---

## 模式屬性

| 屬性 | 說明 |
| --- | --- |
| GoF 分類 | Structural(結構型) |
| 參與者 | Component, ConcreteComponent, Decorator, ConcreteDecorator |
| 意圖 | 動態附加職責,比繼承更靈活 |
| 鏈式深度 $n$ | 呼叫時間 $O(n)$,空間 $O(n)$ |
| 原則 | Composition over Inheritance |

$$\text{cost}(n) = \text{cost}_0 + \sum_{i=1}^{n} \Delta_i$$

鏈式 Decorator 的總成本等於基本元件成本加上所有裝飾者疊加的增量之和。

---

## 程式碼

```cpp
class Coffee {
public:
    virtual ~Coffee() {}
    virtual string getDescription() const = 0;
    virtual double getCost() const = 0;
};

class SimpleCoffee : public Coffee {
public:
    string getDescription() const override { return "Simple Coffee"; }
    double getCost() const override { return 2.00; }
};

class CoffeeDecorator : public Coffee {
protected:
    shared_ptr<Coffee> m_coffee;
public:
    CoffeeDecorator(shared_ptr<Coffee> c) : m_coffee(c) {}
};

class MilkDecorator : public CoffeeDecorator {
public:
    MilkDecorator(shared_ptr<Coffee> c) : CoffeeDecorator(c) {}
    string getDescription() const override {
        return m_coffee->getDescription() + " + Milk";
    }
    double getCost() const override { return m_coffee->getCost() + 0.50; }
};

int main() {
    shared_ptr<Coffee> c = make_shared<SimpleCoffee>();
    c = make_shared<MilkDecorator>(c);
    cout << c->getDescription() << " $" << c->getCost() << endl;
}
```

---

## 優缺點與使用時機

- 優點:執行期動態組合,比繼承子類別更靈活,避免類別爆炸。
- 優點:遵循 Single Responsibility Principle,每個 Decorator 只負責一個附加功能。
- 優點:符合 Open/Closed Principle — 新增功能增加 Decorator,不修改既有類別。
- 缺點:大量小 Decorator 類別使系統結構複雜,除錯時難以追蹤呼叫鏈。
- 適用:I/O 串流包裝(如 `BufferedReader`)、GUI 元件裝飾、計費/日誌/認證等橫切關注點。

---

## 小結

- Decorator 是 Structural 模式:Decorator 與 Component 共用介面,以組合實現動態職責附加。
- 鏈式組合($n$ 個 Decorator)的呼叫時間為 $O(n)$。
- 核心原則:Composition over Inheritance — 組合比繼承更靈活且不破壞封裝。
- 典型應用:C++ `std::istream`/`std::ostream` 家族的各層包裝均採用 Decorator 思想。
