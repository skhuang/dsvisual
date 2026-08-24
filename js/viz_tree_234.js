/**
 * 2-3-4 Tree Visualization
 * Chapter 5: Trees (Self-balancing Multiway Search Tree)
 */
(function () {
  const methodId = 'tree-234';

  // 2-3-4 Tree Data Model
  class Node234 {
    constructor() {
      this.keys = [];      // 1 to 3 keys (sorted)
      this.children = [];  // 0 or (keys.length + 1) children
    }
    isLeaf() {
      return this.children.length === 0;
    }
    isFull() {
      return this.keys.length === 3;
    }
  }

  class Tree234 {
    constructor() {
      this.root = new Node234();
    }

    clone() {
      const copy = new Tree234();
      copy.root = this._cloneNode(this.root);
      return copy;
    }

    _cloneNode(node) {
      if (!node) return null;
      const n = new Node234();
      n.keys = [...node.keys];
      n.children = node.children.map(c => this._cloneNode(c));
      return n;
    }

    // Top-down insertion with proactive splitting
    insert(key, recordFrame) {
      if (this.root.isFull()) {
        const oldRoot = this.root;
        const newRoot = new Node234();
        this.root = newRoot;
        newRoot.children.push(oldRoot);
        recordFrame(this.clone(), {
          msgEn: `Root is full ([${oldRoot.keys.join(', ')}]). Creating new root before split.`,
          msgZh: `根節點已滿 ([${oldRoot.keys.join(', ')}])，建立新根節點準備進行分裂。`,
          activeKeys: [...oldRoot.keys]
        });
        this._splitChild(newRoot, 0, recordFrame);
      }
      this._insertNonFull(this.root, key, recordFrame);
    }

    _splitChild(parent, idx, recordFrame) {
      const fullChild = parent.children[idx];
      const leftChild = new Node234();
      const rightChild = new Node234();

      leftChild.keys = [fullChild.keys[0]];
      const middleKey = fullChild.keys[1];
      rightChild.keys = [fullChild.keys[2]];

      if (!fullChild.isLeaf()) {
        leftChild.children = [fullChild.children[0], fullChild.children[1]];
        rightChild.children = [fullChild.children[2], fullChild.children[3]];
      }

      parent.keys.splice(idx, 0, middleKey);
      parent.children.splice(idx, 1, leftChild, rightChild);

      recordFrame(this.clone(), {
        msgEn: `Split 4-node [${fullChild.keys.join(', ')}]: Promoted middle key ${middleKey} to parent.`,
        msgZh: `分裂 4-節點 [${fullChild.keys.join(', ')}]：中間鍵值 ${middleKey} 提升至父節點。`,
        activeKeys: [middleKey]
      });
    }

    _insertNonFull(node, key, recordFrame) {
      let i = node.keys.length - 1;

      if (node.isLeaf()) {
        node.keys.push(key);
        node.keys.sort((a, b) => a - b);
        recordFrame(this.clone(), {
          msgEn: `Inserted key ${key} into leaf node [${node.keys.join(', ')}].`,
          msgZh: `將鍵值 ${key} 插入葉節點 [${node.keys.join(', ')}]。`,
          activeKeys: [key]
        });
        return;
      }

      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      i++; // target child index

      recordFrame(this.clone(), {
        msgEn: `Traversing down to child ${i} for key ${key}.`,
        msgZh: `搜尋鍵值 ${key}，向下移動至第 ${i} 個子節點。`,
        activeKeys: [node.keys[Math.min(i, node.keys.length - 1)]]
      });

      if (node.children[i].isFull()) {
        this._splitChild(node, i, recordFrame);
        if (key > node.keys[i]) {
          i++;
        }
      }
      this._insertNonFull(node.children[i], key, recordFrame);
    }
  }

  // Pre-generate animation frames
  function generateFrames(keys) {
    const frames = [];
    const tree = new Tree234();

    frames.push({
      tree: tree.clone(),
      msgEn: 'Initial empty 2-3-4 Tree.',
      msgZh: '初始空 2-3-4 樹。',
      activeKeys: []
    });

    for (const k of keys) {
      frames.push({
        tree: tree.clone(),
        msgEn: `Starting insertion of key ${k}...`,
        msgZh: `開始插入鍵值 ${k}...`,
        activeKeys: [k]
      });
      tree.insert(k, (snapshot, info) => {
        frames.push({
          tree: snapshot,
          msgEn: info.msgEn,
          msgZh: info.msgZh,
          activeKeys: info.activeKeys || []
        });
      });
    }
    return frames;
  }

  // Layout & Tree Rendering Calculation
  function calculatePositions(node, depth = 0, offset = { x: 0 }, levelGap = 80, nodeGap = 20) {
    if (!node) return null;
    const isLeaf = node.isLeaf();
    const childrenLayout = [];

    if (isLeaf) {
      const width = node.keys.length * 36 + 16;
      const x = offset.x + width / 2;
      offset.x += width + nodeGap;
      return { node, x, y: depth * levelGap + 50, width, children: [] };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    for (const child of node.children) {
      const cl = calculatePositions(child, depth + 1, offset, levelGap, nodeGap);
      childrenLayout.push(cl);
      minX = Math.min(minX, cl.x);
      maxX = Math.max(maxX, cl.x);
    }

    const width = node.keys.length * 36 + 16;
    const x = (minX + maxX) / 2;
    return { node, x, y: depth * levelGap + 50, width, children: childrenLayout };
  }

  function renderTreeSVG(layout, svg, activeKeys, currentLang) {
    svg.innerHTML = '';
    if (!layout || layout.node.keys.length === 0) return;

    // Draw Edges
    function drawEdges(item) {
      for (const child of item.children) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', item.x);
        line.setAttribute('y1', item.y + 16);
        line.setAttribute('x2', child.x);
        line.setAttribute('y2', child.y - 16);
        line.setAttribute('stroke', '#94a3b8');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
        drawEdges(child);
      }
    }
    drawEdges(layout);

    // Draw Nodes & Keys
    function drawNodes(item) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const boxW = item.node.keys.length * 36 + 8;
      const boxH = 32;
      const startX = item.x - boxW / 2;
      const startY = item.y - boxH / 2;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', startX);
      rect.setAttribute('y', startY);
      rect.setAttribute('width', boxW);
      rect.setAttribute('height', boxH);
      rect.setAttribute('rx', '6');
      rect.setAttribute('fill', '#ffffff');
      rect.setAttribute('stroke', '#334155');
      rect.setAttribute('stroke-width', '2');
      g.appendChild(rect);

      item.node.keys.forEach((k, idx) => {
        const cellX = startX + 4 + idx * 36;
        const cellRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cellRect.setAttribute('x', cellX);
        cellRect.setAttribute('y', startY + 3);
        cellRect.setAttribute('width', 32);
        cellRect.setAttribute('height', 26);
        cellRect.setAttribute('rx', '4');

        const isActive = activeKeys.includes(k);
        cellRect.setAttribute('fill', isActive ? '#fed7aa' : '#f1f5f9');
        cellRect.setAttribute('stroke', isActive ? '#f97316' : '#cbd5e1');
        cellRect.setAttribute('stroke-width', '1.5');
        g.appendChild(cellRect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', cellX + 16);
        text.setAttribute('y', startY + 20);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '13');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#1e293b');
        text.textContent = k;
        g.appendChild(text);
      });

      svg.appendChild(g);
      item.children.forEach(drawNodes);
    }
    drawNodes(layout);
  }

  // VizRegistry Integration
  VizRegistry.attach(methodId, {
    layout(container) {
      container.innerHTML = `
        <div class="viz-control-panel flex flex-wrap gap-2 items-center mb-4">
          <label class="text-sm font-medium" data-i18n="input_label">Keys:</label>
          <input type="text" id="tree234-input" class="border px-2 py-1 rounded text-sm w-56" value="10, 20, 5, 15, 25, 30, 12, 18" />
          <select id="tree234-difficulty" class="border px-2 py-1 rounded text-sm">
            <option value="basic">Standard (Basic)</option>
            <option value="splits">Frequent Splits (Advanced)</option>
          </select>
          <button id="tree234-build-btn" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Build Tree</button>
        </div>
        <div id="tree234-vcr-container" class="mb-3"></div>
        <div id="tree234-status" class="text-sm text-slate-700 font-medium mb-2 p-2 bg-slate-100 rounded border border-slate-200"></div>
        <div class="viz-canvas-container overflow-auto border rounded bg-white p-4" style="min-height: 380px;">
          <svg id="tree234-svg" width="900" height="400"></svg>
        </div>
      `;
    },

    render(container) {
      const inputEl = container.querySelector('#tree234-input');
      const diffSelect = container.querySelector('#tree234-difficulty');
      const buildBtn = container.querySelector('#tree234-build-btn');
      const statusEl = container.querySelector('#tree234-status');
      const svg = container.querySelector('#tree234-svg');
      const vcrContainer = container.querySelector('#tree234-vcr-container');

      let currentFrameIdx = 0;
      let frames = [];

      function parseInput() {
        return inputEl.value
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n));
      }

      function updateView(idx) {
        if (!frames || frames.length === 0) return;
        currentFrameIdx = Math.max(0, Math.min(idx, frames.length - 1));
        const frame = frames[currentFrameIdx];

        const lang = VizKit?.langOf ? VizKit.langOf() : 'en';
        statusEl.textContent = lang === 'zh' ? frame.msgZh : frame.msgEn;

        const layout = calculatePositions(frame.tree.root, 0, { x: 50 }, 80, 25);
        renderTreeSVG(layout, svg, frame.activeKeys, lang);
      }

      function recompute() {
        const keys = parseInput();
        if (keys.length === 0) {
          statusEl.textContent = 'Please enter valid numbers.';
          return;
        }
        frames = generateFrames(keys);
        currentFrameIdx = 0;

        // VCR Step Controls
        if (VizKit && VizKit.buildFrameControls) {
          vcrContainer.innerHTML = '';
          vcrContainer.appendChild(
            VizKit.buildFrameControls({
              totalFrames: frames.length,
              getFrame: () => currentFrameIdx,
              setFrame: (idx) => updateView(idx),
              isPlaying: false
            })
          );
        }
        updateView(0);
      }

      diffSelect.addEventListener('change', () => {
        if (diffSelect.value === 'basic') {
          inputEl.value = '10, 20, 5, 15, 25, 30, 12, 18';
        } else {
          inputEl.value = '10, 20, 30, 40, 50, 60, 70, 80';
        }
        recompute();
      });

      buildBtn.addEventListener('click', recompute);
      recompute();
    }
  });
})();