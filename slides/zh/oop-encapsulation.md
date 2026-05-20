---
marp: true
theme: default
paginate: true
math: katex
title: "封裝與存取控制"
category: "OOP Concepts"
---

## 封裝與存取控制

封裝(Encapsulation)將資料與操作資料的方法綁定在同一個類別中,以 `private`/`protected`/`public` 存取修飾子隱藏實作細節,僅對外暴露受控的 `public` 介面。

---

## 核心概念

`BankAccount` 範例展示典型封裝:`balance` 設為 `private`,外部只能透過 `deposit()`/`withdraw()`/`getBalance()` 操作,確保不變式(invariant)始終成立。

- `public`:類別契約的一部分,任何程式碼均可存取。
- `protected`:僅允許類別本身及 derived class 存取;通常用於供子類別覆寫的 helper 方法。
- `private`:僅類別本身可存取;保護資料不受外部直接修改。
- `const` 成員函式:不可修改物件狀態,提供唯讀存取保證。
- `mutex` + `lock_guard`:在 `deposit`/`withdraw` 中保護共享狀態的執行緒安全。

---

## 運作流程

1. 外部呼叫 `account.deposit(200)`;進入 `public` 方法,加上 `lock_guard` 鎖定。
2. 方法內部直接存取 `private` 成員 `balance`,完成業務邏輯後釋放鎖。
3. `withdraw` 呼叫 `protected` 方法 `canWithdraw()` 及 `private` 方法 `log()`,外部無法直接呼叫。
4. 外部只能透過 `getBalance()` (`public const`) 讀取餘額,無法直接修改。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 940.938px; background-color: transparent;" viewBox="0 0 940.9375 198" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M168.359,93L189.193,93C210.026,93,251.693,93,292.693,93C333.693,93,374.026,93,394.193,93L414.359,93" id="my-svg-L_EXT_PUB_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_EXT_PUB_0" data-points="W3sieCI6MTY4LjM1OTM3NSwieSI6OTN9LHsieCI6MjkzLjM1OTM3NSwieSI6OTN9LHsieCI6NDE4LjM1OTM3NSwieSI6OTN9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M564.693,66L576.032,60.833C587.371,55.667,610.049,45.333,628.53,40.167C647.01,35,661.294,35,668.436,35L675.578,35" id="my-svg-L_PUB_PROT_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_PUB_PROT_0" data-points="W3sieCI6NTY0LjY5Mjc1MzIzMjc1ODYsInkiOjY2fSx7IngiOjYzMi43MjY1NjI1LCJ5IjozNX0seyJ4Ijo2NzkuNTc4MTI1LCJ5IjozNX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M564.693,120L576.032,125.167C587.371,130.333,610.049,140.667,627.423,145.833C644.797,151,656.867,151,662.902,151L668.938,151" id="my-svg-L_PUB_PRIV_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_PUB_PRIV_0" data-points="W3sieCI6NTY0LjY5Mjc1MzIzMjc1ODYsInkiOjEyMH0seyJ4Ijo2MzIuNzI2NTYyNSwieSI6MTUxfSx7IngiOjY3Mi45Mzc1LCJ5IjoxNTF9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(293.359375, 93)"><g class="label" data-id="L_EXT_PUB_0" transform="translate(-100, -24)"><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="edgeLabel"><p>deposit / withdraw / getBalance</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(632.7265625, 35)"><g class="label" data-id="L_PUB_PROT_0" transform="translate(-15.2109375, -12)"><foreignObject width="30.421875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>uses</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(632.7265625, 151)"><g class="label" data-id="L_PUB_PRIV_0" transform="translate(-15.2109375, -12)"><foreignObject width="30.421875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>uses</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-EXT-0" data-look="classic" transform="translate(88.1796875, 93)"><rect class="basic label-container" style="" x="-80.1796875" y="-27" width="160.359375" height="54"/><g class="label" style="" transform="translate(-50.1796875, -12)"><rect/><foreignObject width="100.359375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>External Code</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-PUB-1" data-look="classic" transform="translate(505.4375, 93)"><rect class="basic label-container" style="" x="-87.078125" y="-27" width="174.15625" height="54"/><g class="label" style="" transform="translate(-57.078125, -12)"><rect/><foreignObject width="114.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>public interface</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-PROT-3" data-look="classic" transform="translate(802.9375, 35)"><rect class="basic label-container" style="" x="-123.359375" y="-27" width="246.71875" height="54"/><g class="label" style="" transform="translate(-93.359375, -12)"><rect/><foreignObject width="186.71875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>protected: canWithdraw()</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-PRIV-5" data-look="classic" transform="translate(802.9375, 151)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"/><g class="label" style="" transform="translate(-100, -24)"><rect/><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>private: balance / log() / mutex</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 封裝膠囊示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 170" width="400" height="170"><g font-family="sans-serif" font-size="11"><ellipse cx="175" cy="85" rx="150" ry="75" fill="#f0f9ff" stroke="#0ea5e9" stroke-width="2"/><ellipse cx="175" cy="85" rx="100" ry="48" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/><ellipse cx="175" cy="85" rx="50" ry="24" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/><text x="175" y="89" text-anchor="middle" font-weight="bold" fill="#1e3a8a" font-size="12">private</text><text x="175" y="49" text-anchor="middle" fill="#075985" font-size="11">protected</text><text x="175" y="22" text-anchor="middle" fill="#0369a1" font-size="11">public interface</text><text x="360" y="89" text-anchor="middle" fill="#64748b" font-size="10">external</text><line x1="345" y1="86" x2="328" y2="86" stroke="#64748b" stroke-width="1" marker-end="url(#ext)"/><defs><marker id="ext" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#64748b"/></marker></defs></g></svg>

> 封裝如同一個膠囊:最外層 `public` 介面供外部呼叫;中層 `protected` 僅供繼承;最內層 `private` 資料與邏輯完全隱藏。

---

## 存取層級與可見範圍

| 存取修飾子 | 類別本身 | Derived Class | 外部程式碼 |
| --- | --- | --- | --- |
| `public` | 可 | 可 | 可 |
| `protected` | 可 | 可 | 否 |
| `private` | 可 | 否 | 否 |
| `friend` | 可 | 否(不繼承) | 例外授權 |

$$\text{Invariant preserved} \iff \forall\, f \in public(C) : \text{post}(f) \models \text{inv}(C)$$

封裝的核心目標:透過限制直接存取,確保每次 `public` 方法呼叫後物件狀態仍滿足所有不變式。

---

## 程式碼

```cpp
class BankAccount {
public:
    explicit BankAccount(double initialBalance) : balance(initialBalance) {}

    void deposit(double amount) {
        lock_guard<mutex> guard(accountLock);
        if (amount > 0) {
            balance += amount;
        }
    }

    bool withdraw(double amount) {
        lock_guard<mutex> guard(accountLock);
        if (canWithdraw(amount)) {
            balance -= amount;
            log("withdraw", amount);
            return true;
        }
        return false;
    }

    double getBalance() const { return balance; } // read-only

protected:
    bool canWithdraw(double amount) const { return amount > 0 && amount <= balance; }

private:
    void log(const string& type, double amount) const {
        cout << "Log: " << type << " " << amount << endl;
    }
    double balance;
    mutable mutex accountLock;
};
```

---

## 優缺點與使用時機

- 優點:不變式保護 — `private` 成員只能透過受控方法修改,防止非法狀態。
- 優點:介面穩定性 — 內部實作可自由重構,只要 `public` 介面不變就不影響呼叫端。
- 優點:執行緒安全 — 可在 `public` 方法入口集中加鎖,外部無法繞過。
- 缺點:過度封裝可能導致冗長的 getter/setter,增加樣板程式碼。
- 適用:任何需要保護內部狀態或確保執行緒安全的類別,如帳戶、快取、連線池。

---

## 小結

- 封裝 = 資料隱藏 + 受控存取:以存取修飾子劃定邊界。
- `private` 保護不變式;`protected` 支援繼承擴充;`public` 定義契約。
- 存取控制在編譯期強制執行,執行期無額外開銷。
- 良好封裝是可維護、可測試、執行緒安全程式碼的基礎。
