(function (global) {
  'use strict';

  function buildIsam(keys, blockSize) {
    blockSize = blockSize || 3;
    const sorted = (keys || []).slice().sort((a, b) => a - b);
    const blocks = [];
    for (let i = 0; i < sorted.length; i += blockSize) blocks.push({ keys: sorted.slice(i, i + blockSize), overflow: [] });
    if (!blocks.length) blocks.push({ keys: [], overflow: [] });
    const index = blocks.map((b, i) => ({ blockIndex: i, minKey: b.keys.length ? b.keys[0] : Infinity }));
    return { blocks: blocks, index: index, blockSize: blockSize };
  }

  function searchFrames(isam, key) {
    const frames = [];
    let bi = 0;
    for (let i = 0; i < isam.index.length; i++) {
      frames.push({ phase: 'index', activeIndex: i, key: key });
      if (isam.index[i].minKey <= key) bi = i; else break;
    }
    frames.push({ phase: 'block', activeBlock: bi, key: key });
    const blk = isam.blocks[bi];
    for (let s = 0; s < blk.keys.length; s++) {
      frames.push({ phase: 'scan', activeBlock: bi, activeSlot: s, key: key });
      if (blk.keys[s] === key) { frames.push({ phase: 'found', activeBlock: bi, activeSlot: s, key: key }); return { frames: frames, found: true, block: bi, slot: s }; }
    }
    for (let s = 0; s < blk.overflow.length; s++) {
      frames.push({ phase: 'overflow', activeBlock: bi, activeSlot: s, key: key });
      if (blk.overflow[s] === key) { frames.push({ phase: 'found', activeBlock: bi, overflow: true, slot: s, key: key }); return { frames: frames, found: true, block: bi, slot: s, overflow: true }; }
    }
    frames.push({ phase: 'notfound', activeBlock: bi, key: key });
    return { frames: frames, found: false, block: bi };
  }

  const api = { buildIsam: buildIsam, searchFrames: searchFrames, SAMPLE_KEYS: [10, 20, 30, 40, 50, 60, 70, 80, 90], SAMPLE_BLOCK: 3 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.FileIsamViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
