(function (global) {
  'use strict';
  const K = () => global.VizKit;

  // loadExamples/saveExample/buildExamplesSelect — copied pattern
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

  const DEFAULT = { arr: [7,2,1,6,8,5,3], k: 4 };

  // 獨立出的核心 Quickselect 演算法（供測試與內部使用）
  function quickselect(inputArr, k) {
    const a = inputArr.slice();
    let l = 0, r = a.length - 1;
    if (a.length === 0) return undefined;
    if (k < 1) k = 1;
    if (k > a.length) k = a.length;

    while (l <= r) {
      if (l === r) return a[l];
      const pivotVal = a[r];
      let i = l - 1;
      for (let j = l; j < r; j++) {
        if (a[j] <= pivotVal) {
          i++;
          [a[i], a[j]] = [a[j], a[i]];
        }
      }
      [a[i + 1], a[r]] = [a[r], a[i + 1]];
      const p = i + 1;

      if (p - l === k - 1) return a[p];
      else if (p - l > k - 1) r = p - 1;
      else {
        k = k - (p - l + 1);
        l = p + 1;
      }
    }
    return a[l];
  }

  // Build frames for median-of-medians quickselect (illustrative, deterministic)
  function quickselectFrames(inputArr, k) {
    const a = inputArr.slice();
    const n = a.length;
    const frames = [];
    function snap(hi, msg) { frames.push({ array: a.slice(), hi: Object.assign({}, hi), message: msg }); }

    snap({}, { zh: '起始陣列', en: 'Initial array' });
    if (n === 0) { snap({}, { zh: '空陣列', en: 'Empty array' }); return frames; }
    if (k < 1) k = 1; if (k > n) k = n;

    function choosePivot(l, r) {
      const groups = [];
      for (let i = l; i <= r; i += 5) groups.push(a.slice(i, Math.min(i + 5, r + 1)));
      const medians = groups.map((g) => { const s = g.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; });
      
      const hi = {};
      groups.forEach((g, gi) => {
        for (let j = 0; j < g.length; j++) {
          const idx = l + gi*5 + j;
          hi[idx] = 'group' + gi;
        }
      });
      medians.forEach((m) => { const idx = a.indexOf(m); if (idx >= 0) hi[idx] = 'median'; });
      snap(hi, { zh: '分組取中位數 (每組最多5個)', en: 'Group into 5s and take medians' });

      const med = medians.slice().sort((x,y)=>x-y)[Math.floor(medians.length/2)];
      
      let pivotIdx = -1;
      for (let idx = l; idx <= r; idx++) {
        if (a[idx] === med) {
          pivotIdx = idx;
          break;
        }
      }
      if (pivotIdx === -1) pivotIdx = Math.floor((l + r) / 2);
      return pivotIdx;
    }

    function partition(l, r, pivotIdx) {
      const pivotVal = a[pivotIdx];
      [a[pivotIdx], a[r]] = [a[r], a[pivotIdx]];
      snap({ [r]: 'pivot' }, { zh: '選 pivot=' + pivotVal, en: 'Pick pivot=' + pivotVal });
      let i = l - 1;
      for (let j = l; j < r; j++) {
        const hi = {}; hi[j] = 'comparing'; hi[r] = 'pivot';
        snap(hi, { zh: '比較 a[' + j + ']=' + a[j] + ' 與 pivot', en: 'Compare a[' + j + ']=' + a[j] + ' with pivot' });
        if (a[j] <= pivotVal) { i++; [a[i], a[j]] = [a[j], a[i]]; const s = {}; s[i] = 'swapping'; s[j] = 'swapping'; snap(s, { zh: '小於等於 pivot，交換', en: '≤ pivot; swap' }); }
      }
      [a[i+1], a[r]] = [a[r], a[i+1]];
      const p = i+1; snap({ [p]: 'pivot-placed' }, { zh: 'pivot 定位於 ' + p, en: 'pivot placed at ' + p });
      return p;
    }

    let l = 0, r = n - 1;
    while (l <= r) {
      if (l === r) { const hi = {}; hi[l] = 'found'; snap(hi, { zh: '單元素，命中', en: 'Single element; found' }); break; }
      const pivotIdx = choosePivot(l, r);
      const p = partition(l, r, pivotIdx);
      if (p - l === k - 1) { const hi = {}; hi[p] = 'found'; snap(hi, { zh: '找到第 ' + k + ' 小元素：' + a[p], en: 'Found k=' + k + ' smallest: ' + a[p] }); break; }
      else if (p - l > k - 1) { snap({}, { zh: '目標在左半部', en: 'Go left' }); r = p - 1; }
      else { snap({}, { zh: '目標在右半部', en: 'Go right' }); k = k - (p - l + 1); l = p + 1; }
    }
    return frames;
  }

  function renderQuickselect() {
    const host = K().acquireDynamicVizHost();
    const methodId = 'select-quickselect';
    const defaultText = DEFAULT.arr.join(',') + ' | ' + DEFAULT.k;
    let inputText = defaultText;

    function rebuild() {
      host.innerHTML = '';
      const parts = String(inputText).split('|');
      const arr = (parts[0] || '').split(/[,\s]+/).map((s)=>parseInt(s,10)).filter(Number.isFinite).slice(0,20);
      const k = Math.max(1, Math.min(arr.length, parseInt((parts[1]||'').trim(),10) || DEFAULT.k));
      const controls = document.createElement('div');
      controls.className = 'searchviz-controls';
      const lang = (global.I18N && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? 'zh' : 'en';
      controls.innerHTML =
        '<input type="text" class="qsel-arr" data-testid="qsel-arr" value="' + arr.join(',') + '">' +
        '<label class="qsel-klabel">' + (lang === 'zh' ? 'k (1-based)' : 'k (1-based)') + ' <input type="number" class="qsel-k" data-testid="qsel-k" value="' + k + '"></label>' +
        '<button type="button" class="qsel-build btn primary">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
        '<button type="button" class="rand-btn" title="' + (lang === 'zh' ? '隨機' : 'Random') + '">🎲</button>' +
        buildExamplesSelect(methodId, defaultText);
      host.appendChild(controls);

      const frames = quickselectFrames(arr.length ? arr : DEFAULT.arr, k);

      const stage = document.createElement('div');
      stage.className = 'searchviz-stage';
      function paint(f) {
        stage.innerHTML = f.array.map((v,i)=> '<div class="search-cell ' + (f.hi[i]||'') + '"><span class="val">' + v + '</span><i class="idx">' + i + '</i></div>').join('');
      }
      host.appendChild(K().buildStepWorkbench({ stage: stage, frames: frames, paint: paint, getMessage: (f)=>K().langOf(f.message), runIntervalMs: 700 }));

      controls.querySelector('.qsel-build').addEventListener('click', ()=> {
        inputText = controls.querySelector('.qsel-arr').value + ' | ' + controls.querySelector('.qsel-k').value;
        saveExample(methodId, inputText, defaultText);
        rebuild();
      });
      const ex = controls.querySelector('.ex-select');
      if (ex) ex.addEventListener('change', (e)=> { if (e.target.value) { inputText = e.target.value; rebuild(); } });
      controls.querySelector('.rand-btn').addEventListener('click', ()=> {
        const r = window.RandomInput && RandomInput.randomInputFor('search', K().getInputDifficulty());
        if (r && Array.isArray(r.data) && r.data.length) { inputText = r.data.join(',') + ' | ' + (r.target || DEFAULT.k); rebuild(); }
      });
    }
    rebuild();
  }

  if (typeof global !== 'undefined' && global.VizRegistry) {
    global.VizRegistry.attach('select-quickselect', {
      render: renderQuickselect,
      code: () => (typeof codeQuickselect !== 'undefined' ? codeQuickselect : ''),
      layout: { host: 'dynamic', codeDrawer: true }
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { quickselect, quickselectFrames, renderQuickselect };
  }
})(typeof window !== 'undefined' ? window : global);
