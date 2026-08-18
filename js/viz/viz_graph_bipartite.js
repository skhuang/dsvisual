(function (global) {
  'use strict';
  const K = () => global.VizKit; // resolved at call time

  // Examples-helper trio — duplicated from viz_graph_components.js per program
  // convention; do NOT refactor into a shared module.
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

  function edgesToStr(edges) { return edges.map((e) => e.u + '-' + e.v).join(','); }
  function serialize(st) { return st.n + '|' + edgesToStr(st.edges); }
  function deserialize(text) {
    const parts = String(text).split('|');
    const parsed = global.GraphBipartiteViz.parseInput(parts[0], parts.slice(1).join('|'));
    return { n: parsed.n, edges: parsed.edges };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphBipartiteViz.SAMPLE);
  // Built-in odd-cycle (C5) example — always offered alongside "Default".
  const ODD_CYCLE_SERIALIZED = '5|0-1,1-2,2-3,3-4,4-0';

  const NODE_A = '#ef4444', NODE_B = '#3b82f6';
  const _st = { n: global.GraphBipartiteViz.SAMPLE.n, edges: global.GraphBipartiteViz.SAMPLE.edges.slice() };

  function gbpGraphSvg(n, edges, frame) {
    const CX = 130, CY = 130, R = 100, NR = 17;
    const frontierSet = new Set(frame.frontier || []);
    const conflict = frame.conflict;
    const pos = [];
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
      pos.push({ x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) });
    }
    let svg = '<svg viewBox="0 0 260 260" width="260" height="260" class="gbp-svg">';
    edges.forEach((e) => {
      const a = pos[e.u], b = pos[e.v];
      if (!a || !b) return;
      const isConflict = !!(conflict && ((conflict.u === e.u && conflict.v === e.v) || (conflict.u === e.v && conflict.v === e.u)));
      svg += '<line class="gbp-edge' + (isConflict ? ' gbp-edge-conflict' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    });
    pos.forEach((p, i) => {
      const c = frame.color[i];
      const fill = c === 0 ? NODE_A : (c === 1 ? NODE_B : '');
      let cls = 'gbp-node';
      if (c < 0) cls += ' gbp-node-uncolored'; else cls += (c === 0 ? ' gbp-node-a' : ' gbp-node-b');
      if (i === frame.current) cls += ' gbp-node-current';
      if (frontierSet.has(i)) cls += ' gbp-node-frontier';
      svg += '<circle class="' + cls + '" data-v="' + i + '" cx="' + p.x + '" cy="' + p.y + '" r="' + NR + '"' +
             (fill ? ' style="fill:' + fill + '"' : '') + '/>' +
             '<text class="gbp-node-label" x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle">' + i + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function verdictText(fr) {
    const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    if (fr.conflict) {
      return lang === 'zh'
        ? ('不是二分圖 — 邊 ' + fr.conflict.u + '—' + fr.conflict.v + ' 形成奇環')
        : ('NOT bipartite — odd cycle at edge ' + fr.conflict.u + '—' + fr.conflict.v);
    }
    if (fr.done && fr.bipartite && fr.classes) {
      return lang === 'zh'
        ? ('是二分圖 ✓　V₁={' + fr.classes.v1.join('、') + '}　V₂={' + fr.classes.v2.join('、') + '}')
        : ('Bipartite ✓  V1={' + fr.classes.v1.join(', ') + '}  V2={' + fr.classes.v2.join(', ') + '}');
    }
    return lang === 'zh' ? '二分圖判定中…' : 'Checking…';
  }

  function renderGraphBipartite() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gbp-wrap">' +
        '<div class="gbp-controls">' +
          '<label>n <input type="text" class="gbp-n" value="' + _st.n + '"></label>' +
          '<label>edges <input type="text" class="gbp-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gbp-apply">套用 Apply</button>' +
          '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
          buildExamplesSelect('graph-bipartite', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="gbp-verdict" data-testid="gbp-verdict">&nbsp;</div>' +
        '<div class="gbp-scroll"><div class="gbp-graph"></div></div>' +
        '<div class="gbp-msg" data-testid="gbp-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gbp-wrap');
    const graphEl = wrap.querySelector('.gbp-graph');
    const verdictEl = wrap.querySelector('.gbp-verdict');
    const msgEl = wrap.querySelector('.gbp-msg');

    // Inject the built-in "Odd cycle" option right after "Default".
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect && !Array.from(exSelect.options).some((o) => o.value === ODD_CYCLE_SERIALIZED)) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      const opt = document.createElement('option');
      opt.value = ODD_CYCLE_SERIALIZED;
      opt.textContent = lang === 'zh' ? '奇環' : 'Odd cycle';
      exSelect.insertBefore(opt, exSelect.options[2] || null); // after placeholder(0) + Default(1)
    }

    const frames = global.GraphBipartiteViz.bipartiteFrames(_st).frames;

    function paint(fr, i) {
      graphEl.innerHTML = gbpGraphSvg(_st.n, _st.edges, fr);
      verdictEl.textContent = verdictText(fr);
      msgEl.textContent = K().langOf(fr.msg);
      K().showStatus(K().langOf(fr.msg), fr.conflict ? '#f87171' : (fr.done ? '#34d399' : '#60a5fa'));
    }

    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 800 }));

    wrap.querySelector('.gbp-apply').addEventListener('click', function () {
      const parsed = global.GraphBipartiteViz.parseInput(wrap.querySelector('.gbp-n').value, wrap.querySelector('.gbp-edges').value);
      _st.n = parsed.n; _st.edges = parsed.edges;
      saveExample('graph-bipartite', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphBipartite();
    });
    wrap.querySelector('.rand-btn').addEventListener('click', function () {
      const difficulty = K().getInputDifficulty();
      const r = global.RandomInput && global.RandomInput.randomInputFor('graph-bipartite', difficulty);
      if (!r || !Array.isArray(r.edges)) return;
      _st.n = r.n; _st.edges = r.edges;
      saveExample('graph-bipartite', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphBipartite();
    });
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value; if (!v) return;
      const parsed = deserialize(v);
      _st.n = parsed.n; _st.edges = parsed.edges;
      renderGraphBipartite();
    });
  }

  global.VizRegistry.attach('graph-bipartite', {
    render: renderGraphBipartite,
    code: () => (typeof codeGraphBipartite !== 'undefined' ? codeGraphBipartite : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
