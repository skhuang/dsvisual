(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;
  const AF = () => global.AhoFrames;

  const DEFAULT_TEXT = () => AF().AHO_DEFAULT_PATTERNS.join(',') + ' | ' + AF().AHO_DEFAULT_TEXT;
  let _txt = null;

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
  function parseAho(text) {
    const idx = String(text).indexOf('|');
    let ps = idx >= 0 ? text.slice(0, idx) : text;
    let tt = idx >= 0 ? text.slice(idx + 1) : '';
    const patterns = ps.split(',').map((s) => clean(s.trim(), 12)).filter((s) => s.length).slice(0, 8);
    tt = clean(tt.trim(), 40);
    if (!patterns.length) return { patterns: AF().AHO_DEFAULT_PATTERNS.slice(), text: tt || AF().AHO_DEFAULT_TEXT };
    if (!tt) tt = AF().AHO_DEFAULT_TEXT;
    return { patterns: patterns, text: tt };
  }

  function renderAho(methodId) {
    const K1 = K();
    const host = K1.acquireDynamicVizHost();
    const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
    if (_txt === null) _txt = DEFAULT_TEXT();

    function rebuild() {
      host.innerHTML = '';
      const parsed = parseAho(_txt);
      const controls = document.createElement('div');
      controls.className = 'aho-controls-row';
      controls.innerHTML =
        '<label class="aho-plabel">' + (lang === 'zh' ? '樣式' : 'patterns') + ' <input type="text" class="aho-patterns" data-testid="aho-patterns" value="' + esc(parsed.patterns.join(',')) + '"></label>' +
        '<label class="aho-tlabel">' + (lang === 'zh' ? '文字' : 'text') + ' <input type="text" class="aho-text" data-testid="aho-text" value="' + esc(parsed.text) + '"></label>' +
        '<button type="button" class="aho-build btn primary">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
        '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
        exSelectHtml(methodId);
      host.appendChild(controls);

      const A = AF().ahoFrames(parsed.patterns, parsed.text);
      const nodes = A.nodes, fs = A.failSteps, text = A.text, vb = A.viewBox;
      const stage = document.createElement('div');
      stage.className = 'aho-stage';

      function paint(f) {
        let svg = '';
        for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; if (n.parent >= 0) { const p = nodes[n.parent]; svg += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + n.x + '" y2="' + n.y + '" stroke="#94a3b8" stroke-width="2"/>'; } }
        for (let k = 0; k < f.builtCount; k++) { const a = nodes[fs[k].node], b = nodes[fs[k].fail]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 3"/>'; }
        for (let j = 0; j < nodes.length; j++) { const nd = nodes[j]; const isCur = nd.id === f.curNode && (f.phase === 'scan' || f.buildCur >= 0); const hasOut = nd.out && nd.out.length > 0;
          svg += '<circle cx="' + nd.x + '" cy="' + nd.y + '" r="16" fill="' + (isCur ? '#34d399' : (hasOut ? '#dbeafe' : '#ffffff')) + '" stroke="#1e40af" stroke-width="2" data-node="' + nd.id + '"/>';
          svg += '<text x="' + nd.x + '" y="' + (nd.y + 5) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">' + esc(nd.ch || '·') + '</text>'; }
        let tr = '';
        for (let c = 0; c < text.length; c++) tr += '<span class="aho-char' + (c === f.scanIdx ? ' aho-char-cur' : '') + '">' + esc(text[c]) + '</span>';
        const phase = f.phase === 'fail'
          ? 'Phase 1: Building failure links (' + f.builtCount + '/' + fs.length + ')'
          : 'Phase 2: Scanning text (' + (f.scanIdx + 1) + '/' + text.length + ')';
        stage.innerHTML =
          '<div class="aho-phase" data-testid="aho-phase">' + phase + '</div>' +
          '<svg class="aho-svg" viewBox="0 0 ' + vb.w + ' ' + vb.h + '" width="100%" xmlns="http://www.w3.org/2000/svg">' + svg + '</svg>' +
          '<div class="aho-textrow">' + tr + '</div>' +
          '<div class="aho-stats" data-testid="aho-stats">matches: <span class="aho-matches">[' + f.matches.join(', ') + ']</span></div>';
      }
      host.appendChild(K1.buildStepWorkbench({ stage: stage, frames: A.frames, paint: paint, getMessage: (f) => K1.langOf(f.message), runIntervalMs: 500 }));

      function applyText(t) { _txt = t; saveEx(methodId, t); rebuild(); }
      controls.querySelector('.aho-build').addEventListener('click', () => {
        applyText(controls.querySelector('.aho-patterns').value + ' | ' + controls.querySelector('.aho-text').value);
      });
      controls.querySelector('.rand-btn').addEventListener('click', () => {
        const r = window.RandomInput && RandomInput.randomInputFor('aho', K1.getInputDifficulty());
        if (r && Array.isArray(r.patterns) && r.patterns.length) applyText(r.patterns.join(',') + ' | ' + r.text);
      });
      const ex = controls.querySelector('.ex-select');
      if (ex) ex.addEventListener('change', (e) => { if (e.target.value) applyText(e.target.value); });
    }
    rebuild();
  }

  R().attach('search-aho', { render: () => renderAho('search-aho'), code: () => codeSearchAho, layout: { host: 'dynamic' } });
  C().registerDomain({ id: 'aho' });
})(typeof window !== 'undefined' ? window : globalThis);
