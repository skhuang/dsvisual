(function (global) {
  'use strict';

  const K = () => global.VizKit;

  const NORMAL_SAMPLE = {
  nLeft: 2,
  nRight: 2,
  edges: [
    [0, 0],
    [0, 1],
    [1, 0]
  ]
};

const CHALLENGE_SAMPLE = {
  nLeft: 5,
  nRight: 5,
  edges: [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 1],
    [2, 2],
    [3, 2],
    [3, 3],
    [4, 3],
    [4, 4]
  ]
};

function getDifficultySample() {
  const difficulty =
    K().getInputDifficulty
      ? K().getInputDifficulty()
      : 'normal';

  return difficulty === 'normal'
    ? NORMAL_SAMPLE
    : CHALLENGE_SAMPLE;
}

  function validateInput(leftText, rightText, edgeText) {
  const errors = [];
  const warnings = [];

  const nLeft = Number(leftText);
  const nRight = Number(rightText);

  if (!Number.isInteger(nLeft)) {
    errors.push('左側頂點數 |U| 必須是整數。');
  } else if (nLeft < 1) {
    errors.push('左側頂點數 |U| 至少必須為 1。');
  } else if (nLeft > 10) {
    errors.push('左側頂點數 |U| 最多為 10，以避免視覺化過度擁擠。');
  }

  if (!Number.isInteger(nRight)) {
    errors.push('右側頂點數 |V| 必須是整數。');
  } else if (nRight < 1) {
    errors.push('右側頂點數 |V| 至少必須為 1。');
  } else if (nRight > 10) {
    errors.push('右側頂點數 |V| 最多為 10，以避免視覺化過度擁擠。');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      nLeft,
      nRight,
      edges: [],
      errors,
      warnings
    };
  }

  const edges = [];
  const seen = new Set();

  const tokens = String(edgeText || '')
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const match = token.match(/^(\d+)\s*-\s*(\d+)$/);

    if (!match) {
      warnings.push(`忽略格式錯誤的邊：「${token}」`);
      continue;
    }

    const u = Number(match[1]);
    const v = Number(match[2]);

    if (u < 0 || u >= nLeft || v < 0 || v >= nRight) {
      warnings.push(
        `忽略超出範圍的邊：${u}-${v}`
      );
      continue;
    }

    const key = `${u}-${v}`;

    if (seen.has(key)) {
      warnings.push(
        `重複邊 ${u}-${v} 已忽略。`
      );
      continue;
    }

    seen.add(key);
    edges.push([u, v]);
  }

  if (edges.length === 0) {
    warnings.push(
      '沒有有效邊；最大匹配將為 0。'
    );
  }

  return {
    valid: true,
    nLeft,
    nRight,
    edges,
    errors,
    warnings
  };
}

  function buildNodePositions(nLeft, nRight) {
    const left = [];
    const right = [];

    const top = 90;
    const leftX = 150;
    const rightX = 620;

    const leftGap = nLeft > 1 ? 280 / (nLeft - 1) : 0;
    const rightGap = nRight > 1 ? 280 / (nRight - 1) : 0;

    for (let i = 0; i < nLeft; i++) {
      left.push({
        x: leftX,
        y: top + i * leftGap
      });
    }

    for (let j = 0; j < nRight; j++) {
      right.push({
        x: rightX,
        y: top + j * rightGap
      });
    }

    return { left, right };
  }

  function edgeKey(u, v) {
    return `${u}-${v}`;
  }

  function makeSet(edges) {
    return new Set((edges || []).map(([u, v]) => edgeKey(u, v)));
  }

  function renderSvgGraph(frame) {
    const data = frame.data;
    const { nLeft, nRight, edges, matching } = data;
    const pos = buildNodePositions(nLeft, nRight);

    const matchedSet = makeSet(matching);
    const inspectSet = makeSet(frame.inspectEdges || []);
    const pathSet = makeSet(frame.pathEdges || []);

    let svg = `
      <svg viewBox="0 0 760 470" width="100%" height="470">
        <text x="150" y="38" text-anchor="middle" font-size="24" font-weight="700" fill="#1f2937">U</text>
        <text x="620" y="38" text-anchor="middle" font-size="24" font-weight="700" fill="#1f2937">V</text>
    `;

    // Draw edges
    for (const [u, v] of edges) {
      const a = pos.left[u];
      const b = pos.right[v];
      const key = edgeKey(u, v);

      let stroke = '#94a3b8';
      let width = 2.5;

      if (matchedSet.has(key)) {
        stroke = '#16a34a';
        width = 5;
      }

      if (inspectSet.has(key)) {
        stroke = '#f59e0b';
        width = 5;
      }

      if (pathSet.has(key)) {
        stroke = '#7c3aed';
        width = 6;
      }

      svg += `
        <line
          x1="${a.x + 24}"
          y1="${a.y}"
          x2="${b.x - 24}"
          y2="${b.y}"
          stroke="${stroke}"
          stroke-width="${width}"
          opacity="0.96"
        />
      `;
    }

    // Draw left nodes
    for (let i = 0; i < nLeft; i++) {
      const p = pos.left[i];

      const isCurrent = frame.currentU === i;
      const isLayered = frame.layers && frame.layers[i] !== undefined;

      let stroke = '#334155';
      let strokeWidth = 2.5;
      let fill = '#eff6ff';

      if (isLayered) {
        stroke = '#2563eb';
        strokeWidth = 4;
      }

      if (isCurrent) {
        stroke = '#f59e0b';
        strokeWidth = 5;
      }

      svg += `
        <circle cx="${p.x}" cy="${p.y}" r="24" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        <text x="${p.x}" y="${p.y + 7}" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">U${i}</text>
      `;

      if (isLayered) {
        svg += `
          <text x="${p.x - 42}" y="${p.y + 6}" text-anchor="middle" font-size="15" font-weight="700" fill="#2563eb">
            d=${frame.layers[i]}
          </text>
        `;
      }
    }

    // Draw right nodes
    for (let j = 0; j < nRight; j++) {
      const p = pos.right[j];

      const isCurrent = frame.currentV === j;

      let stroke = '#334155';
      let strokeWidth = 2.5;
      let fill = '#f0fdf4';

      if (isCurrent) {
        stroke = '#f59e0b';
        strokeWidth = 5;
      }

      svg += `
        <circle cx="${p.x}" cy="${p.y}" r="24" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
        <text x="${p.x}" y="${p.y + 7}" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">V${j}</text>
      `;
    }

    svg += `</svg>`;
    return svg;
  }

  function renderMatchingTable(frame) {
    const data = frame.data;
    const rows = [];
    const used = new Map();

    for (const [u, v] of (data.matching || [])) {
      used.set(u, v);
    }

    for (let u = 0; u < data.nLeft; u++) {
      rows.push(`
        <tr>
          <td style="padding:6px 10px;border:1px solid #cbd5e1;">U${u}</td>
          <td style="padding:6px 10px;border:1px solid #cbd5e1;">${used.has(u) ? 'V' + used.get(u) : 'FREE'}</td>
        </tr>
      `);
    }

    return `
      <table style="border-collapse:collapse; width:100%; font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:6px 10px;border:1px solid #cbd5e1;">Left</th>
            <th style="padding:6px 10px;border:1px solid #cbd5e1;">Matched To</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    `;
  }

  function renderLayerTable(frame, nLeft) {
    const rows = [];

    for (let u = 0; u < nLeft; u++) {
      const val = frame.layers && frame.layers[u] !== undefined
        ? frame.layers[u]
        : '—';

      rows.push(`
        <tr>
          <td style="padding:6px 10px;border:1px solid #cbd5e1;">U${u}</td>
          <td style="padding:6px 10px;border:1px solid #cbd5e1;">${val}</td>
        </tr>
      `);
    }

    return `
      <table style="border-collapse:collapse; width:100%; font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:6px 10px;border:1px solid #cbd5e1;">U</th>
            <th style="padding:6px 10px;border:1px solid #cbd5e1;">dist</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    `;
  }

  function buildSampleFrames() {
    const base = {
      nLeft: SAMPLE.nLeft,
      nRight: SAMPLE.nRight,
      edges: [...SAMPLE.edges]
    };

    return [
      {
        title: 'Step 0 — Initial graph',
        message: '初始狀態：尚未有任何匹配。',
        data: {
          ...base,
          matching: []
        },
        layers: {},
        queue: []
      },

      {
        title: 'Step 1 — BFS phase 1',
        message: '所有自由左側頂點 U0、U1 都作為 BFS 起點，因此兩者的 dist = 0。',
        data: {
          ...base,
          matching: []
        },
        layers: { 0: 0, 1: 0 },
        queue: ['U0', 'U1']
      },

      {
        title: 'Step 2 — DFS from U0',
        message: 'DFS 從 U0 出發，先找到自由右側頂點 V0，因此得到第一條增廣路徑 U0 → V0。',
        data: {
          ...base,
          matching: []
        },
        layers: { 0: 0, 1: 0 },
        inspectEdges: [[0, 0]],
        currentU: 0,
        currentV: 0,
        queue: ['U1']
      },

      {
        title: 'Step 3 — Matching size = 1',
        message: '完成第一次增廣，更新匹配為 U0 → V0。',
        data: {
          ...base,
          matching: [[0, 0]]
        },
        layers: {},
        queue: []
      },

      {
        title: 'Step 4 — BFS phase 2',
        message: '現在只有 U1 是自由頂點，因此 BFS 從 U1 出發。經過已匹配邊 V0 → U0，可把 U0 放入下一層，故 dist(U1)=0，dist(U0)=1。',
        data: {
          ...base,
          matching: [[0, 0]]
        },
        layers: { 1: 0, 0: 1 },
        inspectEdges: [[1, 0], [0, 0]],
        currentU: 1,
        currentV: 0,
        queue: ['U1', 'U0']
      },

      {
        title: 'Step 5 — Shortest augmenting path',
        message: '找到最短增廣路徑：U1 → V0 → U0 → V1。紫色邊即為此增廣路徑。',
        data: {
          ...base,
          matching: [[0, 0]]
        },
        layers: { 1: 0, 0: 1 },
        pathEdges: [[1, 0], [0, 0], [0, 1]],
        currentU: 0,
        currentV: 1,
        queue: []
      },

  {
    title: 'Step 6 — Augment path',
    message: '翻轉增廣路徑後，舊匹配 U0-V0 被替換為 U1-V0 與 U0-V1。',
    data: {
      ...base,
      matching: [[0, 1], [1, 0]]
    },
    pathEdges: [],
    layers: {},
    queue: []
  },

      {
        title: 'Step 7 — Done',
        message: '已無新的增廣路徑，因此目前匹配就是最大匹配，大小 = 2。',
        data: {
          ...base,
          matching: [[0, 1], [1, 0]]
        },
        layers: {},
        queue: []
      }
    ];
  }

  function buildSingleFrame(data) {
    return [{
      title: 'Custom input',
      message: '已更新圖形。目前先顯示靜態圖；下一步再把自訂輸入接上自動 BFS / DFS frame。',
      data: {
        nLeft: data.nLeft,
        nRight: data.nRight,
        edges: [...data.edges],
        matching: []
      },
      layers: {},
      queue: []
    }];
  }

  function renderGraphHopcroftKarp() {
    const preset = getDifficultySample();

const difficulty =
  K().getInputDifficulty
    ? K().getInputDifficulty()
    : 'normal';

const difficultyLabel =
  difficulty === 'normal'
    ? '一般輸入'
    : '挑戰輸入';

    const host = K().acquireDynamicVizHost();

    const initialEdgeText =
  preset.edges
    .map(([u, v]) => `${u}-${v}`)
    .join(',');

    host.innerHTML = `
      <div style="padding: 18px 18px 8px 18px;">
        <div style="
          border:1px solid #d1d5db;
          border-radius:16px;
          padding:18px;
          background:#f8fafc;
        ">

          <div style="
            display:flex;
            flex-wrap:wrap;
            gap:10px;
            align-items:center;
            justify-content:flex-start;
            margin-bottom:16px;
          ">
            <span style="
              background:#dbeafe;
              color:#1d4ed8;
              font-weight:700;
              font-size:13px;
              border-radius:999px;
              padding:6px 12px;
            ">${difficultyLabel}</span>

            <label>|U|
              <input class="hk-left" type="text" value="${preset.nLeft}" style="width:56px;margin-left:4px;">
            </label>

            <label>|V|
              <input class="hk-right" type="text" value="${preset.nRight}" style="width:56px;margin-left:4px;">
            </label>

            <label>邊 u-v
              <input class="hk-edges" type="text" value="${initialEdgeText}" style="width:360px;max-width:100%;margin-left:4px;">
            </label>

            <button class="hk-apply" type="button">套用</button>

            <button class="hk-demo" type="button">載入教學範例</button>
          </div>

  <div
    class="hk-issues"
    style="
        display:none;
        margin:0 0 14px 0;
        padding:10px 14px;
        border-radius:10px;
        font-size:14px;
        line-height:1.7;
    "
  ></div>
          <div style="
            text-align:center;
            font-size:16px;
            font-weight:700;
            color:#2563eb;
            margin-bottom:14px;
          ">
            Hopcroft-Karp 二分圖最大匹配
          </div>

          <div style="
            display:grid;
            grid-template-columns: minmax(500px, 1fr) 300px;
            gap:18px;
            align-items:start;
          ">

            <div style="
              border:1px solid #cbd5e1;
              border-radius:14px;
              background:white;
              padding:14px;
              min-height:560px;
            ">
              <div class="hk-svg-area"></div>
            </div>

            <div style="
              border:1px solid #cbd5e1;
              border-radius:14px;
              background:white;
              padding:14px;
            ">
              <div style="font-size:18px;font-weight:700;margin-bottom:10px;color:#1e293b;">
                狀態資訊
              </div>

              <div style="margin-bottom:14px;">
                <div style="font-weight:700;margin-bottom:6px;">Matching</div>
                <div class="hk-matching-table"></div>
              </div>

              <div style="margin-bottom:14px;">
                <div style="font-weight:700;margin-bottom:6px;">BFS Layers</div>
                <div class="hk-layer-table"></div>
              </div>

              <div style="margin-bottom:14px;">
                <div style="font-weight:700;margin-bottom:6px;">Queue</div>
                <div class="hk-queue" style="font-size:14px;color:#334155;"></div>
              </div>

              <div style="margin-bottom:14px;">
                <div style="font-weight:700;margin-bottom:6px;">說明</div>
                <div class="hk-info" style="font-size:14px;line-height:1.7;color:#334155;"></div>
              </div>

              <div>
                <div style="font-weight:700;margin-bottom:6px;">圖例</div>
                <div style="font-size:14px;line-height:1.8;color:#334155;">
                  <div><span style="display:inline-block;width:18px;height:0;border-top:3px solid #94a3b8;vertical-align:middle;margin-right:8px;"></span>未匹配邊</div>
                  <div><span style="display:inline-block;width:18px;height:0;border-top:5px solid #16a34a;vertical-align:middle;margin-right:8px;"></span>匹配邊</div>
                  <div><span style="display:inline-block;width:18px;height:0;border-top:5px solid #f59e0b;vertical-align:middle;margin-right:8px;"></span>目前檢查</div>
                  <div><span style="display:inline-block;width:18px;height:0;border-top:5px solid #7c3aed;vertical-align:middle;margin-right:8px;"></span>增廣路徑</div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:16px;">
            <div class="hk-vcr"></div>
          </div>
        </div>
      </div>
    `;

    const svgArea = host.querySelector('.hk-svg-area');
    const matchingTable = host.querySelector('.hk-matching-table');
    const layerTable = host.querySelector('.hk-layer-table');
    const queueBox = host.querySelector('.hk-queue');
    const infoBox = host.querySelector('.hk-info');
    const vcr = host.querySelector('.hk-vcr');
    const issuesBox = host.querySelector('.hk-issues');

    let frames =
  global.GraphHopcroftKarpViz.generateFrames(
    preset.nLeft,
    preset.nRight,
    preset.edges
  ).frames;

    function paint(frame, index) {
      svgArea.innerHTML = renderSvgGraph(frame);
      matchingTable.innerHTML = renderMatchingTable(frame);
      layerTable.innerHTML = renderLayerTable(frame, frame.data.nLeft);
      queueBox.textContent = frame.queue && frame.queue.length ? frame.queue.join(' → ') : '∅';

      infoBox.innerHTML = `
        <div><strong>${frame.title}</strong></div>
        <div style="margin-top:6px;">${frame.message}</div>
        <div style="margin-top:8px;">步驟：${index + 1} / ${frames.length}</div>
        <div>目前匹配大小：${frame.data.matching.length}</div>
        <div>左側頂點數：${frame.data.nLeft}</div>
        <div>右側頂點數：${frame.data.nRight}</div>
        <div>邊數：${frame.data.edges.length}</div>
      `;
    }

    function showIssues(errors, warnings) {
  if (
    errors.length === 0 &&
    warnings.length === 0
  ) {
    issuesBox.style.display = 'none';
    issuesBox.innerHTML = '';
    return;
  }

  issuesBox.style.display = 'block';

  if (errors.length > 0) {
    issuesBox.style.background = '#fef2f2';
    issuesBox.style.border = '1px solid #fecaca';
    issuesBox.style.color = '#991b1b';
  } else {
    issuesBox.style.background = '#fffbeb';
    issuesBox.style.border = '1px solid #fde68a';
    issuesBox.style.color = '#92400e';
  }

  const errorHtml = errors
    .map(msg => `<div>⚠ ${msg}</div>`)
    .join('');

  const warningHtml = warnings
    .map(msg => `<div>• ${msg}</div>`)
    .join('');

  issuesBox.innerHTML =
    errorHtml + warningHtml;
}

    function mountControls() {
      vcr.innerHTML = '';
      vcr.appendChild(
        K().buildFrameControls(frames, paint, {
          runIntervalMs: 1200
        })
      );
      paint(frames[0], 0);
    }

    mountControls();

    host.querySelector('.hk-demo').addEventListener('click', () => {
      const demo = getDifficultySample();

host.querySelector('.hk-left').value =
  String(demo.nLeft);

host.querySelector('.hk-right').value =
  String(demo.nRight);

host.querySelector('.hk-edges').value =
  demo.edges
    .map(([u, v]) => `${u}-${v}`)
    .join(',');
      frames =
  global.GraphHopcroftKarpViz.generateFrames(
    demo.nLeft,
    demo.nRight,
    demo.edges
  ).frames;
      mountControls();
    });

    host.querySelector('.hk-apply').addEventListener('click', () => {
  const leftText =
    host.querySelector('.hk-left').value;

  const rightText =
    host.querySelector('.hk-right').value;

  const edgeText =
    host.querySelector('.hk-edges').value;

  const result =
    validateInput(
      leftText,
      rightText,
      edgeText
    );

  showIssues(
    result.errors,
    result.warnings
  );

  if (!result.valid) {
    return;
  }

  frames =
    global.GraphHopcroftKarpViz.generateFrames(
      result.nLeft,
      result.nRight,
      result.edges
    ).frames;

  mountControls();
});
  }

  global.VizRegistry.attach('graph-hopcroft-karp', {
    render: renderGraphHopcroftKarp,
    code: () =>
      (typeof codeGraphHopcroftKarp !== 'undefined'
        ? codeGraphHopcroftKarp
        : ''),
    layout: {
      host: 'dynamic'
    }
  });

})(typeof window !== 'undefined' ? window : globalThis);