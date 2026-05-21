---
marp: true
theme: default
paginate: true
math: katex
title: "Dependency Injection"
category: "Design Patterns"
---

## Dependency Injection

Dependency Injection is an application of Inversion of Control: instead of an object constructing its own dependencies, they are supplied from outside (typically via the constructor) — making dependencies swappable and testable.

---

## Core Concept

The consumer depends on an abstraction (interface), not a concrete class; a composition root wires the concrete implementation in.

- The consumer never calls new on its dependency — dependencies are supplied externally.
- Depending on an interface rather than a concrete class makes swapping implementations easy.
- The composition root is the single, centralized wiring place — clear and explicit.

---

## Operation Flow

1. Define a Service abstraction; the Consumer depends only on this interface.
2. The Consumer takes a Service& in its constructor (constructor injection).
3. The composition root (main) creates the concrete ConsoleService and injects it into the Consumer.

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 466.312px; background-color: transparent;" viewBox="0 0 466.3125 174" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M171.723,60L183.07,55.833C194.417,51.667,217.111,43.333,236.36,39.167C255.609,35,271.414,35,279.316,35L287.219,35" id="my-svg-L_CompositionRoot_ConsoleService_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_CompositionRoot_ConsoleService_0" data-points="W3sieCI6MTcxLjcyMzI1NzIxMTUzODQ1LCJ5Ijo2MH0seyJ4IjoyMzkuODA0Njg3NSwieSI6MzV9LHsieCI6MjkxLjIxODc1LCJ5IjozNX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M171.723,114L183.07,118.167C194.417,122.333,217.111,130.667,239.423,134.833C261.734,139,283.664,139,294.629,139L305.594,139" id="my-svg-L_CompositionRoot_Consumer_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_CompositionRoot_Consumer_0" data-points="W3sieCI6MTcxLjcyMzI1NzIxMTUzODQ1LCJ5IjoxMTR9LHsieCI6MjM5LjgwNDY4NzUsInkiOjEzOX0seyJ4IjozMDkuNTkzNzUsInkiOjEzOX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(239.8046875, 35)"><g class="label" data-id="L_CompositionRoot_ConsoleService_0" transform="translate(-26.4140625, -12)"><foreignObject width="52.828125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>creates</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(239.8046875, 139)"><g class="label" data-id="L_CompositionRoot_Consumer_0" transform="translate(-24.3203125, -12)"><foreignObject width="48.640625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>injects</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-CompositionRoot-0" data-look="classic" transform="translate(98.1953125, 87)"><rect class="basic label-container" style="" x="-90.1953125" y="-27" width="180.390625" height="54"/><g class="label" style="" transform="translate(-60.1953125, -12)"><rect/><foreignObject width="120.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>CompositionRoot</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-ConsoleService-1" data-look="classic" transform="translate(374.765625, 35)"><rect class="basic label-container" style="" x="-83.546875" y="-27" width="167.09375" height="54"/><g class="label" style="" transform="translate(-53.546875, -12)"><rect/><foreignObject width="107.09375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>ConsoleService</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Consumer-3" data-look="classic" transform="translate(374.765625, 139)"><rect class="basic label-container" style="" x="-65.171875" y="-27" width="130.34375" height="54"/><g class="label" style="" transform="translate(-35.171875, -12)"><rect/><foreignObject width="70.34375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Consumer</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## Layout

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" width="400"><g font-family="monospace" font-size="12"><rect x="140" y="10" width="120" height="34" fill="none" stroke="#a78bfa"/><text x="200" y="31" text-anchor="middle" fill="#a78bfa">CompositionRoot</text><line x1="160" y1="44" x2="90" y2="100" stroke="#64748b"/><line x1="240" y1="44" x2="310" y2="100" stroke="#64748b"/><rect x="20" y="100" width="120" height="34" fill="none" stroke="#f59e0b"/><text x="80" y="121" text-anchor="middle" fill="#f59e0b">ConsoleService</text><rect x="260" y="100" width="100" height="34" fill="none" stroke="#34d399"/><text x="310" y="121" text-anchor="middle" fill="#34d399">Consumer</text><line x1="140" y1="117" x2="260" y2="117" stroke="#60a5fa" stroke-dasharray="4"/><text x="200" y="113" text-anchor="middle" fill="#60a5fa" font-size="10">injects</text></g></svg>

> The visualizer uses a triangle layout: CompositionRoot on top, ConsoleService and Consumer below; solid connectors show creation and the dashed connector shows injection.

---

## Trade-offs & When to Use

| Aspect | Notes |
| --- | --- |
| Testability | Excellent — inject a mock or fake in place of the real dependency |
| Flexibility | Swap concrete implementations without touching the consumer |
| Cost | More wiring code; a composition root to maintain |

---

## Source Code

```cpp
// Service — an abstraction the consumer depends on.
class Service {
public:
    virtual string fetch() const = 0;
    virtual ~Service() {}
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
```

---

## Pros, Cons & When to Use

- Pro: greatly improves unit testability by allowing mock or fake injection.
- Pro: swap concrete implementations without modifying the consumer, for maximum flexibility.
- Con: requires more wiring boilerplate and a composition root to maintain.
- Con: added indirection makes control flow harder to follow for beginners.
- Use whenever a class has external dependencies you want to test or swap. Note: DI is the practical mechanism behind Inversion of Control.

---

## Summary

- Dependency Injection supplies dependencies from outside; the consumer depends on an abstraction, not a concrete class.
- The composition root is the single wiring place, making the system's dependency graph explicit.
- It is the foundation of testable, loosely-coupled code and the practical form of Inversion of Control.
