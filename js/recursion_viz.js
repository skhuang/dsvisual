(function (global) {
  'use strict';

  function makeRecorder() {
    let nextId = 0;
    const frames = [];
    const nodes = [];
    const stack = [];
    function call(label, parentId, depth) {
      const id = nextId++;
      nodes.push({ id: id, parentId: parentId, label: label, depth: depth, value: undefined, returned: false });
      stack.push(id);
      frames.push({ event: 'call', id: id, stack: stack.slice() });
      return id;
    }
    function ret(id, value) {
      const node = nodes[id];
      node.value = value; node.returned = true;
      frames.push({ event: 'return', id: id, value: value, stack: stack.slice() });
      stack.pop();
      return value;
    }
    return { call: call, ret: ret, frames: frames, nodes: nodes };
  }

  function fibTrace(n, rec) {
    function fib(k, parentId, depth) {
      const id = rec.call('fib(' + k + ')', parentId, depth);
      if (k < 2) return rec.ret(id, k);
      const a = fib(k - 1, id, depth + 1);
      const b = fib(k - 2, id, depth + 1);
      return rec.ret(id, a + b);
    }
    return fib(n, null, 0);
  }

  function reverseTrace(s, rec) {
    function rev(str, parentId, depth) {
      const id = rec.call('rev("' + str + '")', parentId, depth);
      if (str.length <= 1) return rec.ret(id, str);
      const sub = rev(str.slice(1), id, depth + 1);
      return rec.ret(id, sub + str[0]);
    }
    return rev(s, null, 0);
  }

  function permTrace(s, rec) {
    const out = [];
    function permute(prefix, rest, parentId, depth) {
      const id = rec.call('perm("' + prefix + '","' + rest + '")', parentId, depth);
      if (rest.length === 0) { out.push(prefix); return rec.ret(id, 1); }
      let cnt = 0;
      for (let i = 0; i < rest.length; i++) {
        cnt += permute(prefix + rest[i], rest.slice(0, i) + rest.slice(i + 1), id, depth + 1);
      }
      return rec.ret(id, cnt);
    }
    permute('', s, null, 0);
    return out;
  }

  function bsearchTrace(arr, target, rec) {
    function bs(lo, hi, parentId, depth) {
      const id = rec.call('bs(' + lo + ',' + hi + ')', parentId, depth);
      if (lo > hi) return rec.ret(id, -1);
      const mid = Math.floor((lo + hi) / 2);
      if (arr[mid] === target) return rec.ret(id, mid);
      if (arr[mid] < target) return rec.ret(id, bs(mid + 1, hi, id, depth + 1));
      return rec.ret(id, bs(lo, mid - 1, id, depth + 1));
    }
    return bs(0, arr.length - 1, null, 0);
  }

  function qsortTrace(arr, rec) {
    const a = arr.slice();
    function qs(lo, hi, parentId, depth) {
      const id = rec.call('qs(' + lo + '..' + hi + ')', parentId, depth);
      if (lo >= hi) return rec.ret(id, a.slice(lo, hi + 1));
      const pivot = a[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) { if (a[j] < pivot) { const t = a[i]; a[i] = a[j]; a[j] = t; i++; } }
      const t = a[i]; a[i] = a[hi]; a[hi] = t;
      const p = i;
      qs(lo, p - 1, id, depth + 1);
      qs(p + 1, hi, id, depth + 1);
      return rec.ret(id, a.slice(lo, hi + 1));
    }
    if (a.length) qs(0, a.length - 1, null, 0);
    return a;
  }

  const EXAMPLES = ['fibonacci', 'reverse', 'permutations', 'binary-search', 'quicksort'];
  const DEFAULTS = {
    fibonacci: { n: 5 },
    reverse: { text: 'ABCDE' },
    permutations: { text: 'ABC' },
    'binary-search': { arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 },
    quicksort: { arr: [5, 3, 8, 1, 9, 2, 7, 4] }
  };

  function recursionTrace(example, input) {
    const rec = makeRecorder();
    input = input || {};
    let result;
    if (example === 'fibonacci') result = fibTrace(Math.max(0, parseInt(input.n, 10) || 0), rec);
    else if (example === 'reverse') result = reverseTrace(String(input.text || ''), rec);
    else if (example === 'permutations') result = permTrace(String(input.text || ''), rec);
    else if (example === 'binary-search') { const arr = (input.arr || []).slice().sort((x, y) => x - y); result = bsearchTrace(arr, input.target, rec); }
    else if (example === 'quicksort') result = qsortTrace(input.arr || [], rec);
    else return null;
    return { frames: rec.frames, nodes: rec.nodes, result: result };
  }

  const api = { recursionTrace: recursionTrace, EXAMPLES: EXAMPLES, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.RecursionViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
