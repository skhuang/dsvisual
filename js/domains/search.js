(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  const SF = () => global.SearchFrames;
  const DEFAULT_TEXT = () => SF().SEARCH_DEFAULT_ARR.join(',') + ' | ' + SF().SEARCH_DEFAULT_TARGET;
  const FRAMES = {
    'search-linear': (a, t) => SF().linearFrames(a, t),
    'search-binary': (a, t) => SF().binaryFrames(a, t),
    'search-fibonacci': (a, t) => SF().fibonacciFrames(a, t),
    'search-interpolation': (a, t) => SF().interpolationFrames(a, t),
  };
  const CODE = {
    'search-linear': () => codeSearchLinear, 'search-binary': () => codeSearchBinary,
    'search-fibonacci': () => codeSearchFibonacci, 'search-interpolation': () => codeSearchInterpolation,
  };
  const _txt = {}; // per-method last input ("arr | target")

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function loadEx(id) { try { return ExamplesStore.load(localStorage, id); } catch (e) { return []; } }
  function saveEx(id, text) { try { ExamplesStore.save(localStorage, id, text, DEFAULT_TEXT()); } catch (e) {} }
  function exSelectHtml(id) {
    const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
    let h = '<select class="ex-select"><option value="">' + (lang === 'zh' ? '範例…' : 'Examples…') + '</option>';
    h += '<option value="' + esc(DEFAULT_TEXT()) + '">' + (lang === 'zh' ? '預設' : 'Default') + '</option>';
    for (const e of loadEx(id)) h += '<option value="' + esc(e.text) + '">' + esc(e.text) + '</option>';
    return h + '</select>';
  }
  function parseSearch(text) {
    const parts = String(text).split('|');
    let arr = (parts[0] || '').split(/[\s,]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite).filter((v) => v >= 1 && v <= 99).slice(0, 20);
    let target = parseInt((parts[1] || '').trim(), 10);
    if (arr.length < 2) arr = SF().SEARCH_DEFAULT_ARR.slice();
    if (!Number.isFinite(target)) target = SF().SEARCH_DEFAULT_TARGET;
    return { arr, target };
  }

  function renderSearch(methodId) {
    const K1 = K();
    const host = K1.acquireDynamicVizHost();
    const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
    if (!_txt[methodId]) _txt[methodId] = DEFAULT_TEXT();

    function rebuild() {
      host.innerHTML = '';
      const parsed = parseSearch(_txt[methodId]);
      const arr = methodId === 'search-linear' ? parsed.arr : parsed.arr.slice().sort((a, b) => a - b);
      const target = parsed.target;

      const controls = document.createElement('div');
      controls.className = 'searchviz-controls';
      controls.innerHTML =
        '<input type="text" class="searchviz-arr" data-testid="searchviz-arr" value="' + esc(arr.join(',')) + '">' +
        '<label class="searchviz-tlabel">' + (lang === 'zh' ? '目標' : 'target') + ' <input type="number" class="searchviz-target" data-testid="searchviz-target" value="' + esc(target) + '"></label>' +
        '<button type="button" class="searchviz-build btn primary">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
        '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
        exSelectHtml(methodId);
      host.appendChild(controls);

      const frames = FRAMES[methodId](arr, target);
      const stage = document.createElement('div');
      stage.className = 'searchviz-stage';
      function paint(f) {
        stage.innerHTML = f.array.map((v, i) =>
          '<div class="search-cell ' + (f.hi[i] || '') + '"><span class="val">' + v + '</span><i class="idx">' + i + '</i></div>'
        ).join('');
      }
      host.appendChild(K1.buildStepWorkbench({ stage: stage, frames: frames, paint: paint, getMessage: (f) => K1.langOf(f.message), runIntervalMs: 500 }));

      function applyText(text) { _txt[methodId] = text; saveEx(methodId, text); rebuild(); }
      controls.querySelector('.searchviz-build').addEventListener('click', () => {
        applyText(controls.querySelector('.searchviz-arr').value + ' | ' + controls.querySelector('.searchviz-target').value);
      });
      controls.querySelector('.rand-btn').addEventListener('click', () => {
        const r = window.RandomInput && RandomInput.randomInputFor('search', K1.getInputDifficulty());
        if (r && Array.isArray(r.data) && r.data.length) applyText(r.data.join(',') + ' | ' + r.target);
      });
      const ex = controls.querySelector('.ex-select');
      if (ex) ex.addEventListener('change', (e) => { if (e.target.value) applyText(e.target.value); });
    }
    rebuild();
  }

  R().attach('search-linear', { render: () => renderSearch('search-linear'), code: CODE['search-linear'], layout: { host: 'dynamic' } });
  R().attach('search-binary', { render: () => renderSearch('search-binary'), code: CODE['search-binary'], layout: { host: 'dynamic' } });
  R().attach('search-fibonacci', { render: () => renderSearch('search-fibonacci'), code: CODE['search-fibonacci'], layout: { host: 'dynamic' } });
  R().attach('search-interpolation', { render: () => renderSearch('search-interpolation'), code: CODE['search-interpolation'], layout: { host: 'dynamic' } });
  C().registerDomain({ id: 'search' });
})(typeof window !== 'undefined' ? window : globalThis);
