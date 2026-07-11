(function (global) {
  const OPS = ['id', 'r90', 'r180', 'r270', 'flipH', 'flipV', 'transpose', 'antiT'];
  const DEST = {              // forward map: old (r,c) → new (row,col)
    id: (r, c, n) => [r, c],
    r90: (r, c, n) => [c, n - 1 - r],
    r180: (r, c, n) => [n - 1 - r, n - 1 - c],
    r270: (r, c, n) => [n - 1 - c, r],
    flipH: (r, c, n) => [r, n - 1 - c],
    flipV: (r, c, n) => [n - 1 - r, c],
    transpose: (r, c, n) => [c, r],
    antiT: (r, c, n) => [n - 1 - c, n - 1 - r],
  };
  function siamese(n) {
    const sq = Array.from({ length: n }, () => Array(n).fill(0));
    let r = 0, c = (n / 2) | 0;
    for (let v = 1; v <= n * n; v++) {
      sq[r][c] = v; const u = (r - 1 + n) % n, l = (c - 1 + n) % n;
      if (sq[u][l] !== 0) r = (r + 1) % n; else { r = u; c = l; }
    }
    return sq;
  }
  function applyOp(square, op, n) {
    const g = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const [tr, tc] = DEST[op](r, c, n); g[tr][tc] = square[r][c]; }
    return g;
  }
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  function lineSums(g, n) {
    const rows = g.map((row) => sum(row));
    const cols = g[0].map((_, j) => sum(g.map((row) => row[j])));
    let d = 0, a = 0; for (let i = 0; i < n; i++) { d += g[i][i]; a += g[i][n - 1 - i]; }
    return { rows, cols, diag: d, anti: a };
  }
  function isMagic(g, n) { const M = n * (n * n + 1) / 2; const s = lineSums(g, n);
    return s.rows.every((x) => x === M) && s.cols.every((x) => x === M) && s.diag === M && s.anti === M; }

  function orbit(n) {
    const base = siamese(n); const seen = new Map();
    for (const op of OPS) { const g = applyOp(base, op, n); const key = g.map((r) => r.join(',')).join(';'); if (!seen.has(key)) seen.set(key, g); }
    return { size: seen.size, squares: [...seen.values()] };
  }

  function buildFrames(n, op) {
    const original = siamese(n);
    const transformed = applyOp(original, op, n);
    const magicSum = n * (n * n + 1) / 2;
    const mapping = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const [tr, tc] = DEST[op](r, c, n); mapping.push({ fromR: r, fromC: c, toR: tr, toC: tc, value: original[r][c] }); }
    const s = lineSums(transformed, n);
    const frames = [
      { phase: 'show', op, original, transformed, magicSum, msg: { en: `operation: ${op}`, zh: `操作:${op}` } },
      { phase: 'apply', op, original, transformed, mapping, magicSum, msg: { en: `remap every cell by ${op}`, zh: `把每格依 ${op} 重新映射` } },
    ];
    for (let i = 0; i < n; i++) frames.push({ phase: 'verify', kind: 'row', index: i, lineSum: s.rows[i], magicSum,
      msg: { en: `row ${i} → ${s.rows[i]}`, zh: `第 ${i} 列 → ${s.rows[i]}` } });
    for (let j = 0; j < n; j++) frames.push({ phase: 'verify', kind: 'col', index: j, lineSum: s.cols[j], magicSum,
      msg: { en: `col ${j} → ${s.cols[j]}`, zh: `第 ${j} 欄 → ${s.cols[j]}` } });
    frames.push({ phase: 'verify', kind: 'diag', lineSum: s.diag, magicSum, msg: { en: `main diagonal → ${s.diag}`, zh: `主對角線 → ${s.diag}` } });
    frames.push({ phase: 'verify', kind: 'anti', lineSum: s.anti, magicSum, msg: { en: `anti-diagonal → ${s.anti}`, zh: `反對角線 → ${s.anti}` } });
    const stillMagic = isMagic(transformed, n);
    frames.push({ phase: 'done', op, transformed, stillMagic, magicSum,
      msg: { en: `${stillMagic ? 'still magic' : 'NOT magic'} (all lines = ${magicSum})`, zh: `${stillMagic ? '仍是魔方陣' : '不是魔方陣'}(每條線 = ${magicSum})` } });
    return { frames, original, transformed, magicSum, stillMagic };
  }

  const api = { OPS, applyOp, orbit, buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicSymmetryViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
