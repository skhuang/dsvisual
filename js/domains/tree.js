(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  // Core sets
  let bstRoot = null;
  let treeDrawLoop = null;

  let trieRoot = { children: {}, endOfWord: false };
  let radixRoot = { edges: {} };
  let tstRoot = null;
  let btreeData = []; let bplusData = [];

  let dom = null; // { treeContainer, advTreeContainer, btnTreeAdd, btnTreeSearch, treeVal, btnTextTreeAdd, textTreeVal }

  // RAF
  function drawTreeEdgesContinually() {
      const svg = document.getElementById('tree-edges'); svg.innerHTML = '';
      const nc = document.getElementById('tree-nodes-container');
      // Find all lines and draw between them dynamically to capture CSS transitions properly!
      function drawR(node) {
          if(!node) return;
          const originDom = document.getElementById(node.id);
          if(node.left) {
              const targetDom = document.getElementById(node.left.id);
              if(originDom && targetDom) {
                  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                  // Read computed live offsets
                  const x1 = originDom.offsetLeft; const y1 = originDom.offsetTop; const x2 = targetDom.offsetLeft; const y2 = targetDom.offsetTop;
                  line.setAttribute("x1", x1); line.setAttribute("y1", y1); line.setAttribute("x2", x2); line.setAttribute("y2", y2);
                  line.setAttribute("class", "tree-edge"); svg.appendChild(line);
              }
              drawR(node.left);
          }
          if(node.right) {
              const targetDom = document.getElementById(node.right.id);
              if(originDom && targetDom) {
                  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                  const x1 = originDom.offsetLeft; const y1 = originDom.offsetTop; const x2 = targetDom.offsetLeft; const y2 = targetDom.offsetTop;
                  line.setAttribute("x1", x1); line.setAttribute("y1", y1); line.setAttribute("x2", x2); line.setAttribute("y2", y2);
                  line.setAttribute("class", "tree-edge"); svg.appendChild(line);
              }
              drawR(node.right);
          }
      }
      drawR(bstRoot);
      // Continue loop
      treeDrawLoop = requestAnimationFrame(drawTreeEdgesContinually);
  }

  function computeTreeLayout(node, x, y, dx, nodesMeta) {
      if(!node) return;
      nodesMeta.push({ id: node.id, val: node.val, x: x, y: y, color: node.color });
      if(node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, nodesMeta);
      if(node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, nodesMeta);
  }

  function renderTree() {
      const currentMode = C().getMode();
      const nc = document.getElementById('tree-nodes-container');
      if(!bstRoot) { nc.innerHTML = ''; return; }

      let nodesMeta = [];
      computeTreeLayout(bstRoot, 200, 30, 80, nodesMeta);

      // Mark obsolete
      Array.from(nc.children).forEach(child => child.dataset.keep = 'false');

      // Apply new layouts (triggers CSS transition gracefully!)
      nodesMeta.forEach(meta => {
          let nDom = document.getElementById(meta.id);
          if(!nDom) {
              nDom = document.createElement('div'); nDom.id = meta.id; nDom.className = 'tree-node'; nDom.textContent = meta.val;
              nc.appendChild(nDom);
          }
          nDom.dataset.keep = 'true';
          nDom.style.left = meta.x + 'px'; nDom.style.top = meta.y + 'px';

          if(currentMode === 'tree-rb') {
              nDom.className = 'tree-node ' + meta.color;
          } else {
              nDom.className = 'tree-node';
          }
      });

      // Clean obsolete
      Array.from(nc.children).forEach(child => { if(child.dataset.keep === 'false') child.remove(); });

      if(!treeDrawLoop) drawTreeEdgesContinually();
  }

  function renderAdvTrees() {
      const currentMode = C().getMode();
      const advTreeContainer = dom.advTreeContainer;
      advTreeContainer.innerHTML = '';
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.style.position = "absolute"; svg.style.top = "0"; svg.style.left = "0"; svg.style.width = "100%"; svg.style.height = "100%"; svg.style.zIndex="5"; svg.style.pointerEvents = "none";
      advTreeContainer.appendChild(svg);

      const cx = advTreeContainer.clientWidth / 2;
      const cy = 40;

      function drawLine(x1, y1, x2, y2, label="") {
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", x1); line.setAttribute("y1", y1); line.setAttribute("x2", x2); line.setAttribute("y2", y2);
          line.setAttribute("stroke", "#94a3b8"); line.setAttribute("stroke-width", "2"); svg.appendChild(line);
          if(label) {
              const el = document.createElement('div'); el.className = 'edge-label'; el.textContent = label;
              el.style.left = ((x1+x2)/2) + "px"; el.style.top = ((y1+y2)/2) + "px";
              advTreeContainer.appendChild(el);
          }
      }

      if(currentMode === 'tree-trie') {
          function drawTrie(node, x, y, dx) {
              const el = document.createElement('div'); el.className = 'tree-node' + (node.endOfWord ? ' trie-end' : '');
              el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = '20px'; el.style.height = '20px';
              if(node.endOfWord) el.style.backgroundColor = '#ec4899';
              advTreeContainer.appendChild(el);
              let keys = Object.keys(node.children);
              if(keys.length === 0) return;
              let startX = x - (keys.length-1)*dx/2;
              keys.forEach((k, i) => {
                  let nx = startX + i*dx; let ny = y + 60;
                  drawLine(x, y, nx, ny, k); drawTrie(node.children[k], nx, ny, dx/1.5);
              });
          }
          drawTrie(trieRoot, cx, cy, 150);
      } else if (currentMode === 'tree-radix') {
          function drawRadix(node, x, y, dx) {
              const el = document.createElement('div'); el.className = 'tree-node' + (node.endOfWord ? ' trie-end' : '');
              el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = '20px'; el.style.height = '20px';
              advTreeContainer.appendChild(el);
              let keys = Object.keys(node.edges);
              if(keys.length === 0) return;
              let startX = x - (keys.length-1)*dx/2;
              keys.forEach((k, i) => {
                  let nx = startX + i*dx; let ny = y + 80;
                  drawLine(x, y, nx, ny, k); drawRadix(node.edges[k], nx, ny, dx/1.5);
              });
          }
          drawRadix(radixRoot, cx, cy, 200);
      } else if (currentMode === 'tree-ternary') {
          function drawTST(node, x, y, dx) {
              if(!node) return;
              const el = document.createElement('div'); el.className = 'tree-node' + (node.isEnd ? ' trie-end' : ' tst-char');
              el.style.left = x + 'px'; el.style.top = y + 'px'; el.textContent = node.char;
              if(node.isEnd) el.style.borderColor = '#ec4899';
              advTreeContainer.appendChild(el);
              if(node.left) { let nx=x-dx; let ny=y+60; drawLine(x,y,nx,ny,"<"); drawTST(node.left, nx, ny, dx/1.5); }
              if(node.eq) { let nx=x; let ny=y+80; drawLine(x,y,nx,ny,"="); drawTST(node.eq, nx, ny, dx/1.5); }
              if(node.right) { let nx=x+dx; let ny=y+60; drawLine(x,y,nx,ny,">"); drawTST(node.right, nx, ny, dx/1.5); }
          }
          drawTST(tstRoot, cx, cy, 120);
      } else if (currentMode === 'tree-btree' || currentMode === 'tree-bplus') {
          // Simplified Block Presentation Fallback
          const dataToRender = (currentMode === 'tree-btree') ? btreeData : bplusData;
          const el = document.createElement('div'); el.className = 'btree-node';
          el.style.left = cx + 'px'; el.style.top = '100px';
          if(dataToRender.length === 0) el.innerHTML = "<div class='key'>Empty</div>";
          else {
              // Chunk keys to simulate multiple leaf nodes horizontally for B+Tree
              if(currentMode === 'tree-bplus' && dataToRender.length > 2) {
                  el.innerHTML = "<div class='key'>Root Index Block</div>";
                  const leaves = document.createElement('div'); leaves.style.display='flex'; leaves.style.gap='20px'; leaves.style.position='absolute'; leaves.style.top='180px'; leaves.style.left='50%'; leaves.style.transform='translateX(-50%)';
                  for(let i=0; i<dataToRender.length; i+=2) {
                      const b = document.createElement('div'); b.className='btree-node'; b.style.position='relative'; b.style.transform='none';
                      b.innerHTML = "<div class='key'>" + dataToRender[i] + "</div>" + (dataToRender[i+1] ? ("<div class='key'>"+dataToRender[i+1]+"</div>") : "");
                      leaves.appendChild(b);
                  }
                  advTreeContainer.appendChild(leaves);
                  const p = document.createElement('div'); p.style.position='absolute'; p.style.top='220px'; p.style.left='50%'; p.style.transform='translateX(-50%)'; p.style.color='#ec4899'; p.textContent = '----[ Sequence Pointer Path ]---->'; advTreeContainer.appendChild(p);
              } else {
                  dataToRender.forEach(k => { const s = document.createElement('div'); s.className='key'; s.textContent=k; el.appendChild(s); });
              }
          }
          advTreeContainer.appendChild(el);
      }
  }

  // ===== Red-Black Tree（紅黑樹旋轉觀測站，ported from the author's visualizer） =====
  // State survives re-renders (language / mode switches): the RBTree and its
  // rewindable History live in _rbState; each render builds a fresh Stage and
  // re-attaches the History to the new DOM.
  let _rbState = null;
  function renderTreeRB() {
      const host = K().acquireDynamicVizHost();
      const langOf = K().langOf;
      const showStatus = K().showStatus;
      host.innerHTML =
          '<div class="rbviz" data-testid="rbviz">' +
              '<div class="rbviz-toolbar">' +
                  '<div class="rbviz-field">' +
                      '<input type="number" class="rbviz-input" data-testid="rbviz-input" placeholder="' + langOf({ zh: '鍵值', en: 'Key' }) + '" aria-label="' + langOf({ zh: '鍵值', en: 'Key' }) + '">' +
                      '<button type="button" class="btn primary rbviz-insert" data-testid="rbviz-insert">' + langOf({ zh: '插入', en: 'Insert' }) + '</button>' +
                      '<button type="button" class="btn secondary rbviz-delete" data-testid="rbviz-delete">' + langOf({ zh: '刪除', en: 'Delete' }) + '</button>' +
                      '<button type="button" class="btn exception rbviz-clear" data-testid="rbviz-clear">' + langOf({ zh: '清空', en: 'Clear' }) + '</button>' +
                  '</div>' +
                  '<div class="rbviz-presets" data-testid="rbviz-presets"><span class="lbl">' + langOf({ zh: '劇本', en: 'Scenarios' }) + '</span></div>' +
                  '<span class="rbviz-hint">' + langOf({ zh: '點節點可把鍵值帶入輸入框；← → 鍵逐步前進 / 倒帶，空白鍵播放 / 暫停', en: 'Click a node to load its key; ← → step forward / back, Space to play / pause' }) + '</span>' +
              '</div>' +
              '<div class="rbviz-workbench">' +
                  '<div class="rbviz-stagecol">' +
                      '<div class="rbviz-stepdesc" data-testid="rbviz-desc"></div>' +
                      '<div class="rbviz-stage" data-testid="rbviz-stage"></div>' +
                      '<div class="rbviz-transport" data-testid="rbviz-transport"></div>' +
                      '<div class="rbviz-legend">' +
                          '<span><i class="lr"></i>' + langOf({ zh: '紅節點', en: 'Red node' }) + '</span><span><i class="lb"></i>' + langOf({ zh: '黑節點', en: 'Black node' }) + '</span>' +
                          '<span><i class="lh"></i>' + langOf({ zh: '本步驟主角', en: "This step's focus" }) + '</span><span><i class="lbe"></i>' + langOf({ zh: 'β 子樹（旋轉時換邊的那包）', en: 'β subtree (the bundle that switches sides on rotation)' }) + '</span>' +
                      '</div>' +
                  '</div>' +
                  '<aside class="rbviz-logcol">' +
                      '<h4>' + langOf({ zh: '步驟紀錄', en: 'Step Log' }) + '</h4>' +
                      '<div class="rbviz-steplog" data-testid="rbviz-log"></div>' +
                  '</aside>' +
              '</div>' +
          '</div>';

      const input = host.querySelector('.rbviz-input');
      const stage = new RBTreeViz.Stage(host.querySelector('.rbviz-stage'), {
          emptyText: { zh: '空樹 —— 插入一個值，或載入一個劇本', en: 'Empty tree — insert a value, or load a scenario' },
      });
      stage.onNodeClick = (key) => { input.value = key; };

      const attachCfg = {
          stage,
          descEl: host.querySelector('[data-testid="rbviz-desc"]'),
          logEl: host.querySelector('[data-testid="rbviz-log"]'),
          transportEl: host.querySelector('[data-testid="rbviz-transport"]'),
      };
      if (!_rbState) {
          const tree = new RBTreeViz.RBTree();
          _rbState = { tree, hist: new RBTreeViz.History(Object.assign({ tree }, attachCfg)) };
      } else {
          _rbState.hist.attach(attachCfg);
      }

      function rbReset() {
          _rbState.tree = new RBTreeViz.RBTree();
          _rbState.hist.tree = _rbState.tree;
          _rbState.hist.reset();
      }
      function rbInsert(v, opt) {
          if (!Number.isFinite(v)) { showStatus(langOf({ zh: '先輸入一個整數', en: 'Enter an integer first' }), '#fbbf24'); return false; }
          v = Math.round(v);
          if (_rbState.tree.size() >= 63) { showStatus(langOf({ zh: '節點太多了（上限 63），先刪一些吧', en: 'Too many nodes (max 63) — delete some first' }), '#fbbf24'); return false; }
          if (_rbState.tree.find(v)) { showStatus(langOf({ zh: v + ' 已經在樹裡了', en: v + ' is already in the tree' }), '#fbbf24'); return false; }
          _rbState.hist.runOp({ zh: '插入 ' + v, en: 'Insert ' + v }, () => _rbState.tree.insert(v), opt);
          return true;
      }
      function rbDelete(v, opt) {
          if (!Number.isFinite(v)) { showStatus(langOf({ zh: '先輸入一個整數', en: 'Enter an integer first' }), '#fbbf24'); return false; }
          v = Math.round(v);
          if (!_rbState.tree.find(v)) { showStatus(langOf({ zh: '樹裡沒有 ' + v, en: v + " isn't in the tree" }), '#fbbf24'); return false; }
          _rbState.hist.runOp({ zh: '刪除 ' + v, en: 'Delete ' + v }, () => _rbState.tree.delete(v), opt);
          return true;
      }

      host.querySelector('.rbviz-insert').addEventListener('click', () => { if (rbInsert(+input.value)) input.value = ''; });
      host.querySelector('.rbviz-delete').addEventListener('click', () => { if (rbDelete(+input.value)) input.value = ''; });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (rbInsert(+input.value)) input.value = ''; } });
      host.querySelector('.rbviz-clear').addEventListener('click', () => { rbReset(); showStatus(langOf({ zh: '清空了', en: 'Cleared' }), '#94a3b8'); });

      const presetsEl = host.querySelector('[data-testid="rbviz-presets"]');
      RBTreeViz.PRESETS.forEach((p) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'rbviz-preset';
          b.dataset.preset = p.id;
          b.textContent = langOf(p.name);
          const tip = langOf(p.tip || { zh: '', en: '' });
          if (tip) b.title = tip;
          b.addEventListener('click', () => {
              rbReset();
              for (const k of p.seed()) rbInsert(k, { play: false });
              if (p.final) {
                  // Park on the fully-built tree, one step before the final
                  // operation, so ▶ plays exactly that operation.
                  const ready = _rbState.hist.steps.length - 1;
                  if (p.final.op === 'insert') rbInsert(p.final.v, { play: false });
                  else rbDelete(p.final.v, { play: false });
                  _rbState.hist.goTo(ready, false);
              } else {
                  _rbState.hist.goTo(0, false);
              }
              const zhTip = (p.tip && p.tip.zh) || '', enTip = (p.tip && p.tip.en) || '';
              showStatus(langOf({
                  zh: (zhTip ? zhTip + '。' : '') + '劇本已載入，按 ▶ 開始播放',
                  en: (enTip ? enTip + '. ' : '') + 'Scenario loaded — press ▶ to play'
              }), '#94a3b8');
          });
          presetsEl.appendChild(b);
      });
  }

  function onModeSwitch(mode) {
      if (_rbState) _rbState.hist.pause(); // stop RB playback when leaving/re-entering the mode
      bstRoot = null;
      trieRoot = { children: {}, endOfWord: false }; radixRoot = { edges: {} }; tstRoot = null; btreeData = []; bplusData = [];
      // This used to be cancelled unconditionally at the top of app.js's
      // updateLayout() (called right after onModeSwitch on every mode
      // switch) — moved here since treeDrawLoop is now domain-private state.
      if (treeDrawLoop) { cancelAnimationFrame(treeDrawLoop); treeDrawLoop = null; }
  }

  function init() {
      dom = {
          treeContainer: document.getElementById('tree-container'),
          advTreeContainer: document.getElementById('advanced-tree-container'),
          btnTreeAdd: document.getElementById('btn-tree-add'),
          btnTreeSearch: document.getElementById('btn-tree-search'),
          treeVal: document.getElementById('tree-val'),
          btnTextTreeAdd: document.getElementById('btn-text-tree-add'),
          textTreeVal: document.getElementById('text-tree-val'),
      };

      // ----------- TREES -----------
      dom.btnTreeAdd.addEventListener('click', () => {
          K().executeAnimWrapper(async () => {
              const currentMode = C().getMode();
              const showStatus = K().showStatus;
              const val = parseInt(dom.treeVal.value); if(isNaN(val)) return showStatus('Enter valid number.', '#f87171');
              if(currentMode === 'tree-bst') bstRoot = insertBST(bstRoot, val);
              else if(currentMode === 'tree-avl') bstRoot = insertAVL(bstRoot, val);
              else if(currentMode === 'tree-rb') { bstRoot = insertRB_Mock(bstRoot, val); assignRBColors(bstRoot, true); }
              else if(currentMode === 'tree-splay') bstRoot = insertSplay(bstRoot, val);
              else if(currentMode === 'tree-btree') { btreeData.push(val); btreeData.sort((a,b)=>a-b); renderAdvTrees(); return showStatus("B-Tree Updated.", "#34d399"); }
              else if(currentMode === 'tree-bplus') { bplusData.push(val); bplusData.sort((a,b)=>a-b); renderAdvTrees(); return showStatus("B+Tree Updated.", "#34d399"); }
              showStatus("Inserted " + val, '#60a5fa'); dom.treeVal.value = Math.floor(Math.random() * 100); renderTree();
          });
      });
      dom.btnTreeSearch.addEventListener('click', () => {
          const currentMode = C().getMode();
          const showStatus = K().showStatus;
          const val = parseInt(dom.treeVal.value); if(isNaN(val)) return;
          if(currentMode === 'tree-splay') { bstRoot = splayNode(bstRoot, val); renderTree(); showStatus("Splayed " + val, '#fbbf24'); }
      });

      dom.btnTextTreeAdd.addEventListener('click', () => {
          let str = dom.textTreeVal.value.trim().toUpperCase();
          const showStatus = K().showStatus;
          if(!str) return showStatus('Enter a word!', '#f87171');
          K().executeAnimWrapper(async () => {
              const currentMode = C().getMode();
              if(currentMode === 'tree-trie') {
                  let curr = trieRoot; for(let char of str) { if(!curr.children[char]) curr.children[char] = { children: {}, endOfWord: false }; curr = curr.children[char]; }
                  curr.endOfWord = true; renderAdvTrees(); showStatus("Trie Inserted: " + str, "#34d399");
              } else if (currentMode === 'tree-radix') {
                  radixRoot.edges[str] = { edges: {}, endOfWord: true }; renderAdvTrees(); showStatus("Radix Block Inserted: " + str, "#34d399");
              } else if (currentMode === 'tree-ternary') {
                  function ins(node, word, depth) {
                      let c = word[depth]; if(!node) node = { char: c, isEnd: false, left: null, eq: null, right: null };
                      if(c < node.char) node.left = ins(node.left, word, depth);
                      else if(c > node.char) node.right = ins(node.right, word, depth);
                      else { if(depth+1 < word.length) node.eq = ins(node.eq, word, depth+1); else node.isEnd = true; }
                      return node;
                  }
                  tstRoot = ins(tstRoot, str, 0); renderAdvTrees(); showStatus("TST Inserted: " + str, "#34d399");
              }
          });
      });

      // 鍵盤操作（沙盒）：← → 逐步、空白鍵播放/暫停 —— 只在紅黑樹模式作用
      document.addEventListener('keydown', (e) => {
          if (C().getMode() !== 'tree-rb' || !_rbState) return;
          if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
          const h = _rbState.hist;
          if (e.key === 'ArrowRight') { e.preventDefault(); h.pause(); h.goTo(h.cursor + 1); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); h.pause(); h.goTo(h.cursor - 1); }
          else if (e.key === ' ') { e.preventDefault(); h.playing ? h.pause() : h.play(); }
      });
  }

  R().attach('tree-bst', { render: renderTree, code: () => codeTreeBST, layout: null });
  R().attach('tree-avl', { render: renderTree, code: () => codeTreeAVL, layout: null });
  R().attach('tree-rb', { render: renderTreeRB, code: () => codeTreeRB, layout: { host: 'dynamic' } });
  R().attach('tree-splay', { render: renderTree, code: () => codeTreeSplay, layout: null });
  R().attach('tree-trie', { render: renderAdvTrees, code: () => codeTreeTrie, layout: null });
  R().attach('tree-radix', { render: renderAdvTrees, code: () => codeTreeRadix, layout: null });
  R().attach('tree-ternary', { render: renderAdvTrees, code: () => codeTreeTST, layout: null });
  R().attach('tree-btree', { render: renderAdvTrees, code: () => codeTreeBTree, layout: null });
  R().attach('tree-bplus', { render: renderAdvTrees, code: () => codeTreeBPlus, layout: null });
  C().registerDomain({ id: 'tree', init: init, onModeSwitch: onModeSwitch });
})(typeof window !== 'undefined' ? window : globalThis);
