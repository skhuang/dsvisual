(function (global) {
  'use strict';

  var SAMPLE = { words: ['CAT', 'CAR', 'CARD', 'DO', 'DOG'], query: 'CAR' };

  function parseWords(str) {
    var toks = String(str == null ? '' : str).toUpperCase().replace(/[0-9]/g, '').split(/[^A-Z]+/);
    var out = [];
    for (var i = 0; i < toks.length && out.length < 12; i++) {
      var w = toks[i];
      if (!w) continue;
      if (w.length > 8) w = w.slice(0, 8);
      out.push(w);
    }
    return out;
  }

  function parseQuery(str) {
    var toks = String(str == null ? '' : str).toUpperCase().replace(/[0-9]/g, '').split(/[^A-Z]+/).filter(Boolean);
    var q = toks.length ? toks[0] : '';
    return q.length > 8 ? q.slice(0, 8) : q;
  }

  function newNode(id, parent, char, depth) {
    return { id: id, parent: parent, char: char, depth: depth, endOfWord: false, children: {} };
  }

  function buildTrie(words) {
    var nodes = [newNode(0, -1, '', 0)];
    for (var i = 0; i < words.length; i++) {
      var cur = 0, w = words[i];
      for (var j = 0; j < w.length; j++) {
        var ch = w[j];
        if (nodes[cur].children[ch] == null) {
          var id = nodes.length;
          nodes.push(newNode(id, cur, ch, nodes[cur].depth + 1));
          nodes[cur].children[ch] = id;
        }
        cur = nodes[cur].children[ch];
      }
      nodes[cur].endOfWord = true;
    }
    return { nodes: nodes, root: 0 };
  }

  function buildFramesBuild(words) {
    var nodes = [newNode(0, -1, '', 0)];
    var revealed = [0], ends = [], frames = [];
    frames.push({ op: 'build', action: 'init', word: '', ci: -1, cur: 0, edge: null,
      revealed: revealed.slice(), ends: ends.slice(),
      msg: { zh: '開始建立 trie（僅有根節點）', en: 'Start building the trie (root only)' } });
    for (var i = 0; i < words.length; i++) {
      var w = words[i], cur = 0;
      for (var j = 0; j < w.length; j++) {
        var ch = w[j], action, to;
        if (nodes[cur].children[ch] == null) {
          var id = nodes.length;
          nodes.push(newNode(id, cur, ch, nodes[cur].depth + 1));
          nodes[cur].children[ch] = id;
          revealed.push(id); action = 'create'; to = id;
        } else { action = 'follow'; to = nodes[cur].children[ch]; }
        var edge = { from: cur, to: to, ch: ch };
        cur = to;
        frames.push({ op: 'build', action: action, word: w, ci: j, cur: cur, edge: edge,
          revealed: revealed.slice(), ends: ends.slice(),
          msg: action === 'create'
            ? { zh: '「' + w + '」第 ' + (j + 1) + " 字元 '" + ch + "'：新建節點", en: 'Word "' + w + '" char ' + (j + 1) + " '" + ch + "': create node" }
            : { zh: '「' + w + '」第 ' + (j + 1) + " 字元 '" + ch + "'：沿用既有節點", en: 'Word "' + w + '" char ' + (j + 1) + " '" + ch + "': follow existing node" } });
      }
      if (ends.indexOf(cur) === -1) ends.push(cur);
      nodes[cur].endOfWord = true;
      frames.push({ op: 'build', action: 'mark-end', word: w, ci: w.length - 1, cur: cur, edge: null,
        revealed: revealed.slice(), ends: ends.slice(),
        msg: { zh: '標記「' + w + '」結尾（endOfWord）', en: 'Mark end of word "' + w + '" (endOfWord)' } });
    }
    frames.push({ op: 'build', action: 'done', word: '', ci: -1, cur: 0, edge: null,
      revealed: revealed.slice(), ends: ends.slice(),
      msg: { zh: '完成：共 ' + nodes.length + ' 個節點', en: 'Done: ' + nodes.length + ' nodes total' } });
    return frames;
  }

  function buildFramesSearch(words, query) {
    var nodes = buildTrie(words).nodes;
    var frames = [], path = [0], cur = 0, mismatched = false;
    frames.push({ op: 'search', action: 'start', query: query, ci: -1, cur: 0, path: path.slice(), verdict: null,
      msg: { zh: '開始搜尋「' + query + '」（從根節點）', en: 'Start searching "' + query + '" (from root)' } });
    for (var j = 0; j < query.length; j++) {
      var ch = query[j], next = nodes[cur].children[ch];
      if (next == null) {
        frames.push({ op: 'search', action: 'mismatch', query: query, ci: j, cur: cur, path: path.slice(), verdict: 'not-found',
          msg: { zh: '第 ' + (j + 1) + " 字元 '" + ch + "'：無對應邊 → 找不到", en: 'Char ' + (j + 1) + " '" + ch + "': no matching edge → not found" } });
        mismatched = true; break;
      }
      cur = next; path.push(cur);
      frames.push({ op: 'search', action: 'match', query: query, ci: j, cur: cur, path: path.slice(), verdict: null,
        msg: { zh: '第 ' + (j + 1) + " 字元 '" + ch + "'：符合，往下走", en: 'Char ' + (j + 1) + " '" + ch + "': match, descend" } });
    }
    if (!mismatched) {
      if (nodes[cur].endOfWord) {
        frames.push({ op: 'search', action: 'found', query: query, ci: query.length - 1, cur: cur, path: path.slice(), verdict: 'found',
          msg: { zh: '「' + query + '」存在於 trie（命中）', en: '"' + query + '" is in the trie (found)' } });
      } else {
        frames.push({ op: 'search', action: 'prefix-only', query: query, ci: query.length - 1, cur: cur, path: path.slice(), verdict: 'prefix-only',
          msg: { zh: '「' + query + '」只是前綴，非完整單字', en: '"' + query + '" is only a prefix, not a full word' } });
      }
    }
    return frames;
  }

  function buildFrames(st) {
    var words = (st && st.words) || [];
    var mode = (st && st.mode === 'search') ? 'search' : 'build';
    var frames = mode === 'search' ? buildFramesSearch(words, (st && st.query) || '') : buildFramesBuild(words);
    return { frames: frames };
  }

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randWord(minL, maxL, alphabet) {
    var n = randInt(minL, maxL), w = '';
    for (var i = 0; i < n; i++) w += alphabet.charAt(randInt(0, alphabet.length - 1));
    return w;
  }
  function randomInput(difficulty) {
    var d = difficulty || 'normal';
    var words = [];
    if (d === 'large') {
      var nL = randInt(10, 12);
      for (var i = 0; i < nL; i++) words.push(randWord(4, 8, 'ABCDEFGH'));
    } else if (d === 'edge') {
      words.push(randWord(1, 1, 'ABCDE'));
      words.push(randWord(1, 1, 'ABCDE'));
      words.push(randWord(8, 8, 'ABCDE'));
      var dup = randWord(3, 4, 'ABCDE'); words.push(dup); words.push(dup);   // duplicate insert
    } else if (d === 'special') {
      var stem = randWord(2, 3, 'ABCDEF'), nS = randInt(4, 6);
      for (var j = 0; j < nS; j++) words.push((stem + randWord(1, 3, 'ABCDEF')).slice(0, 8));
    } else {
      var nN = randInt(4, 6);
      for (var k = 0; k < nN; k++) words.push(randWord(3, 5, 'ABCDEF'));
    }
    words = words.slice(0, 12).map(function (w) { return w.slice(0, 8); });
    var r = Math.random(), query;
    if (r < 0.34 && words.length) { query = words[randInt(0, words.length - 1)]; }
    else if (r < 0.67 && words.length) { var w0 = words[randInt(0, words.length - 1)]; query = w0.slice(0, Math.max(1, w0.length - 1)); }
    else { query = randWord(2, 4, 'ABCDEFGH'); }
    return { words: words, query: query };
  }

  var api = { SAMPLE: SAMPLE, parseWords: parseWords, parseQuery: parseQuery, buildTrie: buildTrie, buildFrames: buildFrames, randomInput: randomInput };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TrieViz = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
