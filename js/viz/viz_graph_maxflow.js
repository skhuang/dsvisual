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
    return edges.map((edge) => edge.u + '-' + edge.v + ':' + edge.capacity).join(',');
  }
  function serialize(config) {
    return [config.n, config.source, config.sink, edgesToText(config.edges)].join('|');
  }
  function deserialize(text) {
    const parts = String(text).split('|');
    return global.GraphMaxFlowViz.parseInput(parts[0], parts.slice(3).join('|'), parts[1], parts[2]);
  }
  function configOnly(parsed) {
    return { n: parsed.n, source: parsed.source, sink: parsed.sink, edges: parsed.edges };
  }

  const NO_PATH = { n: 5, source: 0, sink: 4, edges: [
    { u: 0, v: 1, capacity: 7 }, { u: 1, v: 2, capacity: 3 }, { u: 3, v: 4, capacity: 5 },
  ] };
  const state = {
    config: global.GraphMaxFlowViz.cloneConfig(global.GraphMaxFlowViz.SAMPLE),
    errors: [], warnings: [], tier: null, userEdited: false,
  };

  function syncDifficultyPreset() {
    const inputDifficulty = K().getInputDifficulty ? K().getInputDifficulty() : 'normal';
    const tier = inputDifficulty === 'normal' ? 'normal' : 'challenge';
    if (state.tier === null || (!state.userEdited && state.tier !== tier)) {
      state.config = global.GraphMaxFlowViz.presetForDifficulty(tier);
      state.errors = [];
      state.warnings = [];
    }
    state.tier = tier;
  }

  function edgeIn(list, u, v) {
    return (list || []).some((edge) => edge.u === u && edge.v === v);
  }

  function nodePositions(n) {
    const points = [];
    const cx = 180, cy = 145, radiusX = 145, radiusY = 110;
    for (let vertex = 0; vertex < n; ++vertex) {
      const angle = -Math.PI / 2 + vertex * 2 * Math.PI / Math.max(n, 1);
      points.push({ x: cx + radiusX * Math.cos(angle), y: cy + radiusY * Math.sin(angle) });
    }
    return points;
  }

  function curvedEdge(points, u, v, curved) {
    const from = points[u], to = points[v];
    const dx = to.x - from.x, dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length, uy = dy / length;
    const start = { x: from.x + ux * 19, y: from.y + uy * 19 };
    const end = { x: to.x - ux * 27, y: to.y - uy * 27 };
    const bend = curved ? 27 : 0;
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

  function nodeSvg(points, config, frame, prefix) {
    const sourceSide = frame.minCut ? frame.minCut.sourceSide : [];
    let svg = '';
    points.forEach((point, vertex) => {
      let cls = prefix + '-node';
      if (vertex === config.source) cls += ' ' + prefix + '-node-source';
      if (vertex === config.sink) cls += ' ' + prefix + '-node-sink';
      if (frame.visited[vertex]) cls += ' ' + prefix + '-node-visited';
      if (frame.current === vertex) cls += ' ' + prefix + '-node-current';
      if (frame.minCut) cls += sourceSide.indexOf(vertex) >= 0 ? ' ' + prefix + '-node-cut-s' : ' ' + prefix + '-node-cut-t';
      svg += '<circle class="' + cls + '" data-v="' + vertex + '" cx="' + point.x + '" cy="' + point.y + '" r="17"/>';
      svg += '<text class="' + prefix + '-node-label" x="' + point.x + '" y="' + (point.y + 5) + '" text-anchor="middle">' + vertex + '</text>';
      if (vertex === config.source || vertex === config.sink) {
        svg += '<text class="' + prefix + '-node-role" x="' + point.x + '" y="' + (point.y - 23) + '" text-anchor="middle">' + (vertex === config.source ? 's' : 't') + '</text>';
      }
    });
    return svg;
  }

  function flowNetworkSvg(config, frame) {
    const points = nodePositions(config.n);
    const original = config.edges;
    let svg = '<svg viewBox="0 0 360 290" width="360" height="290" class="gmf-flow-svg">' +
      '<defs><marker id="gmf-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>';
    original.forEach((edge) => {
      const reverseExists = original.some((other) => other.u === edge.v && other.v === edge.u);
      const geometry = curvedEdge(points, edge.u, edge.v, reverseExists);
      const currentFlow = Math.max(0, frame.flow[edge.u][edge.v]);
      const saturated = frame.residual[edge.u][edge.v] === 0;
      const inPath = edgeIn(frame.path, edge.u, edge.v);
      const augmenting = frame.augmentEdge && frame.augmentEdge.u === edge.u && frame.augmentEdge.v === edge.v;
      const cut = frame.minCut && edgeIn(frame.minCut.edges, edge.u, edge.v);
      let cls = 'gmf-flow-edge';
      if (saturated) cls += ' gmf-edge-saturated';
      if (inPath) cls += ' gmf-edge-path';
      if (augmenting) cls += ' gmf-edge-augment';
      if (cut) cls += ' gmf-edge-cut';
      svg += '<path class="' + cls + '" data-u="' + edge.u + '" data-v="' + edge.v + '" d="' + geometry.d + '" marker-end="url(#gmf-flow-arrow)"/>';
      svg += '<text class="gmf-edge-label" x="' + geometry.labelX + '" y="' + (geometry.labelY - 4) + '" text-anchor="middle">' + currentFlow + '/' + edge.capacity + '</text>';
    });
    return svg + nodeSvg(points, config, frame, 'gmf-flow') + '</svg>';
  }

  function residualNetworkSvg(config, frame) {
    const points = nodePositions(config.n);
    const residualEdges = [];
    for (let u = 0; u < config.n; ++u) {
      for (let v = 0; v < config.n; ++v) {
        if (u !== v && frame.residual[u][v] > 0) residualEdges.push({ u, v, capacity: frame.residual[u][v] });
      }
    }
    let svg = '<svg viewBox="0 0 360 290" width="360" height="290" class="gmf-res-svg">' +
      '<defs><marker id="gmf-res-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>';
    residualEdges.forEach((edge) => {
      const curved = residualEdges.some((other) => other.u === edge.v && other.v === edge.u);
      const geometry = curvedEdge(points, edge.u, edge.v, curved);
      const inPath = edgeIn(frame.path, edge.u, edge.v);
      const inspected = frame.inspectedEdge && frame.inspectedEdge.u === edge.u && frame.inspectedEdge.v === edge.v;
      const augmenting = frame.augmentEdge && frame.augmentEdge.u === edge.u && frame.augmentEdge.v === edge.v;
      let cls = 'gmf-res-edge';
      if (inPath) cls += ' gmf-edge-path';
      if (inspected) cls += ' gmf-edge-inspect';
      if (augmenting) cls += ' gmf-edge-augment';
      svg += '<path class="' + cls + '" data-u="' + edge.u + '" data-v="' + edge.v + '" d="' + geometry.d + '" marker-end="url(#gmf-res-arrow)"/>';
      svg += '<text class="gmf-res-label" x="' + geometry.labelX + '" y="' + (geometry.labelY - 4) + '" text-anchor="middle">r=' + edge.capacity + '</text>';
    });
    return svg + nodeSvg(points, config, frame, 'gmf-res') + '</svg>';
  }

  function issuesHtml(errors, warnings) {
    const items = [];
    errors.forEach((issue) => items.push('<div class="gmf-error">⚠ ' + escapeText(K().langOf(issue)) + '</div>'));
    warnings.forEach((issue) => items.push('<div class="gmf-warning">• ' + escapeText(K().langOf(issue)) + '</div>'));
    return items.join('');
  }

  function queueHtml(frame) {
    if (!frame.queue.length) return '<span class="gmf-queue-empty">∅</span>';
    return frame.queue.map((vertex) => '<span class="gmf-queue-item">' + vertex + '</span>').join('');
  }

  function cutHtml(frame) {
    if (!frame.minCut) return '';
    const cut = frame.minCut;
    const edgeText = cut.edges.length ? cut.edges.map((edge) => edge.u + '→' + edge.v + ' (' + edge.capacity + ')').join(', ') : '∅';
    return '<div class="gmf-cut" data-testid="gmf-cut">' +
      '<strong>' + L('最小割', 'Minimum cut') + '</strong> ' +
      'S={' + cut.sourceSide.join(',') + '} · T={' + cut.sinkSide.join(',') + '} · ' +
      L('割邊：', 'cut edges: ') + edgeText + ' · ' + L('容量 ', 'capacity ') + cut.capacity +
      '</div>';
  }

  function renderGraphMaxFlow() {
    syncDifficultyPreset();
    const config = state.config;
    const host = K().acquireDynamicVizHost();
    const defaultConfig = global.GraphMaxFlowViz.presetForDifficulty(state.tier);
    const defaultSerialized = serialize(defaultConfig);
    const challengeSerialized = serialize(global.GraphMaxFlowViz.CHALLENGE);
    const noPathSerialized = serialize(NO_PATH);
    host.innerHTML =
      '<div class="gmf-wrap vizfit-host">' +
        '<div class="gmf-controls">' +
          '<span class="gmf-tier">' + (state.tier === 'normal' ? L('一般輸入', 'Normal input') : L('挑戰輸入', 'Challenge input')) + '</span>' +
          '<label>n <input type="text" class="gmf-n" value="' + config.n + '"></label>' +
          '<label>' + L('起點', 'source') + ' <input type="text" class="gmf-source" value="' + config.source + '"></label>' +
          '<label>' + L('終點', 'sink') + ' <input type="text" class="gmf-sink" value="' + config.sink + '"></label>' +
          '<label>' + L('邊 u-v:容量', 'edges u-v:capacity') + ' <input type="text" class="gmf-edges" value="' + escapeAttribute(edgesToText(config.edges)) + '"></label>' +
          '<button type="button" class="gmf-apply">' + L('套用', 'Apply') + '</button>' +
          '<button type="button" class="gmf-random" title="' + L('依目前難度產生網路', 'Generate a network at the current difficulty') + '">🎲</button>' +
          buildExamplesSelect('graph-maxflow', defaultSerialized) +
        '</div>' +
        '<div class="gmf-issues" aria-live="polite">' + issuesHtml(state.errors, state.warnings) + '</div>' +
        '<div class="gmf-banner" data-testid="gmf-banner">&nbsp;</div>' +
        '<div class="gmf-panels vizfit-scroll">' +
          '<section><h4>' + L('流量網路 f/c', 'Flow network f/c') + '</h4><div class="gmf-flow"></div></section>' +
          '<section><h4>' + L('殘量網路 r', 'Residual network r') + '</h4><div class="gmf-residual"></div></section>' +
        '</div>' +
        '<div class="gmf-queue"><strong>BFS queue</strong> <span class="gmf-queue-values"></span></div>' +
        '<div class="gmf-cut-slot"></div>' +
        '<div class="gmf-msg" data-testid="gmf-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gmf-wrap');
    const examples = wrap.querySelector('.ex-select');
    const addPreset = (value, zh, en) => {
      if (!examples || Array.from(examples.options).some((option) => option.value === value)) return;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = L(zh, en);
      examples.insertBefore(option, examples.options[2] || null);
    };
    addPreset(challengeSerialized, '八點挑戰網路', '8-vertex challenge');
    addPreset(noPathSerialized, '無 s→t 路徑', 'No s→t path');

    const result = global.GraphMaxFlowViz.maxFlowFrames(config);
    const flowElement = wrap.querySelector('.gmf-flow');
    const residualElement = wrap.querySelector('.gmf-residual');
    const bannerElement = wrap.querySelector('.gmf-banner');
    const queueElement = wrap.querySelector('.gmf-queue-values');
    const cutElement = wrap.querySelector('.gmf-cut-slot');
    const messageElement = wrap.querySelector('.gmf-msg');

    function paint(frame) {
      flowElement.innerHTML = flowNetworkSvg(config, frame);
      residualElement.innerHTML = residualNetworkSvg(config, frame);
      queueElement.innerHTML = queueHtml(frame);
      cutElement.innerHTML = cutHtml(frame);
      const bottleneck = frame.bottleneck ? ' · ' + L('瓶頸 ', 'bottleneck ') + frame.bottleneck : '';
      bannerElement.textContent = L('最大流 ', 'Maximum flow ') + frame.maxFlow + bottleneck + ' · ' + frame.phase;
      messageElement.textContent = K().langOf(frame.msg);
      K().showStatus(K().langOf(frame.msg), frame.phase === 'done' ? '#16a34a' : frame.phase === 'augment' ? '#f59e0b' : '#2563eb');
    }
    wrap.appendChild(K().buildFrameControls(result.frames, paint, { runIntervalMs: 650 }));

    wrap.querySelector('.gmf-apply').addEventListener('click', () => {
      const parsed = global.GraphMaxFlowViz.parseInput(
        wrap.querySelector('.gmf-n').value,
        wrap.querySelector('.gmf-edges').value,
        wrap.querySelector('.gmf-source').value,
        wrap.querySelector('.gmf-sink').value
      );
      state.config = configOnly(parsed);
      state.errors = parsed.errors;
      state.warnings = parsed.warnings;
      state.userEdited = true;
      if (!parsed.errors.length) saveExample('graph-maxflow', serialize(state.config), defaultSerialized);
      renderGraphMaxFlow();
    });
    wrap.querySelector('.gmf-random').addEventListener('click', () => {
      const difficulty = K().getInputDifficulty ? K().getInputDifficulty() : 'normal';
      state.tier = difficulty === 'normal' ? 'normal' : 'challenge';
      state.config = global.GraphMaxFlowViz.randomConfig(difficulty);
      state.errors = [];
      state.warnings = [];
      state.userEdited = true;
      saveExample('graph-maxflow', serialize(state.config), defaultSerialized);
      renderGraphMaxFlow();
    });
    if (examples) examples.addEventListener('change', (event) => {
      if (!event.target.value) return;
      const parsed = deserialize(event.target.value);
      state.config = configOnly(parsed);
      state.errors = parsed.errors;
      state.warnings = parsed.warnings;
      state.userEdited = true;
      renderGraphMaxFlow();
    });
  }

  global.VizRegistry.attach('graph-maxflow', {
    render: renderGraphMaxFlow,
    code: () => (typeof codeGraphMaxFlow !== 'undefined' ? codeGraphMaxFlow : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
