---
marp: true
theme: default
paginate: true
math: katex
title: "Observer Pattern"
---

## Observer Pattern

Observer is a Behavioral design pattern that defines a one-to-many dependency between objects — when the Subject changes state, all registered Observers are automatically notified and updated.

---

## Core Concept

`Subject` maintains a list of Observer pointers; on state change it calls `notify()`, which invokes each Observer's `update()` method in turn. The Subject knows only the abstract `Observer` interface — loosely coupled from concrete observers.

- Subject: maintains the observer list; provides `attach()`/`detach()` for subscription management; triggers notification via `setState()`.
- Observer interface: declares `update(message)`; all concrete observers must implement it.
- Concrete Observers (`ConcreteObserverA/B/C`): each defines its own reaction to notifications.
- Loose coupling: Subject is unaware of concrete Observer types; subscriptions can be added or removed at runtime.

---

## Operation Flow

1. Call `subject->attach(obs_a/b/c)` to add the three observers to the list.
2. Call `subject->setState("Event1")`, which triggers internal `notify()`.
3. `notify()` calls `ObserverA::update()`, `ObserverB::update()`, `ObserverC::update()` in sequence.
4. `detach()` removes a subscription; subsequent `setState()` calls no longer notify the removed observer.

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 515.766px; background-color: transparent;" viewBox="0 0 515.765625 246" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M192.414,74.141L172.79,82.284C153.167,90.427,113.919,106.714,94.296,120.357C74.672,134,74.672,145,74.672,150.5L74.672,156" id="my-svg-L_S_A_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_S_A_0" data-points="W3sieCI6MTkyLjQxNDA2MjUsInkiOjc0LjE0MTIzNjE4OTkwNzQzfSx7IngiOjc0LjY3MTg3NSwieSI6MTIzfSx7IngiOjc0LjY3MTg3NSwieSI6MTYwfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M257.82,86L257.82,92.167C257.82,98.333,257.82,110.667,257.82,122.333C257.82,134,257.82,145,257.82,150.5L257.82,156" id="my-svg-L_S_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_S_B_0" data-points="W3sieCI6MjU3LjgyMDMxMjUsInkiOjg2fSx7IngiOjI1Ny44MjAzMTI1LCJ5IjoxMjN9LHsieCI6MjU3LjgyMDMxMjUsInkiOjE2MH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M323.227,74.132L342.861,82.277C362.495,90.421,401.763,106.711,421.397,120.355C441.031,134,441.031,145,441.031,150.5L441.031,156" id="my-svg-L_S_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_S_C_0" data-points="W3sieCI6MzIzLjIyNjU2MjUsInkiOjc0LjEzMTk3NzMxNDQwMDI1fSx7IngiOjQ0MS4wMzEyNSwieSI6MTIzfSx7IngiOjQ0MS4wMzEyNSwieSI6MTYwfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(74.671875, 123)"><g class="label" data-id="L_S_A_0" transform="translate(-26.8984375, -12)"><foreignObject width="53.796875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>notify()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(257.8203125, 123)"><g class="label" data-id="L_S_B_0" transform="translate(-26.8984375, -12)"><foreignObject width="53.796875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>notify()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(441.03125, 123)"><g class="label" data-id="L_S_C_0" transform="translate(-26.8984375, -12)"><foreignObject width="53.796875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>notify()</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-S-0" data-look="classic" transform="translate(257.8203125, 47)"><rect class="basic label-container" style="" x="-65.40625" y="-39" width="130.8125" height="78"/><g class="label" style="" transform="translate(-35.40625, -24)"><rect/><foreignObject width="70.8125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Subject<br />setState()</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-A-1" data-look="classic" transform="translate(74.671875, 199)"><rect class="basic label-container" style="" x="-66.671875" y="-39" width="133.34375" height="78"/><g class="label" style="" transform="translate(-36.671875, -24)"><rect/><foreignObject width="73.34375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>ObserverA<br />update()</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-3" data-look="classic" transform="translate(257.8203125, 199)"><rect class="basic label-container" style="" x="-66.4765625" y="-39" width="132.953125" height="78"/><g class="label" style="" transform="translate(-36.4765625, -24)"><rect/><foreignObject width="72.953125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>ObserverB<br />update()</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-5" data-look="classic" transform="translate(441.03125, 199)"><rect class="basic label-container" style="" x="-66.734375" y="-39" width="133.46875" height="78"/><g class="label" style="" transform="translate(-36.734375, -24)"><rect/><foreignObject width="73.46875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>ObserverC<br />update()</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML Structure Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 190" width="380" height="190"><g font-family="sans-serif" font-size="11"><rect x="20" y="60" width="130" height="65" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="85" y="78" text-anchor="middle" font-weight="bold" fill="#1e3a8a">Subject</text><text x="85" y="93" text-anchor="middle" fill="#374151">- observers: list</text><text x="85" y="108" text-anchor="middle" fill="#374151">+ attach(Observer*)</text><text x="85" y="120" text-anchor="middle" fill="#374151">+ setState(string)</text><rect x="230" y="10" width="130" height="40" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="295" y="28" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">Observer</text><text x="295" y="43" text-anchor="middle" fill="#374151">+ update(string) = 0</text><rect x="200" y="100" width="90" height="30" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="245" y="119" text-anchor="middle" font-weight="bold" fill="#166534">ObsA</text><rect x="300" y="100" width="70" height="30" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="335" y="119" text-anchor="middle" font-weight="bold" fill="#166534">ObsB …</text><line x1="150" y1="92" x2="230" y2="29" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="245" y1="100" x2="275" y2="52" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/><line x1="335" y1="100" x2="310" y2="52" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3"/><text x="155" y="75" font-size="10" fill="#6b7280">notifies</text></g></svg>

> Subject holds a list of abstract `Observer` pointers; concrete observers implement the `Observer` interface. Subject and concrete observers are fully loosely coupled — subscriptions can be managed dynamically at runtime.

---

## Pattern Properties

| Property | Description |
| --- | --- |
| GoF Category | Behavioral |
| Participants | Subject, Observer, ConcreteObserver |
| Intent | One-to-many dependency: Subject state change auto-notifies all Observers |
| notify() Time | $O(n)$ where $n$ is the number of subscribers |
| Space | $O(n)$ observer list |

$$\text{notify}: T(n) = O(n)$$

`notify()` linearly traverses all $n$ observers and calls their `update()` — time complexity $O(n)$.

---

## Source Code

```cpp
class Observer {
public:
    virtual ~Observer() {}
    virtual void update(const string& message) = 0;
};

class Subject {
    vector<shared_ptr<Observer>> m_observers;
    string m_state;

public:
    void attach(shared_ptr<Observer> obs) { m_observers.push_back(obs); }
    void setState(const string& state) {
        m_state = state;
        notify();
    }

private:
    void notify() {
        for (auto& obs : m_observers)
            obs->update(m_state);
    }
};

class ConcreteObserverA : public Observer {
public:
    void update(const string& msg) override {
        cout << "ObserverA received: " << msg << endl;
    }
};

int main() {
    auto subject = make_shared<Subject>();
    subject->attach(make_shared<ConcreteObserverA>());
    subject->setState("Event1"); // notifies all observers
}
```

---

## Pros, Cons & When to Use

- Pro: Subject and Observer are loosely coupled, changeable independently; supports broadcast communication.
- Pro: subscriptions can be added or removed at runtime, accommodating changing requirements flexibly.
- Con: many observers or complex notification chains may cause unexpected cascading updates and performance issues.
- Con: ordering dependencies among observers are hard to control and debug.
- Use for event systems, MVC model-to-view notifications, real-time push notifications, reactive programming.

---

## Summary

- Observer is a Behavioral pattern: Subject maintains a subscriber list and broadcasts state changes to all of them.
- One-to-many dependency + loose coupling: Subject depends only on the abstract `Observer` interface.
- `notify()` is $O(n)$; `attach`/`detach` can be called dynamically at runtime.
- Observer is the core foundation of event-driven architectures, MVC, and reactive frameworks.
