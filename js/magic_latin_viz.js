(function (global) {
  // Odd-order magic square via the Siamese/Coxeter rule (dsvisual up-left variant).
  function siamese(n) {
    const sq = Array.from({ length: n }, () => Array(n).fill(0));
    let row = 0, col = (n / 2) | 0;
    for (let v = 1; v <= n * n; v++) {
      sq[row][col] = v;
      const up = (row - 1 + n) % n, left = (col - 1 + n) % n;
      if (sq[up][left] !== 0) row = (row + 1) % n; else { row = up; col = left; }
    }
    return sq;
  }
  const sum = (arr) => arr.reduce((x, y) => x + y, 0);
  const isPerm = (arr) => { const s = [...arr].sort((x, y) => x - y); return s.every((x, i) => x === i); };

  function buildFrames(n) {
    const square = siamese(n);
    const magicSum = n * (n * n + 1) / 2;
    const a = square.map((r) => r.map((v) => Math.floor((v - 1) / n)));
    const b = square.map((r) => r.map((v) => (v - 1) % n));
    const frames = [];
    frames.push({ phase: 'split', r: -1, c: -1, count: 0, magicSum,
      msg: { en: 'Split each value: v = n·a + b + 1', zh: '把每格拆解:v = n·a + b + 1' } });
    let count = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      count++;
      const v = square[r][c];
      frames.push({ phase: 'split', r, c, count, v, a: a[r][c], b: b[r][c], magicSum,
        msg: { en: `${v} = ${n}·${a[r][c]} + ${b[r][c]} + 1`, zh: `${v} = ${n}·${a[r][c]} + ${b[r][c]} + 1` } });
    }
    for (let i = 0; i < n; i++) {
      frames.push({ phase: 'verify', kind: 'row', index: i, aSum: sum(a[i]), bSum: sum(b[i]),
        lineSum: sum(square[i]), isPerm: isPerm(a[i]) && isPerm(b[i]), magicSum,
        msg: { en: `row ${i}: n·${sum(a[i])} + ${sum(b[i])} + ${n} = ${sum(square[i])}`,
               zh: `第 ${i} 列:n·${sum(a[i])} + ${sum(b[i])} + ${n} = ${sum(square[i])}` } });
    }
    for (let j = 0; j < n; j++) {
      const col = square.map((r) => r[j]), aC = a.map((r) => r[j]), bC = b.map((r) => r[j]);
      frames.push({ phase: 'verify', kind: 'col', index: j, aSum: sum(aC), bSum: sum(bC),
        lineSum: sum(col), isPerm: isPerm(aC) && isPerm(bC), magicSum,
        msg: { en: `col ${j} → ${sum(col)}`, zh: `第 ${j} 欄 → ${sum(col)}` } });
    }
    const diag = [], anti = [];
    for (let i = 0; i < n; i++) { diag.push(square[i][i]); anti.push(square[i][n - 1 - i]); }
    frames.push({ phase: 'verify', kind: 'diag', index: 0, lineSum: sum(diag), magicSum,
      msg: { en: `main diagonal → ${sum(diag)}`, zh: `主對角線 → ${sum(diag)}` } });
    frames.push({ phase: 'verify', kind: 'anti', index: 0, lineSum: sum(anti), magicSum,
      msg: { en: `anti-diagonal → ${sum(anti)}`, zh: `反對角線 → ${sum(anti)}` } });
    frames.push({ phase: 'done', magicSum,
      msg: { en: `every row/col/diagonal = ${magicSum}`, zh: `每列/欄/對角線都 = ${magicSum}` } });
    return { frames, square, a, b, magicSum };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicLatinViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
