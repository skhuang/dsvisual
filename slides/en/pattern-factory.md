---
marp: true
theme: default
paginate: true
math: katex
title: "Factory Method Pattern"
---

## Factory Method Pattern

This example demonstrates the Simple Factory variant — a single `VehicleFactory` class with a static `createVehicle()` method that centralises object creation by branching on a type string. Note: the canonical GoF Factory Method pattern is different — it defines an abstract `Creator` class with a factory method overridden by each `ConcreteCreator` subclass to decide which product to instantiate, with no if/else branching needed. Simple Factory is not among the GoF 23 patterns, but is a useful starting point for understanding the factory concept.

---

## Core Concept

`VehicleFactory::createVehicle()` takes a type string and returns an abstract `Vehicle*`. The client knows only the `Vehicle` interface, not the concrete construction details of `Car`, `Truck`, or `Bike`.

- [Simple Factory] A single `VehicleFactory` holds all creation logic; a static method branches on a string — this is Simple Factory, not GoF Factory Method.
- Abstract Product (`Vehicle`): defines the interface (`display()`) that all concrete products must implement.
- Concrete Products (`Car`, `Truck`, `Bike`): each implements `display()` differently.
- Factory (`VehicleFactory`): provides a static factory method that centralises creation logic.
- `unique_ptr<Vehicle>`: ensures resource safety and automatic deallocation.

---

## Operation Flow

1. Client calls `VehicleFactory::createVehicle("car")`.
2. The factory method decides whether to instantiate `Car`, `Truck`, or `Bike` based on the type string.
3. Returns `unique_ptr<Vehicle>`; the client operates on the object through the `Vehicle` interface, calling `display()`.
4. Adding a new product requires only modifying the factory method; client code stays unchanged.

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1017.92px; background-color: transparent;" viewBox="0 0 1017.921875 278" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M110.672,139L126.65,139C142.628,139,174.583,139,205.872,139C237.161,139,267.784,139,283.095,139L298.406,139" id="my-svg-L_Client_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Client_F_0" data-points="W3sieCI6MTEwLjY3MTg3NSwieSI6MTM5fSx7IngiOjIwNi41MzkwNjI1LCJ5IjoxMzl9LHsieCI6MzAyLjQwNjI1LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M423.218,112L441.301,99.167C459.385,86.333,495.552,60.667,524.789,47.833C554.026,35,576.333,35,587.487,35L598.641,35" id="my-svg-L_F_Car_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_Car_0" data-points="W3sieCI6NDIzLjIxNzY5ODMxNzMwNzcsInkiOjExMn0seyJ4Ijo1MzEuNzE4NzUsInkiOjM1fSx7IngiOjYwMi42NDA2MjUsInkiOjM1fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M467.938,139L478.568,139C489.198,139,510.458,139,531.052,139C551.646,139,571.573,139,581.536,139L591.5,139" id="my-svg-L_F_Truck_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_Truck_0" data-points="W3sieCI6NDY3LjkzNzUsInkiOjEzOX0seyJ4Ijo1MzEuNzE4NzUsInkiOjEzOX0seyJ4Ijo1OTUuNSwieSI6MTM5fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M423.218,166L441.301,178.833C459.385,191.667,495.552,217.333,524.271,230.167C552.99,243,574.26,243,584.896,243L595.531,243" id="my-svg-L_F_Bike_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_Bike_0" data-points="W3sieCI6NDIzLjIxNzY5ODMxNzMwNzcsInkiOjE2Nn0seyJ4Ijo1MzEuNzE4NzUsInkiOjI0M30seyJ4Ijo1OTkuNTMxMjUsInkiOjI0M31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M686.844,35L699.182,35C711.521,35,736.198,35,767.473,47.467C798.747,59.933,836.619,84.867,855.556,97.334L874.492,109.8" id="my-svg-L_Car_V_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Car_V_0" data-points="W3sieCI6Njg2Ljg0Mzc1LCJ5IjozNX0seyJ4Ijo3NjAuODc1LCJ5IjozNX0seyJ4Ijo4NzcuODMyNjMyMjExNTM4NSwieSI6MTEyfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M693.984,139L705.133,139C716.281,139,738.578,139,760.208,139C781.839,139,802.802,139,813.284,139L823.766,139" id="my-svg-L_Truck_V_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Truck_V_0" data-points="W3sieCI6NjkzLjk4NDM3NSwieSI6MTM5fSx7IngiOjc2MC44NzUsInkiOjEzOX0seyJ4Ijo4MjcuNzY1NjI1LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M689.953,243L701.773,243C713.594,243,737.234,243,767.991,230.533C798.747,218.067,836.619,193.133,855.556,180.666L874.492,168.2" id="my-svg-L_Bike_V_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Bike_V_0" data-points="W3sieCI6Njg5Ljk1MzEyNSwieSI6MjQzfSx7IngiOjc2MC44NzUsInkiOjI0M30seyJ4Ijo4NzcuODMyNjMyMjExNTM4NSwieSI6MTY2fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(206.5390625, 139)"><g class="label" data-id="L_Client_F_0" transform="translate(-70.8671875, -12)"><foreignObject width="141.734375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>createVehicle(type)</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(531.71875, 35)"><g class="label" data-id="L_F_Car_0" transform="translate(-31.40625, -12)"><foreignObject width="62.8125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>type=car</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(531.71875, 139)"><g class="label" data-id="L_F_Truck_0" transform="translate(-38.78125, -12)"><foreignObject width="77.5625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>type=truck</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(531.71875, 243)"><g class="label" data-id="L_F_Bike_0" transform="translate(-35.2734375, -12)"><foreignObject width="70.546875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>type=bike</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(760.875, 35)"><g class="label" data-id="L_Car_V_0" transform="translate(-41.890625, -12)"><foreignObject width="83.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>implements</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(760.875, 139)"><g class="label" data-id="L_Truck_V_0" transform="translate(-41.890625, -12)"><foreignObject width="83.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>implements</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(760.875, 243)"><g class="label" data-id="L_Bike_V_0" transform="translate(-41.890625, -12)"><foreignObject width="83.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>implements</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-Client-0" data-look="classic" transform="translate(59.3359375, 139)"><rect class="basic label-container" style="" x="-51.3359375" y="-27" width="102.671875" height="54"/><g class="label" style="" transform="translate(-21.3359375, -12)"><rect/><foreignObject width="42.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Client</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-F-1" data-look="classic" transform="translate(385.171875, 139)"><rect class="basic label-container" style="" x="-82.765625" y="-27" width="165.53125" height="54"/><g class="label" style="" transform="translate(-52.765625, -12)"><rect/><foreignObject width="105.53125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>VehicleFactory</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Car-3" data-look="classic" transform="translate(644.7421875, 35)"><rect class="basic label-container" style="" x="-42.1015625" y="-27" width="84.203125" height="54"/><g class="label" style="" transform="translate(-12.1015625, -12)"><rect/><foreignObject width="24.203125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Car</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Truck-5" data-look="classic" transform="translate(644.7421875, 139)"><rect class="basic label-container" style="" x="-49.2421875" y="-27" width="98.484375" height="54"/><g class="label" style="" transform="translate(-19.2421875, -12)"><rect/><foreignObject width="38.484375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Truck</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Bike-7" data-look="classic" transform="translate(644.7421875, 243)"><rect class="basic label-container" style="" x="-45.2109375" y="-27" width="90.421875" height="54"/><g class="label" style="" transform="translate(-15.2109375, -12)"><rect/><foreignObject width="30.421875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Bike</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-V-9" data-look="classic" transform="translate(918.84375, 139)"><rect class="basic label-container" style="" x="-91.078125" y="-27" width="182.15625" height="54"/><g class="label" style="" transform="translate(-61.078125, -12)"><rect/><foreignObject width="122.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Vehicle interface</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML Structure Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 180" width="380" height="180"><g font-family="sans-serif" font-size="11"><rect x="140" y="10" width="110" height="40" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="195" y="27" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">Vehicle</text><text x="195" y="43" text-anchor="middle" fill="#374151">+ display() = 0</text><rect x="20" y="100" width="90" height="35" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="65" y="121" text-anchor="middle" font-weight="bold" fill="#166534">Car</text><rect x="150" y="100" width="90" height="35" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="195" y="121" text-anchor="middle" font-weight="bold" fill="#166534">Truck</text><rect x="280" y="100" width="90" height="35" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="325" y="121" text-anchor="middle" font-weight="bold" fill="#166534">Bike</text><line x1="65" y1="100" x2="175" y2="52" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="195" y1="100" x2="195" y2="52" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="325" y1="100" x2="215" y2="52" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><rect x="130" y="155" width="130" height="20" rx="3" fill="#fef9c3" stroke="#ca8a04" stroke-width="1"/><text x="195" y="169" text-anchor="middle" fill="#92400e">VehicleFactory::createVehicle()</text></g></svg>

> Dashed arrows indicate the "implements" relationship: all Concrete Products implement the `Vehicle` abstract interface. The factory method encapsulates creation; the client depends only on `Vehicle`.

---

## Pattern Properties

| Property | Description |
| --- | --- |
| GoF Category | Creational |
| Participants | Product (`Vehicle`), ConcreteProduct (`Car`/`Truck`/`Bike`), Factory (`VehicleFactory`; Simple Factory — no ConcreteCreator subclass hierarchy as in GoF Factory Method) |
| Intent | Encapsulate object creation; depend on abstraction |
| Collaboration | Client → Factory → ConcreteProduct → Product interface |
| Extensibility | New products only need factory changes; follows OCP |

$$\text{Client} \to \text{Factory} \xrightarrow{\text{returns}} \text{Product}^*$$

The client receives an abstract Product pointer from the Factory; the concrete type is decided inside the factory, invisible to the client.

---

## Source Code

```cpp
class Vehicle {
public:
    virtual ~Vehicle() {}
    virtual void display() const = 0;
};

class Car : public Vehicle {
public:
    void display() const override {
        cout << "[Car] V6 sedan" << endl;
    }
};

class Truck : public Vehicle {
public:
    void display() const override {
        cout << "[Truck] Diesel cargo" << endl;
    }
};

class Bike : public Vehicle {
public:
    void display() const override {
        cout << "[Bike] 2 wheels, Gasoline" << endl;
    }
};

class VehicleFactory {
public:
    static unique_ptr<Vehicle> createVehicle(const string& type) {
        if (type == "car")   return make_unique<Car>();
        if (type == "truck") return make_unique<Truck>();
        if (type == "bike")  return make_unique<Bike>();
        return nullptr;
    }
};

int main() {
    auto v = VehicleFactory::createVehicle("bike");
    if (v) v->display(); // [Bike] 2 wheels, Gasoline
}
```

---

## Pros, Cons & When to Use

- Pro: client is decoupled from concrete classes, reducing the scope of changes.
- Pro: adding a product requires only one change in the factory, following the Open/Closed Principle.
- Pro: easy to substitute or mock concrete products, improving testability.
- Con: each new product requires a new ConcreteProduct class, increasing class count.
- Use for database driver selection, UI element creation, plug-in systems — any scenario requiring type-based dynamic object creation.

---

## Summary

- Factory Method is a Creational pattern: encapsulates `new` in a factory method so the client depends on the abstract Product interface.
- Participants: Product (abstract), ConcreteProduct (concrete), Factory (factory method).
- Returning `unique_ptr` to a polymorphic pointer combines safety with abstraction.
- Extension follows OCP: add a ConcreteProduct, modify the Factory, leave all other code unchanged.
