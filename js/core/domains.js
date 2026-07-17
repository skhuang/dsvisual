(function (global) {
  const _domains = [];
  let _get = () => null;
  let _set = () => {};
  function registerDomain(d) { if (d) _domains.push(d); }
  function domains() { return _domains.slice(); }
  function bindMode(getter, setter) { if (getter) _get = getter; if (setter) _set = setter; }
  function getMode() { return _get(); }
  function setMode(m) { _set(m); }
  const api = { registerDomain, domains, bindMode, getMode, setMode };
  if (typeof module !== 'undefined' && module.exports) module.exports = { VizCore: api };
  global.VizCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
