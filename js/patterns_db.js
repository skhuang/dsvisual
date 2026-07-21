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
        {caption:{en:'Director drives step-by-step construction…', zh:'指挥者（Director）逐步驱动建造流程…'}},
        {caption:{en:'builder.buildPartA()', zh:'builder.buildPartA()：建造者建造零件 A'}},
        {caption:{en:'builder.buildPartB()', zh:'builder.buildPartB()：建造者建造零件 B'}},
        {caption:{en:'product = builder.getResult()', zh:'product = builder.getResult()：取得建造完成的产品'}},
        {caption:{en:'Same steps, different builders → different products', zh:'相同的步骤，换一个建造者 → 得到不同的产品'}}
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
      diagram:null,
      narration:[
        {text:'Client treats leaves and composites uniformly…', color:'#6366f1'},
        {text:'Composite.operation() recurses into children', color:'#ec4899'},
        {text:'Leaf.operation() does the work', color:'#eab308'},
        {text:'Whole-part hierarchy via one Component interface', color:'#10b981'}
      ],
      render: function (svg) {
        // Escape hatch: a small component tree (Composite → {Leaf, Composite → {Leaf, Leaf}}).
        PatternVizDraw.tree(svg, {
          label:'Composite', color:'#ec4899', children:[
            { label:'Leaf', color:'#eab308' },
            { label:'Composite', color:'#ec4899', children:[
              { label:'Leaf', color:'#eab308' }, { label:'Leaf', color:'#eab308' } ] }
          ]
        });
      } },
    { id:'pattern-singleton', category:'patterns-creational', title:'Singleton',
      label:'Singleton - Unique Instance', cpp:'pattern_singleton.cpp', diagram:null,
      narration:[
        {text:'Creating Singleton instance...', color:'#ec4899'},
        {text:'getInstance() called - checks static instance', color:'#ec4899'},
        {text:'Instance is null, creating new Singleton()', color:'#fbbf24'},
        {text:'Singleton created and stored in static variable', color:'#34d399'},
        {text:'All subsequent getInstance() calls return same instance', color:'#ec4899'}
      ],
      render: function (svg) {
        svg.innerHTML = '';

        // Singleton box
        const singletonBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        singletonBox.setAttribute('x', '150'); singletonBox.setAttribute('y', '80');
        singletonBox.setAttribute('width', '300'); singletonBox.setAttribute('height', '120');
        singletonBox.setAttribute('fill', '#ec4899'); singletonBox.setAttribute('stroke', '#be185d'); singletonBox.setAttribute('stroke-width', '2');
        svg.appendChild(singletonBox);

        // Class name
        const className = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        className.setAttribute('x', '300'); className.setAttribute('y', '105');
        className.setAttribute('text-anchor', 'middle'); className.setAttribute('font-size', '16'); className.setAttribute('font-weight', 'bold');
        className.setAttribute('fill', 'white');
        className.textContent = 'Singleton';
        svg.appendChild(className);

        // Members
        const members = ['- static instance', '- private constructor', '+ getInstance()'];
        members.forEach((m, i) => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '165'); text.setAttribute('y', '130 + i*18');
            text.setAttribute('font-family', 'monospace'); text.setAttribute('font-size', '11'); text.setAttribute('fill', '#fca5a5');
            text.textContent = m;
            svg.appendChild(text);
        });

        // Access arrows
        const arrow1 = PatternVizDraw.arrow(svg, '300', '200', '300', '240', '#fbbf24');
        const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label1.setAttribute('x', '310'); label1.setAttribute('y', '225');
        label1.setAttribute('font-size', '12'); label1.setAttribute('fill', '#fbbf24');
        label1.textContent = 'Unique Instance';
        svg.appendChild(label1);

        // Instance box
        const instBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        instBox.setAttribute('x', '180'); instBox.setAttribute('y', '240');
        instBox.setAttribute('width', '240'); instBox.setAttribute('height', '40');
        instBox.setAttribute('fill', '#fef08a'); instBox.setAttribute('stroke', '#eab308'); instBox.setAttribute('stroke-width', '2');
        svg.appendChild(instBox);

        const instText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        instText.setAttribute('x', '300'); instText.setAttribute('y', '267');
        instText.setAttribute('text-anchor', 'middle'); instText.setAttribute('font-size', '13'); instText.setAttribute('font-family', 'monospace');
        instText.setAttribute('fill', '#78350f');
        instText.textContent = 's1 = Singleton::getInstance()';
        svg.appendChild(instText);
      } },
    { id:'pattern-factory', category:'patterns-creational', title:'Factory Method',
      label:'Factory - Object Creation', cpp:'pattern_factory.cpp', diagram:null,
      narration:[
        {text:'Using Factory to create objects...', color:'#ec4899'},
        {text:'VehicleFactory::createVehicle("car") called', color:'#f59e0b'},
        {text:'Factory returns new Car() instance', color:'#34d399'},
        {text:'VehicleFactory::createVehicle("bike") called', color:'#f59e0b'},
        {text:'Factory returns new Bike() instance', color:'#34d399'},
        {text:'Client code depends on interface, not concrete classes', color:'#10b981'}
      ],
      render: function (svg) {
        svg.innerHTML = '';

        // Factory box
        const factoryBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        factoryBox.setAttribute('x', '180'); factoryBox.setAttribute('y', '20');
        factoryBox.setAttribute('width', '240'); factoryBox.setAttribute('height', '60');
        factoryBox.setAttribute('fill', '#ec4899'); factoryBox.setAttribute('stroke', '#be185d'); factoryBox.setAttribute('stroke-width', '2');
        svg.appendChild(factoryBox);

        const factoryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        factoryText.setAttribute('x', '300'); factoryText.setAttribute('y', '55');
        factoryText.setAttribute('text-anchor', 'middle'); factoryText.setAttribute('font-size', '14'); factoryText.setAttribute('font-weight', 'bold');
        factoryText.setAttribute('fill', 'white');
        factoryText.textContent = 'VehicleFactory';
        svg.appendChild(factoryText);

        // Product interface
        const prodBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        prodBox.setAttribute('x', '240'); prodBox.setAttribute('y', '120');
        prodBox.setAttribute('width', '120'); prodBox.setAttribute('height', '50');
        prodBox.setAttribute('fill', '#60a5fa'); prodBox.setAttribute('stroke', '#1e40af'); prodBox.setAttribute('stroke-width', '2');
        svg.appendChild(prodBox);

        const prodText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        prodText.setAttribute('x', '300'); prodText.setAttribute('y', '153');
        prodText.setAttribute('text-anchor', 'middle'); prodText.setAttribute('font-size', '12'); prodText.setAttribute('font-weight', 'bold');
        prodText.setAttribute('fill', 'white');
        prodText.textContent = '<<interface>>';
        svg.appendChild(prodText);

        const prodName = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        prodName.setAttribute('x', '300'); prodName.setAttribute('y', '168');
        prodName.setAttribute('text-anchor', 'middle'); prodName.setAttribute('font-size', '11');
        prodName.setAttribute('fill', 'white');
        prodName.textContent = 'Vehicle';
        svg.appendChild(prodName);

        // Concrete products
        const carBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        carBox.setAttribute('x', '100'); carBox.setAttribute('y', '220');
        carBox.setAttribute('width', '100'); carBox.setAttribute('height', '40');
        carBox.setAttribute('fill', '#34d399'); carBox.setAttribute('stroke', '#059669'); carBox.setAttribute('stroke-width', '2');
        svg.appendChild(carBox);

        const carText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        carText.setAttribute('x', '150'); carText.setAttribute('y', '247');
        carText.setAttribute('text-anchor', 'middle'); carText.setAttribute('font-size', '12');
        carText.setAttribute('fill', 'white');
        carText.textContent = 'Car';
        svg.appendChild(carText);

        const bikeBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bikeBox.setAttribute('x', '280'); bikeBox.setAttribute('y', '220');
        bikeBox.setAttribute('width', '100'); bikeBox.setAttribute('height', '40');
        bikeBox.setAttribute('fill', '#34d399'); bikeBox.setAttribute('stroke', '#059669'); bikeBox.setAttribute('stroke-width', '2');
        svg.appendChild(bikeBox);

        const bikeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bikeText.setAttribute('x', '330'); bikeText.setAttribute('y', '247');
        bikeText.setAttribute('text-anchor', 'middle'); bikeText.setAttribute('font-size', '12');
        bikeText.setAttribute('fill', 'white');
        bikeText.textContent = 'Bike';
        svg.appendChild(bikeText);

        // Factory creates arrow
        PatternVizDraw.arrow(svg, '240', '85', '180', '220', '#f59e0b');
        PatternVizDraw.arrow(svg, '360', '85', '380', '220', '#f59e0b');

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '280'); label.setAttribute('y', '200');
        label.setAttribute('font-size', '11'); label.setAttribute('fill', '#f59e0b');
        label.textContent = 'creates';
        svg.appendChild(label);
      } },
    { id:'pattern-adapter', category:'patterns-structural', title:'Adapter',
      label:'Adapter - Interface Bridge', cpp:'pattern_adapter.cpp', diagram:null,
      narration:[
        {text:'Adapting legacy interface to modern interface...', color:'#ec4899'},
        {text:'Legacy system uses getData()', color:'#fb7185'},
        {text:'Adapter wraps legacy object', color:'#10b981'},
        {text:'fetch() calls legacy.getData() internally', color:'#34d399'},
        {text:'Modern code calls adapter.fetch()', color:'#60a5fa'},
        {text:'Incompatible interfaces now work together!', color:'#34d399'}
      ],
      render: function (svg) {
        svg.innerHTML = '';

        // Legacy system
        const legacyBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        legacyBox.setAttribute('x', '50'); legacyBox.setAttribute('y', '100');
        legacyBox.setAttribute('width', '120'); legacyBox.setAttribute('height', '60');
        legacyBox.setAttribute('fill', '#fb7185'); legacyBox.setAttribute('stroke', '#be185d'); legacyBox.setAttribute('stroke-width', '2');
        svg.appendChild(legacyBox);

        const legacyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        legacyText.setAttribute('x', '110'); legacyText.setAttribute('y', '128');
        legacyText.setAttribute('text-anchor', 'middle'); legacyText.setAttribute('font-size', '11'); legacyText.setAttribute('font-weight', 'bold');
        legacyText.setAttribute('fill', 'white');
        legacyText.textContent = 'Legacy';
        svg.appendChild(legacyText);

        // Adapter bridge
        const adapterBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        adapterBox.setAttribute('x', '220'); adapterBox.setAttribute('y', '80');
        adapterBox.setAttribute('width', '160'); adapterBox.setAttribute('height', '100');
        adapterBox.setAttribute('fill', '#10b981'); adapterBox.setAttribute('stroke', '#047857'); adapterBox.setAttribute('stroke-width', '2');
        svg.appendChild(adapterBox);

        const adapterTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        adapterTitle.setAttribute('x', '300'); adapterTitle.setAttribute('y', '100');
        adapterTitle.setAttribute('text-anchor', 'middle'); adapterTitle.setAttribute('font-size', '12'); adapterTitle.setAttribute('font-weight', 'bold');
        adapterTitle.setAttribute('fill', 'white');
        adapterTitle.textContent = 'Adapter';
        svg.appendChild(adapterTitle);

        const adapterLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        adapterLine.setAttribute('x1', '220'); adapterLine.setAttribute('y1', '115');
        adapterLine.setAttribute('x2', '380'); adapterLine.setAttribute('y2', '115');
        adapterLine.setAttribute('stroke', 'rgba(255,255,255,0.3)'); adapterLine.setAttribute('stroke-width', '1');
        svg.appendChild(adapterLine);

        const adapterContent = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        adapterContent.setAttribute('x', '230'); adapterContent.setAttribute('y', '140');
        adapterContent.setAttribute('font-size', '10'); adapterContent.setAttribute('fill', '#d1fae5');
        adapterContent.textContent = '+ fetch()';
        svg.appendChild(adapterContent);

        const adapterImpl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        adapterImpl.setAttribute('x', '230'); adapterImpl.setAttribute('y', '160');
        adapterImpl.setAttribute('font-size', '10'); adapterImpl.setAttribute('font-style', 'italic'); adapterImpl.setAttribute('fill', '#a7f3d0');
        adapterImpl.textContent = 'wraps legacy.getData()';
        svg.appendChild(adapterImpl);

        // Modern system
        const modernBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        modernBox.setAttribute('x', '450'); modernBox.setAttribute('y', '100');
        modernBox.setAttribute('width', '120'); modernBox.setAttribute('height', '60');
        modernBox.setAttribute('fill', '#60a5fa'); modernBox.setAttribute('stroke', '#1e40af'); modernBox.setAttribute('stroke-width', '2');
        svg.appendChild(modernBox);

        const modernText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        modernText.setAttribute('x', '510'); modernText.setAttribute('y', '128');
        modernText.setAttribute('text-anchor', 'middle'); modernText.setAttribute('font-size', '11'); modernText.setAttribute('font-weight', 'bold');
        modernText.setAttribute('fill', 'white');
        modernText.textContent = 'Modern';
        svg.appendChild(modernText);

        // Connections
        PatternVizDraw.arrow(svg, '170', '130', '220', '130', '#fbbf24');
        PatternVizDraw.arrow(svg, '380', '130', '450', '130', '#fbbf24');
      } },
    { id:'pattern-decorator', category:'patterns-structural', title:'Decorator',
      label:'Decorator - Dynamic Behavior', cpp:'pattern_decorator.cpp', diagram:null,
      narration:[
        {text:'Decorating SimpleCoffee with features...', color:'#ec4899'},
        {text:'Create SimpleCoffee: $2.00', color:'#34d399'},
        {text:'Add Milk decorator: +$0.50', color:'#f59e0b'},
        {text:'Compose: new Milk(coffee)', color:'#34d399'},
        {text:'Result: Coffee with Milk - $2.50', color:'#fbbf24'},
        {text:'Each decorator adds behavior/cost without subclassing', color:'#34d399'}
      ],
      render: function (svg) {
        svg.innerHTML = '';

        // Component interface
        const compBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        compBox.setAttribute('x', '240'); compBox.setAttribute('y', '20');
        compBox.setAttribute('width', '120'); compBox.setAttribute('height', '50');
        compBox.setAttribute('fill', '#06b6d4'); compBox.setAttribute('stroke', '#0369a1'); compBox.setAttribute('stroke-width', '2');
        svg.appendChild(compBox);

        const compText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        compText.setAttribute('x', '300'); compText.setAttribute('y', '52');
        compText.setAttribute('text-anchor', 'middle'); compBox.setAttribute('font-size', '12'); compText.setAttribute('fill', 'white');
        compText.textContent = 'Coffee';
        svg.appendChild(compText);

        // Simple coffee
        const simpleBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        simpleBox.setAttribute('x', '100'); simpleBox.setAttribute('y', '120');
        simpleBox.setAttribute('width', '100'); simpleBox.setAttribute('height', '50');
        simpleBox.setAttribute('fill', '#10b981'); simpleBox.setAttribute('stroke', '#059669'); simpleBox.setAttribute('stroke-width', '2');
        svg.appendChild(simpleBox);

        const simpleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        simpleText.setAttribute('x', '150'); simpleText.setAttribute('y', '150');
        simpleText.setAttribute('text-anchor', 'middle'); simpleText.setAttribute('font-size', '11'); simpleText.setAttribute('fill', 'white');
        simpleText.textContent = 'SimpleCoffee';
        svg.appendChild(simpleText);

        // Decorators
        const decBox1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        decBox1.setAttribute('x', '280'); decBox1.setAttribute('y', '120');
        decBox1.setAttribute('width', '100'); decBox1.setAttribute('height', '50');
        decBox1.setAttribute('fill', '#f59e0b'); decBox1.setAttribute('stroke', '#d97706'); decBox1.setAttribute('stroke-width', '2');
        svg.appendChild(decBox1);

        const decText1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        decText1.setAttribute('x', '330'); decText1.setAttribute('y', '150');
        decText1.setAttribute('text-anchor', 'middle'); decText1.setAttribute('font-size', '11'); decText1.setAttribute('fill', 'white');
        decText1.textContent = 'Milk';
        svg.appendChild(decText1);

        const decBox2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        decBox2.setAttribute('x', '460'); decBox2.setAttribute('y', '120');
        decBox2.setAttribute('width', '100'); decBox2.setAttribute('height', '50');
        decBox2.setAttribute('fill', '#f59e0b'); decBox2.setAttribute('stroke', '#d97706'); decBox2.setAttribute('stroke-width', '2');
        svg.appendChild(decBox2);

        const decText2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        decText2.setAttribute('x', '510'); decText2.setAttribute('y', '150');
        decText2.setAttribute('text-anchor', 'middle'); decText2.setAttribute('font-size', '11'); decText2.setAttribute('fill', 'white');
        decText2.textContent = 'Sugar';
        svg.appendChild(decText2);

        // Inheritance arrows
        PatternVizDraw.arrow(svg, '150', '120', '280', '70', '#34d399');
        PatternVizDraw.arrow(svg, '330', '120', '300', '70', '#34d399');
        PatternVizDraw.arrow(svg, '510', '120', '340', '70', '#34d399');

        // Composition chain
        PatternVizDraw.arrow(svg, '200', '147', '280', '147', '#fbbf24');
        PatternVizDraw.arrow(svg, '380', '147', '460', '147', '#fbbf24');

        const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label1.setAttribute('x', '238'); label1.setAttribute('y', '140');
        label1.setAttribute('font-size', '10'); label1.setAttribute('fill', '#fbbf24');
        label1.textContent = 'wraps';
        svg.appendChild(label1);
      } },
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
