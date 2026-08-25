(function (global) {
  'use strict';
  const K = () => global.VizKit;

  const METHOD_ID = 'sparse-table-rmq';
  const DEFAULT_ARR = [7, 2, 3, 9, 4, 6, 1, 8];
  const DEFAULT_L = 1, DEFAULT_R = 4;
  const MAX_N = 16;

  function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
  function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) { /* ignore */ } }
  function buildExamplesSelect(methodId, defaultText) {
    const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const trunc = (s) => { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
    let h = '<select class="ex-select spt-examples" data-method="' + escAttr(methodId) + '">';
    h += '<option value="">' + (lang === 'zh' ? '範例…' : 'Examples…') + '</option>';
    h += '<option value="' + escAttr(defaultText) + '">' + (lang === 'zh' ? '預設' : 'Default') + '</option>';
    loadExamples(methodId).forEach((e) => {
      if (e.text === defaultText) return;
      h += '<option value="' + escAttr(e.text) + '">' + escText(trunc(e.text)) + '</option>';
    });
    h += '</select>';
    return h;
  }

  function defaultText() { return DEFAULT_ARR.join(',') + ' | ' + DEFAULT_L + ',' + DEFAULT_R; }

  // Parses "v1,v2,... | l,r" into a clamped {arr, l, r}. Falls back to the
  // default whenever the array half is empty/unparseable, and always yields
  // a valid in-range, l<=r query (swapping/clamping rather than rejecting).
  function parseInput(text) {
    const parts = String(text).split('|');
    let arr = (parts[0] || '').split(/[,\s]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite).slice(0, MAX_N);
    if (!arr.length) arr = DEFAULT_ARR.slice();
    const n = arr.length;
    const rangeParts = (parts[1] || '').split(/[,\s]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite);
    let l = Number.isFinite(rangeParts[0]) ? rangeParts[0] : DEFAULT_L;
    let r = Number.isFinite(rangeParts[1]) ? rangeParts[1] : Math.min(DEFAULT_R, n - 1);
    l = Math.max(0, Math.min(l, n - 1));
    r = Math.max(0, Math.min(r, n - 1));
    if (l > r) { const t = l; l = r; r = t; }
    return { arr, l, r };
  }

  // Pure model: builds the doubling table plus a frame log for both the
  // build phase (level by level) and the O(1) query phase. Exported for
  // reuse/testing.
  function buildSparseTableFrames(arr, l, r) {
    const n = arr.length;
    const frames = [];
    const snap = (table, levels, msg, hi) => frames.push({
      table: table.map((row) => row.slice()),
      levels: levels,
      msg: msg,
      hi: hi || {}, // { 'k,i': 'src'|'dst'|'ans', arr: Set-like {idx:true} }
    });

    if (n === 0) {
      snap([], 0, { zh: '空陣列，無法建表', en: 'Empty array — nothing to build' }, {});
      return { frames, table: [], K: 0, k: 0, answer: undefined };
    }

    let levels = 1;
    while ((1 << levels) <= n) levels++;
    const table = [arr.slice()];
    snap(table, 1, { zh: 'Level 0 = 原始陣列 (窗長 1)', en: 'Level 0 = the array itself (window length 1)' }, { arr: allIdx(n) });

    for (let k = 1; k < levels; k++) {
      const half = 1 << (k - 1), len = 1 << k;
      const row = new Array(n).fill(null);
      for (let i = 0; i + len <= n; i++) {
        row[i] = Math.min(table[k - 1][i], table[k - 1][i + half]);
        const hi = {};
        hi[(k - 1) + ',' + i] = 'src';
        hi[(k - 1) + ',' + (i + half)] = 'src';
        hi[k + ',' + i] = 'dst';
        // table currently holds k complete rows (0..k-1); append the
        // in-progress row k (only indices up to i filled so far) for the snapshot.
        const partial = table.concat([row]);
        frames.push({
          table: partial.map((rw) => rw.slice()),
          levels: k + 1,
          msg: { zh: 'st[' + k + '][' + i + '] = min(st[' + (k - 1) + '][' + i + '], st[' + (k - 1) + '][' + (i + half) + ']) = min(' + table[k - 1][i] + ', ' + table[k - 1][i + half] + ') = ' + row[i],
                  en: 'st[' + k + '][' + i + '] = min(st[' + (k - 1) + '][' + i + '], st[' + (k - 1) + '][' + (i + half) + ']) = min(' + table[k - 1][i] + ', ' + table[k - 1][i + half] + ') = ' + row[i] },
          hi: hi,
        });
      }
      table.push(row);
    }

    // Query phase.
    const len = r - l + 1;
    let k = 0;
    while ((1 << (k + 1)) <= len) k++;
    const j = r - (1 << k) + 1;
    const answer = Math.min(table[k][l], table[k][j]);

    const hiRange = { arr: rangeIdx(l, r) };
    snap(table, levels, { zh: '查詢 [' + l + ', ' + r + ']，長度 = ' + len, en: 'Query [' + l + ', ' + r + '], length = ' + len }, hiRange);
    snap(table, levels, { zh: 'k = floor(log2(' + len + ')) = ' + k + '（用兩個長度 2^' + k + ' 的視窗覆蓋）', en: 'k = floor(log2(' + len + ')) = ' + k + ' (cover with two windows of length 2^' + k + ')' }, hiRange);

    const hiWindows = { arr: rangeIdx(l, r) };
    hiWindows[k + ',' + l] = 'src';
    hiWindows[k + ',' + j] = 'src';
    snap(table, levels, { zh: 'st[' + k + '][' + l + '] 與 st[' + k + '][' + j + '] 這兩個視窗覆蓋了整個 [' + l + ', ' + r + ']（可重疊）', en: 'st[' + k + '][' + l + '] and st[' + k + '][' + j + '] together cover [' + l + ', ' + r + '] (overlap is fine for min)' }, hiWindows);

    const hiAns = { arr: rangeIdx(l, r) };
    hiAns[k + ',' + l] = 'ans'; hiAns[k + ',' + j] = 'ans';
    snap(table, levels, { zh: '答案 = min(' + table[k][l] + ', ' + table[k][j] + ') = ' + answer, en: 'answer = min(' + table[k][l] + ', ' + table[k][j] + ') = ' + answer }, hiAns);

    return { frames, table, K: levels, k, answer };
  }

  function allIdx(n) { const o = {}; for (let i = 0; i < n; i++) o[i] = true; return o; }
  function rangeIdx(l, r) { const o = {}; for (let i = l; i <= r; i++) o[i] = true; return o; }

  let _state = null;
  function renderSparseTableRMQ() {
    const host = K().acquireDynamicVizHost();
    if (!_state) _state = { text: defaultText() };

    function rebuild() {
      host.innerHTML = '';
      const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
      const parsed = parseInput(_state.text);
      const arr = parsed.arr, l = parsed.l, r = parsed.r, n = arr.length;

      const controls = document.createElement('div');
      controls.className = 'spt-controls';
      controls.innerHTML =
        '<input type="text" class="spt-arr" data-testid="spt-arr" value="' + arr.join(',') + '">' +
        '<label class="spt-range-label">l,r <input type="text" class="spt-range" data-testid="spt-range" value="' + l + ',' + r + '"></label>' +
        '<button type="button" class="spt-build btn primary">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
        '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
        buildExamplesSelect(METHOD_ID, defaultText());
      host.appendChild(controls);

      const built = buildSparseTableFrames(arr, l, r);
      const frames = built.frames;

      const stage = document.createElement('div');
      stage.className = 'spt-wrap';

      function paint(f) {
        const hi = f.hi || {};
        let arrHtml = '<div class="spt-level-label">a[i]</div><div class="spt-row">';
        for (let i = 0; i < n; i++) {
          arrHtml += '<div class="spt-cell' + (hi.arr && hi.arr[i] ? ' active' : '') + '" data-cell="a,' + i + '">' + arr[i] + '</div>';
        }
        arrHtml += '</div>';

        let idxHtml = '<div class="spt-level-label"></div><div class="spt-row">';
        for (let i = 0; i < n; i++) idxHtml += '<div class="spt-idx">' + i + '</div>';
        idxHtml += '</div>';

        let tableHtml = '';
        const table = f.table || [];
        for (let k = 0; k < (f.levels || table.length); k++) {
          const row = table[k] || [];
          tableHtml += '<div class="spt-level-label">k=' + k + ' (len ' + (1 << k) + ')</div><div class="spt-row">';
          for (let i = 0; i < n; i++) {
            const v = row[i];
            const has = v !== undefined && v !== null;
            const cls = hi[k + ',' + i] || '';
            tableHtml += '<div class="spt-cell' + (has ? '' : ' empty') + (cls ? ' ' + cls : '') + '" data-cell="' + k + ',' + i + '">' + (has ? v : '') + '</div>';
          }
          tableHtml += '</div>';
        }

        stage.innerHTML =
          '<div class="spt-grid">' + idxHtml + arrHtml + tableHtml + '</div>' +
          '<div class="spt-msg" data-testid="spt-msg">' + K().langOf(f.msg) + '</div>';
      }

      host.appendChild(K().buildStepWorkbench({
        stage: stage, frames: frames, paint: paint, runIntervalMs: 650,
        getMessage: (f) => K().langOf(f.msg),
      }));

      wireControls();

      function wireControls() {
        controls.querySelector('.spt-build').addEventListener('click', () => {
          const arrVal = controls.querySelector('.spt-arr').value;
          const rangeVal = controls.querySelector('.spt-range').value;
          _state.text = arrVal + ' | ' + rangeVal;
          saveExample(METHOD_ID, _state.text, defaultText());
          rebuild();
        });
        const ex = controls.querySelector('.ex-select');
        if (ex) ex.addEventListener('change', (e) => { if (e.target.value) { _state.text = e.target.value; rebuild(); } });
        controls.querySelector('.rand-btn').addEventListener('click', () => {
          const difficulty = K().getInputDifficulty ? K().getInputDifficulty() : 'normal';
          const r2 = global.RandomInput && RandomInput.randomInputFor(METHOD_ID, difficulty);
          if (!r2 || !Array.isArray(r2.vals) || !r2.vals.length) return;
          _state.text = r2.vals.join(',') + ' | ' + r2.l + ',' + r2.r;
          rebuild();
        });
      }
    }
    rebuild();
  }

  if (typeof global !== 'undefined' && global.VizRegistry) {
    global.VizRegistry.attach(METHOD_ID, {
      render: renderSparseTableRMQ,
      code: () => (typeof codeSparseTableRMQ !== 'undefined' ? codeSparseTableRMQ : ''),
      layout: { host: 'dynamic', codeDrawer: true },
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildSparseTableFrames, parseInput };
  }
})(typeof window !== 'undefined' ? window : globalThis);
