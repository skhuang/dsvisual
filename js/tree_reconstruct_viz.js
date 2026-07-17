(function (global) {
  function tokenize(str) { return String(str).trim().split(/\s+/).filter((s) => s.length); }

  function reconstructedInorder(root) {
    const out = [];
    (function go(n) { if (!n) return; go(n.left); out.push(n.val); go(n.right); })(root);
    return out.join(' ');
  }

  function allDistinct(a) { return new Set(a).size === a.length; }
  function sameKeySet(a, b) {
    if (a.length !== b.length) return false;
    const s = {}; a.forEach((k) => { s[k] = (s[k] || 0) + 1; });
    for (const k of b) { if (!s[k]) return false; s[k]--; }
    return true;
  }

  function buildReconstructFrames(s1, s2, mode) {
    const seq1 = tokenize(s1), seq2 = tokenize(s2);
    const frames = [];
    const fail = (zh, en) => {
      frames.push({ root1: null, range2: null, splitAt: null, tree: null, created: null, action: 'error', msg: { zh, en } });
      return { frames, root: null, error: en };
    };
    if (!seq1.length || !seq2.length) return fail('輸入不可為空', 'inputs must be non-empty');
    if (seq1.length !== seq2.length) return fail('兩序列長度不同', 'the two sequences have different lengths');
    if (!allDistinct(seq1) || !allDistinct(seq2)) return fail('鍵值須相異', 'keys must be distinct');
    if (!sameKeySet(seq1, seq2)) return fail('兩序列的鍵值集合不同', 'the two sequences have different key sets');

    let idc = 0;
    const node = (val) => ({ id: 'rc-' + (idc++), val, left: null, right: null });
    const clone = (n) => n ? { id: n.id, val: n.val, left: clone(n.left), right: clone(n.right) } : null;
    let root = null;
    let ambiguous = false;
    const snap = (created, root1, range2, splitAt, msg) =>
      frames.push({ root1, range2, splitAt, tree: clone(root), created: created.id, action: 'build', msg });

    if (mode === 'pre-in' || mode === 'post-in') {
      const inorder = seq2;
      const posIn = {}; inorder.forEach((k, i) => { posIn[k] = i; });
      if (mode === 'pre-in') {
        const pre = seq1; let preIdx = 0;
        (function build(lo, hi, link) {
          if (lo > hi) return;
          const rootVal = pre[preIdx]; const r1 = preIdx; preIdx++;
          const n = node(rootVal); if (!root) root = n; link(n);
          const m = posIn[rootVal];
          snap(n, r1, [lo, hi], m, { zh: '前序頭 ' + rootVal + ' 為根;於中序 [' + lo + ',' + hi + '] 定位並切分左右', en: 'preorder head ' + rootVal + ' is the root; locate it in inorder [' + lo + ',' + hi + '] to split L/R' });
          build(lo, m - 1, (c) => { n.left = c; });
          build(m + 1, hi, (c) => { n.right = c; });
        })(0, inorder.length - 1, () => {});
      } else {
        const post = seq1; let postIdx = post.length - 1;
        (function build(lo, hi, link) {
          if (lo > hi) return;
          const rootVal = post[postIdx]; const r1 = postIdx; postIdx--;
          const n = node(rootVal); if (!root) root = n; link(n);
          const m = posIn[rootVal];
          snap(n, r1, [lo, hi], m, { zh: '後序尾 ' + rootVal + ' 為根;於中序 [' + lo + ',' + hi + '] 定位並切分左右', en: 'postorder tail ' + rootVal + ' is the root; locate it in inorder [' + lo + ',' + hi + '] to split L/R' });
          build(m + 1, hi, (c) => { n.right = c; });   // right first (postorder back-to-front)
          build(lo, m - 1, (c) => { n.left = c; });
        })(0, inorder.length - 1, () => {});
      }
    } else if (mode === 'pre-post') {
      const pre = seq1, post = seq2; let preIdx = 0;
      const posPost = {}; post.forEach((k, i) => { posPost[k] = i; });
      (function build(lo, hi, link) {   // lo..hi is a postorder subrange
        if (lo > hi) return;
        const rootVal = pre[preIdx]; const r1 = preIdx; preIdx++;
        const n = node(rootVal); if (!root) root = n; link(n);
        if (lo === hi) { snap(n, r1, [lo, hi], lo, { zh: '前序 ' + rootVal + ':後序子範圍僅一元素 → 葉節點', en: 'preorder ' + rootVal + ': postorder subrange has one element → leaf' }); return; }
        const leftRootVal = pre[preIdx];
        const j = posPost[leftRootVal];
        const leftSize = j - lo + 1;
        snap(n, r1, [lo, hi], j, { zh: '前序 ' + rootVal + ' 為根;下一前序 ' + leftRootVal + ' 於後序位置 ' + j + ' → 左子樹大小 ' + leftSize, en: 'preorder ' + rootVal + ' is root; next preorder ' + leftRootVal + ' at postorder ' + j + ' → left-subtree size ' + leftSize });
        build(lo, j, (c) => { n.left = c; });
        if (j + 1 <= hi - 1) build(j + 1, hi - 1, (c) => { n.right = c; });
        else ambiguous = true;   // single child → not a full binary tree
      })(0, post.length - 1, () => {});
      if (ambiguous) {
        frames.push({ root1: null, range2: null, splitAt: null, tree: clone(root), created: null, action: 'error', msg: { zh: '前序+後序僅對「完全二元樹(每節點 0 或 2 子)」唯一;此輸入含單子節點 → 不唯一', en: 'preorder+postorder is unique only for FULL binary trees (0 or 2 children); this input has a single-child node → ambiguous' } });
        return { frames, root: null, error: 'ambiguous (needs full binary tree)' };
      }
    } else {
      return fail('未知模式', 'unknown mode');
    }

    frames.push({ root1: null, range2: null, splitAt: null, tree: clone(root), created: null, action: 'done', msg: { zh: '完成;重建中序 = ' + reconstructedInorder(root), en: 'done; reconstructed inorder = ' + reconstructedInorder(root) } });
    return { frames, root, error: null };
  }

  const api = { tokenize, buildReconstructFrames, reconstructedInorder };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeReconstructViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
