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
      label:'Observer - Event Notification', cpp:'pattern_observer.cpp',
      diagram:{ nodes:[
        {id:'subject',x:250,y:30,w:180,h:90,label:'Subject',members:['- state','+ attach(observer)','+ notify()'],color:'#f97316',active:[1,2,4]},
        {id:'obs1',x:40,y:220,w:140,h:60,label:'Observer1',members:['+ update()'],color:'#06b6d4',active:[0,3,4]},
        {id:'obs2',x:230,y:240,w:140,h:60,label:'Observer2',members:['+ update()'],color:'#06b6d4',active:[0,3,4]},
        {id:'obs3',x:470,y:220,w:140,h:60,label:'Observer3',members:['+ update()'],color:'#06b6d4',active:[0,3,4]}
      ], edges:[
        {from:'obs1',to:'subject',label:'attach()',active:[0,4]},
        {from:'obs2',to:'subject',label:'attach()',active:[0,4]},
        {from:'obs3',to:'subject',label:'attach()',active:[0,4]},
        {from:'subject',to:'obs1',label:'notify()',active:[2,3,4]},
        {from:'subject',to:'obs2',label:'notify()',active:[2,3,4]},
        {from:'subject',to:'obs3',label:'notify()',active:[2,3,4]}
      ],
      steps:[
        {caption:{en:'Observer1, Observer2, and Observer3 each attach() themselves to the Subject', zh:'Observer1、Observer2、Observer3 各自呼叫 attach() 訂閱 Subject'}},
        {caption:{en:"The Subject's internal state changes", zh:'Subject 的內部狀態發生變化'}},
        {caption:{en:'subject.notify() is called, iterating over every attached observer', zh:'subject.notify() 被呼叫，依序走訪每一個已訂閱的 Observer'}},
        {caption:{en:"Each observer's update() runs, reading the new state off the Subject", zh:'每個 Observer 的 update() 執行，從 Subject 讀取最新狀態'}},
        {caption:{en:'The Subject depends only on the Observer interface — loose coupling', zh:'Subject 只依賴 Observer 介面——彼此鬆散耦合'}}
      ] },
      render:null },
    { id:'pattern-strategy', category:'patterns-behavioral', title:'Strategy',
      label:'Strategy - Algorithm Encapsulation', cpp:'pattern_strategy.cpp',
      diagram:{ nodes:[
        {id:'context',x:40,y:140,w:160,h:80,label:'PaymentProcessor',members:['+ setStrategy(s)','+ processPayment(amount)'],color:'#f97316',active:[0,1,2,3]},
        {id:'strategy',x:280,y:30,w:180,h:70,label:'Strategy',members:['<<interface>>','+ execute(amount)'],color:'#06b6d4',active:[0,1,2,3]},
        {id:'card',x:250,y:200,w:150,h:60,label:'CardPayment',members:['+ execute(amount)'],color:'#10b981',active:[0,1]},
        {id:'crypto',x:460,y:200,w:170,h:60,label:'CryptoPayment',members:['+ execute(amount)'],color:'#3b82f6',active:[2,3]}
      ], edges:[
        {from:'context',to:'strategy',label:'delegates to',active:[0,1,2,3]},
        {from:'strategy',to:'card',label:'implements',active:[0,1]},
        {from:'strategy',to:'crypto',label:'implements',active:[2,3]}
      ],
      steps:[
        {caption:{en:'context.setStrategy(CardPayment) — the Context now holds CardPayment through the Strategy interface', zh:'context.setStrategy(CardPayment)：Context 透過 Strategy 介面持有 CardPayment 策略'}},
        {caption:{en:'context.processPayment(100) → strategy.execute(100) — the call is delegated to the current strategy, running the card algorithm', zh:'context.processPayment(100) → strategy.execute(100)：委派給目前的策略，執行信用卡付款演算法'}},
        {caption:{en:'context.setStrategy(CryptoPayment) — swap the strategy at runtime', zh:'context.setStrategy(CryptoPayment)：在執行期切換為 CryptoPayment 策略'}},
        {caption:{en:'context.processPayment(0.005) → strategy.execute(0.005) — same call, now running the crypto algorithm instead', zh:'context.processPayment(0.005) → strategy.execute(0.005)：同樣的呼叫，改為執行加密貨幣付款演算法'}}
      ] },
      render:null },
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
