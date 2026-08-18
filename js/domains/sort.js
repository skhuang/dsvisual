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
      function paint(f) {
        stage.innerHTML = f.array.map((v, i) =>
          '<div class="sort-bar ' + (f.hi[i] || '') + '" style="height:' + ((v / maxV) * 100).toFixed(2) + '%"><span>' + v + '</span></div>'
        ).join('');
      }
      host.appendChild(K1.buildStepWorkbench({ stage: stage, frames: frames, paint: paint, getMessage: (f) => K1.langOf(f.message), runIntervalMs: 400 }));

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
