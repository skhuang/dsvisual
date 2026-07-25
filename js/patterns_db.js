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
      label:'MVC (Model-View-Controller)', cpp:'pattern_mvc.cpp',
      diagram:{ nodes:[
        {id:'user',x:20,y:20,w:140,h:56,label:'User Input',color:'#94a3b8',active:[0]},
        {id:'ctrl',x:280,y:110,w:170,h:64,label:'Controller',members:['handles input'],color:'#f59e0b',active:[0,1]},
        {id:'model',x:60,y:210,w:180,h:70,label:'Model',members:['data + state'],color:'#34d399',active:[1,2,3]},
        {id:'view',x:420,y:230,w:190,h:70,label:'View',members:['renders model'],color:'#60a5fa',active:[2,3]}
      ], edges:[
        {from:'user',to:'ctrl',label:'input',active:[0]},
        {from:'ctrl',to:'model',label:'updates',active:[1]},
        {from:'model',to:'view',label:'notifies',active:[2]},
        {from:'view',to:'model',label:'reads',active:[3]}
      ],
      steps:[
        {caption:{en:'User input arrives at the Controller', zh:'使用者輸入抵達 Controller（控制器）'}},
        {caption:{en:'The Controller updates the Model (business logic + state)', zh:'Controller 更新 Model（商業邏輯與狀態）'}},
        {caption:{en:'The Model change notifies the View', zh:'Model 狀態改變後通知 View'}},
        {caption:{en:'The View reads the Model and re-renders the UI', zh:'View 從 Model 讀取資料並重新渲染畫面'}}
      ] },
      render:null },
    { id:'pattern-layered', category:'patterns-architectural', title:'Layered Architecture',
      label:'Layered Architecture', cpp:'pattern_layered.cpp',
      diagram:{ nodes:[
        {id:'presentation',x:120,y:25,w:220,h:64,label:'Presentation',members:['formats output'],color:'#60a5fa',active:[0,1]},
        {id:'business',x:180,y:140,w:220,h:64,label:'Business',members:['applies rules'],color:'#f59e0b',active:[1,2]},
        {id:'data',x:120,y:245,w:220,h:64,label:'Data',members:['raw records'],color:'#34d399',active:[2]}
      ], edges:[
        {from:'presentation',to:'business',label:'calls',active:[1]},
        {from:'business',to:'data',label:'calls',active:[2]}
      ],
      steps:[
        {caption:{en:'A request enters the Presentation layer, which formats it', zh:'請求進入 Presentation（展示層），並將其格式化'}},
        {caption:{en:'Presentation calls down into the Business layer, which applies rules', zh:'Presentation 向下呼叫 Business（商業邏輯層），套用商業規則'}},
        {caption:{en:'Business calls down into the Data layer, which returns raw records', zh:'Business 向下呼叫 Data（資料層），取得原始資料紀錄'}}
      ] },
      render:null },
    { id:'pattern-pubsub', category:'patterns-architectural', title:'Publish-Subscribe',
      label:'Publish-Subscribe', cpp:'pattern_pubsub.cpp',
      diagram:{ nodes:[
        {id:'publisher',x:20,y:150,w:140,h:60,label:'Publisher',members:['emits events'],color:'#f59e0b',active:[0]},
        {id:'bus',x:230,y:110,w:140,h:60,label:'EventBus',members:['broker'],color:'#a78bfa',active:[0,1,2,3]},
        {id:'subA',x:460,y:20,w:140,h:56,label:'Subscriber A',color:'#34d399',active:[1]},
        {id:'subB',x:460,y:150,w:140,h:56,label:'Subscriber B',color:'#34d399',active:[2]},
        {id:'subC',x:460,y:250,w:140,h:56,label:'Subscriber C',color:'#34d399',active:[3]}
      ], edges:[
        {from:'publisher',to:'bus',label:'publish',active:[0]},
        {from:'bus',to:'subA',label:'notify',active:[1]},
        {from:'bus',to:'subB',label:'notify',active:[2]},
        {from:'bus',to:'subC',label:'notify',active:[3]}
      ],
      steps:[
        {caption:{en:'Publisher publishes an event to the EventBus', zh:'Publisher（發布者）將事件發布到 EventBus'}},
        {caption:{en:'The EventBus forwards the event to Subscriber A', zh:'EventBus 將事件轉發給 Subscriber A'}},
        {caption:{en:'The EventBus forwards the event to Subscriber B', zh:'EventBus 將事件轉發給 Subscriber B'}},
        {caption:{en:'The EventBus forwards the event to Subscriber C — all three are fully decoupled from the Publisher', zh:'EventBus 將事件轉發給 Subscriber C——三者皆與 Publisher 完全解耦'}}
      ] },
      render:null },
    { id:'pattern-pipefilter', category:'patterns-architectural', title:'Pipe-and-Filter',
      label:'Pipe-and-Filter', cpp:'pattern_pipefilter.cpp',
      diagram:{ nodes:[
        {id:'input',x:20,y:140,w:110,h:60,label:'Input',color:'#94a3b8',active:[0,1]},
        {id:'trim',x:160,y:90,w:110,h:60,label:'Trim',color:'#34d399',active:[1,2]},
        {id:'upper',x:300,y:140,w:110,h:60,label:'Upper',color:'#34d399',active:[2,3]},
        {id:'exclaim',x:440,y:90,w:110,h:60,label:'Exclaim',color:'#34d399',active:[3,4]},
        {id:'output',x:580,y:140,w:110,h:60,label:'Output',color:'#60a5fa',active:[4]}
      ], edges:[
        {from:'input',to:'trim',active:[1]},
        {from:'trim',to:'upper',active:[2]},
        {from:'upper',to:'exclaim',active:[3]},
        {from:'exclaim',to:'output',active:[4]}
      ],
      steps:[
        {caption:{en:'Data enters the pipeline at Input', zh:'資料從 Input（輸入端）進入管線'}},
        {caption:{en:'The Trim filter removes surrounding whitespace and passes the result on', zh:'Trim 過濾器移除前後空白字元，並將結果往下傳遞'}},
        {caption:{en:'The Upper filter converts the text to uppercase', zh:'Upper 過濾器將文字轉換為大寫'}},
        {caption:{en:'The Exclaim filter appends an exclamation mark', zh:'Exclaim 過濾器在文字尾端加上驚嘆號'}},
        {caption:{en:'The transformed data arrives at Output — each filter only knows the one before and after it', zh:'轉換後的資料到達 Output（輸出端）——每個過濾器只需知道前後相鄰的過濾器'}}
      ] },
      render:null },
    { id:'pattern-di', category:'patterns-architectural', title:'Dependency Injection',
      label:'Dependency Injection', cpp:'pattern_di.cpp',
      diagram:{ nodes:[
        {id:'root',x:260,y:20,w:200,h:60,label:'Composition Root',members:['wires dependencies'],color:'#ec4899',active:[0,1]},
        {id:'iface',x:260,y:130,w:200,h:60,label:'IService',members:['<<interface>>'],color:'#60a5fa',active:[2,3]},
        {id:'concrete',x:40,y:230,w:190,h:70,label:'ConsoleService',members:['implements IService'],color:'#34d399',active:[0,1,2]},
        {id:'consumer',x:480,y:230,w:190,h:70,label:'Consumer',members:['depends on IService only','never calls new'],color:'#818cf8',active:[1,3]}
      ], edges:[
        {from:'root',to:'concrete',label:'creates',active:[0]},
        {from:'root',to:'consumer',label:'injects',active:[1]},
        {from:'iface',to:'concrete',label:'implements',active:[2]},
        {from:'consumer',to:'iface',label:'depends on',active:[3]}
      ],
      steps:[
        {caption:{en:'The Composition Root constructs the concrete ConsoleService', zh:'Composition Root（組合根）建立具體的 ConsoleService 物件'}},
        {caption:{en:"The Composition Root injects the Service into the Consumer's constructor", zh:'Composition Root 將 Service 注入 Consumer 的建構函式'}},
        {caption:{en:'ConsoleService implements the IService interface', zh:'ConsoleService 實作 IService 介面'}},
        {caption:{en:'Consumer depends only on the IService abstraction, never the concrete class — easy to swap or test', zh:'Consumer 只依賴 IService 抽象介面，而非具體類別——易於替換與測試'}}
      ] },
      render:null }
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
