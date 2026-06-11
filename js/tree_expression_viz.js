(function (global) {
  const isOp = (t) => t === '+' || t === '-' || t === '*' || t === '/';

  function tokenizePostfix(str) {
    return String(str).trim().split(/\s+/).filter((s) => s.length);
  }

  function buildExprTreeFrames(tokens) {
    let idc = 0;
    const node = (val, left, right) => ({ id: 'ex-' + (idc++), val: val, left: left || null, right: right || null });
    const clone = (n) => n ? { id: n.id, val: n.val, left: clone(n.left), right: clone(n.right) } : null;
    const stack = [];
    const frames = [];
    const snap = (token, action, msg) => frames.push({ token, action, forest: stack.map(clone), msg });

    snap(null, 'start', { zh: '開始由後序式建立運算式樹', en: 'Begin building the expression tree from postfix' });
    for (const t of tokens) {
      if (isOp(t)) {
        const r = stack.pop() || null;
        const l = stack.pop() || null;
        stack.push(node(t, l, r));
        snap(t, 'combine', { zh: '運算子 ' + t + ':彈出兩棵子樹合併', en: 'Operator ' + t + ': pop two subtrees and combine' });
      } else {
        stack.push(node(t, null, null));
        snap(t, 'leaf', { zh: '運算元 ' + t + ':建立葉節點並推入', en: 'Operand ' + t + ': create a leaf and push' });
      }
    }
    const root = stack.length === 1 ? stack[0] : null;
    snap(null, 'done', { zh: '完成,運算式樹建立完畢', en: 'Done; expression tree built' });
    return { frames, root };
  }

  function evalExprTree(root) {
    if (!root) return NaN;
    if (!root.left && !root.right) { const v = parseFloat(root.val); return Number.isNaN(v) ? NaN : v; }
    const a = evalExprTree(root.left), b = evalExprTree(root.right);
    if (root.val === '+') return a + b;
    if (root.val === '-') return a - b;
    if (root.val === '*') return a * b;
    if (root.val === '/') return b === 0 ? NaN : a / b;
    return NaN;
  }

  const api = { tokenizePostfix, buildExprTreeFrames, evalExprTree };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ExprTreeViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
