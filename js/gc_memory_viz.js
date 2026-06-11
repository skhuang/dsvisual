(function (global) {
  'use strict';

  const MS_SCENARIO = {
    objects: [
      { id: 0, refs: [2] }, { id: 1, refs: [3, 4] }, { id: 2, refs: [5] },
      { id: 3, refs: [] }, { id: 4, refs: [2] }, { id: 5, refs: [] }, { id: 6, refs: [] }
    ],
    roots: [0, 1]
  };
  function markSweepFrames(scenario) {
    scenario = scenario || MS_SCENARIO;
    const objs = scenario.objects.map((o) => ({ id: o.id, refs: o.refs.slice(), mark: false, free: false }));
    const byId = {}; objs.forEach((o) => { byId[o.id] = o; });
    const frames = [];
    function snap(phase, active) { return { phase: phase, active: active, heap: objs.map((o) => ({ id: o.id, refs: o.refs.slice(), mark: o.mark, free: o.free })) }; }
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

  function gcMemoryFrames(mode) {
    if (mode === 'refcount') return refCountFrames();
    if (mode === 'buddy') return buddyFrames();
    return markSweepFrames();
  }

  const api = { markSweepFrames: markSweepFrames, refCountFrames: refCountFrames, buddyFrames: buddyFrames, gcMemoryFrames: gcMemoryFrames, MS_SCENARIO: MS_SCENARIO, RC_OPS: RC_OPS, BUDDY_OPS: BUDDY_OPS, BUDDY_TOTAL: BUDDY_TOTAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GcMemoryViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
