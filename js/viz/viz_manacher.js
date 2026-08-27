(function (global) {
  'use strict';

  const K = () => global.VizKit;
  const METHOD_ID = 'manacher';
  const DEFAULT_INPUT = 'abacaba';
  const MAX_INPUT_LENGTH = 24;
  const BUILTIN_EXAMPLES = ['abba', 'babad', 'aaaa', 'forgeeksskeegfor'];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeInput(text) {
    const chars = Array.from(String(text == null ? '' : text));
    if (chars.length === 0) return DEFAULT_INPUT;
    return chars.slice(0, MAX_INPUT_LENGTH).join('');
  }

  function buildTokens(input) {
    const tokens = [{ kind: 'start', label: '^' }, { kind: 'separator', label: '#' }];
    for (const char of Array.from(input)) {
      tokens.push({ kind: 'char', label: char });
      tokens.push({ kind: 'separator', label: '#' });
    }
    tokens.push({ kind: 'end', label: '$' });
    return tokens;
  }

  function sameToken(left, right) {
    if (!left || !right || left.kind !== right.kind) return false;
    if (left.kind === 'separator') return true;
    if (left.kind === 'char') return left.label === right.label;
    return false;
  }

  function buildManacherFrames(text) {
    const input = normalizeInput(text);
    const tokens = buildTokens(input);
    const transformed = tokens.map((token) => token.label);
    const tokenKinds = tokens.map((token) => token.kind);
    const radii = new Array(tokens.length).fill(0);
    const frames = [];
    let center = 0;
    let right = 0;
    let bestCenter = 0;
    let bestRadius = 0;

    function snapshot(phase, message, state) {
      const extra = state || {};
      frames.push({
        phase,
        input,
        transformed: transformed.slice(),
        tokenKinds: tokenKinds.slice(),
        radii: radii.slice(),
        center,
        right,
        bestCenter,
        bestRadius,
        current: Number.isInteger(extra.current) ? extra.current : -1,
        mirror: Number.isInteger(extra.mirror) ? extra.mirror : -1,
        compareLeft: Number.isInteger(extra.compareLeft) ? extra.compareLeft : -1,
        compareRight: Number.isInteger(extra.compareRight) ? extra.compareRight : -1,
        message,
      });
    }

    snapshot('initial', {
      zh: '在字元之間加入分隔符號，讓奇數與偶數長度的回文可以用同一種方式處理。',
      en: 'Insert separators so odd- and even-length palindromes use the same expansion rule.',
    });

    for (let i = 1; i < tokens.length - 1; i++) {
      const mirror = 2 * center - i;
      const reused = i < right && mirror >= 0;
      radii[i] = reused ? Math.min(right - i, radii[mirror]) : 0;

      snapshot('inspect', reused ? {
        zh: '位置 ' + i + ' 位於右界內，先利用鏡像位置 ' + mirror + ' 的資訊，半徑從 ' + radii[i] + ' 開始。',
        en: 'Index ' + i + ' is inside the right boundary; reuse mirror ' + mirror + ' and start with radius ' + radii[i] + '.',
      } : {
        zh: '位置 ' + i + ' 不在已知右界內，半徑從 0 開始。',
        en: 'Index ' + i + ' is outside the known right boundary, so start with radius 0.',
      }, { current: i, mirror: reused ? mirror : -1 });

      while (true) {
        const left = i - radii[i] - 1;
        const nextRight = i + radii[i] + 1;
        const matches = sameToken(tokens[left], tokens[nextRight]);

        snapshot('compare', matches ? {
          zh: '比較位置 ' + left + ' 與 ' + nextRight + '：相同，可以向外擴張。',
          en: 'Compare indices ' + left + ' and ' + nextRight + ': they match, so expand.',
        } : {
          zh: '比較位置 ' + left + ' 與 ' + nextRight + '：不同，停止擴張。',
          en: 'Compare indices ' + left + ' and ' + nextRight + ': they differ, so stop expanding.',
        }, { current: i, mirror: reused ? mirror : -1, compareLeft: left, compareRight: nextRight });

        if (!matches) break;
        radii[i]++;
        if (radii[i] > bestRadius) {
          bestRadius = radii[i];
          bestCenter = i;
        }
        snapshot('expand', {
          zh: '擴張成功：位置 ' + i + ' 的回文半徑更新為 ' + radii[i] + '。',
          en: 'Expansion succeeds: the palindrome radius at index ' + i + ' becomes ' + radii[i] + '.',
        }, { current: i, mirror: reused ? mirror : -1 });
      }

      if (i + radii[i] > right) {
        center = i;
        right = i + radii[i];
        snapshot('update', {
          zh: '這個回文超過原本的右界，更新中心 C=' + center + '、右界 R=' + right + '。',
          en: 'This palindrome extends past the old boundary; update center C=' + center + ' and right boundary R=' + right + '.',
        }, { current: i, mirror: reused ? mirror : -1 });
      }
    }

    const start = Math.floor((bestCenter - bestRadius) / 2);
    const longest = Array.from(input).slice(start, start + bestRadius).join('');
    snapshot('done', {
      zh: '完成：最長回文子字串是「' + longest + '」，長度為 ' + bestRadius + '。',
      en: 'Done: the longest palindromic substring is "' + longest + '" with length ' + bestRadius + '.',
    });

    return {
      input,
      transformed,
      tokenKinds,
      radii: radii.slice(),
      frames,
      longest,
      start,
      length: bestRadius,
    };
  }

  function longestPalindrome(text) {
    return buildManacherFrames(text).longest;
  }

  function loadExamples(methodId) {
    try { return global.ExamplesStore.load(global.localStorage, methodId); }
    catch (error) { return []; }
  }

  function saveExample(methodId, text, defaultText) {
    try { global.ExamplesStore.save(global.localStorage, methodId, text, defaultText); }
    catch (error) { /* localStorage may be unavailable in a private file context. */ }
  }

  function buildExamplesSelect() {
    const lang = global.I18N && global.I18N.getCurrentLanguage
      ? global.I18N.getCurrentLanguage()
      : 'en';
    const label = lang === 'zh' ? '範例…' : 'Examples…';
    const defaultLabel = lang === 'zh' ? '預設：abacaba' : 'Default: abacaba';
    const options = ['<option value="">' + label + '</option>'];
    options.push('<option value="' + DEFAULT_INPUT + '">' + defaultLabel + '</option>');
    for (const example of BUILTIN_EXAMPLES) {
      options.push('<option value="' + escapeHtml(example) + '">' + escapeHtml(example) + '</option>');
    }
    for (const entry of loadExamples(METHOD_ID)) {
      if (entry.text === DEFAULT_INPUT || BUILTIN_EXAMPLES.includes(entry.text)) continue;
      const short = Array.from(entry.text).slice(0, 24).join('');
      options.push('<option value="' + escapeHtml(entry.text) + '">' + escapeHtml(short) + '</option>');
    }
    return '<select class="ex-select man-examples" data-testid="man-examples">' + options.join('') + '</select>';
  }

  function substringFor(center, radius, input) {
    if (radius <= 0) return '';
    const start = Math.floor((center - radius) / 2);
    return Array.from(input).slice(start, start + radius).join('');
  }

  let viewState = null;

  function renderManacher() {
    const host = K().acquireDynamicVizHost();
    if (!viewState) viewState = { text: DEFAULT_INPUT };

    function rebuild() {
      host.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'man-wrap';
      host.appendChild(wrap);
      const language = global.I18N && global.I18N.getCurrentLanguage && global.I18N.getCurrentLanguage() === 'zh'
        ? 'zh'
        : 'en';
      const result = buildManacherFrames(viewState.text);
      viewState.text = result.input;

      const controls = document.createElement('div');
      controls.className = 'man-controls';
      controls.innerHTML =
        '<label class="man-input-label">' + (language === 'zh' ? '字串' : 'String') +
        ' <input type="text" class="man-input" data-testid="man-input" maxlength="' + MAX_INPUT_LENGTH +
        '" value="' + escapeHtml(result.input) + '"></label>' +
        '<button type="button" class="man-build btn primary" data-testid="man-build">' +
        (language === 'zh' ? '建立' : 'Build') + '</button>' +
        buildExamplesSelect();
      wrap.appendChild(controls);

      const stage = document.createElement('div');
      stage.className = 'man-stage';
      stage.dataset.testid = 'man-stage';

      function paint(frame) {
        const currentRadius = frame.current >= 0 ? frame.radii[frame.current] : -1;
        const rangeStart = frame.current >= 0 ? frame.current - currentRadius : -1;
        const rangeEnd = frame.current >= 0 ? frame.current + currentRadius : -1;
        const bestStart = frame.bestRadius > 0 ? frame.bestCenter - frame.bestRadius : -1;
        const bestEnd = frame.bestRadius > 0 ? frame.bestCenter + frame.bestRadius : -1;
        const markers = [];
        const tokenCells = [];
        const indexCells = [];
        const radiusCells = [];

        for (let index = 0; index < frame.transformed.length; index++) {
          const markerParts = [];
          if (index === frame.current) markerParts.push('i');
          if (index === frame.center) markerParts.push('C');
          if (index === frame.right) markerParts.push('R');
          if (index === frame.mirror) markerParts.push('M');
          markers.push('<div class="man-marker">' + markerParts.join('·') + '</div>');

          const classes = ['man-cell'];
          if (frame.tokenKinds[index] !== 'char') classes.push('structural');
          if (index >= rangeStart && index <= rangeEnd) classes.push('in-current');
          if (index >= bestStart && index <= bestEnd) classes.push('in-best');
          if (index === frame.mirror) classes.push('mirror');
          if (index === frame.current) classes.push('current');
          if (index === frame.compareLeft || index === frame.compareRight) classes.push('comparing');

          tokenCells.push('<div class="' + classes.join(' ') + '" data-testid="man-token" data-index="' + index + '">' +
            escapeHtml(frame.transformed[index]) + '</div>');
          indexCells.push('<div class="man-index">' + index + '</div>');
          radiusCells.push('<div class="man-radius' + (index === frame.current ? ' current' : '') +
            '" data-testid="man-radius" data-index="' + index + '">' + frame.radii[index] + '</div>');
        }

        const best = substringFor(frame.bestCenter, frame.bestRadius, frame.input);
        const resultText = frame.phase === 'done'
          ? K().langOf(frame.message)
          : (language === 'zh' ? '目前最長回文：' : 'Best palindrome so far: ') + (best || '—');

        stage.innerHTML =
          '<div class="man-result" data-testid="man-result">' + escapeHtml(resultText) + '</div>' +
          '<div class="man-scroll"><div class="man-board">' +
            '<div class="man-row"><div class="man-row-label">C / R / i / M</div>' + markers.join('') + '</div>' +
            '<div class="man-row"><div class="man-row-label">T</div>' + tokenCells.join('') + '</div>' +
            '<div class="man-row"><div class="man-row-label">index</div>' + indexCells.join('') + '</div>' +
            '<div class="man-row"><div class="man-row-label">P</div>' + radiusCells.join('') + '</div>' +
          '</div></div>' +
          '<div class="man-legend">' +
            '<span><i class="man-swatch current"></i>i / center</span>' +
            '<span><i class="man-swatch mirror"></i>mirror</span>' +
            '<span><i class="man-swatch comparing"></i>' + (language === 'zh' ? '正在比較' : 'comparing') + '</span>' +
            '<span><i class="man-swatch best"></i>' + (language === 'zh' ? '目前最佳' : 'best so far') + '</span>' +
          '</div>' +
          '<div class="man-message" data-testid="man-message">' + escapeHtml(K().langOf(frame.message)) + '</div>';
      }

      wrap.appendChild(stage);
      wrap.appendChild(K().buildFrameControls(result.frames, paint, { runIntervalMs: 520 }));

      const input = controls.querySelector('.man-input');
      const applyInput = () => {
        viewState.text = normalizeInput(input.value);
        saveExample(METHOD_ID, viewState.text, DEFAULT_INPUT);
        rebuild();
      };
      controls.querySelector('.man-build').addEventListener('click', applyInput);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') applyInput();
      });
      controls.querySelector('.man-examples').addEventListener('change', (event) => {
        if (!event.target.value) return;
        viewState.text = event.target.value;
        rebuild();
      });
    }

    rebuild();
  }

  global.ManacherViz = {
    DEFAULT_INPUT,
    MAX_INPUT_LENGTH,
    normalizeInput,
    buildManacherFrames,
    longestPalindrome,
  };

  if (typeof global !== 'undefined' && global.VizRegistry) {
    global.VizRegistry.attach(METHOD_ID, {
      render: renderManacher,
      code: () => (global.CODE_DB && global.CODE_DB['manacher.cpp']) || '',
      layout: { host: 'dynamic', codeDrawer: true },
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      DEFAULT_INPUT,
      MAX_INPUT_LENGTH,
      normalizeInput,
      buildManacherFrames,
      longestPalindrome,
      renderManacher,
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
