(function (global) {
  'use strict';
  const K = () => global.VizKit;
  const L = (zh, en) => {
    try { return global.I18N && I18N.getCurrentLanguage() === 'zh' ? zh : en; }
    catch (error) { return en; }
  };
  const METHOD_ID = 'tree-persistent-segment';

  // Fixed pixel layout for positions 1..15 — identical to tree-segment's POS map,
  // since every version of a persistent segment tree shares the same shape.
  const POS = {
    1: [299, 34], 2: [151, 96], 3: [447, 96],
    4: [77, 158], 5: [225, 158], 6: [373, 158], 7: [521, 158],
    8: [40, 220], 9: [114, 220], 10: [188, 220], 11: [262, 220],
    12: [336, 220], 13: [410, 220], 14: [484, 220], 15: [558, 220],
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

  function idvText(o) { return o.idx + ':' + o.val; }
  function serialize(config) {
    return [config.arr.join(','), idvText(config.u1), idvText(config.u2), config.q.l + ',' + config.q.r].join('|');
  }
  function deserialize(text) {
    const parts = String(text).split('|');
    return global.PersistentSegTreeViz.parseInput(parts[0] || '', parts[1] || '0:0', parts[2] || '0:0', parts[3] || '0,0');
  }

  const state = {
    config: (function () { const p = global.PersistentSegTreeViz.presetForDifficulty('normal'); return p; })(),
    errors: [], warnings: [], tier: null, userEdited: false,
  };

  function syncDifficultyPreset() {
    const inputDifficulty = K().getInputDifficulty ? K().getInputDifficulty() : 'normal';
    const tier = inputDifficulty === 'normal' ? 'normal' : 'challenge';
    if (state.tier === null || (!state.userEdited && state.tier !== tier)) {
      state.config = global.PersistentSegTreeViz.presetForDifficulty(tier === 'normal' ? 'normal' : 'edge');
      state.errors = [];
      state.warnings = [];
    }
    state.tier = tier;
  }

  function issuesHtml(errors, warnings) {
    const items = [];
    errors.forEach((issue) => items.push('<div class="pst-error">⚠ ' + escapeText(K().langOf(issue)) + '</div>'));
    warnings.forEach((issue) => items.push('<div class="pst-warning">• ' + escapeText(K().langOf(issue)) + '</div>'));
    return items.join('');
  }

  function nodeStyle(frame, pos, node, isActive) {
    if (isActive) {
      if (frame.phase === 'covered') return { fill: '#14b8a6', text: '#fff', stroke: '#0f766e', dashed: false };
      if (frame.phase === 'disjoint') return { fill: '#e2e8f0', text: '#64748b', stroke: '#94a3b8', dashed: false };
      return { fill: '#f59e0b', text: '#fff', stroke: '#b45309', dashed: false };
    }
    const isNew = node.version === frame.version;
    if (isNew) return { fill: '#34d399', text: '#fff', stroke: '#059669', dashed: false };
    return { fill: '#fff', text: '#1e293b', stroke: '#2563eb', dashed: true };
  }

  function treeSvg(result, frame) {
    const lo = result.lo, hi = result.hi, nodes = result.nodes;
    let svg = '<svg class="pst-svg" viewBox="0 0 600 252" width="100%" xmlns="http://www.w3.org/2000/svg">';
    for (let pos = 2; pos <= 15; pos++) {
      if (lo[pos] === undefined) continue;
      const id = frame.posToId[pos];
      if (!id) continue;
      const node = nodes[id];
      const isNew = node.version === frame.version;
      const p = POS[pos >> 1], c = POS[pos];
      svg += '<line x1="' + p[0] + '" y1="' + (p[1] + 15) + '" x2="' + c[0] + '" y2="' + (c[1] - 15) +
             '" stroke="' + (isNew ? '#059669' : '#cbd5e1') + '" stroke-width="' + (isNew ? '2' : '1.5') +
             '" stroke-dasharray="' + (isNew ? 'none' : '4 2') + '"/>';
    }
    for (let pos = 1; pos <= 15; pos++) {
      if (lo[pos] === undefined) continue;
      const id = frame.posToId[pos];
      if (!id) continue;
      const node = nodes[id];
      const isActive = pos === frame.active;
      const style = nodeStyle(frame, pos, node, isActive);
      const c = POS[pos];
      svg += '<rect class="pst-node" data-pos="' + pos + '" data-node-id="' + node.id + '" x="' + (c[0] - 30) +
             '" y="' + (c[1] - 15) + '" width="60" height="30" rx="4" fill="' + style.fill + '" stroke="' + style.stroke +
             '" stroke-width="1.5" stroke-dasharray="' + (style.dashed ? '4 2' : 'none') + '"/>';
      svg += '<text x="' + c[0] + '" y="' + (c[1] - 19) + '" text-anchor="middle" font-size="9" fill="#64748b">[' +
             lo[pos] + ',' + hi[pos] + ']</text>';
      svg += '<text x="' + c[0] + '" y="' + (c[1] + 5) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' +
             style.text + '">' + node.sum + '</text>';
      svg += '<text x="' + (c[0] + 24) + '" y="' + (c[1] - 5) + '" text-anchor="middle" font-size="8" font-weight="700" fill="' +
             (style.dashed ? '#2563eb' : '#065f46') + '">v' + node.version + '</text>';
    }
    svg += '</svg>';
    return svg;
  }

  function versionTabsHtml(result, currentVersion) {
    return result.versions.map((v) => {
      const cls = 'pst-vtab' + (v.version === currentVersion ? ' pst-vtab-current' : '');
      return '<button type="button" class="' + cls + '" data-jump-version="' + v.version + '" data-testid="pst-vtab-' + v.version + '">' +
        'v' + v.version + ' <span class="pst-vtab-sum">Σ=' + v.rootSum + '</span></button>';
    }).join('');
  }

  function statsHtml(result, frame) {
    const v = result.versions[frame.version];
    if (!v) return '';
    return '<span data-testid="pst-stats">' +
      L('版本 v', 'Version v') + v.version + ': ' +
      '<strong>' + v.newNodes + '</strong> ' + L('個新節點', 'new') + ' · ' +
      '<strong>' + v.sharedNodes + '</strong> ' + L('個共用節點', 'shared') + ' (' + L('共', 'of') + ' ' + v.totalNodes + ')' +
      '</span>';
  }

  function renderPersistentSegmentTree() {
    syncDifficultyPreset();
    const config = state.config;
    const host = K().acquireDynamicVizHost();
    const defaultConfig = global.PersistentSegTreeViz.presetForDifficulty(state.tier === 'normal' ? 'normal' : 'edge');
    const defaultSerialized = serialize(defaultConfig);

    host.innerHTML =
      '<div class="pst-wrap vizfit-host">' +
        '<div class="pst-controls">' +
          '<span class="pst-tier">' + (state.tier === 'normal' ? L('一般輸入', 'Normal input') : L('挑戰輸入', 'Challenge input')) + '</span>' +
          '<label>' + L('陣列', 'array') + ' <input type="text" class="pst-arr" value="' + escapeAttribute(config.arr.join(',')) + '"></label>' +
          '<label>' + L('更新1 idx:val', 'update1 idx:val') + ' <input type="text" class="pst-u1" value="' + idvText(config.u1) + '"></label>' +
          '<label>' + L('更新2 idx:val', 'update2 idx:val') + ' <input type="text" class="pst-u2" value="' + idvText(config.u2) + '"></label>' +
          '<label>' + L('查詢 l,r', 'query l,r') + ' <input type="text" class="pst-q" value="' + config.q.l + ',' + config.q.r + '"></label>' +
          '<button type="button" class="pst-apply">' + L('套用', 'Apply') + '</button>' +
          '<button type="button" class="pst-random" title="' + L('依目前難度產生範例', 'Generate an example at the current difficulty') + '">🎲</button>' +
          buildExamplesSelect(METHOD_ID, defaultSerialized) +
        '</div>' +
        '<div class="pst-issues" aria-live="polite">' + issuesHtml(state.errors, state.warnings) + '</div>' +
        '<div class="pst-versions" data-testid="pst-versions"></div>' +
        '<div class="pst-banner" data-testid="pst-banner">&nbsp;</div>' +
        '<div class="pst-stage vizfit-scroll"></div>' +
        '<div class="pst-stats-row">' + '</div>' +
        '<div class="pst-msg" data-testid="pst-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.pst-wrap');
    const examples = wrap.querySelector('.ex-select');

    const result = global.PersistentSegTreeViz.buildFrames(config);
    const versionsEl = wrap.querySelector('.pst-versions');
    const stageEl = wrap.querySelector('.pst-stage');
    const bannerEl = wrap.querySelector('.pst-banner');
    const statsEl = wrap.querySelector('.pst-stats-row');
    const msgEl = wrap.querySelector('.pst-msg');

    // Frame indices worth jumping straight to from the version tabs / result banner.
    const jump = { build0: 0, ready1: -1, ready2: -1, resultV0: -1, resultV2: -1 };
    result.frames.forEach((frame, index) => {
      if (frame.phase === 'version-ready' && frame.version === 1 && jump.ready1 < 0) jump.ready1 = index;
      if (frame.phase === 'version-ready' && frame.version === 2 && jump.ready2 < 0) jump.ready2 = index;
      if (frame.phase === 'result' && frame.version === 0 && jump.resultV0 < 0) jump.resultV0 = index;
      if (frame.phase === 'result' && frame.version === 2 && jump.resultV2 < 0) jump.resultV2 = index;
    });

    let controls = null;
    function paint(frame) {
      stageEl.innerHTML = treeSvg(result, frame);
      versionsEl.innerHTML = versionTabsHtml(result, frame.version);
      statsEl.innerHTML = statsHtml(result, frame);
      const langMsg = K().langOf(frame.msg);
      bannerEl.textContent = 'v' + frame.version + ' · ' + frame.phase + (frame.active >= 0 ? ' · node #' + frame.active : '');
      msgEl.textContent = langMsg;
      K().showStatus(langMsg, frame.phase === 'result' ? '#16a34a' : frame.phase === 'shared' ? '#2563eb' : '#0f172a');
      versionsEl.querySelectorAll('[data-jump-version]').forEach((button) => {
        button.onclick = () => {
          const target = button.getAttribute('data-jump-version');
          const idx = target === '0' ? jump.build0 : target === '1' ? jump.ready1 : jump.ready2;
          if (idx >= 0 && controls && controls.__pstGoTo) controls.__pstGoTo(idx);
        };
      });
    }

    controls = K().buildFrameControls(result.frames, paint, { runIntervalMs: 550 });
    // buildFrameControls doesn't expose a public "goTo" — drive it the same way the
    // page's own scrubber does, via its DOM element, so version tabs can jump precisely.
    controls.__pstGoTo = (index) => {
      const scrubber = controls.querySelector('.stepctl-scrubber');
      if (!scrubber) return;
      scrubber.value = String(index);
      scrubber.dispatchEvent(new Event('input', { bubbles: true }));
    };
    wrap.appendChild(controls);

    const resultBannerLine = document.createElement('div');
    resultBannerLine.className = 'pst-invariant';
    resultBannerLine.setAttribute('data-testid', 'pst-invariant');
    resultBannerLine.innerHTML =
      '<button type="button" class="pst-jump-btn" data-jump="resultV0">' + L('查詢 v0', 'Query v0') + '</button>' +
      '<button type="button" class="pst-jump-btn" data-jump="resultV2">' + L('查詢 v2', 'Query v2') + '</button>' +
      '<span>' + L('sum[', 'sum[') + result.query.l + ',' + result.query.r + ']: v0 = ' + result.resultV0 +
      '　v2 = ' + result.resultV2 + '　(' + L('v0 保持不變', 'v0 stays untouched') + ')</span>';
    wrap.insertBefore(resultBannerLine, wrap.querySelector('.stepctl'));
    resultBannerLine.querySelectorAll('[data-jump]').forEach((button) => {
      button.onclick = () => {
        const key = button.getAttribute('data-jump');
        const idx = key === 'resultV0' ? jump.resultV0 : jump.resultV2;
        if (idx >= 0 && controls.__pstGoTo) controls.__pstGoTo(idx);
      };
    });

    wrap.querySelector('.pst-apply').addEventListener('click', () => {
      const parsed = global.PersistentSegTreeViz.parseInput(
        wrap.querySelector('.pst-arr').value,
        wrap.querySelector('.pst-u1').value,
        wrap.querySelector('.pst-u2').value,
        wrap.querySelector('.pst-q').value
      );
      state.config = { arr: parsed.arr, u1: parsed.u1, u2: parsed.u2, q: parsed.q };
      state.errors = parsed.errors;
      state.warnings = parsed.warnings;
      state.userEdited = true;
      if (!parsed.errors.length) saveExample(METHOD_ID, serialize(state.config), defaultSerialized);
      renderPersistentSegmentTree();
    });
    wrap.querySelector('.pst-random').addEventListener('click', () => {
      const difficulty = K().getInputDifficulty ? K().getInputDifficulty() : 'normal';
      state.tier = difficulty === 'normal' ? 'normal' : 'challenge';
      state.config = global.PersistentSegTreeViz.randomConfig(difficulty);
      state.errors = [];
      state.warnings = [];
      state.userEdited = true;
      saveExample(METHOD_ID, serialize(state.config), defaultSerialized);
      renderPersistentSegmentTree();
    });
    if (examples) examples.addEventListener('change', (event) => {
      if (!event.target.value) return;
      const parsed = deserialize(event.target.value);
      state.config = { arr: parsed.arr, u1: parsed.u1, u2: parsed.u2, q: parsed.q };
      state.errors = parsed.errors;
      state.warnings = parsed.warnings;
      state.userEdited = true;
      renderPersistentSegmentTree();
    });
  }

  global.VizRegistry.attach(METHOD_ID, {
    render: renderPersistentSegmentTree,
    code: () => (typeof codeTreePersistentSegment !== 'undefined' ? codeTreePersistentSegment : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
