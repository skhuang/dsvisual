---
marp: true
theme: default
paginate: true
math: katex
title: "Command Pattern"
category: "Design Patterns"
---

## Command Pattern

Command is a Behavioral design pattern that encapsulates a request as a standalone object, allowing clients to parameterize different requests, queue or log them, and support undoable operations.

---

## Core Concept

`RemoteControl` is the Invoker — it holds a `Command` object and calls its `execute()` without knowing what actually happens behind it; `LightOnCommand` and `LightOffCommand` are ConcreteCommands, each holding a reference to a `Light` (the Receiver) and forwarding the call to the Receiver's real action methods.

- Invoker (`RemoteControl`): holds a `Command` object, calls `execute()` via `submit()`, and stores commands in `m_history` for later undo.
- Command interface (`Command`): declares `execute()` and `undo()`, forming the abstraction layer between Invoker and Receiver.
- ConcreteCommand (`LightOnCommand`, `LightOffCommand`): implements the Command interface, forwarding `execute()`/`undo()` calls to the corresponding Receiver methods.
- Receiver (`Light`): the object that actually knows how to perform the request, providing real action methods such as `on()`/`off()`.

---

## Operation Flow

1. The client creates a Receiver, e.g. `Light kitchenLight("Kitchen")`.
2. Create a ConcreteCommand, e.g. `make_shared<LightOnCommand>(kitchenLight)`, binding the Receiver into the command.
3. Call `remote.submit(onCommand)`; the Invoker calls `command->execute()` and pushes the command onto `m_history`.
4. Inside `execute()`, `m_light.on()` is called, letting the Receiver actually perform the action.
5. Call `remote.undoLast()`; the last command is popped from `m_history` and its `undo()` is called to restore the previous state.

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1153.16px; background-color: transparent;" viewBox="0 0 1153.15625 222" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M175.094,76.198L186.776,71.332C198.458,66.465,221.823,56.733,244.521,51.866C267.219,47,289.25,47,300.266,47L311.281,47" id="my-svg-L_I_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_C_0" data-points="W3sieCI6MTc1LjA5Mzc1LCJ5Ijo3Ni4xOTgwMDY3MTIwOTE5NH0seyJ4IjoyNDUuMTg3NSwieSI6NDd9LHsieCI6MzE1LjI4MTI1LCJ5Ijo0N31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M499.359,47L510.508,47C521.656,47,543.953,47,565.628,51.045C587.302,55.09,608.355,63.181,618.881,67.226L629.407,71.271" id="my-svg-L_C_CC_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_CC_0" data-points="W3sieCI6NDk5LjM1OTM3NSwieSI6NDd9LHsieCI6NTY2LjI1LCJ5Ijo0N30seyJ4Ijo2MzMuMTQwNjI1LCJ5Ijo3Mi43MDU2ODA5MTE5NDgyfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M832.438,111L847.402,111C862.367,111,892.297,111,921.56,111C950.823,111,979.419,111,993.717,111L1008.016,111" id="my-svg-L_CC_R_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_CC_R_0" data-points="W3sieCI6ODMyLjQzNzUsInkiOjExMX0seyJ4Ijo5MjIuMjI2NTYyNSwieSI6MTExfSx7IngiOjEwMTIuMDE1NjI1LCJ5IjoxMTF9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M175.094,145.802L186.776,150.668C198.458,155.535,221.823,165.267,245.94,170.134C270.057,175,294.927,175,307.362,175L319.797,175" id="my-svg-L_I_H_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_H_0" data-points="W3sieCI6MTc1LjA5Mzc1LCJ5IjoxNDUuODAxOTkzMjg3OTA4MDZ9LHsieCI6MjQ1LjE4NzUsInkiOjE3NX0seyJ4IjozMjMuNzk2ODc1LCJ5IjoxNzV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M490.844,175L503.411,175C515.979,175,541.115,175,564.208,170.955C587.302,166.91,608.355,158.819,618.881,154.774L629.407,150.729" id="my-svg-L_H_CC_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_CC_0" data-points="W3sieCI6NDkwLjg0Mzc1LCJ5IjoxNzV9LHsieCI6NTY2LjI1LCJ5IjoxNzV9LHsieCI6NjMzLjE0MDYyNSwieSI6MTQ5LjI5NDMxOTA4ODA1MTh9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(245.1875, 47)"><g class="label" data-id="L_I_C_0" transform="translate(-45.09375, -12)"><foreignObject width="90.1875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>submit(cmd)</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(566.25, 47)"><g class="label" data-id="L_C_CC_0" transform="translate(-41.890625, -12)"><foreignObject width="83.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>implements</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(922.2265625, 111)"><g class="label" data-id="L_CC_R_0" transform="translate(-64.7890625, -12)"><foreignObject width="129.578125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>m_light.on()/off()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(245.1875, 175)"><g class="label" data-id="L_I_H_0" transform="translate(-38.03125, -12)"><foreignObject width="76.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>undoLast()</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(566.25, 175)"><g class="label" data-id="L_H_CC_0" transform="translate(-23.3671875, -12)"><foreignObject width="46.734375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>undo()</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-I-0" data-look="classic" transform="translate(91.546875, 111)"><rect class="basic label-container" style="" x="-83.546875" y="-39" width="167.09375" height="78"/><g class="label" style="" transform="translate(-53.546875, -24)"><rect/><foreignObject width="107.09375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>RemoteControl<br />(Invoker)</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-1" data-look="classic" transform="translate(407.3203125, 47)"><rect class="basic label-container" style="" x="-92.0390625" y="-39" width="184.078125" height="78"/><g class="label" style="" transform="translate(-62.0390625, -24)"><rect/><foreignObject width="124.078125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Command<br />execute()/undo()</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-CC-3" data-look="classic" transform="translate(732.7890625, 111)"><rect class="basic label-container" style="" x="-99.6484375" y="-39" width="199.296875" height="78"/><g class="label" style="" transform="translate(-69.6484375, -24)"><rect/><foreignObject width="139.296875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>LightOnCommand /<br />LightOffCommand</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-R-5" data-look="classic" transform="translate(1078.5859375, 111)"><rect class="basic label-container" style="" x="-66.5703125" y="-39" width="133.140625" height="78"/><g class="label" style="" transform="translate(-36.5703125, -24)"><rect/><foreignObject width="73.140625" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Light<br />(Receiver)</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-H-7" data-look="classic" transform="translate(407.3203125, 175)"><rect class="basic label-container" style="" x="-83.5234375" y="-39" width="167.046875" height="78"/><g class="label" style="" transform="translate(-53.5234375, -24)"><rect/><foreignObject width="107.046875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>m_history<br />(command log)</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML Structure Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" width="420" height="200"><g font-family="sans-serif" font-size="11"><rect x="15" y="25" width="130" height="55" rx="4" fill="#ede9fe" stroke="#6d28d9" stroke-width="1.5"/><text x="80" y="45" text-anchor="middle" font-weight="bold" fill="#4c1d95">RemoteControl</text><line x1="15" y1="52" x2="145" y2="52" stroke="#6d28d9" stroke-width="1"/><text x="25" y="68" font-size="10" fill="#374151">+ submit(cmd)</text><text x="25" y="81" font-size="10" fill="#374151">+ undoLast()</text><rect x="235" y="15" width="170" height="80" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="320" y="33" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">Command</text><line x1="235" y1="40" x2="405" y2="40" stroke="#2563eb" stroke-width="1"/><text x="245" y="55" font-size="10" fill="#374151">+ execute() = 0</text><text x="245" y="70" font-size="10" fill="#374151">+ undo() = 0</text><rect x="235" y="135" width="170" height="40" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="320" y="153" text-anchor="middle" font-weight="bold" fill="#166534">LightOnCommand /</text><text x="320" y="167" text-anchor="middle" font-size="10" fill="#166534">LightOffCommand</text><rect x="15" y="135" width="130" height="40" rx="4" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/><text x="80" y="153" text-anchor="middle" font-weight="bold" fill="#92400e">Light</text><text x="80" y="167" text-anchor="middle" font-size="10" fill="#92400e">(Receiver)</text><line x1="145" y1="52" x2="235" y2="52" stroke="#6d28d9" stroke-width="1.5"/><text x="152" y="46" font-size="10" fill="#6d28d9">uses</text><line x1="320" y1="135" x2="320" y2="95" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="235" y1="155" x2="145" y2="155" stroke="#16a34a" stroke-width="1.5"/><text x="165" y="149" font-size="10" fill="#16a34a">calls</text></g></svg>

> The dashed arrow indicates the "implements" relationship: LightOnCommand/LightOffCommand implement the abstract Command interface. RemoteControl (the Invoker) depends only on Command and knows nothing about the Receiver; only the ConcreteCommand knows about Light (the Receiver) and forwards the real call, so the Invoker and Receiver are fully decoupled.

---

## Pattern Properties

| Property | Description |
| --- | --- |
| GoF Category | Behavioral |
| Participants | Invoker, Command (interface), ConcreteCommand, Receiver |
| Intent | Encapsulate a request as an object so it can be parameterized, queued, logged, and undone |
| Decoupling | Invoker and Receiver are fully decoupled, communicating only through the Command interface |
| Extras | Command queues, operation logging, undo/redo |

$$\text{invoker.submit}(cmd) \equiv cmd\text{.execute}() \to \text{receiver.action}()$$

Calling execute() on a command via the Invoker is equivalent to delegating to the Receiver's real action; undo reverses this by calling undo() to restore the Receiver's previous state.

---

## Source Code

```cpp
// Receiver
class Light {
    string m_name;
public:
    Light(const string& name) : m_name(name) {}
    void on() const { cout << m_name << " light is ON" << endl; }
    void off() const { cout << m_name << " light is OFF" << endl; }
};

// Command interface
class Command {
public:
    virtual ~Command() {}
    virtual void execute() = 0;
    virtual void undo() = 0;
};

// Concrete Command
class LightOnCommand : public Command {
    Light& m_light;
public:
    LightOnCommand(Light& light) : m_light(light) {}
    void execute() override { m_light.on(); }
    void undo() override { m_light.off(); }
};

// Invoker
class RemoteControl {
    vector<shared_ptr<Command>> m_history;
public:
    void submit(shared_ptr<Command> command) {
        command->execute();
        m_history.push_back(command);
    }
    void undoLast() {
        if (m_history.empty()) return;
        m_history.back()->undo();
        m_history.pop_back();
    }
};

int main() {
    Light kitchenLight("Kitchen");
    auto onCommand = make_shared<LightOnCommand>(kitchenLight);

    RemoteControl remote;
    remote.submit(onCommand);  // Kitchen light is ON
    remote.undoLast();         // Kitchen light is OFF
}
```

---

## Pros, Cons & When to Use

- Pro: decouples the Invoker from concrete Receiver logic — the Invoker only needs to know the Command interface.
- Pro: commands are first-class objects, so they can be queued, logged, or executed later/asynchronously.
- Pro: naturally supports undo/redo by keeping a command history and calling undo() in reverse.
- Con: every distinct action requires its own ConcreteCommand class, which can lead to class-count bloat.
- Use for menu/button actions, transactional operations, task queues/job schedulers, and any UI or macro system that needs undo/redo.

---

## Summary

- Command is a Behavioral pattern: it encapsulates a request as an object, decoupling the caller from the actual executor.
- Participants: Invoker (`RemoteControl`), Command interface, ConcreteCommand (`LightOnCommand`/`LightOffCommand`), Receiver (`Light`).
- The Invoker calls `execute()` without knowing the underlying details; a command history (`m_history`) makes `undo()`/redo possible.
- Command is a common choice for GUI actions, transactional systems, and task queues.
