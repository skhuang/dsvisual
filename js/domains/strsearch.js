(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;
  const SSF = () => global.StrSearchFrames;

  const DEFAULT_TEXT = () => SSF().STRSEARCH_DEFAULT_TEXT + ' | ' + SSF().STRSEARCH_DEFAULT_PATTERN;
  const FRAMES = {
    'search-kmp': (t, p) => SSF().kmpFrames(t, p),
    'search-bm': (t, p) => SSF().bmFrames(t, p),
    'search-rk': (t, p) => SSF().rkFrames(t, p),
    'search-zalgo': (t, p) => SSF().zalgoFrames(t, p),
    'search-strcompare': (t, p) => SSF().strcompareFrames(t, p),
  };
  const CODE = {
    'search-kmp': () => codeSearchKMP, 'search-bm': () => codeSearchBM, 'search-rk': () => codeSearchRK,
    'search-zalgo': () => codeSearchZAlgo, 'search-strcompare': () => codeSearchStrCompare,
  };
  const _txt = {};

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
  function clean(s, cap) { return String(s).replace(/[^\x21-\x7e]/g, '').slice(0, cap); }
  function parseStrSearch(text) {
    const idx = String(text).indexOf('|');
    let tt = idx >= 0 ? text.slice(0, idx) : text;
    let pp = idx >= 0 ? text.slice(idx + 1) : '';
    tt = clean(tt.trim(), 40); pp = clean(pp.trim(), 20);
    if (!tt) tt = SSF().STRSEARCH_DEFAULT_TEXT;
    if (!pp) pp = SSF().STRSEARCH_DEFAULT_PATTERN;
    return { text: tt, pattern: pp };
  }

  function alignHtml(f) { return '<div class="strsearch-align">' + SSF().buildAlignmentRow(f.text, f.pattern, f.offset || 0, f.hi) + '</div>'; }
  const PAINT = {
    'search-kmp': (f) => alignHtml(f) +
      '<div class="strsearch-lps"><strong>LPS:</strong> ' + f.extras.lps.map((v, k) => '<span class="strsearch-lps-cell' + (k === f.extras.lpsActive ? ' strsearch-lps-active' : '') + '">' + v + '</span>').join('') + '</div>' +
      '<div class="strsearch-stats" data-testid="kmp-stats">comparisons: ' + f.extras.comparisons + ' &nbsp;|&nbsp; matches: [' + f.extras.matches.join(',') + ']</div>',
    'search-bm': (f) => alignHtml(f) +
      '<div class="strsearch-shift-note" data-testid="bm-note">' + (f.extras.note || '&nbsp;') + '</div>' +
      '<div class="strsearch-stats" data-testid="bm-stats">comparisons: ' + f.extras.comparisons + ' &nbsp;|&nbsp; matches: [' + f.extras.matches.join(',') + ']</div>',
    'search-rk': (f) => alignHtml(f) +
      '<div class="strsearch-hash" data-testid="rk-hash">pattern hash: ' + f.extras.patHash + ' &nbsp;|&nbsp; window hash: ' + f.extras.winHash + '</div>' +
      '<div class="strsearch-shift-note" data-testid="rk-note">' + (f.extras.note || '&nbsp;') + '</div>' +
      '<div class="strsearch-stats">hash checks: ' + f.extras.hashChecks + ' &nbsp;|&nbsp; verifications: ' + f.extras.verifyChecks + ' &nbsp;|&nbsp; matches: [' + f.extras.matches.join(',') + ']</div>',
    'search-zalgo': (f) => {
      const s = f.extras.combined, z = f.extras.z, cur = f.extras.cur, box = f.extras.box, n = s.length, m = f.pattern.length;
      let chr = '<div class="zalgo-row zalgo-chr">', zr = '<div class="zalgo-row zalgo-z">';
      for (let k = 0; k < n; k++) {
        const inBox = box.r > box.l && k >= box.l && k < box.r;
        chr += '<span class="zalgo-cell' + (inBox ? ' zalgo-box' : '') + ((k === cur && cur < n) ? ' zalgo-cur' : '') + '">' + (s[k] === '<' ? '&lt;' : s[k] === '&' ? '&amp;' : s[k]) + '</span>';
        let zval = '-'; if (k > 0 && k < cur) zval = z[k]; else if (k >= cur) zval = '?';
        zr += '<span class="zalgo-cell' + ((k < cur && k > 0 && z[k] === m) ? ' zalgo-match' : '') + '">' + zval + '</span>';
      }
      return '<div class="zalgo-grid">' + chr + '</div>' + zr + '</div>' +
        '<div class="zalgo-stats" data-testid="zalgo-stats">computed: ' + Math.max(0, cur - 1) + ' &nbsp;|&nbsp; matches: [' + f.extras.matches.filter((p) => p + m + 1 < cur).join(',') + ']</div>';
    },
    'search-strcompare': (f) => {
      const pane = (name, title, p) => '<div class="strcompare-pane" data-pane="' + name + '"><h4>' + title + '</h4><div class="strcompare-align">' + SSF().buildAlignmentRow(f.text, f.pattern, p.offset, p.hi) + '</div><div class="strsearch-stats">comparisons: <span class="strcompare-cmp">' + p.cmp + '</span></div></div>';
      return '<div class="strcompare-grid">' + pane('kmp', 'KMP', f.panes.kmp) + pane('bm', 'Boyer-Moore (bad-char)', f.panes.bm) + pane('rk', 'Rabin-Karp', f.panes.rk) + '</div>';
    },
  };

  function renderStrSearch(methodId) {
    const K1 = K();
    const host = K1.acquireDynamicVizHost();
    const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
    if (!_txt[methodId]) _txt[methodId] = DEFAULT_TEXT();

    function rebuild() {
      host.innerHTML = '';
      const parsed = parseStrSearch(_txt[methodId]);
      const controls = document.createElement('div');
      controls.className = 'strsearch-controls-row';
      controls.innerHTML =
        '<input type="text" class="strsearch-text" data-testid="strsearch-text" value="' + esc(parsed.text) + '" placeholder="text">' +
        '<label class="strsearch-plabel">' + (lang === 'zh' ? '樣式' : 'pattern') + ' <input type="text" class="strsearch-pattern" data-testid="strsearch-pattern" value="' + esc(parsed.pattern) + '"></label>' +
        '<button type="button" class="strsearch-build btn primary">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
        '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
        exSelectHtml(methodId);
      host.appendChild(controls);

      const frames = FRAMES[methodId](parsed.text, parsed.pattern);
      const stage = document.createElement('div');
      stage.className = 'strsearch-stage';
      function paint(f) { stage.innerHTML = PAINT[methodId](f); }
      host.appendChild(K1.buildStepWorkbench({ stage: stage, frames: frames, paint: paint, getMessage: (f) => K1.langOf(f.message), runIntervalMs: 450 }));

      function applyText(t) { _txt[methodId] = t; saveEx(methodId, t); rebuild(); }
      controls.querySelector('.strsearch-build').addEventListener('click', () => {
        applyText(controls.querySelector('.strsearch-text').value + ' | ' + controls.querySelector('.strsearch-pattern').value);
      });
      controls.querySelector('.rand-btn').addEventListener('click', () => {
        const r = window.RandomInput && RandomInput.randomInputFor('strsearch', K1.getInputDifficulty());
        if (r && r.text) applyText(r.text + ' | ' + r.pattern);
      });
      const ex = controls.querySelector('.ex-select');
      if (ex) ex.addEventListener('change', (e) => { if (e.target.value) applyText(e.target.value); });
    }
    rebuild();
  }

  ['search-kmp', 'search-bm', 'search-rk', 'search-zalgo', 'search-strcompare'].forEach((id) => {
    R().attach(id, { render: () => renderStrSearch(id), code: CODE[id], layout: { host: 'dynamic' } });
  });
  C().registerDomain({ id: 'strsearch' });
})(typeof window !== 'undefined' ? window : globalThis);
