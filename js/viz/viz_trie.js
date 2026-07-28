(function (global) {
  'use strict';
  var K = function () { return global.VizKit; };

  // Examples-helper trio — duplicated per program convention; do NOT refactor.
  function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
  function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) {} }
  function buildExamplesSelect(methodId, defaultText) {
    var lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    var escA = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
    var escT = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var trunc = function (s) { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
    var h = '<select class="ex-select" data-method="' + escA(methodId) + '">';
    h += '<option value="">' + (lang === 'zh' ? '範例…' : 'Examples…') + '</option>';
    h += '<option value="' + escA(defaultText) + '">' + (lang === 'zh' ? '預設' : 'Default') + '</option>';
    loadExamples(methodId).forEach(function (e) { if (e.text === defaultText) return;
      h += '<option value="' + escA(e.text) + '">' + escT(trunc(e.text)) + '</option>'; });
    return h + '</select>';
  }

  function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function serialize(st) { return st.words.join(',') + '|' + st.query; }
  function deserialize(text) {
    var parts = String(text).split('|');
    return { words: global.TrieViz.parseWords(parts[0] || ''), query: global.TrieViz.parseQuery(parts[1] || '') };
  }
  var DEFAULT_SERIALIZED = global.TrieViz.SAMPLE.words.join(',') + '|' + global.TrieViz.SAMPLE.query;
  var MISS_SERIALIZED = 'CAR,CARD|CARE';
  var _st = { words: global.TrieViz.SAMPLE.words.slice(), query: global.TrieViz.SAMPLE.query, mode: 'build' };
  var FOCUS_CHROME_RESERVE = 210;   // px reserved for controls+banner+msg+VCR in focus; keep == the CSS calc(100vh - 210px)

  function computeLayout(nodes) {
    var pos = {}, LEVEL_H = 70;
    function place(id, x, y, dx) {
      pos[id] = { x: x, y: y };
      var keys = Object.keys(nodes[id].children);
      if (!keys.length) return;
      var startX = x - (keys.length - 1) * dx / 2;
      keys.forEach(function (k, i) { place(nodes[id].children[k], startX + i * dx, y + LEVEL_H, Math.max(dx / 1.6, 30)); });
    }
    place(0, 0, 30, 150);
    var ids = Object.keys(pos);
    var xs = ids.map(function (id) { return pos[id].x; });
    var ys = ids.map(function (id) { return pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), maxY = Math.max.apply(null, ys);
    var MARGIN = 30, shift = MARGIN - minX;
    ids.forEach(function (id) { pos[id].x += shift; });
    return { pos: pos, width: Math.max((maxX - minX) + 2 * MARGIN, 320), height: Math.max(maxY + 60, 200) };
  }

  function svgFor(nodes, fr, layout, w, h) {
    var pos = layout.pos, present = {}, endSet = {};
    if (fr.op === 'build') {
      fr.revealed.forEach(function (id) { present[id] = true; });
      fr.ends.forEach(function (id) { endSet[id] = true; });
    } else {
      nodes.forEach(function (n) { present[n.id] = true; if (n.endOfWord) endSet[n.id] = true; });
    }
    var curEdge = null;
    if (fr.op === 'build' && fr.edge) curEdge = fr.edge.from + '>' + fr.edge.to;
    else if (fr.op === 'search' && fr.path && fr.path.length >= 2) { var p = fr.path; curEdge = p[p.length - 2] + '>' + p[p.length - 1]; }
    var s = '<svg class="trie-svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + layout.width + ' ' + layout.height + '">';
    nodes.forEach(function (n) {
      if (n.parent < 0 || !present[n.id] || !present[n.parent]) return;
      var a = pos[n.parent], b = pos[n.id], key = n.parent + '>' + n.id;
      s += '<line class="trie-edge' + (key === curEdge ? ' trie-edge-cur' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
      s += '<text class="trie-edge-label" x="' + ((a.x + b.x) / 2) + '" y="' + ((a.y + b.y) / 2) + '">' + n.char + '</text>';
    });
    nodes.forEach(function (n) {
      if (!present[n.id]) return;
      var pp = pos[n.id];
      var cls = 'trie-node' + (endSet[n.id] ? ' trie-node-end' : '') + (n.id === fr.cur ? ' trie-node-cur' : '');
      s += '<circle class="' + cls + '" cx="' + pp.x + '" cy="' + pp.y + '" r="14"/>';
    });
    return s + '</svg>';
  }

  function render() {
    var host = K().acquireDynamicVizHost();
    var lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    host.innerHTML =
      '<div class="trie-wrap">' +
        '<div class="trie-controls">' +
          '<label>' + (lang === 'zh' ? '單字' : 'words') + ' <input type="text" class="trie-words" value="' + escAttr(_st.words.join(',')) + '"></label>' +
          '<label>' + (lang === 'zh' ? '搜尋' : 'query') + ' <input type="text" class="trie-query" value="' + escAttr(_st.query) + '"></label>' +
          '<select class="trie-mode">' +
            '<option value="build"' + (_st.mode === 'build' ? ' selected' : '') + '>' + (lang === 'zh' ? '建立 Build' : 'Build') + '</option>' +
            '<option value="search"' + (_st.mode === 'search' ? ' selected' : '') + '>' + (lang === 'zh' ? '搜尋 Search' : 'Search') + '</option>' +
          '</select>' +
          '<button type="button" class="trie-apply">' + (lang === 'zh' ? '套用 Apply' : 'Apply') + '</button>' +
          '<button type="button" class="trie-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
          buildExamplesSelect('tree-trie', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="trie-banner" data-testid="trie-banner">&nbsp;</div>' +
        '<div class="trie-scroll"></div>' +
        '<div class="trie-msg" data-testid="trie-msg">&nbsp;</div>' +
      '</div>';
    var wrap = host.querySelector('.trie-wrap');
    var scrollEl = wrap.querySelector('.trie-scroll');
    var bannerEl = wrap.querySelector('.trie-banner');
    var msgEl = wrap.querySelector('.trie-msg');

    var exSelect = wrap.querySelector('.ex-select');
    if (exSelect && !Array.from(exSelect.options).some(function (o) { return o.value === MISS_SERIALIZED; })) {
      var opt = document.createElement('option');
      opt.value = MISS_SERIALIZED; opt.textContent = lang === 'zh' ? '未命中示範' : 'Miss demo';
      exSelect.insertBefore(opt, exSelect.options[2] || null);
    }

    var fullTrie = global.TrieViz.buildTrie(_st.words);
    var layout = computeLayout(fullTrie.nodes);
    var frames = global.TrieViz.buildFrames(_st).frames;

    function bannerText(fr) {
      var L = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      if (fr.op === 'build') {
        if (fr.action === 'done') return (L === 'zh' ? '完成 · ' : 'Done · ') + fullTrie.nodes.length + (L === 'zh' ? ' 個節點' : ' nodes');
        if (fr.action === 'init') return (L === 'zh' ? '建立 trie' : 'Build trie');
        return (L === 'zh' ? '建立 ' : 'Build ') + fr.word + " · '" + (fr.word[fr.ci] || '') + "'";
      }
      var verdict = { 'found': L === 'zh' ? '命中 FOUND' : 'FOUND', 'prefix-only': L === 'zh' ? '前綴 PREFIX-ONLY' : 'PREFIX-ONLY', 'not-found': L === 'zh' ? '找不到 NOT FOUND' : 'NOT FOUND' };
      return (L === 'zh' ? '搜尋 ' : 'Search ') + fr.query + (fr.verdict ? ' → ' + verdict[fr.verdict] : '');
    }
    function readZoom() {
      var el = scrollEl.closest ? scrollEl.closest('.viz-body-scaled') : null;
      var v = el ? parseFloat(getComputedStyle(el).getPropertyValue('--viz-zoom')) : 1;
      return (v && isFinite(v) && v > 0) ? v : 1;
    }
    function paint(fr) {
      var w = layout.width, h = layout.height;
      if (document.body.classList.contains('viz-focus')) {
        var availW = Math.max(scrollEl.clientWidth - 6, 120);
        var availH = Math.max(window.innerHeight - FOCUS_CHROME_RESERVE, 140);
        var fit = Math.min(availW / layout.width, availH / layout.height);
        fit = Math.max(0.3, Math.min(fit, 3));
        var zoom = readZoom();
        w = Math.round(layout.width * fit * zoom);
        h = Math.round(layout.height * fit * zoom);
      }
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout, w, h);
      bannerEl.textContent = bannerText(fr);
      msgEl.textContent = K().langOf(fr.msg);
      var color = '#60a5fa';
      if (fr.verdict === 'found' || fr.action === 'done') color = '#34d399';
      else if (fr.verdict === 'not-found' || fr.action === 'mismatch') color = '#f87171';
      else if (fr.verdict === 'prefix-only') color = '#f59e0b';
      K().showStatus(K().langOf(fr.msg), color);
    }
    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 650 }));

    wrap.querySelector('.trie-apply').addEventListener('click', function () {
      _st.words = global.TrieViz.parseWords(wrap.querySelector('.trie-words').value);
      _st.query = global.TrieViz.parseQuery(wrap.querySelector('.trie-query').value);
      saveExample('tree-trie', serialize(_st), DEFAULT_SERIALIZED);
      render();
    });
    wrap.querySelector('.trie-random').addEventListener('click', function () {
      var d = (K().getInputDifficulty && K().getInputDifficulty()) || 'normal';
      var r = global.TrieViz.randomInput(d);
      _st.words = r.words; _st.query = r.query;
      saveExample('tree-trie', serialize(_st), DEFAULT_SERIALIZED);
      render();
    });
    wrap.querySelector('.trie-mode').addEventListener('change', function (ev) {
      _st.mode = ev.target.value === 'search' ? 'search' : 'build';
      render();
    });
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      var v = ev.target.value; if (!v) return;
      var d = deserialize(v); _st.words = d.words; _st.query = d.query;
      render();
    });
  }

  global.VizRegistry.attach('tree-trie', {
    render: render,
    code: function () { return (typeof codeTreeTrie !== 'undefined') ? codeTreeTrie : ''; },
    layout: null
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
