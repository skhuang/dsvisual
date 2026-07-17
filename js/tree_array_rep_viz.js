(function (global) {
  const EMPTY = new Set(['-', '.', '_']);
  function tokenize(str) { return String(str).trim().split(/\s+/).filter((s) => s.length); }
  const isEmpty = (t) => EMPTY.has(t);

  function parseLevelArray(tokens) {
    const slots = [null];               // index 0 unused
    let size = 0;
    for (let k = 0; k < tokens.length; k++) {
      const i = k + 1;
      if (isEmpty(tokens[k])) slots[i] = { idx: i, val: null };
      else { slots[i] = { idx: i, val: tokens[k] }; size = i; }
    }
    if (size === 0) return { slots, size: 0, error: null };
    if (!slots[1] || slots[1].val === null) return { slots, size, error: 'root-missing' };
    for (let i = 2; i <= size; i++) {
      if (slots[i] && slots[i].val !== null) {
        const p = Math.floor(i / 2);
        if (!slots[p] || slots[p].val === null) return { slots, size, error: 'orphan-child at index ' + i };
      }
    }
    return { slots, size, error: null };
  }

  function buildArrayRepFrames(tokens) {
    const { slots, size, error } = parseLevelArray(tokens);
    const frames = [];
    const clone = (n) => n ? { id: n.id, val: n.val, idx: n.idx, left: clone(n.left), right: clone(n.right) } : null;

    if (error) {
      const msg = error === 'root-missing'
        ? { zh: '輸入不合法:根(索引 1)不可為空', en: 'invalid: root (index 1) must be present' }
        : { zh: '輸入不合法:' + error + '(子節點需要父節點 ⌊i/2⌋ 存在)', en: 'invalid: ' + error + ' (a child requires its parent ⌊i/2⌋)' };
      frames.push({ placedUpTo: 0, current: null, parent: null, left: null, right: null, tree: null, wastedSoFar: 0, action: 'error', msg });
      return { frames, root: null, slots, size, nodeCount: 0, wasted: 0, error };
    }
    if (size === 0) {
      frames.push({ placedUpTo: 0, current: null, parent: null, left: null, right: null, tree: null, wastedSoFar: 0, action: 'done', msg: { zh: '空樹', en: 'empty tree' } });
      return { frames, root: null, slots, size: 0, nodeCount: 0, wasted: 0, error: null };
    }

    const nodeAt = {};
    let root = null, wasted = 0;
    for (let i = 1; i <= size; i++) {
      const s = slots[i];
      if (s && s.val !== null) {
        const n = { id: 'ar-' + i, val: s.val, idx: i, left: null, right: null };
        nodeAt[i] = n;
        if (i === 1) root = n;
        else { const p = Math.floor(i / 2); if (i % 2 === 0) nodeAt[p].left = n; else nodeAt[p].right = n; }
        frames.push({
          placedUpTo: i, current: i, parent: i === 1 ? null : Math.floor(i / 2), left: 2 * i, right: 2 * i + 1,
          tree: clone(root), wastedSoFar: wasted, action: 'place',
          msg: {
            zh: '索引 ' + i + ' 放入 ' + s.val + (i === 1 ? '(根)' : ';父 ⌊' + i + '/2⌋=' + Math.floor(i / 2)) + ',左 2·' + i + '=' + (2 * i) + ',右 2·' + i + '+1=' + (2 * i + 1),
            en: 'index ' + i + ' ← ' + s.val + (i === 1 ? ' (root)' : '; parent ⌊' + i + '/2⌋=' + Math.floor(i / 2)) + ', left 2·' + i + '=' + (2 * i) + ', right 2·' + i + '+1=' + (2 * i + 1),
          },
        });
      } else {
        wasted++;
        frames.push({ placedUpTo: i, current: i, parent: null, left: null, right: null, tree: clone(root), wastedSoFar: wasted, action: 'skip', msg: { zh: '索引 ' + i + ' 為空 → 浪費的槽', en: 'index ' + i + ' empty → wasted slot' } });
      }
    }
    const nodeCount = size - wasted;
    frames.push({ placedUpTo: size, current: null, parent: null, left: null, right: null, tree: clone(root), wastedSoFar: wasted, action: 'done', msg: { zh: '完成;節點 ' + nodeCount + ',槽 ' + size + ',浪費 ' + wasted, en: 'done; nodes ' + nodeCount + ', slots ' + size + ', wasted ' + wasted } });
    return { frames, root, slots, size, nodeCount, wasted, error: null };
  }

  function arrayIndexOfNode(root, id) {
    let found = null;
    (function go(n) { if (!n || found !== null) return; if (n.id === id) { found = n.idx; return; } go(n.left); go(n.right); })(root);
    return found;
  }

  const api = { tokenize, parseLevelArray, buildArrayRepFrames, arrayIndexOfNode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeArrayRepViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
