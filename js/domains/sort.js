(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  const DEFAULT_TEXT = (global.SortFrames ? global.SortFrames.SORT_DEFAULT : [5,2,8,1,9,3,7,4,6]).join(',');
  const FRAMES = {
    'sort-bubble': (a) => global.SortFrames.bubbleFrames(a),
    'sort-select': (a) => global.SortFrames.selectionFrames(a),
    'sort-insert': (a) => global.SortFrames.insertionFrames(a),
    'sort-quick': (a) => global.SortFrames.quickFrames(a),
    'sort-merge': (a) => global.SortFrames.mergeFrames(a),
    'sort-shell': (a) => global.SortFrames.shellFrames(a),
    'sort-heap': (a) => global.SortFrames.heapFrames(a),
    'sort-bucket': (a) => global.SortFrames.bucketFrames(a),
    'sort-count': (a) => global.SortFrames.countingFrames(a),
    'sort-radix': (a) => global.SortFrames.radixFrames(a),
    'sort-shaker': (a) => global.SortFrames.shakerFrames(a),
  };
  const _sortText = {}; // per-method last input

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function loadEx(id) { try { return ExamplesStore.load(localStorage, id); } catch (e) { return []; } }
  function saveEx(id, text) { try { ExamplesStore.save(localStorage, id, text, DEFAULT_TEXT); } catch (e) {} }
  function exSelectHtml(id) {
    const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
    let h = '<select class="ex-select"><option value="">' + (lang === 'zh' ? '範例…' : 'Examples…') + '</option>';
    h += '<option value="' + esc(DEFAULT_TEXT) + '">' + (lang === 'zh' ? '預設' : 'Default') + '</option>';
    for (const e of loadEx(id)) h += '<option value="' + esc(e.text) + '">' + esc(e.text) + '</option>';
    return h + '</select>';
  }
  function parseArr(text) {
    let a = String(text).split(/[\s,]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite);
    a = a.filter((v) => v >= 1 && v <= 99).slice(0, 20);
    return a.length >= 2 ? a : (global.SortFrames ? global.SortFrames.SORT_DEFAULT.slice() : [5,2,8,1,9,3,7,4,6]);
  }

  // Renders a complete-binary-heap tree (used only by sort-heap) into an SVG element,
  // synchronized with the current animation frame's array + highlight map.
  function renderHeapTree(svg, array, hi) {
    const n = array.length;
    const heightPerLevel = 20;
    const R = 4; // node radius, in viewBox units — kept in sync with the SLOT sizing below
    const SLOT = 12; // >= 2*R plus a margin, so deepest-level siblings never touch/overlap
    if (!n) { svg.setAttribute('viewBox', '0 0 100 ' + heightPerLevel); svg.innerHTML = ''; return; }
    const depth = Math.floor(Math.log2(n)) + 1;
    const H = depth * heightPerLevel;
    // Widen the viewBox to fit the deepest level's slot count so its siblings keep a full
    // SLOT of spacing regardless of n (fixes overlap once the heap reaches 16+ elements);
    // shallower levels just space out further within the same width. Width stays >= 100 so
    // small trees keep their original scale.
    const deepestLevelCount = Math.pow(2, depth - 1);
    const W = Math.max(100, deepestLevelCount * SLOT);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const pos = new Array(n);
    for (let i = 0; i < n; i++) {
      const L = Math.floor(Math.log2(i + 1));
      const levelCount = Math.pow(2, L);
      const p = i - (levelCount - 1);
      pos[i] = { x: ((p + 0.5) / levelCount) * W, y: ((L + 0.5) / depth) * H };
    }
    let edges = '';
    for (let i = 1; i < n; i++) {
      const parent = Math.floor((i - 1) / 2);
      const dim = (hi[i] === 'sorted' || hi[parent] === 'sorted') ? ' dim' : '';
      edges += '<line class="heaptree-edge' + dim + '" x1="' + pos[parent].x.toFixed(2) + '" y1="' + pos[parent].y.toFixed(2) +
        '" x2="' + pos[i].x.toFixed(2) + '" y2="' + pos[i].y.toFixed(2) + '"></line>';
    }
    let nodes = '';
    for (let i = 0; i < n; i++) {
      const cls = hi[i] || '';
      nodes += '<circle class="heaptree-node ' + cls + '" cx="' + pos[i].x.toFixed(2) + '" cy="' + pos[i].y.toFixed(2) + '" r="' + R + '"></circle>' +
        '<text class="heaptree-label" x="' + pos[i].x.toFixed(2) + '" y="' + pos[i].y.toFixed(2) + '">' + esc(Math.trunc(array[i])) + '</text>';
    }
    svg.innerHTML = edges + nodes;
  }

  function renderSort(methodId) {
    const K1 = K();
    const host = K1.acquireDynamicVizHost();
    const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
    if (!_sortText[methodId]) _sortText[methodId] = DEFAULT_TEXT;

    function rebuild() {
      host.innerHTML = '';
      const controls = document.createElement('div');
      controls.className = 'sortviz-controls';
      controls.innerHTML =
        '<input type="text" class="sortviz-input" data-testid="sortviz-input" value="' + esc(_sortText[methodId]) + '">' +
        '<button type="button" class="sortviz-build btn primary">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
        '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
        exSelectHtml(methodId);
      host.appendChild(controls);

      const arr = parseArr(_sortText[methodId]);
      const frames = FRAMES[methodId](arr);
      const maxV = Math.max.apply(null, arr) || 1;
      const stage = document.createElement('div');
      stage.className = 'sortviz-stage';
      let treeStage = null;
      if (methodId === 'sort-heap') {
        treeStage = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        treeStage.setAttribute('class', 'sortviz-heaptree');
        treeStage.setAttribute('data-testid', 'heaptree');
      }
      function paint(f) {
        stage.innerHTML = f.array.map((v, i) =>
          '<div class="sort-bar ' + (f.hi[i] || '') + '" style="height:' + ((v / maxV) * 100).toFixed(2) + '%"><span>' + v + '</span></div>'
        ).join('');
        if (methodId === 'sort-heap') renderHeapTree(treeStage, f.array, f.hi);
      }
      host.appendChild(K1.buildStepWorkbench({ stage: stage, frames: frames, paint: paint, getMessage: (f) => K1.langOf(f.message), runIntervalMs: 400 }));
      if (treeStage) host.appendChild(treeStage);

      function applyText(text) { _sortText[methodId] = text; saveEx(methodId, text); rebuild(); }
      controls.querySelector('.sortviz-build').addEventListener('click', () => applyText(controls.querySelector('.sortviz-input').value));
      controls.querySelector('.rand-btn').addEventListener('click', () => {
        const r = window.RandomInput && RandomInput.randomInputFor('sort', K1.getInputDifficulty());
        if (r && Array.isArray(r.data) && r.data.length) applyText(r.data.join(','));
      });
      const ex = controls.querySelector('.ex-select');
      if (ex) ex.addEventListener('change', (e) => { if (e.target.value) applyText(e.target.value); });
    }
    rebuild();
  }

  R().attach('sort-bubble', { render: () => renderSort('sort-bubble'), code: () => codeSortBubble, layout: { host: 'dynamic' } });
  R().attach('sort-select', { render: () => renderSort('sort-select'), code: () => codeSortSelect, layout: { host: 'dynamic' } });
  R().attach('sort-insert', { render: () => renderSort('sort-insert'), code: () => codeSortInsert, layout: { host: 'dynamic' } });
  R().attach('sort-quick', { render: () => renderSort('sort-quick'), code: () => codeSortQuick, layout: { host: 'dynamic' } });
  R().attach('sort-merge', { render: () => renderSort('sort-merge'), code: () => codeSortMerge, layout: { host: 'dynamic' } });
  R().attach('sort-shell', { render: () => renderSort('sort-shell'), code: () => codeSortShell, layout: { host: 'dynamic' } });
  R().attach('sort-bucket', { render: () => renderSort('sort-bucket'), code: () => codeSortBucket, layout: { host: 'dynamic' } });
  R().attach('sort-count', { render: () => renderSort('sort-count'), code: () => codeSortCounting, layout: { host: 'dynamic' } });
  R().attach('sort-radix', { render: () => renderSort('sort-radix'), code: () => codeSortRadix, layout: { host: 'dynamic' } });
  R().attach('sort-heap', { render: () => renderSort('sort-heap'), code: () => codeSortHeap, layout: { host: 'dynamic' } });
  R().attach('sort-shaker', { render: () => renderSort('sort-shaker'), code: () => codeSortShaker, layout: { host: 'dynamic' } });
  C().registerDomain({ id: 'sort' });
})(typeof window !== 'undefined' ? window : globalThis);
