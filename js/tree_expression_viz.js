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

  const OP_GLYPH = { '&': '∧', '|': '∨', '!': '¬', '^': '⊕', '>': '→' };
  const BOOL_ARITY = { '!': 1, '&': 2, '|': 2, '^': 2, '>': 2 };
  const isBoolOp = (t) => Object.prototype.hasOwnProperty.call(BOOL_ARITY, t);
  const isConst = (t) => t === '0' || t === '1';

  function buildBoolExprTreeFrames(tokens) {
    let idc = 0;
    const node = (val, left, right) => ({ id: 'bx-' + (idc++), val: val, left: left || null, right: right || null });
    const clone = (n) => n ? { id: n.id, val: n.val, left: clone(n.left), right: clone(n.right) } : null;
    const stack = [];
    const frames = [];
    const varset = {};
    const snap = (token, action, msg) => frames.push({ token, action, forest: stack.map(clone), msg });

    snap(null, 'start', { zh: '開始由後序式建立布林運算式樹', en: 'Begin building the boolean expression tree from postfix' });
    let error = null;
    for (const t of tokens) {
      if (isBoolOp(t)) {
        const arity = BOOL_ARITY[t];
        if (stack.length < arity) { error = t; break; }
        if (arity === 1) {
          const c = stack.pop();
          stack.push(node(t, c, null));
          snap(t, 'not', { zh: '一元運算子 ¬:彈出一棵子樹取反', en: 'Unary ¬: pop one subtree and negate' });
        } else {
          const r = stack.pop(), l = stack.pop();
          stack.push(node(t, l, r));
          snap(t, 'combine', { zh: '運算子 ' + OP_GLYPH[t] + ':彈出兩棵子樹合併', en: 'Operator ' + OP_GLYPH[t] + ': pop two subtrees and combine' });
        }
      } else {
        if (!isConst(t)) varset[t] = true;
        stack.push(node(t, null, null));
        snap(t, 'leaf', { zh: (isConst(t) ? '常數 ' : '變數 ') + t + ':建立葉節點', en: (isConst(t) ? 'Constant ' : 'Variable ') + t + ': create a leaf' });
      }
    }
    let root = null;
    if (error) {
      snap(error, 'error', { zh: '輸入不合法:運算元不足', en: 'Invalid input: not enough operands' });
    } else if (stack.length === 1) {
      root = stack[0];
      snap(null, 'done', { zh: '完成,布林運算式樹建立完畢', en: 'Done; boolean expression tree built' });
    } else {
      snap(null, 'error', { zh: '輸入不合法:剩餘多於一棵子樹', en: 'Invalid input: more than one subtree remains' });
    }
    return { frames, root, vars: Object.keys(varset).sort() };
  }

  function evalBoolExprTree(root, asg) {
    if (!root) return 0;
    if (!root.left && !root.right) {
      if (root.val === '1') return 1;
      if (root.val === '0') return 0;
      return asg && asg[root.val] ? 1 : 0;
    }
    if (root.val === '!') return evalBoolExprTree(root.left, asg) ? 0 : 1;
    const a = evalBoolExprTree(root.left, asg), b = evalBoolExprTree(root.right, asg);
    if (root.val === '&') return (a && b) ? 1 : 0;
    if (root.val === '|') return (a || b) ? 1 : 0;
    if (root.val === '^') return (a !== b) ? 1 : 0;
    if (root.val === '>') return (!a || b) ? 1 : 0;
    return 0;
  }

  function buildTruthTableFrames(root, vars) {
    const k = vars.length, total = 1 << k;
    const frames = [], rows = [];
    for (let mask = 0; mask < total; mask++) {
      const asg = {};
      for (let i = 0; i < k; i++) asg[vars[i]] = (mask >> (k - 1 - i)) & 1;  // MSB = vars[0]
      const value = evalBoolExprTree(root, asg);
      rows.push({ asg: Object.assign({}, asg), value });
      const line = vars.map((v) => v + '=' + asg[v]).join(', ');
      frames.push({
        action: 'ttrow', asg: Object.assign({}, asg), value,
        rowsSoFar: rows.map((r) => ({ asg: Object.assign({}, r.asg), value: r.value })),
        msg: { zh: '指派 ' + line + ' → ' + value, en: 'Assign ' + line + ' → ' + value },
      });
    }
    const allTrue = rows.every((r) => r.value === 1);
    const allFalse = rows.every((r) => r.value === 0);
    const verdict = allTrue ? 'tautology' : (allFalse ? 'contradiction' : 'contingent');
    const satisfiable = verdict !== 'contradiction';
    frames.push({
      action: 'verdict', verdict, satisfiable, rowsSoFar: rows.slice(),
      msg: {
        zh: '結論:' + (verdict === 'tautology' ? '恆真(tautology)' : verdict === 'contradiction' ? '矛盾,不可滿足(contradiction)' : '可滿足但非恆真(contingent)'),
        en: 'Verdict: ' + verdict + (satisfiable ? ' — satisfiable' : ' — unsatisfiable'),
      },
    });
    return { frames, rows, verdict, satisfiable };
  }

  const api = { tokenizePostfix, buildExprTreeFrames, evalExprTree, buildBoolExprTreeFrames, evalBoolExprTree, buildTruthTableFrames, OP_GLYPH, BOOL_ARITY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ExprTreeViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
