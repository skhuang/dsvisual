(function (global) {
  'use strict';
  const PATTERNS = [
    { id:'pattern-builder', category:'patterns-creational', title:'Builder',
      label:'Builder - Step-by-step construction', cpp:'pattern_builder.cpp',
      diagram:{ nodes:[
        {id:'dir',x:40,y:40,w:150,h:70,label:'Director',members:['construct()'],color:'#6366f1',active:[0,4]},
        {id:'bld',x:250,y:40,w:170,h:90,label:'Builder',members:['buildPartA()','buildPartB()','getResult()'],color:'#ec4899',active:[1,2,3]},
        {id:'prod',x:230,y:200,w:170,h:60,label:'Product',members:['parts…'],color:'#eab308',active:[3,4]}
      ], edges:[ {from:'dir',to:'bld',label:'uses',active:[0,4]}, {from:'bld',to:'prod',label:'builds',active:[3]} ],
      steps:[
        {caption:{en:'Director drives step-by-step construction…', zh:'指揮者（Director）逐步驅動建造流程…'}},
        {caption:{en:'builder.buildPartA()', zh:'builder.buildPartA()：建造者建造零件 A'}},
        {caption:{en:'builder.buildPartB()', zh:'builder.buildPartB()：建造者建造零件 B'}},
        {caption:{en:'product = builder.getResult()', zh:'product = builder.getResult()：取得建造完成的產品'}},
        {caption:{en:'Same steps, different builders → different products', zh:'相同的步驟，換一個建造者 → 得到不同的產品'}}
      ] },
      render:null },
    { id:'pattern-command', category:'patterns-behavioral', title:'Command',
      label:'Command - Encapsulate a request', cpp:'pattern_command.cpp',
      diagram:{ nodes:[
        {id:'inv',x:40,y:60,w:150,h:70,label:'Invoker',members:['setCommand()','run()'],color:'#6366f1',active:[0,1]},
        {id:'cmd',x:250,y:40,w:160,h:70,label:'Command',members:['execute()'],color:'#ec4899',active:[0,1,2,3]},
        {id:'rcv',x:460,y:60,w:150,h:70,label:'Receiver',members:['action()'],color:'#eab308',active:[2]}
      ], edges:[ {from:'inv',to:'cmd',label:'holds',active:[0,1]}, {from:'cmd',to:'rcv',label:'calls',active:[2]} ],
      steps:[
        {caption:{en:'Invoker holds a Command, not a Receiver…', zh:'調用者（Invoker）持有一個 Command，而非直接持有 Receiver…'}},
        {caption:{en:'invoker.run() → command.execute()', zh:'invoker.run() → command.execute()：呼叫者觸發指令執行'}},
        {caption:{en:'command.execute() → receiver.action()', zh:'command.execute() → receiver.action()：指令呼叫接收者實際執行動作'}},
        {caption:{en:'Request is encapsulated as an object (queue/undo-able)', zh:'請求被封裝為一個物件（可排入佇列、可復原）'}}
      ] },
      render:null },
    { id:'pattern-composite', category:'patterns-structural', title:'Composite',
      label:'Composite - Tree of parts & wholes', cpp:'pattern_composite.cpp',
      diagram:{ nodes:[
        {id:'root',x:185,y:15,w:140,h:50,label:'Composite',color:'#ec4899',active:[0,3]},
        {id:'leaf1',x:30,y:120,w:130,h:50,label:'Leaf',color:'#eab308',active:[1,2,3]},
        {id:'comp2',x:270,y:120,w:180,h:50,label:'Composite',color:'#ec4899',active:[1,3]},
        {id:'leaf2',x:250,y:230,w:110,h:50,label:'Leaf',color:'#eab308',active:[1,2,3]},
        {id:'leaf3',x:390,y:230,w:100,h:50,label:'Leaf',color:'#eab308',active:[1,2,3]}
      ], edges:[
        {from:'root',to:'leaf1',active:[1,3]},
        {from:'root',to:'comp2',active:[1,3]},
        {from:'comp2',to:'leaf2',active:[1,3]},
        {from:'comp2',to:'leaf3',active:[1,3]}
      ],
      steps:[
        {caption:{en:'Client calls operation() on the root Composite, unaware whether a leaf or a subtree lies beneath…', zh:'用戶端呼叫根節點 Composite 的 operation()，並不在意底下是葉節點還是子樹…'}},
        {caption:{en:'Composite.operation() recurses into every child, walking down the whole tree', zh:'Composite.operation() 遞迴呼叫每個子節點的 operation()，一路走遍整棵樹'}},
        {caption:{en:'Leaf.operation() finally does the real work at the bottom of the recursion', zh:'Leaf.operation() 在遞迴的最底層真正執行工作'}},
        {caption:{en:'Whole and part share one Component interface — the client treats them uniformly', zh:'整體與部分共用同一個 Component 介面——用戶端對兩者一視同仁'}}
      ] },
      render:null },
    { id:'pattern-singleton', category:'patterns-creational', title:'Singleton',
      label:'Singleton - Unique Instance', cpp:'pattern_singleton.cpp',
      diagram:{ nodes:[
        {id:'cls',x:150,y:40,w:300,h:130,label:'Singleton',members:['- static instance','- private ctor()','+ getInstance()'],color:'#ec4899',active:[0,1,2,3]},
        {id:'inst',x:190,y:240,w:260,h:60,label:'Instance',members:['s1 = Singleton::getInstance()'],color:'#eab308',active:[2,3]}
      ], edges:[ {from:'cls',to:'inst',label:'creates',active:[2,3]} ],
      steps:[
        {caption:{en:'getInstance() called — checks the static instance', zh:'getInstance() 被呼叫，檢查靜態成員 instance 是否存在'}},
        {caption:{en:'instance is null, so a new Singleton() is constructed', zh:'instance 為 null，於是建構一個新的 Singleton()'}},
        {caption:{en:'The new object is stored in the static member instance', zh:'新建立的物件被儲存於靜態成員 instance 中'}},
        {caption:{en:'Every later getInstance() call returns that same instance', zh:'之後每次呼叫 getInstance() 都回傳同一個 instance'}}
      ] },
      render:null },
    { id:'pattern-factory', category:'patterns-creational', title:'Factory Method',
      label:'Factory - Object Creation', cpp:'pattern_factory.cpp',
      diagram:{ nodes:[
        {id:'fact',x:180,y:20,w:240,h:60,label:'VehicleFactory',members:['+ createVehicle(type)'],color:'#ec4899',active:[0,1]},
        {id:'prod',x:200,y:120,w:160,h:70,label:'Vehicle',members:['<<interface>>'],color:'#60a5fa',active:[2]},
        {id:'car',x:80,y:230,w:120,h:50,label:'Car',color:'#34d399',active:[0,2]},
        {id:'bike',x:340,y:230,w:120,h:50,label:'Bike',color:'#34d399',active:[1,2]}
      ], edges:[
        {from:'fact',to:'car',label:'creates',active:[0]},
        {from:'fact',to:'bike',label:'creates',active:[1]},
        {from:'prod',to:'car',label:'implements',active:[2]},
        {from:'prod',to:'bike',label:'implements',active:[2]}
      ],
      steps:[
        {caption:{en:'client.createVehicle("car") → factory returns a new Car()', zh:'client.createVehicle("car") → 工廠回傳一個新建的 Car()'}},
        {caption:{en:'client.createVehicle("bike") → factory returns a new Bike()', zh:'client.createVehicle("bike") → 工廠回傳一個新建的 Bike()'}},
        {caption:{en:'Client code depends only on the Vehicle interface, never on Car/Bike directly', zh:'用戶端程式碼只依賴 Vehicle 介面，從不直接依賴 Car 或 Bike'}}
      ] },
      render:null },
    { id:'pattern-adapter', category:'patterns-structural', title:'Adapter',
      label:'Adapter - Interface Bridge', cpp:'pattern_adapter.cpp',
      diagram:{ nodes:[
        {id:'client',x:40,y:30,w:160,h:70,label:'Client',color:'#6366f1',active:[0,3]},
        {id:'target',x:280,y:60,w:200,h:70,label:'Target',members:['<<interface>>','+ request()'],color:'#60a5fa',active:[0,1,3]},
        {id:'adapter',x:250,y:180,w:200,h:100,label:'Adapter',members:['+ request()'],color:'#10b981',active:[1,2,3]},
        {id:'adaptee',x:40,y:170,w:170,h:70,label:'Adaptee (Legacy)',members:['+ specificRequest()'],color:'#fb7185',active:[1,2,3]}
      ], edges:[
        {from:'client',to:'target',label:'calls',active:[0,3]},
        {from:'target',to:'adapter',label:'implements',active:[1,3]},
        {from:'adapter',to:'adaptee',label:'wraps',active:[1,2,3]}
      ],
      steps:[
        {caption:{en:'Client calls target.request() through the Target interface', zh:'用戶端透過 Target 介面呼叫 target.request()'}},
        {caption:{en:'The Adapter implements Target and wraps the legacy Adaptee object', zh:'轉接器（Adapter）實作 Target 介面，並包裝舊有的 Adaptee 物件'}},
        {caption:{en:'adapter.request() internally calls adaptee.specificRequest()', zh:'adapter.request() 內部呼叫 adaptee.specificRequest()'}},
        {caption:{en:'Incompatible interfaces now interoperate', zh:'原本不相容的介面，現在得以協同運作'}}
      ] },
      render:null },
    { id:'pattern-decorator', category:'patterns-structural', title:'Decorator',
      label:'Decorator - Dynamic Behavior', cpp:'pattern_decorator.cpp',
      diagram:{ nodes:[
        {id:'component',x:260,y:20,w:200,h:70,label:'Component',members:['<<interface>>','+ cost()'],color:'#06b6d4',active:[0,1,2,3]},
        {id:'base',x:40,y:140,w:160,h:70,label:'SimpleCoffee',members:['cost() = $2.00'],color:'#10b981',active:[0,1,3]},
        {id:'decA',x:300,y:160,w:170,h:90,label:'MilkDecorator',members:['wraps Component','cost() = wrapped+$0.5'],color:'#f59e0b',active:[1,2,3]},
        {id:'decB',x:490,y:200,w:180,h:110,label:'SugarDecorator',members:['wraps Component','cost() = wrapped+$0.25'],color:'#fb923c',active:[2,3]}
      ], edges:[
        {from:'component',to:'base',label:'implements',active:[0]},
        {from:'component',to:'decA',label:'implements',active:[1]},
        {from:'component',to:'decB',label:'implements',active:[2]},
        {from:'base',to:'decA',label:'wraps',active:[1,3]},
        {from:'decA',to:'decB',label:'wraps',active:[2,3]}
      ],
      steps:[
        {caption:{en:'SimpleCoffee (ConcreteComponent) implements Component directly — cost() = $2.00', zh:'SimpleCoffee（具體元件）直接實作 Component 介面，cost() = $2.00'}},
        {caption:{en:'Wrap with a Milk decorator: new Milk(coffee) — Milk also implements Component and holds the wrapped object', zh:'包上 Milk 裝飾器：new Milk(coffee)——Milk 同樣實作 Component 介面，並持有被包裝的物件'}},
        {caption:{en:'Wrap again with Sugar: new Sugar(milk) — Sugar wraps the Milk decorator', zh:'再包上 Sugar 裝飾器：new Sugar(milk)——Sugar 包裝了 Milk 裝飾器'}},
        {caption:{en:'A call to cost() chains through every wrapper down to the base SimpleCoffee', zh:'呼叫 cost() 會一路穿過每一層裝飾器，往下傳遞到最底層的 SimpleCoffee'}}
      ] },
      render:null },
    { id:'pattern-observer', category:'patterns-behavioral', title:'Observer',
      label:'Observer - Event Notification', cpp:'pattern_observer.cpp', diagram:null,
      narration:[
        {text:'Setting up Observer pattern...', color:'#ec4899'},
        {text:'Create Subject and register Observers', color:'#f59e0b'},
        {text:'Observer1, Observer2, Observer3 attached', color:'#34d399'},
        {text:'Subject state changes: notify() called', color:'#fbbf24'},
        {text:'All observers receive update notification', color:'#34d399'},
        {text:'Loose coupling: Subject knows only Observer interface', color:'#06b6d4'}
      ],
      render: function (svg) {
        svg.innerHTML = '';

        // Subject
        const subjectBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        subjectBox.setAttribute('x', '220'); subjectBox.setAttribute('y', '50');
        subjectBox.setAttribute('width', '160'); subjectBox.setAttribute('height', '70');
        subjectBox.setAttribute('fill', '#f97316'); subjectBox.setAttribute('stroke', '#c2410c'); subjectBox.setAttribute('stroke-width', '2');
        svg.appendChild(subjectBox);

        const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subText.setAttribute('x', '300'); subText.setAttribute('y', '75');
        subText.setAttribute('text-anchor', 'middle'); subText.setAttribute('font-size', '12'); subText.setAttribute('font-weight', 'bold');
        subText.setAttribute('fill', 'white');
        subText.textContent = 'Subject';
        svg.appendChild(subText);

        const subMethod = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subMethod.setAttribute('x', '230'); subMethod.setAttribute('y', '100');
        subMethod.setAttribute('font-size', '10'); subMethod.setAttribute('fill', '#fed7aa');
        subMethod.textContent = '+ notify()';
        svg.appendChild(subMethod);

        // Observers
        for (let i = 0; i < 3; i++) {
            const obsBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            obsBox.setAttribute('x', String(60 + i * 170)); obsBox.setAttribute('y', '180');
            obsBox.setAttribute('width', '130'); obsBox.setAttribute('height', '50');
            obsBox.setAttribute('fill', '#06b6d4'); obsBox.setAttribute('stroke', '#0369a1'); obsBox.setAttribute('stroke-width', '2');
            svg.appendChild(obsBox);

            const obsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            obsText.setAttribute('x', String(125 + i * 170)); obsText.setAttribute('y', '212');
            obsText.setAttribute('text-anchor', 'middle'); obsText.setAttribute('font-size', '11');
            obsText.setAttribute('fill', 'white');
            obsText.textContent = `Observer${i + 1}`;
            svg.appendChild(obsText);

            // Notification arrow
            PatternVizDraw.arrow(svg, String(280 - 20 * i), '120', String(125 + i * 170), '180', '#34d399');
        }
      } },
    { id:'pattern-strategy', category:'patterns-behavioral', title:'Strategy',
      label:'Strategy - Algorithm Encapsulation', cpp:'pattern_strategy.cpp', diagram:null,
      narration:[
        {text:'Using Strategy pattern for flexible algorithms...', color:'#ec4899'},
        {text:'PaymentProcessor created', color:'#f59e0b'},
        {text:'setStrategy(CreditCardPayment)', color:'#34d399'},
        {text:'processPayment(100): Credit Card payment', color:'#fbbf24'},
        {text:'setStrategy(CryptoCurrencyPayment)', color:'#34d399'},
        {text:'processPayment(0.005): Crypto payment', color:'#fbbf24'},
        {text:'Algorithm can be changed at runtime!', color:'#34d399'}
      ],
      render: function (svg) {
        svg.innerHTML = '';

        // Context
        const contextBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        contextBox.setAttribute('x', '50'); contextBox.setAttribute('y', '100');
        contextBox.setAttribute('width', '140'); contextBox.setAttribute('height', '70');
        contextBox.setAttribute('fill', '#f97316'); contextBox.setAttribute('stroke', '#c2410c'); contextBox.setAttribute('stroke-width', '2');
        svg.appendChild(contextBox);

        const contextText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        contextText.setAttribute('x', '120'); contextText.setAttribute('y', '125');
        contextText.setAttribute('text-anchor', 'middle'); contextText.setAttribute('font-size', '11'); contextText.setAttribute('font-weight', 'bold');
        contextText.setAttribute('fill', 'white');
        contextText.textContent = 'Processor';
        svg.appendChild(contextText);

        const contextMethod = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        contextMethod.setAttribute('x', '60'); contextMethod.setAttribute('y', '150');
        contextMethod.setAttribute('font-size', '9'); contextMethod.setAttribute('fill', '#fed7aa');
        contextMethod.textContent = '+ execute()';
        svg.appendChild(contextMethod);

        // Strategy interface
        const stratBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        stratBox.setAttribute('x', '280'); stratBox.setAttribute('y', '80');
        stratBox.setAttribute('width', '120'); stratBox.setAttribute('height', '60');
        stratBox.setAttribute('fill', '#06b6d4'); stratBox.setAttribute('stroke', '#0369a1'); stratBox.setAttribute('stroke-width', '2');
        svg.appendChild(stratBox);

        const stratText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        stratText.setAttribute('x', '340'); stratText.setAttribute('y', '100');
        stratText.setAttribute('text-anchor', 'middle'); stratText.setAttribute('font-size', '11'); stratText.setAttribute('font-weight', 'bold');
        stratText.setAttribute('fill', 'white');
        stratText.textContent = '<<interface>>';
        svg.appendChild(stratText);

        const stratMethod = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        stratMethod.setAttribute('x', '340'); stratMethod.setAttribute('y', '125');
        stratMethod.setAttribute('text-anchor', 'middle'); stratMethod.setAttribute('font-size', '10');
        stratMethod.setAttribute('fill', 'white');
        stratMethod.textContent = 'Strategy';
        svg.appendChild(stratMethod);

        // Concrete strategies
        const concreteBg = ['#10b981', '#3b82f6'];
        const concreteNames = ['CardPayment', 'CryptoPayment'];
        for (let i = 0; i < 2; i++) {
            const concBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            concBox.setAttribute('x', String(280 + i * 130)); concBox.setAttribute('y', '190');
            concBox.setAttribute('width', '120'); concBox.setAttribute('height', '50');
            concBox.setAttribute('fill', concreteBg[i]); concBox.setAttribute('stroke', '#1f2937'); concBox.setAttribute('stroke-width', '2');
            svg.appendChild(concBox);

            const concText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            concText.setAttribute('x', String(340 + i * 130)); concText.setAttribute('y', '220');
            concText.setAttribute('text-anchor', 'middle'); concText.setAttribute('font-size', '10');
            concText.setAttribute('fill', 'white');
            concText.textContent = concreteNames[i];
            svg.appendChild(concText);

            // Inheritance
            PatternVizDraw.arrow(svg, String(340 + i * 130), '190', String(340 + i * 25), '140', '#34d399');
        }

        // Context uses strategy
        PatternVizDraw.arrow(svg, '190', '135', '280', '110', '#fbbf24');
      } },
    { id:'pattern-mvc', category:'patterns-architectural', title:'MVC (Model-View-Controller)',
      label:'MVC (Model-View-Controller)', cpp:'pattern_mvc.cpp', diagram:null,
      narration:[
        {text:'User input arrives at the Controller...', color:'#f59e0b'},
        {text:'Controller updates the Model (data + state)', color:'#34d399'},
        {text:'Model change notifies the View, which re-renders', color:'#60a5fa'}
      ],
      render: function (svg) {
        if (!svg) return;
        svg.innerHTML = '';
        PatternVizDraw.drawOopBox(svg, { x: 190, y: 26, w: 140, h: 56, title: 'Controller', titleColor: '#f59e0b',
            lines: [ { text: 'handles input', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 40, y: 200, w: 140, h: 56, title: 'Model', titleColor: '#34d399',
            lines: [ { text: 'data + state', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 340, y: 200, w: 140, h: 56, title: 'View', titleColor: '#60a5fa',
            lines: [ { text: 'renders model', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopLine(svg, 225, 82, 120, 200);   // Controller -> Model
        PatternVizDraw.drawOopLine(svg, 180, 228, 340, 228);  // Model -> View
        PatternVizDraw.drawOopLine(svg, 400, 200, 295, 82);   // View -> Controller
        PatternVizDraw.drawOopLabel(svg, 150, 150, 'updates', '#f59e0b');
        PatternVizDraw.drawOopLabel(svg, 260, 246, 'notifies', '#34d399');
        PatternVizDraw.drawOopLabel(svg, 372, 150, 'user input', '#60a5fa');
      } },
    { id:'pattern-layered', category:'patterns-architectural', title:'Layered Architecture',
      label:'Layered Architecture', cpp:'pattern_layered.cpp', diagram:null,
      narration:[
        {text:'Presentation layer formats a request...', color:'#60a5fa'},
        {text:'Business layer applies rules, calls the layer below', color:'#f59e0b'},
        {text:'Data layer returns raw records — each layer calls only downward', color:'#34d399'}
      ],
      render: function (svg) {
        if (!svg) return;
        svg.innerHTML = '';
        PatternVizDraw.drawOopBox(svg, { x: 150, y: 24, w: 200, h: 58, title: 'Presentation', titleColor: '#60a5fa',
            lines: [ { text: 'formats output', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 150, y: 122, w: 200, h: 58, title: 'Business', titleColor: '#f59e0b',
            lines: [ { text: 'applies rules', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 150, y: 220, w: 200, h: 58, title: 'Data', titleColor: '#34d399',
            lines: [ { text: 'raw records', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopLine(svg, 250, 82, 250, 122);    // Presentation -> Business
        PatternVizDraw.drawOopLine(svg, 250, 180, 250, 220);   // Business -> Data
        PatternVizDraw.drawOopLabel(svg, 320, 106, 'calls', '#94a3b8');
        PatternVizDraw.drawOopLabel(svg, 320, 204, 'calls', '#94a3b8');
      } },
    { id:'pattern-pubsub', category:'patterns-architectural', title:'Publish-Subscribe',
      label:'Publish-Subscribe', cpp:'pattern_pubsub.cpp', diagram:null,
      narration:[
        {text:'Publisher emits an event to the EventBus...', color:'#f59e0b'},
        {text:'EventBus fans the event out to every subscriber', color:'#a78bfa'},
        {text:'Subscribers A, B, C all receive it — fully decoupled', color:'#34d399'}
      ],
      render: function (svg) {
        if (!svg) return;
        svg.innerHTML = '';
        PatternVizDraw.drawOopBox(svg, { x: 24, y: 130, w: 120, h: 58, title: 'Publisher', titleColor: '#f59e0b',
            lines: [ { text: 'emits events', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 196, y: 130, w: 120, h: 58, title: 'EventBus', titleColor: '#a78bfa',
            lines: [ { text: 'broker', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 372, y: 36, w: 116, h: 50, title: 'Subscriber A', titleColor: '#34d399' });
        PatternVizDraw.drawOopBox(svg, { x: 372, y: 134, w: 116, h: 50, title: 'Subscriber B', titleColor: '#34d399' });
        PatternVizDraw.drawOopBox(svg, { x: 372, y: 232, w: 116, h: 50, title: 'Subscriber C', titleColor: '#34d399' });
        PatternVizDraw.drawOopLine(svg, 144, 159, 196, 159);   // Publisher -> EventBus
        PatternVizDraw.drawOopLine(svg, 316, 159, 372, 61);    // EventBus -> A
        PatternVizDraw.drawOopLine(svg, 316, 159, 372, 159);   // EventBus -> B
        PatternVizDraw.drawOopLine(svg, 316, 159, 372, 257);   // EventBus -> C
        PatternVizDraw.drawOopLabel(svg, 170, 150, 'publish', '#f59e0b');
        PatternVizDraw.drawOopLabel(svg, 344, 110, 'notify', '#34d399');
      } },
    { id:'pattern-pipefilter', category:'patterns-architectural', title:'Pipe-and-Filter',
      label:'Pipe-and-Filter', cpp:'pattern_pipefilter.cpp', diagram:null,
      narration:[
        {text:'Input enters the pipeline...', color:'#94a3b8'},
        {text:'Each filter transforms the data and passes it on', color:'#34d399'},
        {text:'Trim -> Upper -> Exclaim -> Output', color:'#60a5fa'}
      ],
      render: function (svg) {
        if (!svg) return;
        svg.innerHTML = '';
        const stages = [
            { x: 12, title: 'Input', color: '#94a3b8' },
            { x: 110, title: 'Trim', color: '#34d399' },
            { x: 208, title: 'Upper', color: '#34d399' },
            { x: 306, title: 'Exclaim', color: '#34d399' },
            { x: 404, title: 'Output', color: '#60a5fa' },
        ];
        stages.forEach((s) => {
            PatternVizDraw.drawOopBox(svg, { x: s.x, y: 132, w: 80, h: 56, title: s.title, titleColor: s.color });
        });
        for (let i = 0; i < stages.length - 1; i++) {
            PatternVizDraw.drawOopLine(svg, stages[i].x + 80, 160, stages[i + 1].x, 160);
        }
        PatternVizDraw.drawOopLabel(svg, 250, 220, 'data flows through each filter via pipes', '#94a3b8');
      } },
    { id:'pattern-di', category:'patterns-architectural', title:'Dependency Injection',
      label:'Dependency Injection', cpp:'pattern_di.cpp', diagram:null,
      narration:[
        {text:'Composition root creates the concrete ConsoleService...', color:'#34d399'},
        {text:'Service is injected into the Consumer constructor', color:'#60a5fa'},
        {text:'Consumer depends only on the Service abstraction — easy to test', color:'#ec4899'}
      ],
      render: function (svg) {
        if (!svg) return;
        svg.innerHTML = '';
        PatternVizDraw.drawOopBox(svg, { x: 150, y: 24, w: 210, h: 56, title: 'Composition Root', titleColor: '#ec4899',
            lines: [ { text: 'wires dependencies', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 50, y: 192, w: 180, h: 70, title: 'ConsoleService', titleColor: '#34d399',
            lines: [ { text: 'concrete Service', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopBox(svg, { x: 290, y: 192, w: 180, h: 70, title: 'Consumer', titleColor: '#60a5fa',
            lines: [ { text: 'depends on Service', color: '#cbd5e1' }, { text: 'never calls new', color: '#cbd5e1' } ] });
        PatternVizDraw.drawOopLine(svg, 210, 80, 140, 192);   // Composition Root -> Service
        PatternVizDraw.drawOopLine(svg, 300, 80, 380, 192);   // Composition Root -> Consumer
        PatternVizDraw.drawOopLine(svg, 230, 227, 290, 227);  // Service injected -> Consumer
        PatternVizDraw.drawOopLabel(svg, 150, 150, 'creates', '#34d399');
        PatternVizDraw.drawOopLabel(svg, 360, 150, 'injects', '#60a5fa');
        PatternVizDraw.drawOopLabel(svg, 260, 248, 'inject', '#ec4899');
      } }
  ];
  const byId = {}; PATTERNS.forEach((p) => { byId[p.id] = p; });
  const api = {
    PATTERNS,
    getPattern: (id) => byId[id] || null,
    patternsByCategory: (cat) => PATTERNS.filter((p) => p.category === cat),
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.PatternsDB = api;
})(typeof window !== 'undefined' ? window : globalThis);
