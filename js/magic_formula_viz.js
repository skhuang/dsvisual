(function (global) {
  const mod = (x, m) => ((x % m) + m) % m;
  const coeffs = (n) => ({ cA: (n - 1) / 2, cB: n - 1 });
  const aAt = (n, i, j) => { const { cA } = coeffs(n); return mod(i - j + cA, n); };
  const bAt = (n, i, j) => { const { cB } = coeffs(n); return mod(i - 2 * j + cB, n); };
  const valueAt = (n, i, j) => n * aAt(n, i, j) + bAt(n, i, j) + 1;

  function buildFrames(n, i, j) {                 // query one cell (i,j)
    const { cA, cB } = coeffs(n);
    const a = aAt(n, i, j), b = bAt(n, i, j), value = valueAt(n, i, j);
    const frames = [
      { mode: 'query', phase: 'pick', n, i, j, a: null, b: null, value: null,
        msg: { en: `Query cell (row ${i}, col ${j}) — no array stored`, zh: `查詢格 (第 ${i} 列, 第 ${j} 欄) — 未儲存任何陣列` } },
      { mode: 'query', phase: 'a', n, i, j, a, b: null, value: null, expr: `a = (${i} − ${j} + ${cA}) mod ${n} = ${a}`,
        msg: { en: `high digit a = (i − j + ${cA}) mod ${n} = ${a}`, zh: `高位 a = (i − j + ${cA}) mod ${n} = ${a}` } },
      { mode: 'query', phase: 'b', n, i, j, a, b, value: null, expr: `b = (${i} − 2·${j} + ${cB}) mod ${n} = ${b}`,
        msg: { en: `low digit b = (i − 2j + ${cB}) mod ${n} = ${b}`, zh: `低位 b = (i − 2j + ${cB}) mod ${n} = ${b}` } },
      { mode: 'query', phase: 'value', n, i, j, a, b, value, expr: `value = ${n}·${a} + ${b} + 1 = ${value}`,
        msg: { en: `value = n·a + b + 1 = ${value}  (O(1), no array)`, zh: `值 = n·a + b + 1 = ${value}(O(1),不需陣列)` } },
    ];
    return { frames, value, a, b };
  }

  function fillAllFrames(n) {
    const cells = [];
    const frames = [{ mode: 'fill', phase: 'start', n, cells: [],
      msg: { en: 'Fill every cell by the O(1) formula — independently', zh: '用 O(1) 公式逐格獨立算出' } }];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      cells.push({ i, j, value: valueAt(n, i, j) });
      frames.push({ mode: 'fill', phase: 'cell', n, i, j, value: valueAt(n, i, j), cells: cells.slice(),
        msg: { en: `(${i},${j}) → ${valueAt(n, i, j)}`, zh: `(${i},${j}) → ${valueAt(n, i, j)}` } });
    }
    frames.push({ mode: 'fill', phase: 'done', n, cells: cells.slice(),
      msg: { en: `Filled ${n * n} cells, each O(1) — O(n²) time, O(1) extra space`,
             zh: `共 ${n * n} 格,每格 O(1) — 時間 O(n²)、額外空間 O(1)` } });
    return { frames };
  }

  const api = { valueAt, aAt, bAt, buildFrames, fillAllFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicFormulaViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
