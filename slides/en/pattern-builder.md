---
marp: true
theme: default
paginate: true
math: katex
title: "Builder Pattern"
category: "Design Patterns"
---

## Builder Pattern

Builder is a Creational design pattern that separates the construction of a complex object from its final representation, so the same construction process can produce different representations.

---

## Core Concept

The Director calls the Builder interface's construction methods in a fixed order, while the actual assembly details are decided by the ConcreteBuilder; the finished Product is retrieved via `getResult()`. The Director never needs to know the Product's concrete type.

- Director: owns the construction order (the recipe), calling steps like `buildPartA()` and `buildPartB()` in sequence, without touching assembly details.
- Builder (interface): declares abstract methods for each construction step, plus `getResult()` to return the finished product.
- ConcreteBuilder: implements the Builder interface, deciding how each step is actually assembled, and holds the Product under construction.
- Product: the complex object being built, assembled incrementally through a series of construction steps.

---

## Operation Flow

1. The client creates a ConcreteBuilder and hands it to the Director.
2. The Director calls `builder.buildPartA()` then `builder.buildPartB()` in a fixed order.
3. Once all steps complete, the Director calls `builder.getResult()` to obtain the finished Product.
4. Swapping in a different ConcreteBuilder lets the same Director logic produce a different Product representation.

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 880.406px; background-color: transparent;" viewBox="0 0 880.40625 127.96057891845703" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M110.672,64L125.659,64C140.646,64,170.62,64,199.927,64C229.234,64,257.875,64,272.195,64L286.516,64" id="my-svg-L_Client_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Client_D_0" data-points="W3sieCI6MTEwLjY3MTg3NSwieSI6NjR9LHsieCI6MjAwLjU5Mzc1LCJ5Ijo2NH0seyJ4IjoyOTAuNTE1NjI1LCJ5Ijo2NH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M408.906,43.538L420.255,39.615C431.604,35.692,454.302,27.846,476.372,27.741C498.442,27.635,519.884,35.271,530.605,39.088L541.326,42.906" id="my-svg-L_D_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_B_0" data-points="W3sieCI6NDA4LjkwNjI1LCJ5Ijo0My41Mzc5NjEwODc1ODM2MjV9LHsieCI6NDc3LCJ5IjoyMH0seyJ4Ijo1NDUuMDkzNzUsInkiOjQ0LjI0Nzg1MDI3ODE5OTI5NH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M408.906,64L420.255,64C431.604,64,454.302,64,476.333,64C498.365,64,519.729,64,530.411,64L541.094,64" id="my-svg-L_D_B_2" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_B_2" data-points="W3sieCI6NDA4LjkwNjI1LCJ5Ijo2NH0seyJ4Ijo0NzcsInkiOjY0fSx7IngiOjU0NS4wOTM3NSwieSI6NjR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M408.906,84.462L420.255,88.385C431.604,92.308,454.302,100.154,476.372,100.259C498.442,100.365,519.884,92.729,530.605,88.912L541.326,85.094" id="my-svg-L_D_B_3" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_B_3" data-points="W3sieCI6NDA4LjkwNjI1LCJ5Ijo4NC40NjIwMzg5MTI0MTYzOH0seyJ4Ijo0NzcsInkiOjEwOH0seyJ4Ijo1NDUuMDkzNzUsInkiOjgzLjc1MjE0OTcyMTgwMDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M656.031,64L664.487,64C672.943,64,689.854,64,706.099,64C722.344,64,737.922,64,745.711,64L753.5,64" id="my-svg-L_B_P_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_P_0" data-points="W3sieCI6NjU2LjAzMTI1LCJ5Ijo2NH0seyJ4Ijo3MDYuNzY1NjI1LCJ5Ijo2NH0seyJ4Ijo3NTcuNSwieSI6NjR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(200.59375, 64)"><g class="label" data-id="L_Client_D_0" transform="translate(-64.921875, -12)"><foreignObject width="129.84375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>construct(builder)</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(477, 20)"><g class="label" data-id="L_D_B_0" transform="translate(-43.09375, -12)"><foreignObject width="86.1875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>buildPartA()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(477, 64)"><g class="label" data-id="L_D_B_2" transform="translate(-42.8984375, -12)"><foreignObject width="85.796875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>buildPartB()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(477.11071, 107.96058)"><g class="label" data-id="L_D_B_3" transform="translate(-39.265625, -12)"><foreignObject width="78.53125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>getResult()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(706.765625, 64)"><g class="label" data-id="L_B_P_0" transform="translate(-25.734375, -12)"><foreignObject width="51.46875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>returns</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-Client-0" data-look="classic" transform="translate(59.3359375, 64)"><rect class="basic label-container" style="" x="-51.3359375" y="-27" width="102.671875" height="54"/><g class="label" style="" transform="translate(-21.3359375, -12)"><rect/><foreignObject width="42.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Client</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-D-1" data-look="classic" transform="translate(349.7109375, 64)"><rect class="basic label-container" style="" x="-59.1953125" y="-27" width="118.390625" height="54"/><g class="label" style="" transform="translate(-29.1953125, -12)"><rect/><foreignObject width="58.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Director</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-3" data-look="classic" transform="translate(600.5625, 64)"><rect class="basic label-container" style="" x="-55.46875" y="-27" width="110.9375" height="54"/><g class="label" style="" transform="translate(-25.46875, -12)"><rect/><foreignObject width="50.9375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Builder</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-P-9" data-look="classic" transform="translate(814.953125, 64)"><rect class="basic label-container" style="" x="-57.453125" y="-27" width="114.90625" height="54"/><g class="label" style="" transform="translate(-27.453125, -12)"><rect/><foreignObject width="54.90625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Product</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML Structure Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" width="420" height="200"><g font-family="sans-serif" font-size="11"><rect x="15" y="25" width="130" height="55" rx="4" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.5"/><text x="80" y="45" text-anchor="middle" font-weight="bold" fill="#4c1d95">Director</text><line x1="15" y1="52" x2="145" y2="52" stroke="#6d28d9" stroke-width="1"/><text x="25" y="68" font-size="10" fill="#374151">+ construct(b): Product</text><rect x="235" y="15" width="170" height="80" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="320" y="33" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">Builder</text><line x1="235" y1="40" x2="405" y2="40" stroke="#2563eb" stroke-width="1"/><text x="245" y="55" font-size="10" fill="#374151">+ buildPartA() = 0</text><text x="245" y="70" font-size="10" fill="#374151">+ buildPartB() = 0</text><text x="245" y="85" font-size="10" fill="#374151">+ getResult() = 0</text><rect x="235" y="135" width="170" height="40" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="320" y="159" text-anchor="middle" font-weight="bold" fill="#166534">ConcreteBuilder</text><rect x="15" y="135" width="130" height="40" rx="4" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/><text x="80" y="159" text-anchor="middle" font-weight="bold" fill="#92400e">Product</text><line x1="145" y1="52" x2="235" y2="52" stroke="#6d28d9" stroke-width="1.5"/><text x="152" y="46" font-size="10" fill="#6d28d9">uses</text><line x1="320" y1="135" x2="320" y2="95" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="235" y1="155" x2="145" y2="155" stroke="#16a34a" stroke-width="1.5"/><text x="165" y="149" font-size="10" fill="#16a34a">builds</text></g></svg>

> The dashed arrow indicates the "implements" relationship: ConcreteBuilder implements the abstract Builder interface. The Director depends only on Builder and knows nothing about the actual construction details; the ConcreteBuilder assembles the object step by step and returns the Product via getResult().

---

## Pattern Properties

| Property | Description |
| --- | --- |
| GoF Category | Creational |
| Participants | Director, Builder (interface), ConcreteBuilder, Product |
| Intent | Separate the construction of a complex object from its representation |
| Construction | Step-by-step construction, invoking multiple build methods in a fixed order |
| Principle | Single responsibility for assembly: the Director owns the process, the ConcreteBuilder owns the details (Single Responsibility Principle) |

$$\text{Product} = \text{getResult} \circ \text{buildPartB} \circ \text{buildPartA}$$

The Product is the result of a sequence of construction steps applied to the Builder: buildPartA runs first, then buildPartB, and finally getResult extracts the finished object.

---

## Source Code

```cpp
class House {
public:
    void setWalls(const string& w) { m_walls = w; }
    void setRoof(const string& r) { m_roof = r; }
    void setInterior(const string& i) { m_interior = i; }
    void show() const { cout << m_walls << ", " << m_roof << ", " << m_interior << endl; }
private:
    string m_walls, m_roof, m_interior;
};

// Builder interface
class HouseBuilder {
public:
    virtual ~HouseBuilder() {}
    virtual void buildWalls() = 0;
    virtual void buildRoof() = 0;
    virtual void buildInterior() = 0;
    virtual shared_ptr<House> getResult() = 0;
};

// Concrete Builder
class WoodenHouseBuilder : public HouseBuilder {
public:
    WoodenHouseBuilder() { m_house = make_shared<House>(); }
    void buildWalls() override { m_house->setWalls("Wooden Walls"); }
    void buildRoof() override { m_house->setRoof("Wooden Shingle Roof"); }
    void buildInterior() override { m_house->setInterior("Rustic Interior"); }
    shared_ptr<House> getResult() override { return m_house; }
private:
    shared_ptr<House> m_house;
};

// Director: fixed build order, independent of the concrete builder
class Director {
public:
    shared_ptr<House> construct(HouseBuilder& builder) {
        builder.buildWalls();
        builder.buildRoof();
        builder.buildInterior();
        return builder.getResult();
    }
};

int main() {
    Director director;
    WoodenHouseBuilder woodenBuilder;
    auto house = director.construct(woodenBuilder);
    house->show(); // Wooden Walls, Wooden Shingle Roof, Rustic Interior
}
```

---

## Pros, Cons & When to Use

- Pro: separates complex construction logic from the object's representation; the same construction process is reusable across different representations.
- Pro: supports step-by-step construction, giving finer control over build order and detail.
- Con: each new representation requires a new ConcreteBuilder subclass, increasing the number of classes.
- Con: the Builder interface must be designed upfront to cover the construction steps needed by every product variant.
- Use for assembling complex objects with many optional parts — document generators, UI dialog builders, SQL/HTML query builders, and similar fluent construction APIs.

---

## Summary

- Builder is a Creational pattern: it separates the construction process of a complex object from its representation.
- Participants: Director (process), Builder (interface), ConcreteBuilder (details), Product (result).
- The same Director paired with different ConcreteBuilders produces different Product representations.
- Well suited to complex objects whose construction steps are fixed but whose assembly details or final representation need to vary.
