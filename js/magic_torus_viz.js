(function (global) {
  function buildFrames(n) {
    const sq = Array.from({ length: n }, () => Array(n).fill(0));
    let row = 0, col = (n / 2) | 0;
    const cells = [], steps = [];        // cells in fill order (v = index+1); steps[i] = i→i+1 transition
    for (let v = 1; v <= n * n; v++) {
      sq[row][col] = v; cells.push({ row, col });
      if (v < n * n) {
        const up = (row - 1 + n) % n, left = (col - 1 + n) % n;
        if (sq[up][left] !== 0) { row = (row + 1) % n; steps.push('break'); }
        else { row = up; col = left; steps.push('run'); }
      }
    }
    const path = []; let runIndex = 0, px = 0, py = 0;
    for (let i = 0; i < cells.length; i++) {
      const { row: r, col: c } = cells[i];
      const prev = i > 0 ? steps[i - 1] : 'start';
      if (prev === 'run') { px -= 1; py -= 1; }          // straight up-left on the plane
      else { if (prev === 'break') runIndex += 1; px = c + n; py = r + n; } // start/break: anchor to center tile
      path.push({ v: i + 1, row: r, col: c, runIndex, stepType: prev, planeX: px, planeY: py });
    }
    const runs = runIndex + 1;
    const frames = [{ phase: 'start', index: -1, runs, n,
      msg: { en: `${n}×${n} board tiled 3×3 — fill starts`, zh: `${n}×${n} 方陣 3×3 拼貼 — 開始填數` } }];
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const tag = p.stepType === 'break' ? 'break ↓' : (p.stepType === 'run' ? 'up-left ↖' : 'start');
      frames.push({ phase: 'fill', index: i, cell: p, runs, n,
        msg: { en: `#${p.v} → (${p.row},${p.col})  [${tag}]  run ${p.runIndex + 1}/${runs}`,
               zh: `#${p.v} → (${p.row},${p.col})  [${tag}]  第 ${p.runIndex + 1}/${runs} 條斜線` } });
    }
    frames.push({ phase: 'done', runs, n,
      msg: { en: `${runs} straight diagonals (broken diagonals of the torus) + ${runs - 1} break jumps`,
             zh: `${runs} 條直斜線(環面的斷裂對角線)+ ${runs - 1} 次 break 跳躍` } });
    return { frames, square: sq, path, runs, n };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicTorusViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
