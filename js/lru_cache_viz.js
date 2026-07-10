(function (global) {
  // Build step frames for an LRU cache processing a reference string of keys.
  // The cache keeps keys ordered from most-recently-used (index 0) to
  // least-recently-used (last index). Each access is either:
  //   hit   -> key already cached; move it to the front (MRU)
  //   miss  -> key absent and room remains; insert at the front
  //   evict -> key absent and cache is full; drop the LRU (back), then insert
  function buildFrames(capacity, keys) {
    const cap = Math.max(1, capacity | 0);
    const order = []; // front (index 0) = MRU, back = LRU
    const frames = [];
    let hits = 0;
    let misses = 0;

    const snap = (access, status, evicted, msg) => frames.push({
      order: order.slice(),
      capacity: cap,
      access,
      status,
      evicted,
      hits,
      misses,
      msg,
    });

    snap(null, 'start', null, {
      zh: '空快取，容量 ' + cap,
      en: 'Empty cache, capacity ' + cap,
    });

    (keys || []).forEach((key) => {
      const pos = order.indexOf(key);
      if (pos !== -1) {
        order.splice(pos, 1);
        order.unshift(key);
        hits += 1;
        snap(key, 'hit', null, {
          zh: '命中 ' + key + '：移到最前（MRU）',
          en: 'Hit ' + key + ': move to front (MRU)',
        });
      } else if (order.length >= cap) {
        const evicted = order.pop();
        order.unshift(key);
        misses += 1;
        snap(key, 'evict', evicted, {
          zh: '未命中 ' + key + '：已滿，淘汰 ' + evicted + '（LRU）後插入',
          en: 'Miss ' + key + ': full — evict ' + evicted + ' (LRU), then insert',
        });
      } else {
        order.unshift(key);
        misses += 1;
        snap(key, 'miss', null, {
          zh: '未命中 ' + key + '：插入到最前',
          en: 'Miss ' + key + ': insert at front',
        });
      }
    });

    return { frames, capacity: cap };
  }

  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.LruViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
