(function (global) {
  'use strict';

  // Fixed-depth layout (positions 1..15, same numbering as tree-segment) supports
  // at most 8 leaves. Every version's tree uses the SAME position -> [lo,hi] ranges
  // (they depend only on n, not on values), which is what lets us show structural
  // sharing simply as "this position holds the same node id as an earlier version".
  const MAX_N = 8;
  const DEFAULT_ARR = [5, 8, 6, 3, 2, 7, 2, 6];
  const CHALLENGE_ARR = [3, 1, 4, 1, 5, 9, 2, 6];

  function rangesFor(n) {
    const lo = new Array(16), hi = new Array(16);
    (function setRanges(pos, l, r) {
      lo[pos] = l; hi[pos] = r;
      if (l === r) return;
      const mid = (l + r) >> 1;
      setRanges(2 * pos, l, mid);
      setRanges(2 * pos + 1, mid + 1, r);
    })(1, 0, n - 1);
    return { lo, hi };
  }

  function clampInt(value, min, max, fallback) {
    const n = Math.trunc(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function presetForDifficulty(tier) {
    if (tier !== 'normal') {
      return {
        arr: CHALLENGE_ARR.slice(),
        u1: { idx: 0, val: 100 },
        u2: { idx: 0, val: 1 }, // edge case: second update overwrites the SAME index again
        q: { l: 0, r: 7 },      // edge case: full-range query
      };
    }
    return {
      arr: DEFAULT_ARR.slice(),
      u1: { idx: 1, val: 20 },
      u2: { idx: 4, val: 9 },
      q: { l: 2, r: 5 },
    };
  }

  function randomConfig(tier, random) {
    const draw = typeof random === 'function' ? random : Math.random;
    const rnd = (span) => Math.floor(Math.max(0, Math.min(0.999999, draw())) * span);
    const n = tier === 'normal' ? 6 + rnd(3) : MAX_N; // normal: 6..8, challenge: always 8
    const arr = Array.from({ length: n }, () => rnd(100));
    const u1 = { idx: rnd(n), val: rnd(100) };
    const u2 = { idx: rnd(n), val: rnd(100) };
    const l = rnd(n);
    const r = l + rnd(n - l);
    return { arr, u1, u2, q: { l, r } };
  }

  function parseIdxVal(text, n, fallback) {
    const match = /^\s*(-?\d+)\s*:\s*(-?\d+)\s*$/.exec(String(text));
    if (!match) {
      return { value: fallback, malformed: true, clamped: false };
    }
    const rawIdx = Number(match[1]), rawVal = Number(match[2]);
    const idx = clampInt(rawIdx, 0, n - 1, fallback.idx);
    const val = clampInt(rawVal, 0, 999, fallback.val);
    return { value: { idx, val }, malformed: false, clamped: idx !== rawIdx || val !== rawVal };
  }

  function parseInput(arrText, u1Text, u2Text, qText) {
    const errors = [];
    const warnings = [];
    let arr = String(arrText).split(/[\s,]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite);
    arr = arr.filter((v) => v >= 0 && v <= 99);
    if (arr.length > MAX_N) {
      warnings.push({ zh: '陣列長度限制為 ' + MAX_N + '，已截斷。', en: 'Array length is limited to ' + MAX_N + ' and was truncated.' });
      arr = arr.slice(0, MAX_N);
    }
    if (!arr.length) {
      errors.push({ zh: '陣列必須至少有一個 0–99 的整數；已改用預設值。', en: 'Array needs at least one integer 0–99; using the default.' });
      arr = DEFAULT_ARR.slice();
    }
    const n = arr.length;

    const u1Result = parseIdxVal(u1Text, n, { idx: 0, val: 0 });
    if (u1Result.malformed) warnings.push({ zh: '更新 1 格式應為 idx:val，已改用 0:0。', en: 'Update 1 should be idx:val; using 0:0.' });
    else if (u1Result.clamped) warnings.push({ zh: '更新 1 的索引或數值超出範圍，已自動截斷。', en: 'Update 1 index or value was out of range and was clamped.' });
    const u2Result = parseIdxVal(u2Text, n, { idx: 0, val: 0 });
    if (u2Result.malformed) warnings.push({ zh: '更新 2 格式應為 idx:val，已改用 0:0。', en: 'Update 2 should be idx:val; using 0:0.' });
    else if (u2Result.clamped) warnings.push({ zh: '更新 2 的索引或數值超出範圍，已自動截斷。', en: 'Update 2 index or value was out of range and was clamped.' });

    const qMatch = /^\s*(-?\d+)\s*[,\-]\s*(-?\d+)\s*$/.exec(String(qText));
    let q;
    if (!qMatch) {
      warnings.push({ zh: '查詢範圍格式應為 l,r，已改用整個陣列。', en: 'Query range should be l,r; using the whole array.' });
      q = { l: 0, r: n - 1 };
    } else {
      let l = clampInt(qMatch[1], 0, n - 1, 0);
      let r = clampInt(qMatch[2], 0, n - 1, n - 1);
      if (l > r) { const t = l; l = r; r = t; }
      q = { l, r };
    }

    return { arr, u1: u1Result.value, u2: u2Result.value, q, errors, warnings };
  }

  // ---- Core persistent-segment-tree engine ------------------------------

  function buildFrames(config) {
    const arr = (config.arr || DEFAULT_ARR).slice(0, MAX_N);
    const n = Math.max(1, arr.length);
    const { lo, hi } = rangesFor(n);
    const u1 = { idx: clampInt(config.u1 && config.u1.idx, 0, n - 1, 0), val: clampInt(config.u1 && config.u1.val, 0, 999, 0) };
    const u2 = { idx: clampInt(config.u2 && config.u2.idx, 0, n - 1, 0), val: clampInt(config.u2 && config.u2.val, 0, 999, 0) };
    const q = { l: clampInt(config.q && config.q.l, 0, n - 1, 0), r: clampInt(config.q && config.q.r, 0, n - 1, n - 1) };
    const ql = Math.min(q.l, q.r), qr = Math.max(q.l, q.r);

    let nextId = 1;
    const nodes = {}; // id -> { id, lo, hi, sum, left, right, version, clonedFrom }
    function makeNode(pos, sum, left, right, version, clonedFrom) {
      const id = nextId++;
      const node = { id, lo: lo[pos], hi: hi[pos], sum, left, right, version, clonedFrom: clonedFrom || null };
      nodes[id] = node;
      return node;
    }

    const frames = [];
    function snapshot(version, posToId, active, phase, msg) {
      frames.push({ version, posToId: posToId.slice(), active: active === undefined ? -1 : active, phase, msg });
    }

    // ---- Version 0: silent build (mirrors tree-segment's silent build) ----
    const posToId0 = new Array(16).fill(0);
    (function build(pos) {
      if (lo[pos] === hi[pos]) {
        posToId0[pos] = makeNode(pos, arr[lo[pos]], 0, 0, 0, null).id;
        return;
      }
      build(2 * pos);
      build(2 * pos + 1);
      const leftId = posToId0[2 * pos], rightId = posToId0[2 * pos + 1];
      posToId0[pos] = makeNode(pos, nodes[leftId].sum + nodes[rightId].sum, leftId, rightId, 0, null).id;
    })(1);
    snapshot(0, posToId0, -1, 'build-v0', {
      zh: '版本 v0 建立完成——每個節點都是全新配置。',
      en: 'Version v0 built — every node is freshly allocated.',
    });

    // ---- Path-copy update: returns the new posToId array for `version` ----
    function applyUpdate(prevPosToId, idx, val, version) {
      const posToId = prevPosToId.slice();
      (function rec(pos) {
        snapshot(version, posToId, pos, 'descend', {
          zh: '走訪節點 ' + pos + ' [' + lo[pos] + ',' + hi[pos] + ']。',
          en: 'Visit node ' + pos + ' [' + lo[pos] + ',' + hi[pos] + '].',
        });
        if (lo[pos] === hi[pos]) {
          const created = makeNode(pos, val, 0, 0, version, posToId[pos]);
          posToId[pos] = created.id;
          snapshot(version, posToId, pos, 'leaf', {
            zh: '複製葉節點 ' + pos + '（索引 ' + lo[pos] + '）並改值為 ' + val + '。',
            en: 'Clone leaf node ' + pos + ' (index ' + lo[pos] + ') with new value ' + val + '.',
          });
          return;
        }
        const mid = (lo[pos] + hi[pos]) >> 1;
        if (idx <= mid) {
          rec(2 * pos);
          const sharedId = posToId[2 * pos + 1];
          snapshot(version, posToId, 2 * pos + 1, 'shared', {
            zh: '節點 ' + pos + ' 的右子樹未受影響——直接沿用 v' + nodes[sharedId].version + ' 的節點 #' + sharedId + '（不複製）。',
            en: "Node " + pos + "'s right subtree is unaffected — reuse node #" + sharedId + ' from v' + nodes[sharedId].version + ' (no copy).',
          });
        } else {
          rec(2 * pos + 1);
          const sharedId = posToId[2 * pos];
          snapshot(version, posToId, 2 * pos, 'shared', {
            zh: '節點 ' + pos + ' 的左子樹未受影響——直接沿用 v' + nodes[sharedId].version + ' 的節點 #' + sharedId + '（不複製）。',
            en: "Node " + pos + "'s left subtree is unaffected — reuse node #" + sharedId + ' from v' + nodes[sharedId].version + ' (no copy).',
          });
        }
        const leftId = posToId[2 * pos], rightId = posToId[2 * pos + 1];
        const created = makeNode(pos, nodes[leftId].sum + nodes[rightId].sum, leftId, rightId, version, posToId[pos]);
        posToId[pos] = created.id;
        snapshot(version, posToId, pos, 'rebuild', {
          zh: '複製節點 ' + pos + '，新的一個子指向 v' + version + '、另一個沿用舊版——新總和 = ' + created.sum + '。',
          en: 'Clone node ' + pos + ': one child points into v' + version + ', the other is reused — new sum = ' + created.sum + '.',
        });
      })(1);
      snapshot(version, posToId, -1, 'version-ready', {
        zh: '版本 v' + version + ' 就緒（更新 index ' + idx + ' → ' + val + '）。',
        en: 'Version v' + version + ' ready (updated index ' + idx + ' → ' + val + ').',
      });
      return posToId;
    }

    const posToId1 = applyUpdate(posToId0, u1.idx, u1.val, 1);
    const posToId2 = applyUpdate(posToId1, u2.idx, u2.val, 2);

    // ---- Range-sum query (read-only: no new nodes) ----
    function applyQuery(version, posToId, queryLo, queryHi) {
      let result = 0;
      (function rec(pos) {
        if (queryHi < lo[pos] || hi[pos] < queryLo) {
          snapshot(version, posToId, pos, 'disjoint', {
            zh: '節點 ' + pos + ' [' + lo[pos] + ',' + hi[pos] + '] 與查詢範圍不相交——略過。',
            en: 'Node ' + pos + ' [' + lo[pos] + ',' + hi[pos] + '] is disjoint from the query — skip.',
          });
          return 0;
        }
        if (queryLo <= lo[pos] && hi[pos] <= queryHi) {
          const sum = nodes[posToId[pos]].sum;
          snapshot(version, posToId, pos, 'covered', {
            zh: '節點 ' + pos + ' 完全被涵蓋——取值 ' + sum + '。',
            en: 'Node ' + pos + ' is fully covered — take ' + sum + '.',
          });
          return sum;
        }
        snapshot(version, posToId, pos, 'partial', {
          zh: '節點 ' + pos + ' 部分重疊——遞迴左右子樹。',
          en: 'Node ' + pos + ' partially overlaps — recurse into both children.',
        });
        return rec(2 * pos) + rec(2 * pos + 1);
      })(1);
      result = (function total(pos) {
        if (queryHi < lo[pos] || hi[pos] < queryLo) return 0;
        if (queryLo <= lo[pos] && hi[pos] <= queryHi) return nodes[posToId[pos]].sum;
        return total(2 * pos) + total(2 * pos + 1);
      })(1);
      snapshot(version, posToId, -1, 'result', {
        zh: '在 v' + version + ' 查詢 sum[' + queryLo + ',' + queryHi + '] = ' + result + '。',
        en: 'Query sum[' + queryLo + ',' + queryHi + '] on v' + version + ' = ' + result + '.',
      });
      return result;
    }

    const resultV0 = applyQuery(0, posToId0, ql, qr);
    const resultV2 = applyQuery(2, posToId2, ql, qr);

    // ---- Per-version summary (for the version strip + "why persistence" stats) ----
    function summarize(version, posToId) {
      const seen = new Set();
      let fresh = 0;
      posToId.forEach((id, pos) => {
        if (!id || lo[pos] === undefined) return;
        if (seen.has(id)) return;
        seen.add(id);
        if (nodes[id].version === version) fresh++;
      });
      return { version: version, rootSum: nodes[posToId[1]].sum, totalNodes: seen.size, newNodes: fresh, sharedNodes: seen.size - fresh };
    }

    const versions = [
      Object.assign({ posToId: posToId0 }, summarize(0, posToId0)),
      Object.assign({ posToId: posToId1 }, summarize(1, posToId1)),
      Object.assign({ posToId: posToId2 }, summarize(2, posToId2)),
    ];

    return {
      frames, nodes, versions, n, lo, hi,
      query: { l: ql, r: qr },
      resultV0, resultV2,
      invariantHolds: resultV0 === (function () { // recompute v0's true (unmutated) sum directly for a sanity cross-check
        let s = 0; for (let i = ql; i <= qr; i++) s += arr[i]; return s;
      })(),
    };
  }

  const api = {
    MAX_N, DEFAULT_ARR, CHALLENGE_ARR,
    rangesFor, presetForDifficulty, randomConfig, parseInput, buildFrames,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.PersistentSegTreeViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
