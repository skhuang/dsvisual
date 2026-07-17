(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  let heapEventTimer = null;
  let heapIsMin = true;
  const heapModels = {
    'heap-binary': HeapModels.createHeapModel('heap-binary', heapIsMin),
    'heap-binomial': HeapModels.createHeapModel('heap-binomial', heapIsMin),
    'heap-fibonacci': HeapModels.createHeapModel('heap-fibonacci', heapIsMin),
    'heap-leftist': HeapModels.createHeapModel('heap-leftist', heapIsMin),
    'heap-skew': HeapModels.createHeapModel('heap-skew', heapIsMin),
    'heap-dary': HeapModels.createHeapModel('heap-dary', heapIsMin),
    'heap-pairing': HeapModels.createHeapModel('heap-pairing', heapIsMin),
  };
  const heapTutorialProfiles = {
    'heap-binary': {
        name: 'Binary Heap',
        intro: 'Watch the complete-tree shape and how a smaller key bubbles to the root.',
        merge: 'Merge a second batch to rebuild the complete tree without losing heap order.',
        change: 'Change a deeper key so you can see heapify restore the root choice.',
        extract: 'Extract the root and observe the last node move up before reheapifying.',
        stats: 'Check the size summary after the tree has been reshaped.'
    },
    'heap-binomial': {
        name: 'Binomial Heap',
        intro: 'Notice how inserts create a forest of degree-labelled trees instead of one fixed shape.',
        merge: 'Merging here should trigger tree linking by equal degree.',
        change: 'A key change can bubble through one binomial tree without touching the others.',
        extract: 'Extracting the root should expose children that rejoin the forest.',
        stats: 'The stats readout highlights the current mix of tree degrees.'
    },
    'heap-fibonacci': {
        name: 'Fibonacci Heap',
        intro: 'Use the root list to see how lazy structure differs from a strict binary tree.',
        merge: 'A merge is cheap here, so focus on the expanded root list before consolidation.',
        change: 'Changing a key is where cut-style behavior becomes easier to explain.',
        extract: 'Extraction is the moment consolidation reorganizes the root list.',
        stats: 'Stats give a quick summary of how deep the current forest can grow.'
    },
    'heap-leftist': {
        name: 'Leftist Heap',
        intro: 'Watch the null-path-length badges while the heap keeps the heavier spine on the left.',
        merge: 'Leftist heaps are merge-first structures, so this step is the core operation.',
        change: 'Changing a key helps show how the merge-based structure adapts.',
        extract: 'Extracting the root merges the left and right subheaps back together.',
        stats: 'Use stats after the merge-heavy steps to confirm the heap size.'
    },
    'heap-skew': {
        name: 'Skew Heap',
        intro: 'This heap self-adjusts by swapping children aggressively after melds.',
        merge: 'A merge demonstrates the self-adjusting nature of skew heaps immediately.',
        change: 'Changing a key gives the next meld a chance to rebalance the shape.',
        extract: 'Extraction melds the two top subtrees back together.',
        stats: 'Stats are a quick checkpoint after the self-adjusting operations.'
    },
    'heap-dary': {
        name: '4-ary Heap',
        intro: 'The wider branching factor trades more children per node for fewer levels.',
        merge: 'After merging, compare the shallower 4-ary layout against the binary version.',
        change: 'A key change still bubbles up, but across a wider parent-child fanout.',
        extract: 'Extraction should keep the heap shallow even as the root is replaced.',
        stats: 'The stats panel calls out the fixed arity and estimated level count.'
    },
    'heap-pairing': {
        name: 'Pairing Heap',
        intro: 'Pairing heaps organize around repeated melds, so follow the root and its children.',
        merge: 'This merge step is really a meld showcase for the pairing heap.',
        change: 'Changing a key prepares the next meld to rearrange the frontier.',
        extract: 'Extraction triggers pairwise passes over the root children.',
        stats: 'Stats summarize the rough amount of pair meld work happening in the tree.'
    }
  };
  let heapTutorialState = { active: false, mode: null, name: '', steps: [], stepIndex: 0, completed: false };

  let dom = null; // { heapContainer, heapEdges, heapNodesContainer, heapOrderSelect, heapValInput, heapExtraInput, btnHeap*, heapTutorial* }

  function clearHeapEventMarks() {
      if (heapEventTimer) {
          clearTimeout(heapEventTimer);
          heapEventTimer = null;
      }
      const classes = ['active', 'swap', 'cut', 'link', 'consolidate'];
      dom.heapNodesContainer.querySelectorAll('.heap-node').forEach(node => {
          classes.forEach(cls => node.classList.remove(cls));
      });
  }

  function getActiveHeapModel() {
      return heapModels[C().getMode()] || null;
  }

  function resetHeapModels() {
      Object.values(heapModels).forEach(m => {
          m.clear();
          m.setOrder(heapIsMin);
      });
      clearHeapEventMarks();
  }

  function setHeapComparator(isMin) {
      heapIsMin = isMin;
      dom.heapOrderSelect.value = heapIsMin ? 'min' : 'max';
      Object.values(heapModels).forEach(m => m.setOrder(heapIsMin));
  }

  function buildHeapTutorial(mode) {
      const profile = heapTutorialProfiles[mode];
      if (!profile) return null;
      return {
          name: profile.name,
          steps: [
              {
                  title: 'Create the first root',
                  text: 'Insert 12 to seed the ' + profile.name + '. ' + profile.intro,
                  action: 'insert',
                  value: '12',
                  extra: '',
                  focusIds: ['heap-val', 'btn-heap-insert', 'heap-container']
              },
              {
                  title: 'Bubble up a better key',
                  text: 'Insert 7 and compare how the active root changes.',
                  action: 'insert',
                  value: '7',
                  extra: '',
                  focusIds: ['heap-val', 'btn-heap-insert', 'heap-container']
              },
              {
                  title: 'Add a third value',
                  text: 'Insert 19 so the heap now has enough structure to inspect.',
                  action: 'insert',
                  value: '19',
                  extra: '',
                  focusIds: ['heap-val', 'btn-heap-insert', 'heap-container']
              },
              {
                  title: 'Inspect the current root',
                  text: 'Use Peek() to confirm which value is currently at the frontier.',
                  action: 'peek',
                  focusIds: ['btn-heap-peek', 'heap-container']
              },
              {
                  title: 'Merge another heap',
                  text: profile.merge,
                  action: 'merge',
                  extra: '3,8,15',
                  expectedValues: [3, 8, 15],
                  focusIds: ['heap-extra', 'btn-heap-merge', 'heap-container']
              },
              {
                  title: 'Change one key',
                  text: profile.change,
                  action: 'change',
                  value: '19',
                  extra: '5',
                  focusIds: ['heap-val', 'heap-extra', 'btn-heap-change', 'heap-container']
              },
              {
                  title: 'Extract the root',
                  text: profile.extract,
                  action: 'extract',
                  focusIds: ['btn-heap-extract', 'heap-container']
              },
              {
                  title: 'Read the summary',
                  text: profile.stats,
                  action: 'stats',
                  focusIds: ['btn-heap-stats']
              }
          ]
      };
  }

  function clearHeapTutorialFocus() {
      document.querySelectorAll('.tutorial-focus').forEach(el => el.classList.remove('tutorial-focus'));
  }

  function syncHeapTutorialChrome() {
      const t = K().t;
      const activeForMode = heapTutorialState.active && C().getMode() === heapTutorialState.mode;
      dom.btnHeapTutorial.textContent = activeForMode ? t('tutorial.restart') : t('tutorial.start');
      dom.heapContainer.classList.toggle('tutorial-active', activeForMode);
      if (!activeForMode) {
          dom.heapTutorialPanel.classList.add('hidden');
          clearHeapTutorialFocus();
      }
      dom.btnHeapTutorialNext.disabled = animState !== 'idle' || !activeForMode || heapTutorialState.completed;
      dom.btnHeapTutorialRestart.disabled = animState !== 'idle' || !activeForMode;
      dom.btnHeapTutorialExit.disabled = animState !== 'idle' || !activeForMode;
  }

  function renderHeapTutorialPanel() {
      const t = K().t;
      const activeForMode = heapTutorialState.active && C().getMode() === heapTutorialState.mode;
      if (!activeForMode) {
          syncHeapTutorialChrome();
          return;
      }

      clearHeapTutorialFocus();
      dom.heapTutorialPanel.classList.remove('hidden');
      dom.heapTutorialMode.textContent = heapTutorialState.name;

      if (heapTutorialState.completed) {
          dom.heapTutorialProgress.textContent = t('tutorial.completed');
          dom.heapTutorialTitle.textContent = t('tutorial.complete-title', { name: heapTutorialState.name });
          dom.heapTutorialText.textContent = t('tutorial.complete-text');
          syncHeapTutorialChrome();
          return;
      }

      const step = heapTutorialState.steps[heapTutorialState.stepIndex];
      dom.heapTutorialProgress.textContent = t('tutorial.progress', {
          n: heapTutorialState.stepIndex + 1,
          total: heapTutorialState.steps.length,
      });
      dom.heapTutorialTitle.textContent = step.title;
      dom.heapTutorialText.textContent = step.text;

      if (Object.prototype.hasOwnProperty.call(step, 'value')) dom.heapValInput.value = step.value;
      if (Object.prototype.hasOwnProperty.call(step, 'extra')) dom.heapExtraInput.value = step.extra;

      (step.focusIds || []).forEach(id => document.getElementById(id)?.classList.add('tutorial-focus'));
      syncHeapTutorialChrome();
  }

  function startHeapTutorial() {
      const currentMode = C().getMode();
      const showStatus = K().showStatus;
      if (!currentMode.includes('heap-')) return;
      const tutorial = buildHeapTutorial(currentMode);
      const model = getActiveHeapModel();
      if (!tutorial || !model) return;
      setHeapComparator(true);
      model.clear();
      clearHeapEventMarks();
      renderHeap();
      heapTutorialState = {
          active: true,
          mode: currentMode,
          name: tutorial.name,
          steps: tutorial.steps,
          stepIndex: 0,
          completed: false,
      };
      renderHeapTutorialPanel();
      showStatus('Tutorial ready: ' + tutorial.name, '#fbbf24');
  }

  function exitHeapTutorial(preserveStatus = false) {
      const showStatus = K().showStatus;
      const wasActive = heapTutorialState.active;
      heapTutorialState = { active: false, mode: null, name: '', steps: [], stepIndex: 0, completed: false };
      syncHeapTutorialChrome();
      if (wasActive && !preserveStatus) showStatus('Heap tutorial closed.', '#94a3b8');
  }

  function advanceHeapTutorial() {
      if (!heapTutorialState.active || heapTutorialState.completed) return;
      if (heapTutorialState.stepIndex >= heapTutorialState.steps.length - 1) {
          heapTutorialState.completed = true;
      } else {
          heapTutorialState.stepIndex += 1;
      }
      renderHeapTutorialPanel();
  }

  function maybeAdvanceHeapTutorial(action, detail = {}) {
      const currentMode = C().getMode();
      if (!heapTutorialState.active || heapTutorialState.completed || currentMode !== heapTutorialState.mode) return;
      const step = heapTutorialState.steps[heapTutorialState.stepIndex];
      if (!step || step.action !== action) return;
      if (action === 'insert' && detail.value !== Number(step.value)) return;
      if (action === 'merge') {
          const expected = step.expectedValues || [];
          if (expected.length !== (detail.values || []).length) return;
          if (!expected.every((value, index) => value === detail.values[index])) return;
      }
      if (action === 'change' && (detail.oldValue !== Number(step.value) || detail.newValue !== Number(step.extra))) return;
      advanceHeapTutorial();
  }

  function eventToClass(type) {
      if (type === 'SWAP' || type === 'SWAP_CHILDREN') return 'swap';
      if (type === 'CUT') return 'cut';
      if (type === 'MARK') return 'cut';
      if (type === 'LINK' || type === 'MERGE_START' || type === 'MERGE_DEGREE' || type === 'PAIR_MELD') return 'link';
      if (type === 'CONSOLIDATE') return 'consolidate';
      return 'active';
  }

  async function animateHeapEvents(events) {
      if (!events || !events.length) return;
      for (const ev of events) {
          if (animState === 'stopped') throw 'STOPPED';
          clearHeapEventMarks();
          const cls = eventToClass(ev.type);
          const ids = [];
          if (typeof ev.index === 'number') ids.push('h-' + ev.index);
          if (typeof ev.a === 'number') ids.push('h-' + ev.a);
          if (typeof ev.b === 'number') ids.push('h-' + ev.b);
          ids.forEach(id => {
              const n = document.getElementById(id);
              if (n) n.classList.add(cls);
          });
          await sleep(Math.max(120, Math.floor(K().getDelay() / 2)));
      }
      clearHeapEventMarks();
  }

  function renderHeap() {
      const model = getActiveHeapModel();
      if (!model) return;

      const snap = model.snapshot();
      dom.heapNodesContainer.innerHTML = '';
      dom.heapEdges.innerHTML = '';

      const positionById = {};
      const heapMode = C().getMode();
      const heapContainer = dom.heapContainer;
      const heapEdges = dom.heapEdges;
      const heapNodesContainer = dom.heapNodesContainer;

      if (snap.kind === 'tree') {
          // Binary, Leftist, Skew: complete binary tree layout
          snap.nodes.forEach((node, i) => {
              const level = Math.floor(Math.log2(i + 1));
              const first = Math.pow(2, level) - 1;
              const posInLevel = i - first;
              const count = Math.pow(2, level);
              const x = ((posInLevel + 1) / (count + 1)) * heapContainer.clientWidth;
              const y = 42 + level * 62;
              positionById[node.id] = { x, y };
          });
      } else if (snap.kind === 'd-ary') {
          const arity = snap.arity || 4;
          let levelStart = 0;
          let levelCount = 1;
          let level = 0;

          snap.nodes.forEach((node, index) => {
              while (index >= levelStart + levelCount) {
                  levelStart += levelCount;
                  levelCount *= arity;
                  level++;
              }
              const posInLevel = index - levelStart;
              const x = ((posInLevel + 1) / (levelCount + 1)) * heapContainer.clientWidth;
              const y = 42 + level * 62;
              positionById[node.id] = { x, y };
          });
      } else if (heapMode === 'heap-binomial') {
          // Enhanced Binomial heap layout: group by degree
          const trees = [];
          snap.roots.forEach((rootId, idx) => {
              const degree = idx;
              const treeSize = Math.pow(2, degree);
              trees.push({ id: rootId, degree, size: treeSize });
          });

          let xOffset = 20;
          trees.forEach((tree) => {
              const treeWidth = Math.min(tree.size * 35, 120);
              const treeCenterX = xOffset + treeWidth / 2;

              // Layout tree using BFS
              const queue = [{ id: tree.id, level: 0, x: treeCenterX }];
              const visited = new Set();

              while (queue.length > 0) {
                  const { id, level, x } = queue.shift();
                  if (visited.has(id)) continue;
                  visited.add(id);

                  const nodeIdx = parseInt(id.replace('h-', ''));
                  const y = 48 + level * 60;
                  positionById[id] = { x, y };

                  const left = 2 * nodeIdx + 1;
                  const right = 2 * nodeIdx + 2;
                  if (left < snap.nodes.length) {
                      const childX = x - (treeWidth / Math.pow(2, level + 2));
                      queue.push({ id: 'h-' + left, level: level + 1, x: childX });
                  }
                  if (right < snap.nodes.length) {
                      const childX = x + (treeWidth / Math.pow(2, level + 2));
                      queue.push({ id: 'h-' + right, level: level + 1, x: childX });
                  }
              }

              xOffset += treeWidth + 30;
          });

          // Fallback for disconnected nodes
          snap.nodes.forEach((node, i) => {
              if (!positionById[node.id]) {
                  const col = i % 5;
                  positionById[node.id] = {
                      x: 40 + col * ((heapContainer.clientWidth - 80) / 4),
                      y: 200,
                  };
              }
          });
      } else if (heapMode === 'heap-fibonacci') {
          // Enhanced Fibonacci heap: root list at top, cut trees below
          const roots = snap.roots;
          const rootCount = roots.length;
          const rootSpacing = heapContainer.clientWidth / (rootCount + 1);

          roots.forEach((rootId, ridx) => {
              const rootX = (ridx + 1) * rootSpacing;
              const rootY = 40;
              positionById[rootId] = { x: rootX, y: rootY };

              // Layout subtree rooted at this root
              const queue = [{ id: rootId, level: 0, x: rootX }];
              const visited = new Set([rootId]);

              while (queue.length > 0) {
                  const { id, level, x } = queue.shift();
                  const nodeIdx = parseInt(id.replace('h-', ''));

                  const y = rootY + 60 + level * 55;
                  positionById[id] = { x, y };

                  const left = 2 * nodeIdx + 1;
                  const right = 2 * nodeIdx + 2;
                  const childSpread = 50 / Math.pow(1.5, level);

                  if (left < snap.nodes.length && !visited.has('h-' + left)) {
                      visited.add('h-' + left);
                      queue.push({ id: 'h-' + left, level: level + 1, x: x - childSpread });
                  }
                  if (right < snap.nodes.length && !visited.has('h-' + right)) {
                      visited.add('h-' + right);
                      queue.push({ id: 'h-' + right, level: level + 1, x: x + childSpread });
                  }
              }
          });
      } else if (snap.kind === 'pairing') {
          const childrenById = {};
          snap.edges.forEach(edge => {
              if (!childrenById[edge.from]) childrenById[edge.from] = [];
              childrenById[edge.from].push(edge.to);
          });

          const layoutPairing = (nodeId, depth, left, right) => {
              const x = (left + right) / 2;
              const y = 42 + depth * 68;
              positionById[nodeId] = { x, y };
              const children = childrenById[nodeId] || [];
              if (!children.length) return;
              const segment = (right - left) / children.length;
              children.forEach((childId, childIndex) => {
                  const childLeft = left + childIndex * segment;
                  const childRight = childLeft + segment;
                  layoutPairing(childId, depth + 1, childLeft + 8, childRight - 8);
              });
          };

          if (snap.roots.length) layoutPairing(snap.roots[0], 0, 24, heapContainer.clientWidth - 24);
      } else {
          // Fallback forest layout
          const roots = snap.roots || [];
          roots.forEach((rootId, ridx) => {
              const rootX = ((ridx + 1) / (roots.length + 1)) * heapContainer.clientWidth;
              const rootY = 48;
              positionById[rootId] = { x: rootX, y: rootY };

              const rootIndex = parseInt(rootId.replace('h-', ''), 10);
              const left = 2 * rootIndex + 1;
              const right = 2 * rootIndex + 2;
              if (left < snap.nodes.length) positionById['h-' + left] = { x: rootX - 35, y: 110 };
              if (right < snap.nodes.length) positionById['h-' + right] = { x: rootX + 35, y: 110 };
          });

          snap.nodes.forEach((node, i) => {
              if (!positionById[node.id]) {
                  const row = 3 + Math.floor(i / 6);
                  const col = i % 6;
                  positionById[node.id] = {
                      x: 40 + col * ((heapContainer.clientWidth - 80) / 5),
                      y: 90 + row * 55,
                  };
              }
          });
      }

      snap.edges.forEach(edge => {
          const from = positionById[edge.from];
          const to = positionById[edge.to];
          if (!from || !to) return;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', from.x);
          line.setAttribute('y1', from.y);
          line.setAttribute('x2', to.x);
          line.setAttribute('y2', to.y);
          line.setAttribute('class', 'heap-edge');
          heapEdges.appendChild(line);
      });

      snap.nodes.forEach((node, idx) => {
          const pos = positionById[node.id];
          if (!pos) return;
          const el = document.createElement('div');
          el.id = node.id;
          let className = 'heap-node';
          if (node.root) className += ' root';
          if (node.npl !== null) className += ' npl';
          if (heapMode === 'heap-binomial' && node.root) className += ' degree';
          if (heapMode === 'heap-dary') className += ' dary';
          if (heapMode === 'heap-pairing') className += ' pairing';
          if (node.marked) className += ' marked';
          el.className = className;

          if (node.npl !== null) el.setAttribute('data-npl', node.npl);
          if (heapMode === 'heap-binomial' && node.root) {
              const rootIdx = snap.roots.indexOf(node.id);
              if (rootIdx >= 0) el.setAttribute('data-degree', 'B' + rootIdx);
          }
          if (heapMode === 'heap-dary' && node.root) el.setAttribute('data-degree', '4-ary');

          el.textContent = node.value;
          el.style.left = pos.x + 'px';
          el.style.top = pos.y + 'px';
          heapNodesContainer.appendChild(el);
      });
      renderHeapTutorialPanel();
  }

  function onModeSwitch(mode) {
      if (heapTutorialState.active && mode !== heapTutorialState.mode) exitHeapTutorial(true);
      if (mode.includes('heap-')) {
          dom.heapOrderSelect.value = heapIsMin ? 'min' : 'max';
          clearHeapEventMarks();
          heapModels[mode].clear();
          heapModels[mode].setOrder(heapIsMin);
      }
  }

  function init() {
      dom = {
          heapContainer: document.getElementById('heap-container'),
          heapEdges: document.getElementById('heap-edges'),
          heapNodesContainer: document.getElementById('heap-nodes-container'),
          heapOrderSelect: document.getElementById('heap-order'),
          heapValInput: document.getElementById('heap-val'),
          heapExtraInput: document.getElementById('heap-extra'),
          btnHeapInsert: document.getElementById('btn-heap-insert'),
          btnHeapPeek: document.getElementById('btn-heap-peek'),
          btnHeapExtract: document.getElementById('btn-heap-extract'),
          btnHeapMerge: document.getElementById('btn-heap-merge'),
          btnHeapChange: document.getElementById('btn-heap-change'),
          btnHeapDelete: document.getElementById('btn-heap-delete'),
          btnHeapFindMin: document.getElementById('btn-heap-find-min'),
          btnHeapStats: document.getElementById('btn-heap-stats'),
          btnHeapTutorial: document.getElementById('btn-heap-tutorial'),
          heapTutorialPanel: document.getElementById('heap-tutorial-panel'),
          heapTutorialMode: document.getElementById('heap-tutorial-mode'),
          heapTutorialProgress: document.getElementById('heap-tutorial-progress'),
          heapTutorialTitle: document.getElementById('heap-tutorial-title'),
          heapTutorialText: document.getElementById('heap-tutorial-text'),
          btnHeapTutorialNext: document.getElementById('btn-heap-tutorial-next'),
          btnHeapTutorialRestart: document.getElementById('btn-heap-tutorial-restart'),
          btnHeapTutorialExit: document.getElementById('btn-heap-tutorial-exit'),
      };

      dom.heapOrderSelect.addEventListener('change', () => {
          const currentMode = C().getMode();
          const showStatus = K().showStatus;
          setHeapComparator(dom.heapOrderSelect.value === 'min');
          if (currentMode.includes('heap-')) {
              renderHeap();
              renderHeapTutorialPanel();
              showStatus('Comparator switched to ' + (heapIsMin ? 'Min-Heap' : 'Max-Heap'), '#60a5fa');
          }
      });

      dom.btnHeapInsert.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          const val = parseInt(dom.heapValInput.value);
          if (!model || isNaN(val)) return showStatus('Enter a valid heap value.', '#f87171');
          K().executeAnimWrapper(async () => {
              const out = model.insert(val);
              renderHeap();
              await animateHeapEvents(out.events);
              showStatus('Inserted ' + val, '#34d399');
              maybeAdvanceHeapTutorial('insert', { value: val });
              return '__KEEP_STATUS__';
          });
      });

      dom.btnHeapPeek.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          if (!model) return;
          const out = model.peek();
          if (!out.ok) return showStatus(out.error, '#f87171');
          renderHeap();
          showStatus('Peek = ' + out.value, '#fbbf24');
          maybeAdvanceHeapTutorial('peek', { value: out.value });
      });

      dom.btnHeapExtract.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          if (!model) return;
          K().executeAnimWrapper(async () => {
              const out = model.extract();
              if (!out.ok) return showStatus(out.error, '#f87171');
              renderHeap();
              await animateHeapEvents(out.events);
              showStatus('Extracted ' + out.value, '#ec4899');
              maybeAdvanceHeapTutorial('extract', { value: out.value });
              return '__KEEP_STATUS__';
          });
      });

      dom.btnHeapMerge.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          const source = dom.heapExtraInput.value.trim();
          if (!model || !source) return showStatus('Set extra values: e.g. 9,4,15', '#f87171');
          const values = source.split(/[,\s]+/).map(v => parseInt(v)).filter(v => !isNaN(v));
          K().executeAnimWrapper(async () => {
              const out = model.merge(values);
              if (!out.ok) return showStatus(out.error, '#f87171');
              renderHeap();
              await animateHeapEvents(out.events);
              showStatus('Merged ' + values.length + ' values', '#34d399');
              maybeAdvanceHeapTutorial('merge', { values });
              return '__KEEP_STATUS__';
          });
      });

      dom.btnHeapChange.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          const oldVal = parseInt(dom.heapValInput.value);
          const newVal = parseInt(dom.heapExtraInput.value);
          if (!model || isNaN(oldVal) || isNaN(newVal)) return showStatus('Provide old value + new value.', '#f87171');
          K().executeAnimWrapper(async () => {
              const out = model.changeKey(oldVal, newVal);
              if (!out.ok) return showStatus(out.error, '#f87171');
              renderHeap();
              await animateHeapEvents(out.events);
              showStatus('Key changed: ' + oldVal + ' -> ' + newVal, '#34d399');
              maybeAdvanceHeapTutorial('change', { oldValue: oldVal, newValue: newVal });
              return '__KEEP_STATUS__';
          });
      });

      dom.btnHeapDelete.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          const val = parseInt(dom.heapValInput.value);
          if (!model || isNaN(val)) return showStatus('Provide value to delete.', '#f87171');
          K().executeAnimWrapper(async () => {
              const out = model.deleteValue(val);
              if (!out.ok) return showStatus(out.error, '#f87171');
              renderHeap();
              await animateHeapEvents(out.events);
              showStatus('Deleted value ' + val, '#34d399');
              return '__KEEP_STATUS__';
          });
      });

      dom.btnHeapFindMin.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          if (!model) return;
          const out = model.peek();
          if (!out.ok) return showStatus(out.error, '#f87171');
          const minVal = out.value;
          document.getElementById('h-0')?.classList.add('active');
          setTimeout(() => document.getElementById('h-0')?.classList.remove('active'), 500);
          showStatus('Min element: ' + minVal, '#60a5fa');
      });

      dom.btnHeapStats.addEventListener('click', () => {
          const showStatus = K().showStatus;
          const model = getActiveHeapModel();
          if (!model) return;
          const size = model.data.length;
          const isMin = model.isMin;
          const mode = C().getMode();
          let statsMsg = `Size: ${size}, Order: ${isMin ? 'Min-Heap' : 'Max-Heap'}`;

          if (mode === 'heap-binomial') {
              const degreeCount = {};
              let idx = 0;
              let degree = 0;
              while (idx < size) {
                  const deg = Math.min(degree, Math.floor(Math.log2(size - idx)));
                  degreeCount[deg] = (degreeCount[deg] || 0) + 1;
                  idx += Math.max(1, 1 << deg);
                  degree++;
              }
              const degrees = Object.keys(degreeCount).map(d => `B${d}:${degreeCount[d]}`).join(', ');
              statsMsg += ` | Trees: ${degrees}`;
          } else if (mode === 'heap-fibonacci') {
              const depth = Math.ceil(Math.log2(size + 1));
              statsMsg += ` | MaxDepth: ${depth}`;
          } else if (mode === 'heap-dary') {
              const depth = size ? Math.ceil(Math.log(size * 3 + 1) / Math.log(4)) : 0;
              statsMsg += ` | Arity: 4 | Levels: ${depth}`;
          } else if (mode === 'heap-pairing') {
              const approximatePairs = Math.max(0, Math.ceil((size - 1) / 2));
              statsMsg += ` | Pair Melds: ~${approximatePairs}`;
          }

          showStatus(statsMsg, '#a78bfa');
          maybeAdvanceHeapTutorial('stats', { size });
      });

      dom.btnHeapTutorial.addEventListener('click', () => {
          const currentMode = C().getMode();
          if (!currentMode.includes('heap-')) return;
          startHeapTutorial();
      });
      dom.btnHeapTutorialNext.addEventListener('click', () => advanceHeapTutorial());
      dom.btnHeapTutorialRestart.addEventListener('click', () => startHeapTutorial());
      dom.btnHeapTutorialExit.addEventListener('click', () => exitHeapTutorial());
  }

  R().attach('heap-binary', { render: renderHeap, code: () => codeHeapBinary, layout: null });
  R().attach('heap-binomial', { render: renderHeap, code: () => codeHeapBinomial, layout: null });
  R().attach('heap-fibonacci', { render: renderHeap, code: () => codeHeapFibonacci, layout: null });
  R().attach('heap-leftist', { render: renderHeap, code: () => codeHeapLeftist, layout: null });
  R().attach('heap-skew', { render: renderHeap, code: () => codeHeapSkew, layout: null });
  R().attach('heap-dary', { render: renderHeap, code: () => codeHeapDary, layout: null });
  R().attach('heap-pairing', { render: renderHeap, code: () => codeHeapPairing, layout: null });
  C().registerDomain({ id: 'heap', init: init, onModeSwitch: onModeSwitch, syncChrome: syncHeapTutorialChrome });
})(typeof window !== 'undefined' ? window : globalThis);
