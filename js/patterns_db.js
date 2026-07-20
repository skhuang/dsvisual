(function (global) {
  'use strict';
  const PATTERNS = [
    { id:'pattern-builder', category:'patterns-creational', title:'Builder',
      label:'Builder - Step-by-step construction', cpp:'pattern_builder.cpp',
      diagram:{ nodes:[
        {id:'dir',x:40,y:40,w:150,h:70,label:'Director',members:['construct()'],color:'#6366f1'},
        {id:'bld',x:250,y:40,w:170,h:90,label:'Builder',members:['buildPartA()','buildPartB()','getResult()'],color:'#ec4899'},
        {id:'prod',x:250,y:200,w:170,h:60,label:'Product',members:['parts…'],color:'#eab308'}
      ], edges:[ {from:'dir',to:'bld',label:'uses'}, {from:'bld',to:'prod',label:'builds'} ] },
      narration:[
        {text:'Director drives step-by-step construction…', color:'#6366f1'},
        {text:'builder.buildPartA()', color:'#ec4899'},
        {text:'builder.buildPartB()', color:'#ec4899'},
        {text:'product = builder.getResult()', color:'#34d399'},
        {text:'Same steps, different builders → different products', color:'#10b981'}
      ], render:null },
    { id:'pattern-command', category:'patterns-behavioral', title:'Command',
      label:'Command - Encapsulate a request', cpp:'pattern_command.cpp',
      diagram:{ nodes:[
        {id:'inv',x:40,y:60,w:150,h:70,label:'Invoker',members:['setCommand()','run()'],color:'#6366f1'},
        {id:'cmd',x:250,y:60,w:160,h:70,label:'Command',members:['execute()'],color:'#ec4899'},
        {id:'rcv',x:460,y:60,w:150,h:70,label:'Receiver',members:['action()'],color:'#eab308'}
      ], edges:[ {from:'inv',to:'cmd',label:'holds'}, {from:'cmd',to:'rcv',label:'calls'} ] },
      narration:[
        {text:'Invoker holds a Command, not a Receiver…', color:'#6366f1'},
        {text:'invoker.run() → command.execute()', color:'#ec4899'},
        {text:'command.execute() → receiver.action()', color:'#eab308'},
        {text:'Request is encapsulated as an object (queue/undo-able)', color:'#10b981'}
      ], render:null },
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
