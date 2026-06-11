(function (global) {
  'use strict';

  function naturalRuns(data) {
    if (!data.length) return [];
    const runs = [];
    let cur = [data[0]];
    for (let i = 1; i < data.length; i++) {
      if (data[i] >= data[i - 1]) cur.push(data[i]);
      else { runs.push(cur); cur = [data[i]]; }
    }
    runs.push(cur);
    return runs;
  }

  function mergeTwo(a, b) {
    const out = []; let i = 0, j = 0;
    while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.length) out.push(a[i++]);
    while (j < b.length) out.push(b[j++]);
    return out;
  }

  function snap(tapes, phase, extra) {
    return Object.assign({ phase: phase, tapes: tapes.map((t) => t.map((r) => r)) }, extra || {});
  }
  function doneSnap(tapes) {
    return { phase: 'done', tapes: tapes.map((t) => t.filter((r) => r !== null)) };
  }

  function polyphaseFrames(data) {
    const frames = [];
    const runs = naturalRuns((data || []).slice());
    const tapes = [[], [], []];
    if (runs.length === 0) { frames.push(snap(tapes, 'distribute')); frames.push(doneSnap(tapes)); return { frames: frames, sorted: [] }; }
    if (runs.length === 1) { tapes[2] = [runs[0]]; frames.push(snap(tapes, 'distribute')); frames.push(doneSnap(tapes)); return { frames: frames, sorted: runs[0] }; }

    const f = [1, 1];
    while (f[f.length - 1] + f[f.length - 2] < runs.length) f.push(f[f.length - 1] + f[f.length - 2]);
    const a = f[f.length - 1], b = f[f.length - 2];
    const total = a + b;
    const dummies = total - runs.length;
    const DUMMY = null;
    const queue = runs.slice();
    const d0 = Math.min(dummies, a), d1 = dummies - d0;
    for (let i = 0; i < a; i++) tapes[0].push(i < d0 ? DUMMY : queue.shift());
    for (let i = 0; i < b; i++) tapes[1].push(i < d1 ? DUMMY : queue.shift());
    frames.push(snap(tapes, 'distribute'));

    let outIdx = 2;
    let guard = 0;
    function countRealRuns() { return tapes.reduce((s, t) => s + t.filter((r) => r !== DUMMY).length, 0); }
    while (countRealRuns() > 1 && guard++ < 5000) {
      const inputs = [0, 1, 2].filter((i) => i !== outIdx);
      const t0 = tapes[inputs[0]], t1 = tapes[inputs[1]];
      if (t0.length === 0 && t1.length === 0) { outIdx = inputs[0]; continue; }
      const r0 = t0.length ? t0.shift() : DUMMY;
      const r1 = t1.length ? t1.shift() : DUMMY;
      let merged;
      if (r0 === DUMMY && r1 === DUMMY) merged = DUMMY;
      else if (r0 === DUMMY) merged = r1;
      else if (r1 === DUMMY) merged = r0;
      else merged = mergeTwo(r0, r1);
      tapes[outIdx].push(merged);
      frames.push(snap(tapes, 'merge'));
      if (t0.length === 0 || t1.length === 0) {
        const emptied = t0.length === 0 ? inputs[0] : inputs[1];
        if (countRealRuns() > 1) outIdx = emptied;
      }
    }
    let sorted = [];
    for (const t of tapes) for (const r of t) if (r !== DUMMY) sorted = r;
    frames.push(doneSnap(tapes));
    return { frames: frames, sorted: sorted };
  }

  const api = { naturalRuns: naturalRuns, polyphaseFrames: polyphaseFrames, mergeTwo: mergeTwo, SAMPLE: [5, 3, 8, 1, 9, 2, 7, 4, 6, 0] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.SortPolyphaseViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
