(function (global) {
  const behaviors = new Map(); // id -> { render, code, layout }

  function attach(id, behavior) {
    if (!id || !behavior) return;
    const prev = behaviors.get(id) || {};
    behaviors.set(id, Object.assign({}, prev, behavior)); // partial-merge; last wins
  }
  function behavior(id) { return behaviors.get(id) || null; }
  function has(id) { return behaviors.has(id); }

  const api = { attach, behavior, has };
  if (typeof module !== 'undefined' && module.exports) module.exports = { VizRegistry: api };
  global.VizRegistry = api;
})(typeof window !== 'undefined' ? window : globalThis);
