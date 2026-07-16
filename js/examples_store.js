(function (global) {
  'use strict';

  function key(methodId) { return 'dsvisual:examples:' + methodId; }

  function load(storage, methodId) {
    try {
      var raw = storage.getItem(key(methodId));
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter(function (e) { return e && typeof e.text === 'string'; });
    } catch (e) { return []; }
  }

  function save(storage, methodId, text, defaultText, cap) {
    try {
      if (text == null) return;
      text = String(text);
      if (text === '' || text === defaultText) return;
      cap = cap || 8;
      var arr = load(storage, methodId).filter(function (e) { return e.text !== text; });
      arr.unshift({ text: text });
      arr = arr.slice(0, cap);
      storage.setItem(key(methodId), JSON.stringify(arr));
    } catch (e) { /* ignore */ }
  }

  var api = { key: key, load: load, save: save };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ExamplesStore = api;
})(typeof window !== 'undefined' ? window : globalThis);
