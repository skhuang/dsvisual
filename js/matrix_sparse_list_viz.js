(function (global) {
  'use strict';

  var MAX = 6;

  function parse(text) {
    var rows = String(text || '').split(';').map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
    var grid = rows.map(function (r) {
      return r.split(',').map(function (c) { var n = parseInt(c.trim(), 10); return Number.isFinite(n) ? n : 0; });
    });
    grid = grid.slice(0, MAX).map(function (r) { return r.slice(0, MAX); });
    return grid.length ? grid : [[0]];
  }

  function build(grid) {
    var rows = grid.length;
    var cols = grid.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var nodes = [];
    var rowChains = []; for (var r = 0; r < rows; r++) rowChains.push([]);
    var colChains = []; for (var c = 0; c < cols; c++) colChains.push([]);
    var id = 0;
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        var v = grid[i][j];
        if (v && v !== 0) {
          nodes.push({ id: id, row: i, col: j, val: v });
          rowChains[i].push(id);
          id++;
        }
      }
    }
    nodes.forEach(function (n) { colChains[n.col].push(n.id); });
    return { rows: rows, cols: cols, nodes: nodes, rowChains: rowChains, colChains: colChains };
  }

  function buildFrames(grid) {
    var built = build(grid);
    var frames = [];
    var acc = [];
    built.nodes.forEach(function (n) {
      acc.push({ id: n.id, row: n.row, col: n.col, val: n.val });
      frames.push({
        type: 'insert', nodeId: n.id, row: n.row, col: n.col, val: n.val,
        nodes: acc.map(function (x) { return { id: x.id, row: x.row, col: x.col, val: x.val }; })
      });
    });
    frames.push({ type: 'done', nodes: built.nodes.map(function (x) { return { id: x.id, row: x.row, col: x.col, val: x.val }; }) });
    return { frames: frames, built: built };
  }

  function transposeGrid(grid) {
    var rows = grid.length;
    var cols = grid.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var out = [];
    for (var c = 0; c < cols; c++) {
      var row = [];
      for (var r = 0; r < rows; r++) row.push((grid[r][c] != null) ? grid[r][c] : 0);
      out.push(row);
    }
    return out;
  }

  function transpose(built) {
    var rows = built.rows, cols = built.cols;
    var grid = []; for (var r = 0; r < rows; r++) { var g = []; for (var c = 0; c < cols; c++) g.push(0); grid.push(g); }
    built.nodes.forEach(function (n) { grid[n.row][n.col] = n.val; });
    return build(transposeGrid(grid));
  }

  var DEFAULT = '0,0,3,0;5,0,0,0;0,2,0,4';

  var api = { parse: parse, build: build, buildFrames: buildFrames, transposeGrid: transposeGrid, transpose: transpose, DEFAULT: DEFAULT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MatrixSparseListViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
