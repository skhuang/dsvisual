(function (global) {
  'use strict';
  const K = () => global.VizKit;
  const L = (zh, en) => {
    try { return global.I18N && I18N.getCurrentLanguage() === 'zh' ? zh : en; }
    catch (error) { return en; }
  };

  function escapeAttribute(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  const DEFAULT_CONFIG = {
    leftSize: 3,
    rightSize: 3,
    edges: [{ u: 0, v: 0 }, { u: 1, v: 1 }, { u: 2, v: 2 }]
  };

  const state = {
    config: Object.assign({}, DEFAULT_CONFIG),
    errors: [],
    warnings: [],
  };

  function edgesToText(edges) {
    return edges.map((e) => e.u + '-' + e.v).join(',');
  }

 
  function generateFrames(config) {
    const frames = [];
    const L_size = config.leftSize;
    const R_size = config.rightSize;
    
    
    const adj = Array.from({ length: L_size }, () => []);
    config.edges.forEach(e => {
      if (e.u < L_size && e.v < R_size) {
        adj[e.u].push(e.v);
      }
    });

    let pairU = Array(L_size).fill(-1);
    let pairV = Array(R_size).fill(-1);
    let dist = Array(L_size).fill(0);

    frames.push({
      matched: {},
      pairV: [...pairV],
      msg: { zh: '初始化 Hopcroft-Karp 演算法，準備尋找增廣路徑', en: 'Initialize Hopcroft-Karp algorithm' },
      phase: 'init'
    });

    
    function bfs() {
      let queue = [];
      for (let u = 0; u < L_size; u++) {
        if (pairU[u] === -1) {
          dist[u] = 0;
          queue.push(u);
        } else {
          dist[u] = Infinity;
        }
      }
      let dis = Infinity;
      while (queue.length > 0) {
        let u = queue.shift();
        if (dist[u] < dis) {
          for (let v of adj[u]) {
            if (pairV[v] === -1) {
              dis = dist[u] + 1;
            } else if (dist[pairV[v]] === Infinity) {
              dist[pairV[v]] = dist[u] + 1;
              queue.push(pairV[v]);
            }
          }
        }
      }
      return dis !== Infinity;
    }

   
    function dfs(u) {
      for (let v of adj[u]) {
        if (pairV[v] === -1 || (dist[pairV[v]] === dist[u] + 1 && dfs(pairV[v]))) {
          pairU[u] = v;
          pairV[v] = u;
          return true;
        }
      }
      dist[u] = Infinity;
      return false;
    }

    
    let matchingSize = 0;
    while (bfs()) {
      for (let u = 0; u < L_size; u++) {
        if (pairU[u] === -1 && dfs(u)) {
          matchingSize++;
          let currentMatched = {};
          for (let i = 0; i < L_size; i++) {
            if (pairU[i] !== -1) currentMatched[i] = pairU[i];
          }
          frames.push({
            matched: currentMatched,
            pairV: [...pairV],
            msg: { zh: `找到增廣路徑，成功擴充匹配，目前大小：${matchingSize}`, en: `Found augmenting path, matching size: ${matchingSize}` },
            phase: 'augmenting'
          });
        }
      }
    }

    const finalMatched = {};
    for (let i = 0; i < L_size; i++) {
      if (pairU[i] !== -1) finalMatched[i] = pairU[i];
    }
    frames.push({
      matched: finalMatched,
      pairV: [...pairV],
      msg: { zh: `Hopcroft-Karp 匹配完成！最大匹配數：${matchingSize}`, en: `Hopcroft-Karp matching complete! Max matching: ${matchingSize}` },
      phase: 'done'
    });

    return { frames };
  }

  
  function graphSvg(config, frame) {
    let svg = '<svg viewBox="0 0 360 260" width="360" height="260" class="hk-graph-svg">';
    
    
    config.edges.forEach(e => {
      if (e.u < config.leftSize && e.v < config.rightSize) {
        const y1 = 50 + e.u * (160 / Math.max(config.leftSize - 1, 1));
        const y2 = 50 + e.v * (160 / Math.max(config.rightSize - 1, 1));
        const isMatchedEdge = frame.matched[e.u] === e.v;
        svg += `<line x1="80" y1="${y1}" x2="280" y2="${y2}" stroke="${isMatchedEdge ? '#16a34a' : '#cbd5e1'}" stroke-width="${isMatchedEdge ? '3' : '1.5'}" />`;
      }
    });

    
    for (let i = 0; i < config.leftSize; i++) {
      const y = 50 + i * (160 / Math.max(config.leftSize - 1, 1));
      const isMatched = frame.matched[i] !== undefined;
      svg += `<circle cx="80" cy="${y}" r="16" fill="${isMatched ? '#dcfce7' : '#fff'}" stroke="#2563eb" stroke-width="2" />`;
      svg += `<text x="80" y="${y + 5}" text-anchor="middle" font-size="12" fill="#1e293b">L${i}</text>`;
    }

    
    for (let j = 0; j < config.rightSize; j++) {
      const y = 50 + j * (160 / Math.max(config.rightSize - 1, 1));
      const isMatched = frame.pairV && frame.pairV[j] !== -1;
      svg += `<circle cx="280" cy="${y}" r="16" fill="${isMatched ? '#dcfce7' : '#fff'}" stroke="#9333ea" stroke-width="2" />`;
      svg += `<text x="280" y="${y + 5}" text-anchor="middle" font-size="12" fill="#1e293b">R${j}</text>`;
    }

    svg += '</svg>';
    return svg;
  }

  function renderGraphHopcroftKarp() {
    const host = K().acquireDynamicVizHost();
    const config = state.config;

    host.innerHTML = `
      <div class="hk-wrap vizfit-host" style="padding: 15px;">
        <div class="hk-controls" style="margin-bottom: 10px;">
          <label>左側點數 <input type="text" class="hk-left" value="${config.leftSize}" style="width: 40px;"></label>
          <label>右側點數 <input type="text" class="hk-right" value="${config.rightSize}" style="width: 40px;"></label>
          <label>邊 (u-v) <input type="text" class="hk-edges" value="${escapeAttribute(edgesToText(config.edges))}" style="width: 120px;"></label>
          <button type="button" class="hk-apply">套用</button>
        </div>
        <div class="hk-banner" style="font-weight: bold; margin-bottom: 8px;">&nbsp;</div>
        <div class="hk-canvas-pane" style="border: 1px solid #ddd; background: #fff; width: 360px; height: 260px;"></div>
        <div class="hk-msg" style="margin-top: 8px; color: #555;">&nbsp;</div>
      </div>
    `;

    const wrap = host.querySelector('.hk-wrap');
    const canvasPane = wrap.querySelector('.hk-canvas-pane');
    const bannerElement = wrap.querySelector('.hk-banner');
    const messageElement = wrap.querySelector('.hk-msg');

    const result = generateFrames(config);

    function paint(frame) {
      canvasPane.innerHTML = graphSvg(config, frame);
      bannerElement.textContent = frame.phase;
      messageElement.textContent = L(frame.msg.zh, frame.msg.en);
    }

    wrap.appendChild(K().buildFrameControls(result.frames, paint, { runIntervalMs: 600 }));

    wrap.querySelector('.hk-apply').addEventListener('click', () => {
      const lVal = parseInt(wrap.querySelector('.hk-left').value) || 3;
      const rVal = parseInt(wrap.querySelector('.hk-right').value) || 3;
      const edgesInput = wrap.querySelector('.hk-edges').value;
      
      const newEdges = edgesInput.split(',').map(item => {
        const parts = item.trim().split('-');
        if (parts.length === 2) {
          return { u: parseInt(parts[0]), v: parseInt(parts[1]) };
        }
        return null;
      }).filter(Boolean);

      state.config.leftSize = lVal;
      state.config.rightSize = rVal;
      if (newEdges.length > 0) state.config.edges = newEdges;
      renderGraphHopcroftKarp();
    });
  }

  global.VizRegistry.attach('graph-hopcroft-karp', {
    render: renderGraphHopcroftKarp,
    code: () => (typeof codeGraphHopcroftKarp !== 'undefined' ? codeGraphHopcroftKarp : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);