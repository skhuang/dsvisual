(function (global) {
  const COINS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  function weigh(scenario, L, R) {
    const w = (i) => 10 + (i === scenario.fake ? (scenario.heavy ? 1 : -1) : 0);
    const sum = (arr) => arr.reduce((t, i) => t + w(i), 0);
    const d = sum(L) - sum(R);
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
  }

  // Faithful transcription of the deck's EIGHTCOINS / COMP procedure.
  function decide(scenario) {
    const path = [];
    const W = (L, R) => { const o = weigh(scenario, L, R); path.push({ left: L, right: R, outcome: o }); return o; };
    // COMP(x, y, z): weigh {x} vs good {z}; >0 -> x heavy, else y light.
    const comp = (x, y, z) => { const o = W([x], [z]); return o > 0 ? { coin: x, heavy: true } : { coin: y, heavy: false }; };
    const a = 0, b = 1, c = 2, d = 3, e = 4, f = 5, g = 6, h = 7;
    let verdict;
    const w1 = W([a, b, c], [d, e, f]);
    if (w1 === 0) {
      const w2 = W([g], [h]);
      verdict = (w2 > 0) ? comp(g, h, a) : comp(h, g, a);
    } else if (w1 > 0) {
      const w2 = W([a, d], [b, e]);
      if (w2 === 0) verdict = comp(c, f, a);
      else if (w2 > 0) verdict = comp(a, e, b);
      else verdict = comp(b, d, a);
    } else {
      const w2 = W([a, d], [b, e]);
      if (w2 === 0) verdict = comp(f, c, a);
      else if (w2 > 0) verdict = comp(d, b, a);
      else verdict = comp(e, a, b);
    }
    return { path, verdict };
  }

  function allScenarios() {
    const out = [];
    for (let fake = 0; fake < 8; fake++) for (const heavy of [true, false]) out.push({ fake, heavy });
    return out;
  }

  function allScenariosCorrect() {
    return allScenarios().every((s) => {
      const v = decide(s).verdict;
      return v.coin === s.fake && v.heavy === s.heavy;
    });
  }

  function buildDecisionTree() {
    const runs = allScenarios().map((s) => { const r = decide(s); return { verdict: r.verdict, path: r.path }; });
    function build(depth, subset, key) {
      const withW = subset.filter((r) => r.path.length > depth);
      if (withW.length === 0) return { key, leaf: subset[0].verdict };
      const wg = withW[0].path[depth];
      const children = {};
      for (const o of [-1, 0, 1]) {
        const child = subset.filter((r) => r.path[depth] && r.path[depth].outcome === o);
        if (child.length) children[String(o)] = build(depth + 1, child, key + '.' + o);
      }
      return { key, weigh: { left: wg.left, right: wg.right }, children };
    }
    return build(0, runs, 'r');
  }

  function buildCoinsFrames(scenario) {
    const { path, verdict } = decide(scenario);
    const frames = [];
    let key = 'r';
    const fmt = (arr) => arr.map((i) => COINS[i]).join('');
    path.forEach((wg, k) => {
      const sym = wg.outcome > 0 ? '>' : (wg.outcome < 0 ? '<' : '=');
      frames.push({
        step: k + 1, left: wg.left, right: wg.right, outcome: wg.outcome, nodeKey: key, verdict: null, action: 'weigh',
        msg: {
          zh: '第 ' + (k + 1) + ' 次秤:' + fmt(wg.left) + ' 對 ' + fmt(wg.right) + ' → ' + (wg.outcome > 0 ? '左重' : wg.outcome < 0 ? '右重' : '平衡') + ' (' + sym + ')',
          en: 'weighing ' + (k + 1) + ': ' + fmt(wg.left) + ' vs ' + fmt(wg.right) + ' → ' + (wg.outcome > 0 ? 'left heavier' : wg.outcome < 0 ? 'right heavier' : 'balanced') + ' (' + sym + ')',
        },
      });
      key = key + '.' + wg.outcome;
    });
    frames.push({
      step: path.length, left: [], right: [], outcome: null, nodeKey: key, verdict, action: 'done',
      msg: {
        zh: '找到:硬幣 ' + COINS[verdict.coin] + ' 為' + (verdict.heavy ? '較重' : '較輕') + '的偽幣',
        en: 'identified: coin ' + COINS[verdict.coin] + ' is the ' + (verdict.heavy ? 'heavy' : 'light') + ' counterfeit',
      },
    });
    return { frames, verdict };
  }

  const api = { COINS, weigh, decide, allScenarios, allScenariosCorrect, buildDecisionTree, buildCoinsFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DecisionTreeCoinsViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
