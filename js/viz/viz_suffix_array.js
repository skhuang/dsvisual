(function () {
  // 計算 Suffix Array (O(N^2 log N) 簡化實作，適合教學視覺化展示)
  function buildSA(s) {
    const n = s.length;
    const suffixes = [];
    for (let i = 0; i < n; i++) {
      suffixes.push({ index: i, text: s.slice(i) });
    }
    suffixes.sort((a, b) => a.text.localeCompare(b.text));
    
    const sa = suffixes.map(item => item.index);
    const rank = new Array(n);
    for (let i = 0; i < n; i++) {
      rank[sa[i]] = i;
    }
    return { sa, rank, suffixes };
  }

  // 利用 Kasai 演算法計算 LCP 陣列 (O(N))
  function buildLCP(s, sa, rank) {
    const n = s.length;
    const lcp = new Array(n).fill(0);
    let k = 0;
    
    const steps = []; // 用於紀錄每一步動畫的 state
    
    for (let i = 0; i < n; i++) {
      if (rank[i] === 0) {
        k = 0;
        steps.push({
          currentI: i,
          rankI: 0,
          compareSAIndex: -1,
          k: 0,
          lcp: [...lcp],
          desc: `Suffix "${s.slice(i)}" 是字典序最小的後綴，LCP[0] 設為 0。`
        });
        continue;
      }
      
      const j = sa[rank[i] - 1]; // 前一個字典序的後綴起點
      while (i + k < n && j + k < n && s[i + k] === s[j + k]) {
        k++;
      }
      
      lcp[rank[i]] = k;
      
      steps.push({
        currentI: i,
        rankI: rank[i],
        compareSAIndex: rank[i] - 1,
        k: k,
        lcp: [...lcp],
        desc: `比較 SA[${rank[i]}] ("${s.slice(i)}") 與 SA[${rank[i] - 1}] ("${s.slice(j)}")，最長公共前綴長度為 ${k}。`
      });
      
      if (k > 0) k--;
    }
    return { lcp, steps };
  }

  // 渲染表格與高亮狀態
  function renderFrame(container, text, sa, steps, frameIdx) {
    const step = steps[Math.min(frameIdx, steps.length - 1)];
    
    let html = `
      <div style="font-family: monospace; padding: 10px;">
        <p><strong>輸入字串：</strong> <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${text}</span></p>
        <p><strong>當前步驟：</strong> ${step.desc}</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; text-align: center;">
          <thead style="background: #f1f5f9;">
            <tr>
              <th>i (Rank)</th>
              <th>SA[i] (Suffix Index)</th>
              <th>LCP[i]</th>
              <th>Suffix (後綴內容)</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (let i = 0; i < sa.length; i++) {
      const isCurrent = (i === step.rankI);
      const isCompared = (i === step.compareSAIndex);
      
      let rowStyle = '';
      if (isCurrent) rowStyle = 'background-color: #fef08a; font-weight: bold;'; // 黃色高亮當前
      else if (isCompared) rowStyle = 'background-color: #fed7aa;'; // 橘色高亮比較項

      const suffixStr = text.slice(sa[i]);
      const lcpVal = step.lcp[i] !== undefined ? step.lcp[i] : 0;

      html += `
        <tr style="${rowStyle}">
          <td>${i}</td>
          <td>${sa[i]}</td>
          <td>${lcpVal}</td>
          <td style="text-align: left; padding-left: 15px;">${suffixStr}</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  VizRegistry.attach('suffix-array', {
    render: function (container, data) {
      const text = (data && data.input) ? data.input : "banana$";
      const { sa, rank } = buildSA(text);
      const { lcp, steps } = buildLCP(text, sa, rank);

      let currentFrame = 0;

      // 建立畫布與控制列容器
      container.innerHTML = `
        <div id="sa-viz-display"></div>
        <div id="sa-viz-controls" style="margin-top: 15px;"></div>
      `;

      const displayEl = container.querySelector('#sa-viz-display');
      const controlsEl = container.querySelector('#sa-viz-controls');

      // 初始化第一幀
      renderFrame(displayEl, text, sa, steps, 0);

      // 整合 VizKit VCR 播放控制條
      if (typeof VizKit !== 'undefined' && VizKit.buildFrameControls) {
        VizKit.buildFrameControls(controlsEl, {
          totalFrames: steps.length,
          onFrameChange: function (frameIndex) {
            currentFrame = frameIndex;
            renderFrame(displayEl, text, sa, steps, currentFrame);
          }
        });
      }
    },

    code: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

// 建立 Suffix Array 與 LCP 陣列 (Kasai 演算法)
void buildSAAndLCP(const string& s) {
    int n = s.length();
    vector<int> sa(n), rank(n), lcp(n, 0);

    // 1. 建立後綴與排序
    vector<pair<string, int>> suffixes(n);
    for (int i = 0; i < n; i++) suffixes[i] = {s.substr(i), i};
    sort(suffixes.begin(), suffixes.end());

    for (int i = 0; i < n; i++) {
        sa[i] = suffixes[i].second;
        rank[sa[i]] = i;
    }

    // 2. Kasai 演算法計算 LCP
    int k = 0;
    for (int i = 0; i < n; i++) {
        if (rank[i] == 0) {
            k = 0;
            continue;
        }
        int j = sa[rank[i] - 1];
        while (i + k < n && j + k < n && s[i + k] == s[j + k]) k++;
        lcp[rank[i]] = k;
        if (k > 0) k--;
    }
}`,

    layout: 'default'
  });
})();