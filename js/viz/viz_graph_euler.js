(function (global) {
  'use strict';
  const K = () => global.VizKit;
  const L = (zh, en) => {
    try { return global.I18N && I18N.getCurrentLanguage() === 'zh' ? zh : en; }
    catch (error) { return en; }
  };

  function loadExamples(methodId) {
    try { return ExamplesStore.load(localStorage, methodId); } catch (error) { return []; }
  }
  function saveExample(methodId, text, defaultText) {
    try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (error) { /* storage may be unavailable */ }
  }
  function escapeAttribute(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
  function escapeText(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function buildExamplesSelect(methodId, defaultText) {
    const truncate = (text) => String(text).length > 28 ? String(text).slice(0, 28) + '…' : String(text);
    let html = '<select class="ex-select" data-method="' + methodId + '">';
    html += '<option value="">' + L('範例…', 'Examples…') + '</option>';
    html += '<option value="' + escapeAttribute(defaultText) + '">' + L('目前難度預設', 'Current difficulty default') + '</option>';
    loadExamples(methodId).forEach((entry) => {
      if (entry.text === defaultText) return;
      html += '<option value="' + escapeAttribute(entry.text) + '">' + escapeText(truncate(entry.text)) + '</option>';
    });
    return html + '</select>';
  }

  function edgesToText(edges) {
    return edges.map((edge) => edge.u + '-' + edge.v).join(',');
  }
  function serialize(config) {
    return [config.n, config.start, edgesToText(config.edges)].join('|');
  }
  function deserialize(text) {
    const parts = String(text).split('|');
    return global.GraphEulerViz.parseInput(parts[0], parts.slice(2).join('|'), parts[1]);
  }
  function configOnly(parsed) {
    return { n: parsed.n, start: parsed.start, edges: parsed.edges };
  }

  const state = {
    config: global.GraphEulerViz.cloneConfig(global.GraphEulerViz.SAMPLE),
    errors: [], warnings: [], tier: null, userEdited: false,
  };

  function syncDifficultyPreset() {
    const inputDifficulty = K().getInputDifficulty ? K().getInputDifficulty() : 'normal';
    const tier = inputDifficulty === 'normal' ? 'normal' : 'challenge';
    if (state.tier === null || (!state.userEdited && state.tier !== tier)) {
      state.config = global.GraphEulerViz.presetForDifficulty(tier);
      state.errors = [];
      state.warnings = [];
    }
    state.tier = tier;
  }

  function nodePositions(n) {
    const points = [];
    const cx = 180, cy = 145, radiusX = 140, radiusY = 105;
    for (let vertex = 0; vertex < n; ++vertex) {
      const angle = -Math.PI / 2 + vertex * 2 * Math.PI / Math.max(n, 1);
      points.push({ x: cx + radiusX * Math.cos(angle), y: cy + radiusY * Math.sin(angle) });
    }
    return points;
  }

  // Parallel edges must stay visually distinct — Konigsberg has two bridges
  // between the same pair of banks, so a single straight line would hide half
  // the problem. Each parallel group is fanned out symmetrically.
  function bendsForEdges(edges) {
    const groups = new Map();
    edges.forEach((edge, id) => {
      const key = Math.min(edge.u, edge.v) + '~' + Math.max(edge.u, edge.v);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(id);
    });
    const bends = Array(edges.length).fill(0);
    groups.forEach((ids) => {
      const count = ids.length;
      ids.forEach((id, index) => {
        // Odd groups keep one straight edge in the middle; even groups straddle it.
        bends[id] = count === 1 ? 0 : (index - (count - 1) / 2) * 26;
      });
    });
    return bends;
  }

  function edgeGeometry(points, edge, bend) {
    const from = points[edge.u], to = points[edge.v];
    const dx = to.x - from.x, dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length, uy = dy / length;
    const start = { x: from.x + ux * 18, y: from.y + uy * 18 };
    const end = { x: to.x - ux * 18, y: to.y - uy * 18 };
    const control = {
      x: (start.x + end.x) / 2 - uy * bend,
      y: (start.y + end.y) / 2 + ux * bend,
    };
    return {
      d: bend ? 'M ' + start.x + ' ' + start.y + ' Q ' + control.x + ' ' + control.y + ' ' + end.x + ' ' + end.y
              : 'M ' + start.x + ' ' + start.y + ' L ' + end.x + ' ' + end.y,
      labelX: bend ? (start.x + 2 * control.x + end.x) / 4 : (start.x + end.x) / 2,
      labelY: bend ? (start.y + 2 * control.y + end.y) / 4 : (start.y + end.y) / 2,
    };
  }

  function graphSvg(config, frame) {
    const points = nodePositions(config.n);
    const edges = config.edges;
    const bends = bendsForEdges(edges);
    let svg = '<svg viewBox="0 0 360 290" width="360" height="290" class="geu-graph-svg">';
    edges.forEach((edge, id) => {
      const geometry = edgeGeometry(points, edge, bends[id]);
      const isCurrent = frame.edgeTaken && frame.edgeTaken.id === id;
      let cls = 'geu-edge';
      if (frame.used[id]) cls += ' geu-edge-used';
      if (isCurrent) cls += ' geu-edge-current';
      svg += '<path class="' + cls + '" data-edge="' + id + '" d="' + geometry.d + '"/>';
      if (frame.used[id]) {
        svg += '<text class="geu-edge-order" x="' + geometry.labelX + '" y="' + (geometry.labelY + 4) + '" text-anchor="middle">' + frame.takenAt[id] + '</text>';
      }
    });
    points.forEach((point, vertex) => {
      const odd = frame.odd.indexOf(vertex) >= 0;
      let cls = 'geu-node';
      if (odd) cls += ' geu-node-odd';
      if (frame.start === vertex) cls += ' geu-node-start';
      if (frame.current === vertex) cls += ' geu-node-current';
      if (frame.checking === vertex) cls += ' geu-node-checking';
      svg += '<circle class="' + cls + '" data-v="' + vertex + '" cx="' + point.x + '" cy="' + point.y + '" r="17"/>';
      svg += '<text class="geu-node-label" x="' + point.x + '" y="' + (point.y + 5) + '" text-anchor="middle">' + vertex + '</text>';
      if (frame.degrees.length) {
        svg += '<text class="geu-node-deg" x="' + point.x + '" y="' + (point.y - 23) + '" text-anchor="middle">deg ' + frame.degrees[vertex] + (odd ? '★' : '') + '</text>';
      }
    });
    return svg + '</svg>';
  }

  function degreeTableHtml(frame) {
    if (!frame.degrees.length) return '';
    let html = '<table class="geu-deg-table"><thead><tr><th>v</th><th>deg</th><th>' + L('奇偶', 'parity') + '</th></tr></thead><tbody>';
    frame.degrees.forEach((degree, vertex) => {
      const odd = degree % 2 === 1;
      const cls = 'geu-deg-row' + (odd ? ' geu-deg-odd' : '') + (frame.checking === vertex ? ' geu-deg-checking' : '');
      html += '<tr class="' + cls + '"><td>' + vertex + '</td><td>' + degree + '</td><td>' +
        (odd ? L('奇', 'odd') : L('偶', 'even')) + '</td></tr>';
    });
    return html + '</tbody></table>';
  }

  function chipsHtml(values, className, emptyMark) {
    if (!values.length) return '<span class="geu-empty">' + emptyMark + '</span>';
    return values.map((value) => '<span class="' + className + '">' + value + '</span>').join('');
  }

  function issuesHtml(errors, warnings) {
    const items = [];
    errors.forEach((issue) => items.push('<div class="geu-error">⚠ ' + escapeText(K().langOf(issue)) + '</div>'));
    warnings.forEach((issue) => items.push('<div class="geu-warning">• ' + escapeText(K().langOf(issue)) + '</div>'));
    return items.join('');
  }

  function verdictText(frame) {
    if (frame.verdict === 'circuit') return L('尤拉迴路存在', 'Euler circuit exists');
    if (frame.verdict === 'path') return L('尤拉路徑存在（非迴路）', 'Euler path exists (not a circuit)');
    if (frame.verdict === 'none') return L('不存在尤拉路徑或迴路', 'No Euler path or circuit');
    return L('檢查度數中…', 'Checking degrees…');
  }

  function renderGraphEuler() {
    syncDifficultyPreset();
    const config = state.config;
    const host = K().acquireDynamicVizHost();
    const Euler = global.GraphEulerViz;
    const defaultConfig = Euler.presetForDifficulty(state.tier);
    const defaultSerialized = serialize(defaultConfig);

    host.innerHTML =
      '<div class="geu-wrap vizfit-host">' +
        '<div class="geu-controls">' +
          '<span class="geu-tier">' + (state.tier === 'normal' ? L('一般輸入', 'Normal input') : L('挑戰輸入', 'Challenge input')) + '</span>' +
          '<label>n <input type="text" class="geu-n" value="' + config.n + '"></label>' +
          '<label>' + L('起點', 'start') + ' <input type="text" class="geu-start" value="' + config.start + '"></label>' +
          '<label>' + L('邊 u-v', 'edges u-v') + ' <input type="text" class="geu-edges" value="' + escapeAttribute(edgesToText(config.edges)) + '"></label>' +
          '<button type="button" class="geu-apply">' + L('套用', 'Apply') + '</button>' +
          '<button type="button" class="geu-random" title="' + L('依目前難度產生圖', 'Generate a graph at the current difficulty') + '">🎲</button>' +
          buildExamplesSelect('graph-euler', defaultSerialized) +
        '</div>' +
        '<div class="geu-issues" aria-live="polite">' + issuesHtml(state.errors, state.warnings) + '</div>' +
        '<div class="geu-banner" data-testid="geu-banner">&nbsp;</div>' +
        '<div class="geu-panels vizfit-scroll">' +
          '<section class="geu-graph-pane"><h4>' + L('圖（邊上數字 = 第幾步走過）', 'Graph (number on an edge = when it was walked)') + '</h4><div class="geu-graph"></div></section>' +
          '<section class="geu-side">' +
            '<h4>' + L('度數表', 'Degree table') + '</h4><div class="geu-degrees"></div>' +
            '<h4>' + L('堆疊（未走完的路）', 'Stack (unfinished walk)') + '</h4><div class="geu-stack" data-testid="geu-stack"></div>' +
            '<h4>' + L('已定案的尾段', 'Finalized tail') + '</h4><div class="geu-circuit" data-testid="geu-circuit"></div>' +
          '</section>' +
        '</div>' +
        '<div class="geu-msg" data-testid="geu-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.geu-wrap');
    const examples = wrap.querySelector('.ex-select');
    const addPreset = (config2, zh, en) => {
      const value = serialize(config2);
      if (!examples || Array.from(examples.options).some((option) => option.value === value)) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = L(zh, en);
      examples.insertBefore(option, examples.options[2] || null);
    };
    addPreset(Euler.KONIGSBERG, '柯尼斯堡七橋（無解）', 'Konigsberg 7 bridges (no trail)');
    addPreset(Euler.DISCONNECTED, '度數全偶但不連通', 'Even degrees but disconnected');
    addPreset(Euler.CHALLENGE, '尤拉路徑（2 個奇點）', 'Euler path (2 odd vertices)');

    const result = Euler.eulerFrames(config);
    const graphElement = wrap.querySelector('.geu-graph');
    const degreesElement = wrap.querySelector('.geu-degrees');
    const stackElement = wrap.querySelector('.geu-stack');
    const circuitElement = wrap.querySelector('.geu-circuit');
    const bannerElement = wrap.querySelector('.geu-banner');
    const messageElement = wrap.querySelector('.geu-msg');

    function paint(frame) {
      graphElement.innerHTML = graphSvg(config, frame);
      degreesElement.innerHTML = degreeTableHtml(frame);
      stackElement.innerHTML = chipsHtml(frame.stack, 'geu-stack-item', '∅');
      circuitElement.innerHTML = chipsHtml(frame.circuit, 'geu-circuit-item', '∅');
      const usedCount = frame.used.filter(Boolean).length;
      bannerElement.textContent = verdictText(frame) +
        ' · ' + L('奇點 ', 'odd ') + frame.odd.length +
        ' · ' + L('已走邊 ', 'edges walked ') + usedCount + '/' + config.edges.length +
        ' · ' + frame.phase;
      messageElement.textContent = K().langOf(frame.msg);
      K().showStatus(K().langOf(frame.msg),
        frame.phase === 'done' ? '#16a34a' :
        frame.phase === 'verdict' && frame.verdict === 'none' ? '#dc2626' :
        frame.phase === 'backtrack' ? '#f59e0b' : '#2563eb');
    }
    wrap.appendChild(K().buildFrameControls(result.frames, paint, { runIntervalMs: 620 }));

    wrap.querySelector('.geu-apply').addEventListener('click', () => {
      const parsed = Euler.parseInput(
        wrap.querySelector('.geu-n').value,
        wrap.querySelector('.geu-edges').value,
        wrap.querySelector('.geu-start').value
      );
      state.config = configOnly(parsed);
      state.errors = parsed.errors;
      state.warnings = parsed.warnings;
      state.userEdited = true;
      if (!parsed.errors.length) saveExample('graph-euler', serialize(state.config), defaultSerialized);
      renderGraphEuler();
    });
    wrap.querySelector('.geu-random').addEventListener('click', () => {
      const difficulty = K().getInputDifficulty ? K().getInputDifficulty() : 'normal';
      state.tier = difficulty === 'normal' ? 'normal' : 'challenge';
      state.config = Euler.randomConfig(difficulty);
      state.errors = [];
      state.warnings = [];
      state.userEdited = true;
      saveExample('graph-euler', serialize(state.config), defaultSerialized);
      renderGraphEuler();
    });
    if (examples) examples.addEventListener('change', (event) => {
      if (!event.target.value) return;
      const parsed = deserialize(event.target.value);
      state.config = configOnly(parsed);
      state.errors = parsed.errors;
      state.warnings = parsed.warnings;
      state.userEdited = true;
      renderGraphEuler();
    });
  }

  global.VizRegistry.attach('graph-euler', {
    render: renderGraphEuler,
    code: () => (typeof codeGraphEuler !== 'undefined' ? codeGraphEuler : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
