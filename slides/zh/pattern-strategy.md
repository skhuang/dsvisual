---
marp: true
theme: default
paginate: true
math: katex
title: "Strategy 模式"
---

## Strategy 模式

Strategy 是一種 Behavioral 設計模式,定義一組可互換的演算法家族,將每種演算法封裝在獨立類別中,讓演算法的變動獨立於使用它的客戶端。

---

## 核心概念

`PaymentStrategy` 是抽象策略介面;`CreditCardPayment`、`CryptoCurrencyPayment`、`PayPalPayment` 是具體策略;`PaymentProcessor` 是 Context,持有策略指標並委派 `pay()` 呼叫。

- Strategy interface(`PaymentStrategy`):定義所有具體策略必須實作的 `pay(amount)` 方法。
- Concrete Strategies:各自封裝特定的支付邏輯,彼此可互換。
- Context(`PaymentProcessor`):持有 `shared_ptr<PaymentStrategy>`;透過 `setStrategy()` 在執行期切換策略。
- Context 不知策略的內部邏輯,只呼叫介面方法 `pay()`,完全委派給具體策略。

---

## 運作流程

1. 建立 `PaymentProcessor`(Context)。
2. 呼叫 `setStrategy(make_shared<CreditCardPayment>("..."))`,設定信用卡策略。
3. 呼叫 `processPayment(99.99)`,Context 委派給 `CreditCardPayment::pay(99.99)`。
4. 再呼叫 `setStrategy(...)` 切換為加密貨幣策略,後續 `processPayment` 自動使用新策略。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 840.953px; background-color: transparent;" viewBox="0 0 840.953125 350" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M196.953,175L209.406,175C221.859,175,246.766,175,271.005,175C295.245,175,318.818,175,330.604,175L342.391,175" id="my-svg-L_P_SI_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_P_SI_0" data-points="W3sieCI6MTk2Ljk1MzEyNSwieSI6MTc1fSx7IngiOjI3MS42NzE4NzUsInkiOjE3NX0seyJ4IjozNDYuMzkwNjI1LCJ5IjoxNzV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M484.988,136L503.24,121.167C521.492,106.333,557.996,76.667,589.572,61.833C621.148,47,647.797,47,661.121,47L674.445,47" id="my-svg-L_SI_CC_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SI_CC_0" data-points="W3sieCI6NDg0Ljk4ODI4MTI1LCJ5IjoxMzZ9LHsieCI6NTk0LjUsInkiOjQ3fSx7IngiOjY3OC40NDUzMTI1LCJ5Ijo0N31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M527.609,175L538.758,175C549.906,175,572.203,175,593.833,175C615.464,175,636.427,175,646.909,175L657.391,175" id="my-svg-L_SI_CR_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SI_CR_0" data-points="W3sieCI6NTI3LjYwOTM3NSwieSI6MTc1fSx7IngiOjU5NC41LCJ5IjoxNzV9LHsieCI6NjYxLjM5MDYyNSwieSI6MTc1fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M484.988,214L503.24,228.833C521.492,243.667,557.996,273.333,590.896,288.167C623.797,303,653.094,303,667.742,303L682.391,303" id="my-svg-L_SI_PP_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SI_PP_0" data-points="W3sieCI6NDg0Ljk4ODI4MTI1LCJ5IjoyMTR9LHsieCI6NTk0LjUsInkiOjMwM30seyJ4Ijo2ODYuMzkwNjI1LCJ5IjozMDN9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(271.671875, 175)"><g class="label" data-id="L_P_SI_0" transform="translate(-49.71875, -12)"><foreignObject width="99.4375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>setStrategy(s)</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(594.5, 47)"><g class="label" data-id="L_SI_CC_0" transform="translate(-41.890625, -12)"><foreignObject width="83.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>implements</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(594.5, 175)"><g class="label" data-id="L_SI_CR_0" transform="translate(-41.890625, -12)"><foreignObject width="83.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>implements</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(594.5, 303)"><g class="label" data-id="L_SI_PP_0" transform="translate(-41.890625, -12)"><foreignObject width="83.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>implements</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-P-0" data-look="classic" transform="translate(102.4765625, 175)"><rect class="basic label-container" style="" x="-94.4765625" y="-39" width="188.953125" height="78"/><g class="label" style="" transform="translate(-64.4765625, -24)"><rect/><foreignObject width="128.953125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>PaymentProcessor<br />(Context)</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-SI-1" data-look="classic" transform="translate(437, 175)"><rect class="basic label-container" style="" x="-90.609375" y="-39" width="181.21875" height="78"/><g class="label" style="" transform="translate(-60.609375, -24)"><rect/><foreignObject width="121.21875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>PaymentStrategy<br />interface</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-CC-3" data-look="classic" transform="translate(747.171875, 47)"><rect class="basic label-container" style="" x="-68.7265625" y="-39" width="137.453125" height="78"/><g class="label" style="" transform="translate(-38.7265625, -24)"><rect/><foreignObject width="77.453125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>CreditCard<br />Payment</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-CR-5" data-look="classic" transform="translate(747.171875, 175)"><rect class="basic label-container" style="" x="-85.78125" y="-39" width="171.5625" height="78"/><g class="label" style="" transform="translate(-55.78125, -24)"><rect/><foreignObject width="111.5625" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>CryptoCurrency<br />Payment</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-PP-7" data-look="classic" transform="translate(747.171875, 303)"><rect class="basic label-container" style="" x="-60.78125" y="-39" width="121.5625" height="78"/><g class="label" style="" transform="translate(-30.78125, -24)"><rect/><foreignObject width="61.5625" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>PayPal<br />Payment</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML 結構示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 190" width="400" height="190"><g font-family="sans-serif" font-size="11"><rect x="10" y="70" width="130" height="50" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="75" y="88" text-anchor="middle" font-weight="bold" fill="#1e3a8a">PaymentProcessor</text><text x="75" y="103" text-anchor="middle" fill="#374151">- strategy: Strategy*</text><text x="75" y="116" text-anchor="middle" fill="#374151">+ setStrategy()</text><rect x="200" y="10" width="150" height="40" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="275" y="28" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">PaymentStrategy</text><text x="275" y="43" text-anchor="middle" fill="#374151">+ pay(amount) = 0</text><rect x="160" y="110" width="90" height="30" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="205" y="128" text-anchor="middle" font-weight="bold" fill="#166534">CreditCard</text><rect x="260" y="110" width="90" height="30" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="305" y="128" text-anchor="middle" font-weight="bold" fill="#166534">Crypto …</text><rect x="200" y="155" width="120" height="25" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1"/><text x="260" y="172" text-anchor="middle" font-size="10" fill="#92400e">PayPalPayment …</text><line x1="140" y1="93" x2="200" y2="29" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="205" y1="110" x2="255" y2="52" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/><line x1="305" y1="110" x2="290" y2="52" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/><text x="148" y="68" font-size="10" fill="#6b7280">uses</text></g></svg>

> Context 持有抽象 Strategy 指標;具體策略實作 Strategy 介面。執行期可隨時透過 `setStrategy()` 替換策略,Context 程式碼不需任何修改。

---

## 模式屬性

| 屬性 | 說明 |
| --- | --- |
| GoF 分類 | Behavioral(行為型) |
| 參與者 | Strategy, ConcreteStrategy, Context |
| 意圖 | 封裝可互換演算法,讓演算法獨立於使用者 |
| 切換時機 | 執行期(runtime)動態切換 |
| 原則 | Open/Closed — 新增策略不改 Context |

$$\text{Context.execute()} \equiv \text{strategy}\text{->pay}(\cdot)$$

Context 的執行完全委派給注入的 Strategy 物件;切換策略等同切換整個演算法行為。

---

## 程式碼

```cpp
class PaymentStrategy {
public:
    virtual ~PaymentStrategy() {}
    virtual void pay(double amount) const = 0;
};

class CreditCardPayment : public PaymentStrategy {
    string m_cardNumber;
public:
    CreditCardPayment(const string& num) : m_cardNumber(num) {}
    void pay(double amount) const override {
        cout << "CreditCard: $" << amount << endl;
    }
};

class PaymentProcessor {
    shared_ptr<PaymentStrategy> m_strategy;
public:
    void setStrategy(shared_ptr<PaymentStrategy> s) {
        m_strategy = s;
    }
    void processPayment(double amount) {
        if (m_strategy) m_strategy->pay(amount);
    }
};

int main() {
    PaymentProcessor processor;
    processor.setStrategy(make_shared<CreditCardPayment>("1234..."));
    processor.processPayment(99.99);
    // switch strategy at runtime:
    // processor.setStrategy(make_shared<PayPalPayment>("x@y.com"));
}
```

---

## 優缺點與使用時機

- 優點:消除大量 if-else/switch 判斷,以多型取代條件分支。
- 優點:演算法可在執行期動態切換,靈活應對需求。
- 優點:符合 Open/Closed Principle — 新增演算法只需新增 ConcreteStrategy。
- 缺點:客戶端需了解各策略差異才能選擇合適的策略。
- 適用:排序演算法選擇、壓縮方法、支付方式、遊戲 AI 行為、路由策略等需執行期切換演算法的場景。

---

## 小結

- Strategy 是 Behavioral 模式:封裝一族可互換演算法,以多型委派取代條件邏輯。
- 參與者:Strategy(介面)、ConcreteStrategy(具體演算法)、Context(使用者)。
- 執行期可透過 `setStrategy()` 切換演算法,Context 無需任何修改。
- Strategy 是多型的典型應用,也是 Policy-based design 的核心思想之一。
