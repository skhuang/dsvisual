(function (global) {
  'use strict';
  const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

  // Distinct per-component fills (cycled by component index).
  const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#14b8a6'];

  // loadExamples/saveExample/buildExamplesSelect — stateless wrappers around the
  // global ExamplesStore, keyed by methodId. Duplicated from viz_graph_matrix.js
  // per the extraction recipe (also in viz_list_equivalence.js) — do NOT refactor
  // into a shared module.
  function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
  function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) { /* ignore */ } }
  function buildExamplesSelect(methodId, defaultText) {
    const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const trunc = (s) => { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
    const placeholder = lang === 'zh' ? '範例…' : 'Examples…';
    const defLabel = lang === 'zh' ? '預設' : 'Default';
    let h = '<select class="ex-select" data-method="' + escAttr(methodId) + '">';
    h += '<option value="">' + placeholder + '</option>';
    h += '<option value="' + escAttr(defaultText) + '">' + defLabel + '</option>';
    loadExamples(methodId).forEach((e) => {
      if (e.text === defaultText) return;
      h += '<option value="' + escAttr(e.text) + '">' + escText(trunc(e.text)) + '</option>';
    });
    h += '</select>';
    return h;
  }

  // Serialize/deserialize _st as `n|u-v,u-v,...` for the examples select.
  function edgesToStr(edges) { return edges.map((e) => e.u + '-' + e.v).join(','); }
  function serialize(st) { return st.n + '|' + edgesToStr(st.edges); }
  function deserialize(text) {
    const parts = String(text).split('|');
    const parsed = global.GraphComponentsViz.parseInput(parts[0], parts.slice(1).join('|'));
    return { n: parsed.n, edges: parsed.edges };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphComponentsViz.SAMPLE);

  const _st = {
    n: global.GraphComponentsViz.SAMPLE.n,
    edges: global.GraphComponentsViz.SAMPLE.edges.slice(),
    idx: 0,
  };

  // Compact self-contained node-link SVG: n nodes on a circle, undirected edges
  // as plain lines. Each node is filled by its component colour once labelled,
  // neutral while unvisited; the current vertex and the frontier get rings.
  function gcGraphSvg(n, edges, frame) {
    const CX = 130, CY = 130, R = 100, NR = 17;
    const frontierSet = new Set(frame.frontier || []);
    const pos = [];
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
      pos.push({ x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) });
    }
    let svg = '<svg viewBox="0 0 260 260" width="260" height="260" class="gc2-svg">';
    edges.forEach((e) => {
      const a = pos[e.u], b = pos[e.v];
      if (!a || !b) return;
      svg += '<line class="gc2-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    });
    pos.forEach((p, i) => {
      const c = frame.comp[i];
      const fill = c >= 0 ? PALETTE[c % PALETTE.length] : '';
      let cls = 'gc2-node';
      if (c < 0) cls += ' gc2-node-unvisited';
      if (i === frame.current) cls += ' gc2-node-current';
      if (frontierSet.has(i)) cls += ' gc2-node-frontier';
      svg += '<circle class="' + cls + '" data-v="' + i + '" cx="' + p.x + '" cy="' + p.y + '" r="' + NR + '"' +
             (fill ? ' style="fill:' + fill + '"' : '') + '/>' +
             '<text class="gc2-node-label" x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle">' + i + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function renderGraphComponents() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gc2-wrap">' +
        '<div class="gc2-controls">' +
          '<label>n <input type="text" class="gc2-n" value="' + _st.n + '"></label>' +
          '<label>edges <input type="text" class="gc2-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gc2-apply">套用 Apply</button>' +
          buildExamplesSelect('graph-components', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="gc2-count" data-testid="gc2-count">&nbsp;</div>' +
        '<div class="gc2-scroll"><div class="gc2-graph"></div></div>' +
        '<div class="gc2-msg" data-testid="gc2-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gc2-wrap');
    const graphEl = wrap.querySelector('.gc2-graph');
    const countEl = wrap.querySelector('.gc2-count');
    const msgEl = wrap.querySelector('.gc2-msg');

    const frames = global.GraphComponentsViz.componentsFrames(_st).frames;
    if (_st.idx >= frames.length) _st.idx = frames.length - 1;

    function countText(k) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      return lang === 'zh' ? ('連通分量：' + k) : ('Components: ' + k);
    }
    function paint() {
      const f = frames[_st.idx];
      graphEl.innerHTML = gcGraphSvg(_st.n, _st.edges, f);
      countEl.textContent = countText(f.k);
      msgEl.textContent = K().langOf(f.msg);
    }
    function step() {
      if (_st.idx >= frames.length - 1) return false;
      _st.idx++;
      paint();
      K().showStatus(K().langOf(frames[_st.idx].msg), frames[_st.idx].done ? '#34d399' : '#60a5fa');
      return _st.idx < frames.length - 1;
    }
    function reset() { _st.idx = 0; paint(); }

    wrap.appendChild(K().buildStepControls(step, reset, 800));
    paint();

    wrap.querySelector('.gc2-apply').addEventListener('click', function () {
      const parsed = global.GraphComponentsViz.parseInput(wrap.querySelector('.gc2-n').value, wrap.querySelector('.gc2-edges').value);
      _st.n = parsed.n; _st.edges = parsed.edges; _st.idx = 0;
      saveExample('graph-components', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphComponents();
    });
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value; if (!v) return;
      const parsed = deserialize(v);
      _st.n = parsed.n; _st.edges = parsed.edges; _st.idx = 0;
      renderGraphComponents();
    });
  }

  global.VizRegistry.attach('graph-components', {
    render: renderGraphComponents,
    code: () => (typeof codeGraphComponents !== 'undefined' ? codeGraphComponents : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
