---
marp: true
theme: default
paginate: true
math: katex
title: "Adapter 模式"
---

## Adapter 模式

Adapter 是一種 Structural 設計模式,將一個類別的介面轉換成客戶端期望的另一種介面,使原本因介面不相容而無法合作的類別能夠協同工作。

---

## 核心概念

`LegacyAdapter` 實作新的 `ModernDataInterface`,內部持有 `LegacyDataSource` 物件;將客戶端對 `fetch()` 的呼叫翻譯為對 `getDataLegacy()` 的呼叫,屏蔽舊介面的差異。

- Target interface(`ModernDataInterface`):客戶端期望使用的介面。
- Adaptee(`LegacyDataSource`):存在不相容介面的既有類別。
- Adapter(`LegacyAdapter`):實作 Target,內部以組合(composition)持有 Adaptee。
- 客戶端程式碼完全不知道 Adaptee 的存在,僅與 Target 介面互動。

---

## 運作流程

1. 客戶端持有 `ModernDataInterface*` 指標,呼叫 `fetch()`。
2. `LegacyAdapter::fetch()` 被呼叫,內部呼叫 `m_legacy.getDataLegacy()`。
3. Adapter 對回傳值做必要的轉換(如格式轉換、前綴加工)後回傳。
4. 客戶端取得符合 Target 介面規格的資料,感知不到舊系統的存在。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 881.031px; background-color: transparent;" viewBox="0 0 881.03125 118" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M110.672,49.899L122.798,47.749C134.924,45.599,159.177,41.3,182.767,40.394C206.357,39.488,229.284,41.975,240.747,43.219L252.211,44.463" id="my-svg-L_Client_A_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Client_A_0" data-points="W3sieCI6MTEwLjY3MTg3NSwieSI6NDkuODk4ODkxOTY2NzU5fSx7IngiOjE4My40Mjk2ODc1LCJ5IjozN30seyJ4IjoyNTYuMTg3NSwieSI6NDQuODk0NTAxNTk5MDQ0NDI1fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M516.188,45.601L530.096,44.168C544.005,42.734,571.823,39.867,598.979,40.067C626.135,40.267,652.629,43.534,665.877,45.167L679.124,46.801" id="my-svg-L_A_L_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_L_0" data-points="W3sieCI6NTE2LjE4NzUsInkiOjQ1LjYwMTI3MzY5ODg1MDc1fSx7IngiOjU5OS42NDA2MjUsInkiOjM3fSx7IngiOjY4My4wOTM3NSwieSI6NDcuMjkwMDQyOTEwOTM3OTF9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M683.094,70.71L669.185,72.425C655.276,74.14,627.458,77.57,600.304,77.92C573.149,78.27,546.658,75.539,533.412,74.174L520.166,72.809" id="my-svg-L_L_A_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_L_A_0" data-points="W3sieCI6NjgzLjA5Mzc1LCJ5Ijo3MC43MDk5NTcwODkwNjIwOX0seyJ4Ijo1OTkuNjQwNjI1LCJ5Ijo4MX0seyJ4Ijo1MTYuMTg3NSwieSI6NzIuMzk4NzI2MzAxMTQ5MjV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M256.188,73.105L244.061,74.421C231.935,75.737,207.682,78.368,184.086,77.651C160.49,76.933,137.55,72.866,126.08,70.833L114.61,68.799" id="my-svg-L_A_Client_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_Client_0" data-points="W3sieCI6MjU2LjE4NzUsInkiOjczLjEwNTQ5ODQwMDk1NTU3fSx7IngiOjE4My40Mjk2ODc1LCJ5Ijo4MX0seyJ4IjoxMTAuNjcxODc1LCJ5Ijo2OC4xMDExMDgwMzMyNDA5OX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(183.4296875, 37)"><g class="label" data-id="L_Client_A_0" transform="translate(-24.703125, -12)"><foreignObject width="49.40625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>fetch()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(599.73487, 37.01162)"><g class="label" data-id="L_A_L_0" transform="translate(-58.453125, -12)"><foreignObject width="116.90625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>getDataLegacy()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(599.640625, 81)"><g class="label" data-id="L_L_A_0" transform="translate(-31.7109375, -12)"><foreignObject width="63.421875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>raw data</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(183.08137, 80.93825)"><g class="label" data-id="L_A_Client_0" transform="translate(-47.7578125, -12)"><foreignObject width="95.515625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>adapted data</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-Client-0" data-look="classic" transform="translate(59.3359375, 59)"><rect class="basic label-container" style="" x="-51.3359375" y="-27" width="102.671875" height="54"/><g class="label" style="" transform="translate(-21.3359375, -12)"><rect/><foreignObject width="42.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Client</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-A-1" data-look="classic" transform="translate(386.1875, 59)"><rect class="basic label-container" style="" x="-130" y="-51" width="260" height="102"/><g class="label" style="" transform="translate(-100, -36)"><rect/><foreignObject width="200" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>LegacyAdapter<br />implements ModernDataInterface</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-L-3" data-look="classic" transform="translate(778.0625, 59)"><rect class="basic label-container" style="" x="-94.96875" y="-27" width="189.9375" height="54"/><g class="label" style="" transform="translate(-64.96875, -12)"><rect/><foreignObject width="129.9375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>LegacyDataSource</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML 結構示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" width="400" height="160"><g font-family="sans-serif" font-size="11"><rect x="10" y="55" width="80" height="35" rx="4" fill="#f3f4f6" stroke="#6b7280" stroke-width="1.5"/><text x="50" y="75" text-anchor="middle" font-weight="bold">Client</text><rect x="130" y="10" width="130" height="45" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="195" y="28" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">ModernDataInterface</text><text x="195" y="44" text-anchor="middle" fill="#374151">+ fetch()</text><text x="195" y="55" text-anchor="middle" fill="#374151">+ getFormat()</text><rect x="130" y="95" width="130" height="55" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="195" y="113" text-anchor="middle" font-weight="bold" fill="#166534">LegacyAdapter</text><text x="195" y="128" text-anchor="middle" fill="#374151">+ fetch()</text><text x="195" y="143" text-anchor="middle" fill="#374151">+ getFormat()</text><rect x="300" y="55" width="90" height="35" rx="4" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/><text x="345" y="72" text-anchor="middle" font-weight="bold" fill="#92400e">LegacyData</text><text x="345" y="84" text-anchor="middle" fill="#374151">Source</text><line x1="90" y1="72" x2="130" y2="35" stroke="#6b7280" stroke-width="1.5"/><line x1="195" y1="55" x2="195" y2="95" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="260" y1="122" x2="300" y2="72" stroke="#16a34a" stroke-width="1.5"/><text x="280" y="105" font-size="10" fill="#6b7280">uses</text></g></svg>

> Adapter(Object Adapter 模式)以組合持有 Adaptee,比繼承更靈活。Adapter 實作 Target 介面,客戶端透過 Target 指標操作,完全不知 Adaptee 的存在。

---

## 模式屬性

| 屬性 | 說明 |
| --- | --- |
| GoF 分類 | Structural(結構型) |
| 參與者 | Target, Adaptee, Adapter, Client |
| 意圖 | 轉換介面以消除不相容 |
| 組合形式 | Object Adapter(組合) vs Class Adapter(多重繼承) |
| 執行期開銷 | 一層額外的間接呼叫 |

$$\text{Adapter}: \text{Target}^* \xrightarrow{\text{wraps}} \text{Adaptee}$$

Adapter 包裝(wrap)Adaptee,向外提供 Target 介面——一層薄薄的橋接轉換。

---

## 程式碼

```cpp
class LegacyDataSource {
public:
    string getDataLegacy() const { return "Legacy: Raw Binary Data [0x1A, 0x2B]"; }
};

class ModernDataInterface {
public:
    virtual ~ModernDataInterface() {}
    virtual string fetch() = 0;
    virtual string getFormat() = 0;
};

class LegacyAdapter : public ModernDataInterface {
private:
    LegacyDataSource m_legacy;

public:
    string fetch() override { return "Adapted: " + m_legacy.getDataLegacy(); }
    string getFormat() override { return "Binary adapted to JSON"; }
};

int main() {
    unique_ptr<ModernDataInterface> adapter = make_unique<LegacyAdapter>();
    cout << adapter->fetch() << endl;
    cout << adapter->getFormat() << endl;
}
```

---

## 優缺點與使用時機

- 優點:無需修改既有類別即可整合,對 Adaptee 零侵入。
- 優點:有助於遺留系統整合、第三方函式庫接入,降低耦合。
- 缺點:如果需要適配的方法很多,Adapter 程式碼可能相當冗長。
- 缺點:額外增加一層間接呼叫,雖通常可忽略,但高頻路徑需注意。
- 適用:整合舊系統或第三方函式庫、API 版本遷移、系統間橋接。

---

## 小結

- Adapter 是 Structural 模式:以包裝(wrap)方式消除介面不相容,保護現有程式碼不被修改。
- 參與者:Target(期望介面)、Adaptee(既有介面)、Adapter(橋接包裝)、Client。
- Object Adapter 以組合持有 Adaptee,靈活且不受 C++ 多重繼承的限制。
- 執行期代價僅一層間接呼叫,透明度高,是遺留整合的首選模式。
