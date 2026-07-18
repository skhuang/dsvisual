(function (global) {
  const EMPTY = new Set(['-', '.', '_']);
  function tokenize(str) { return String(str).trim().split(/\s+/).filter((s) => s.length); }
  const isEmpty = (t) => EMPTY.has(t);

  function parseTree(tokens) {
    const slots = [null]; let size = 0;
    for (let k = 0; k < tokens.length; k++) {
      const i = k + 1;
      if (isEmpty(tokens[k])) slots[i] = null;
      else { slots[i] = tokens[k]; size = i; }
    }
    if (size === 0) return { root: null, error: null };
    if (slots[1] == null) return { root: null, error: 'root-missing' };
    for (let i = 2; i <= size; i++) if (slots[i] != null && slots[Math.floor(i / 2)] == null) return { root: null, error: 'orphan-child at index ' + i };
    let idc = 0; const nodeAt = {}; let root = null;
    for (let i = 1; i <= size; i++) {
      if (slots[i] != null) {
        const n = { id: 'n-' + (idc++), val: slots[i], idx: i, left: null, right: null };
        nodeAt[i] = n;
        if (i === 1) root = n;
        else { const p = Math.floor(i / 2); if (i % 2 === 0) nodeAt[p].left = n; else nodeAt[p].right = n; }
      }
    }
    return { root, error: null };
  }

  function deepCopy(n) {
    if (!n) return null;
    return { id: 'c-' + n.idx + '-' + n.val, val: n.val, idx: n.idx, left: deepCopy(n.left), right: deepCopy(n.right) };
  }

  function equal(s, t) {
    if (!s && !t) return { equal: true, reason: null };
    if (!s || !t) return { equal: false, reason: 'structural' };
    if (s.val !== t.val) return { equal: false, reason: 'value' };
    const L = equal(s.left, t.left); if (!L.equal) return L;
    return equal(s.right, t.right);
  }

  function errFrameMsg(error) {
    return error === 'root-missing'
      ? { zh: '輸入不合法:根(索引 1)不可為空', en: 'invalid: root (index 1) must be present' }
      : { zh: '輸入不合法:' + error, en: 'invalid: ' + error };
  }

  function buildCopyFrames(tokens) {
    const { root, error } = parseTree(tokens);
    const frames = [];
    const cloneSrc = (n) => n ? { id: n.id, val: n.val, idx: n.idx, left: cloneSrc(n.left), right: cloneSrc(n.right) } : null;
    const cloneCopy = (n) => n ? { id: n.id, val: n.val, left: cloneCopy(n.left), right: cloneCopy(n.right) } : null;
    if (error) {
      frames.push({ mode: 'copy', srcTree: null, copyTree: null, srcId: null, copyId: null, action: 'error', verdict: null, msg: errFrameMsg(error) });
      return { frames, root: null, copyRoot: null, error };
    }
    let copyRoot = null; let idc = 0;
    (function copy(src, link) {
      if (!src) return;
      const c = { id: 'cp-' + (idc++), val: src.val, left: null, right: null };
      if (!copyRoot) copyRoot = c;
      link(c);
      frames.push({ mode: 'copy', srcTree: cloneSrc(root), copyTree: cloneCopy(copyRoot), srcId: src.id, copyId: c.id, action: 'copy', verdict: null, msg: { zh: '複製節點 ' + src.val, en: 'copy node ' + src.val } });
      copy(src.left, (x) => { c.left = x; });
      copy(src.right, (x) => { c.right = x; });
    })(root, () => {});
    const eq = equal(root, copyRoot).equal;
    frames.push({ mode: 'copy', srcTree: cloneSrc(root), copyTree: cloneCopy(copyRoot), srcId: null, copyId: null, action: 'done', verdict: eq, msg: { zh: '複製完成;equal(原樹, 副本) = ' + (eq ? '相等 ✓' : '不相等 ✗'), en: 'copy complete; equal(original, copy) = ' + (eq ? 'yes ✓' : 'no ✗') } });
    return { frames, root, copyRoot, error: null };
  }

  function buildEqualFrames(tokensA, tokensB) {
    const ra = parseTree(tokensA), rb = parseTree(tokensB);
    const frames = [];
    if (ra.error || rb.error) {
      const which = ra.error ? 'A' : 'B';
      frames.push({ mode: 'equal', treeA: null, treeB: null, aId: null, bId: null, status: 'error', reason: null, verdict: null, msg: { zh: '樹 ' + which + ' 輸入不合法', en: 'tree ' + which + ' invalid input' } });
      return { frames, equal: false, reason: null, error: ra.error || rb.error };
    }
    const cloneT = (n) => n ? { id: n.id, val: n.val, idx: n.idx, left: cloneT(n.left), right: cloneT(n.right) } : null;
    const A = cloneT(ra.root), B = cloneT(rb.root);
    let mismatch = null;
    (function cmp(a, b) {
      if (mismatch) return;
      if (!a && !b) return;
      frames.push({ mode: 'equal', treeA: A, treeB: B, aId: a ? a.id : null, bId: b ? b.id : null, status: 'compare', reason: null, verdict: null, msg: { zh: '比較 ' + (a ? a.val : '∅') + ' 與 ' + (b ? b.val : '∅'), en: 'compare ' + (a ? a.val : '∅') + ' vs ' + (b ? b.val : '∅') } });
      if (!a || !b) { mismatch = { reason: 'structural', aId: a ? a.id : null, bId: b ? b.id : null }; return; }
      if (a.val !== b.val) { mismatch = { reason: 'value', aId: a.id, bId: b.id }; return; }
      cmp(a.left, b.left); cmp(a.right, b.right);
    })(ra.root, rb.root);
    const isEqual = !mismatch;
    if (isEqual) {
      frames.push({ mode: 'equal', treeA: A, treeB: B, aId: null, bId: null, status: 'equal', reason: null, verdict: true, msg: { zh: '兩棵樹相等 ✓', en: 'trees are equal ✓' } });
    } else {
      frames.push({ mode: 'equal', treeA: A, treeB: B, aId: mismatch.aId, bId: mismatch.bId, status: 'mismatch', reason: mismatch.reason, verdict: false, msg: { zh: '不相等 — ' + (mismatch.reason === 'value' ? '節點值不同' : '結構不同') + ' ✗', en: 'differ — ' + mismatch.reason + ' mismatch ✗' } });
    }
    return { frames, equal: isEqual, reason: mismatch ? mismatch.reason : null, error: null };
  }

  const api = { tokenize, parseTree, deepCopy, equal, buildCopyFrames, buildEqualFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeCopyEqualViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
