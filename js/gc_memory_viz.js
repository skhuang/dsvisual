(function (global) {
  'use strict';

  const MS_SCENARIO = {
    objects: [
      { id: 0, refs: [2] }, { id: 1, refs: [3, 4] }, { id: 2, refs: [5] },
      { id: 3, refs: [] }, { id: 4, refs: [2] }, { id: 5, refs: [] }, { id: 6, refs: [] },
      { id: 7, refs: [8] }, { id: 8, refs: [7] }   // unreachable garbage cycle
    ],
    roots: [0, 1]
  };
  function markSweepFrames(scenario) {
    scenario = scenario || MS_SCENARIO;
    const objs = scenario.objects.map((o) => ({ id: o.id, refs: o.refs.slice(), mark: false, free: false }));
    const byId = {}; objs.forEach((o) => { byId[o.id] = o; });
    const frames = [];
    function snap(phase, active) { return { phase: phase, active: active, roots: scenario.roots.slice(), heap: objs.map((o) => ({ id: o.id, refs: o.refs.slice(), mark: o.mark, free: o.free })) }; }
    frames.push(snap('start', null));
    const stack = scenario.roots.slice();
    while (stack.length) {
      const id = stack.pop(); const o = byId[id];
      if (!o || o.mark) continue;
      o.mark = true; frames.push(snap('mark', id));
      o.refs.forEach((r) => stack.push(r));
    }
    objs.forEach((o) => { if (!o.mark) { o.free = true; frames.push(snap('sweep-free', o.id)); } else { frames.push(snap('sweep-keep', o.id)); } });
    frames.push(snap('done', null));
    return { frames: frames };
  }

  const RC_OPS = [
    { type: 'alloc', id: 'A' }, { type: 'alloc', id: 'B' }, { type: 'ref', from: 'A', to: 'B' },
    { type: 'droproot', id: 'B' }, { type: 'droproot', id: 'A' },
    { type: 'alloc', id: 'D' }, { type: 'alloc', id: 'E' },
    { type: 'ref', from: 'D', to: 'E' }, { type: 'ref', from: 'E', to: 'D' },
    { type: 'droproot', id: 'D' }, { type: 'droproot', id: 'E' }
  ];
  function refCountFrames(ops) {
    ops = ops || RC_OPS;
    const objs = {}; const order = [];
    const frames = [];
    function snap(action, active) { return { action: action, active: active, objs: order.map((id) => ({ id: id, count: objs[id].count, refs: objs[id].refs.slice(), free: objs[id].free })) }; }
    function decref(id) {
      const o = objs[id]; if (!o || o.free) return;
      o.count--;
      if (o.count <= 0) { o.free = true; frames.push(snap('free ' + id, id)); o.refs.forEach((t) => decref(t)); }
    }
    ops.forEach((op) => {
      if (op.type === 'alloc') { objs[op.id] = { count: 1, refs: [], free: false }; order.push(op.id); frames.push(snap('alloc ' + op.id, op.id)); }
      else if (op.type === 'ref') { objs[op.to].count++; objs[op.from].refs.push(op.to); frames.push(snap('ref ' + op.from + '->' + op.to, op.to)); }
      else if (op.type === 'droproot') { frames.push(snap('droproot ' + op.id, op.id)); decref(op.id); }
    });
    frames.push(snap('done', null));
    return { frames: frames };
  }

  const BUDDY_TOTAL = 64;
  const BUDDY_OPS = [
    { type: 'alloc', id: 'a', size: 8 }, { type: 'alloc', id: 'b', size: 16 }, { type: 'alloc', id: 'c', size: 8 },
    { type: 'free', id: 'a' }, { type: 'free', id: 'c' }, { type: 'alloc', id: 'd', size: 32 }
  ];
  function nextPow2(n) { let p = 1; while (p < n) p *= 2; return p; }
  function buddyFrames(total, ops) {
    total = total || BUDDY_TOTAL; ops = ops || BUDDY_OPS;
    let blocks = [{ start: 0, size: total, free: true, id: null }];
    const frames = [];
    function snap(action, active) { return { action: action, active: active, total: total, blocks: blocks.map((b) => ({ start: b.start, size: b.size, free: b.free, id: b.id })).sort((x, y) => x.start - y.start) }; }
    frames.push(snap('start', null));
    function alloc(id, size) {
      const need = nextPow2(size);
      let cand = null;
      blocks.forEach((b) => { if (b.free && b.size >= need) { if (!cand || b.size < cand.size) cand = b; } });
      if (!cand) { frames.push(snap('alloc ' + id + ' FAILED', null)); return; }
      while (cand.size > need) {
        const half = cand.size / 2;
        const left = { start: cand.start, size: half, free: true, id: null };
        const right = { start: cand.start + half, size: half, free: true, id: null };
        blocks = blocks.filter((b) => b !== cand); blocks.push(left, right);
        frames.push(snap('split ' + cand.size + '->' + half, cand.start));
        cand = left;
      }
      cand.free = false; cand.id = id;
      frames.push(snap('alloc ' + id + ' (' + need + ')', cand.start));
    }
    function free(id) {
      let b = blocks.find((x) => x.id === id);
      if (!b) return;
      b.free = true; b.id = null;
      frames.push(snap('free ' + id, b.start));
      let merged = true;
      while (merged) {
        merged = false;
        const buddyStart = b.start ^ b.size;
        const buddy = blocks.find((x) => x.start === buddyStart && x.size === b.size && x.free);
        if (buddy) {
          const start = Math.min(b.start, buddy.start);
          blocks = blocks.filter((x) => x !== b && x !== buddy);
          const m = { start: start, size: b.size * 2, free: true, id: null };
          blocks.push(m);
          frames.push(snap('coalesce @' + start + ' (' + m.size + ')', start));
          b = m; merged = true;
        }
      }
    }
    ops.forEach((op) => { if (op.type === 'alloc') alloc(op.id, op.size); else if (op.type === 'free') free(op.id); });
    frames.push(snap('done', null));
    return { frames: frames };
  }

  const PR_SCENARIO = {
    nodes: [
      { id: 'R', tag: 1, dlink: 'n1', rlink: 'S' },  // list node
      { id: 'S', tag: 0, dlink: null, rlink: null }, // atom sibling
      { id: 'n1', tag: 0, dlink: null, rlink: 'n2' },// atom
      { id: 'n2', tag: 0, dlink: null, rlink: null } // atom
    ],
    root: 'R'
  };
  function pointerReversalFrames(scenario) {
    scenario = scenario || PR_SCENARIO;
    const nodes = {}; const order = scenario.nodes.map((n) => n.id);
    const home = {};
    scenario.nodes.forEach((n) => {
      nodes[n.id] = { id: n.id, tag: n.tag, dlink: n.dlink, rlink: n.rlink, mark: false, c: 0 };
      home[n.id] = { dlink: n.dlink, rlink: n.rlink };
    });
    const frames = [];
    function snap(phase, p, q) {
      return { phase: phase, p: p, q: q, nodes: order.map((id) => {
        const o = nodes[id];
        return { id: id, tag: o.tag, mark: o.mark, c: o.c, dlink: o.dlink, rlink: o.rlink,
                 dRev: o.dlink !== home[id].dlink, rRev: o.rlink !== home[id].rlink };
      }) };
    }
    let p = scenario.root, q = null;
    frames.push(snap('start', p, q));
    for (;;) {
      if (p && !nodes[p].mark) {                 // first visit: mark, descend, reverse
        nodes[p].mark = true;
        if (nodes[p].tag) { nodes[p].c = 0; const t = nodes[p].dlink; nodes[p].dlink = q; q = p; p = t; frames.push(snap('descend dlink', p, q)); }
        else { nodes[p].c = 1; const t = nodes[p].rlink; nodes[p].rlink = q; q = p; p = t; frames.push(snap('atom → rlink', p, q)); }
      } else {                                    // dead end: back up along reversed links
        if (!q) { frames.push(snap('done', p, q)); break; }
        if (nodes[q].c === 0) { nodes[q].c = 1; const t = nodes[q].dlink; nodes[q].dlink = p; p = nodes[q].rlink; nodes[q].rlink = t; frames.push(snap('switch dlink→rlink', p, q)); }
        else { const t = nodes[q].rlink; nodes[q].rlink = p; p = q; q = t; frames.push(snap('pop (restore)', p, q)); }
      }
    }
    return { frames: frames };
  }

  const COMPACT_SCENARIO = {
    total: 10,
    blocks: [
      { id: 'A', addr: 1, size: 2, live: true, link: 'D' },
      { id: 'B', addr: 3, size: 2, live: false, link: null },
      { id: 'C', addr: 5, size: 2, live: true, link: null },
      { id: 'D', addr: 7, size: 2, live: true, link: 'A' },
      { id: 'E', addr: 9, size: 1, live: false, link: null }
    ]
  };
  function compactFrames(scenario) {
    scenario = scenario || COMPACT_SCENARIO;
    const total = scenario.total;
    const blocks = scenario.blocks.map((b) => ({ id: b.id, addr: b.addr, size: b.size, live: b.live, link: b.link, newAddr: null }));
    const byId = {}; blocks.forEach((b) => { byId[b.id] = b; });
    const frames = [];
    function snap(phase, active, av, pass) {
      return { phase: phase, active: active, av: av, pass: pass, total: total,
               blocks: blocks.map((b) => ({ id: b.id, addr: b.addr, size: b.size, live: b.live, link: b.link, newAddr: b.newAddr })) };
    }
    frames.push(snap('start', null, 1, 0));
    let av = 1;                                                    // Pass 1: assign new addresses
    blocks.forEach((b) => { if (b.live) { b.newAddr = av; av += b.size; frames.push(snap('pass1: newAddr[' + b.id + ']=' + b.newAddr, b.id, av, 1)); } });
    blocks.forEach((b) => {                                        // Pass 2: rewrite links old->new addr
      if (b.live && b.link != null) { const tgt = byId[b.link]; b.link = tgt ? tgt.newAddr : 0; frames.push(snap('pass2: link[' + b.id + ']=' + b.link, b.id, av, 2)); }
    });
    blocks.forEach((b) => { if (b.live) { b.addr = b.newAddr; frames.push(snap('pass3: move ' + b.id + ' → ' + b.addr, b.id, av, 3)); } }); // Pass 3: relocate
    frames.push(snap('done', null, av, 3));
    return { frames: frames };
  }

  function gcMemoryFrames(mode) {
    if (mode === 'refcount') return refCountFrames();
    if (mode === 'buddy') return buddyFrames();
    if (mode === 'pointer-reversal') return pointerReversalFrames();
    if (mode === 'compact') return compactFrames();
    return markSweepFrames();
  }

  const api = { markSweepFrames: markSweepFrames, refCountFrames: refCountFrames, buddyFrames: buddyFrames, gcMemoryFrames: gcMemoryFrames, pointerReversalFrames: pointerReversalFrames, compactFrames: compactFrames, MS_SCENARIO: MS_SCENARIO, RC_OPS: RC_OPS, BUDDY_OPS: BUDDY_OPS, BUDDY_TOTAL: BUDDY_TOTAL, PR_SCENARIO: PR_SCENARIO, COMPACT_SCENARIO: COMPACT_SCENARIO };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GcMemoryViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
