/**
 * 2-3-4 Tree Visualization
 * Chapter 5: Trees
 */
(function () {
  const methodId = 'tree-234';

  class Node234 {
    constructor() {
      this.keys = [];
      this.children = [];
    }
    isLeaf() { return this.children.length === 0; }
    isFull() { return this.keys.length === 3; }
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

    insert(key, recordFrame) {
      if (this.root.isFull()) {
        const oldRoot = this.root;
        const newRoot = new Node234();
        this.root = newRoot;
        newRoot.children.push(oldRoot);
        recordFrame(this.clone(), {
          msgEn: `Root [${oldRoot.keys.join(', ')}] is full. Splitting root.`,
          msgZh: `根節點 [${oldRoot.keys.join(', ')}] 已滿，先進行分裂。`,
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
        msgEn: `Promoted middle key ${middleKey} to parent. Created 2 children.`,
        msgZh: `提升中間鍵值 ${middleKey} 至父節點，分裂為兩個 2-節點。`,
        activeKeys: [middleKey]
      });
    }

    _insertNonFull(node, key, recordFrame) {
      let i = node.keys.length - 1;
      if (node.isLeaf()) {
        node.keys.push(key);
        node.keys.sort((a, b) => a - b);
        recordFrame(this.clone(), {
          msgEn: `Inserted key ${key} into leaf [${node.keys.join(', ')}].`,
          msgZh: `將鍵值 ${key} 插入葉節點 [${node.keys.join(', ')}]。`,
          activeKeys: [key]
        });
        return;
      }

      while (i >= 0 && key < node.keys[i]) i--;
      i++;

      recordFrame(this.clone(), {
        msgEn: `Traversing down to child ${i} for key ${key}.`,
        msgZh: `向下走訪至第 ${i} 個子節點以插入 ${key}。`,
        activeKeys: [node.keys[Math.min(i, node.keys.length - 1)]]
      });

      if (node.children[i].isFull()) {
        this._splitChild(node, i, recordFrame);
        if (key > node.keys[i]) i++;
      }
      this._insertNonFull(node.children[i], key, recordFrame);
    }
  }

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

  function calculatePositions(node, depth = 0, offset = { x: 0 }, levelGap = 80, nodeGap = 20) {
    if (!node) return null;
    const isLeaf = node.isLeaf();
    const childrenLayout = [];

    if (isLeaf) {
      const width = Math.max(1, node.keys.length) * 36 + 16;
      const x = offset.x + width / 2;
      offset.x += width + nodeGap;
      return { node, x, y: depth * levelGap + 40, width, children: [] };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    for (const child of node.children) {
      const cl = calculatePositions(child, depth + 1, offset, levelGap, nodeGap);
      childrenLayout.push(cl);
      minX = Math.min(minX, cl.x);
      maxX = Math.max(maxX, cl.x);
    }

    const width = Math.max(1, node.keys.length) * 36 + 16;
    const x = (minX + maxX) / 2;
    return { node, x, y: depth * levelGap + 40, width, children: childrenLayout };
  }

  function renderTreeSVG(layout, svg, activeKeys) {
    svg.innerHTML = '';
    if (!layout || layout.node.keys.length === 0) return;

    function drawEdges(item) {
      for (const child of item.children) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', item.x);
        line.setAttribute('y1', item.y + 16);
        line.setAttribute('x2', child.x);
        line.setAttribute('y2', child.y - 16);
        line.setAttribute('stroke', 'var(--line-color, #94a3b8)');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
        drawEdges(child);
      }
    }
    drawEdges(layout);

    function drawNodes(item) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const boxW = Math.max(1, item.node.keys.length) * 36 + 8;
      const boxH = 32;
      const startX = item.x - boxW / 2;
      const startY = item.y - boxH / 2;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', startX);
      rect.setAttribute('y', startY);
      rect.setAttribute('width', boxW);
      rect.setAttribute('height', boxH);
      rect.setAttribute('rx', '4');
      rect.setAttribute('fill', 'var(--node-bg, #ffffff)');
      rect.setAttribute('stroke', 'var(--node-border, #334155)');
      rect.setAttribute('stroke-width', '2');
      g.appendChild(rect);

      item.node.keys.forEach((k, idx) => {
        const cellX = startX + 4 + idx * 36;
        const cellRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cellRect.setAttribute('x', cellX);
        cellRect.setAttribute('y', startY + 3);
        cellRect.setAttribute('width', 32);
        cellRect.setAttribute('height', 26);
        cellRect.setAttribute('rx', '3');

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

  VizRegistry.attach(methodId, {
    layout(container) {
      container.innerHTML = `
        <div class="control-row">
          <label>Keys:</label>
          <input type="text" id="tree234-input" class="input-text" value="10, 20, 5, 15, 25, 30, 12, 18" />
          <button id="tree234-build-btn" class="btn btn-primary">Build</button>
        </div>
        <div id="tree234-vcr-container"></div>
        <div id="tree234-status" class="status-box"></div>
        <div class="canvas-box">
          <svg id="tree234-svg" width="900" height="400"></svg>
        </div>
      `;
    },

    code() {
      return (window.CODE_DB && window.CODE_DB['tree_234.cpp']) || '';
    },

    render(container) {
      const inputEl = container.querySelector('#tree234-input');
      const buildBtn = container.querySelector('#tree234-build-btn');
      const statusEl = container.querySelector('#tree234-status');
      const svg = container.querySelector('#tree234-svg');
      const vcrContainer = container.querySelector('#tree234-vcr-container');

      function parseInput() {
        return inputEl.value
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n));
      }

      function paint(frame) {
        if (!frame) return;
        const lang = VizKit?.langOf ? VizKit.langOf() : 'en';
        statusEl.textContent = lang === 'zh' ? frame.msgZh : frame.msgEn;
        const layout = calculatePositions(frame.tree.root, 0, { x: 50 }, 80, 25);
        renderTreeSVG(layout, svg, frame.activeKeys);
      }

      function recompute() {
        const keys = parseInput();
        if (keys.length === 0) return;
        const frames = generateFrames(keys);

        vcrContainer.innerHTML = '';
        if (VizKit && VizKit.buildFrameControls) {
          // 正確簽章：buildFrameControls(frames, paint, opts)
          const ctrl = VizKit.buildFrameControls(frames, paint, { runIntervalMs: 600 });
          vcrContainer.appendChild(ctrl);
        }
        paint(frames[0]);
      }

      buildBtn.addEventListener('click', recompute);
      recompute();
    }
  });
})();