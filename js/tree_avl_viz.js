'use strict';
/*
 * AVL Tree 旋轉觀測站 — parallel to tree_rb_viz.js (RB observatory).
 * Exposes window.AVLViz = { AVLTree, Stage, History, KIND_META, PRESETS }.
 * AVLTree uses parent pointers + in-place rebalancing so this.root is valid at
 * every onStep emit (History.runOp serializes the tree on each step). The DOM
 * wiring (toolbar, presets, keyboard) lives in js/domains/tree.js renderTreeAVL().
 */
(function (global) {
    const REDUCED = typeof matchMedia === 'function'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ================= AVL 樹核心（含 parent 指標，原地旋轉） ================= */
    class AVLTree {
        constructor() { this.root = null; this._id = 1; this.onStep = null; }
        _lbl(n) { return n ? String(n.key) : '·'; }
        _emit(kind, title, detail, nodes, extra) {
            if (!this.onStep) return;
            const hl = (nodes || []).filter((n) => n).map((n) => n.id);
            this.onStep(Object.assign({ kind, title, detail, hl }, extra || {}));
        }
        _h(n) { return n ? n.height : 0; }
        _bf(n) { return n ? this._h(n.left) - this._h(n.right) : 0; }
        _fix(n) { n.height = 1 + Math.max(this._h(n.left), this._h(n.right)); }
        _sbf(n) { const b = this._bf(n); return (b > 0 ? '+' : '') + b; }

        serialize() {
            const s = (n) => n ? { id: n.id, key: n.key, height: n.height, bf: this._bf(n), left: s(n.left), right: s(n.right) } : null;
            return s(this.root);
        }
        size() { let c = 0; const w = (n) => { if (n) { c++; w(n.left); w(n.right); } }; w(this.root); return c; }
        find(key) { let x = this.root; while (x) { if (key === x.key) return x; x = key < x.key ? x.left : x.right; } return null; }
        min(x) { x = x || this.root; if (!x) return null; while (x.left) x = x.left; return x; }

        leftRotate(x) {
            const y = x.right, beta = y.left;
            x.right = beta; if (beta) beta.parent = x;
            y.parent = x.parent;
            if (!x.parent) this.root = y;
            else if (x === x.parent.left) x.parent.left = y; else x.parent.right = y;
            y.left = x; x.parent = y;
            this._fix(x); this._fix(y);
            const b = beta || null;
            this._emit('rotate-left',
                { zh: `左旋 @ ${this._lbl(x)}`, en: `Left-rotate @ ${this._lbl(x)}` },
                { zh: `${this._lbl(y)} 升上來當這棵小樹的根，${this._lbl(x)} 下沉成左子` + (b ? `；β 子樹（根 ${this._lbl(b)}）換邊，改掛到 ${this._lbl(x)} 右側` : `；β 子樹是空的，不用搬`),
                  en: `${this._lbl(y)} rises to the subtree root and ${this._lbl(x)} sinks to its left child` + (b ? `; the β subtree (root ${this._lbl(b)}) switches sides to ${this._lbl(x)}'s right` : `; the β subtree is empty`) },
                [x, y], { beta: b ? b.id : null });
        }
        rightRotate(x) {
            const y = x.left, beta = y.right;
            x.left = beta; if (beta) beta.parent = x;
            y.parent = x.parent;
            if (!x.parent) this.root = y;
            else if (x === x.parent.right) x.parent.right = y; else x.parent.left = y;
            y.right = x; x.parent = y;
            this._fix(x); this._fix(y);
            const b = beta || null;
            this._emit('rotate-right',
                { zh: `右旋 @ ${this._lbl(x)}`, en: `Right-rotate @ ${this._lbl(x)}` },
                { zh: `${this._lbl(y)} 升上來當這棵小樹的根，${this._lbl(x)} 下沉成右子` + (b ? `；β 子樹（根 ${this._lbl(b)}）換邊，改掛到 ${this._lbl(x)} 左側` : `；β 子樹是空的，不用搬`),
                  en: `${this._lbl(y)} rises to the subtree root and ${this._lbl(x)} sinks to its right child` + (b ? `; the β subtree (root ${this._lbl(b)}) switches sides to ${this._lbl(x)}'s left` : `; the β subtree is empty`) },
                [x, y], { beta: b ? b.id : null });
        }

        // Walk up from n to the root: recompute height/bf, emit an update step,
        // and rotate wherever |bf|==2. stopAfterRotate=true for insert (a single
        // rotation suffices); false for delete (may rotate repeatedly to the root).
        _rebalance(n, stopAfterRotate) {
            while (n) {
                this._fix(n);
                const bf = this._bf(n);
                this._emit('update',
                    { zh: `更新 ${this._lbl(n)}：高度 ${n.height}、平衡因子 ${this._sbf(n)}`, en: `Update ${this._lbl(n)}: height ${n.height}, balance factor ${this._sbf(n)}` },
                    { zh: `重新計算 ${this._lbl(n)} 的高度與平衡因子`, en: `Recompute ${this._lbl(n)}'s height and balance factor` },
                    [n]);
                if (bf === 2) {
                    const L = n.left;
                    if (this._bf(L) >= 0) {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=+2）→ LL`, en: `Imbalance @ ${this._lbl(n)} (bf=+2) → LL` },
                            { zh: `左子樹過高、且左子 ${this._lbl(L)} 也偏左（LL 形）→ 對 ${this._lbl(n)} 右旋`, en: `Left-heavy and left child ${this._lbl(L)} also leans left (LL) → right-rotate ${this._lbl(n)}` }, [n, L]);
                        this.rightRotate(n);
                    } else {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=+2）→ LR`, en: `Imbalance @ ${this._lbl(n)} (bf=+2) → LR` },
                            { zh: `左子 ${this._lbl(L)} 偏右（LR 形）→ 先左旋 ${this._lbl(L)}，再右旋 ${this._lbl(n)}`, en: `Left child ${this._lbl(L)} leans right (LR) → left-rotate ${this._lbl(L)}, then right-rotate ${this._lbl(n)}` }, [n, L]);
                        this.leftRotate(L); this.rightRotate(n);
                    }
                    n = n.parent; if (stopAfterRotate) break; continue;
                }
                if (bf === -2) {
                    const R = n.right;
                    if (this._bf(R) <= 0) {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=−2）→ RR`, en: `Imbalance @ ${this._lbl(n)} (bf=-2) → RR` },
                            { zh: `右子樹過高、且右子 ${this._lbl(R)} 也偏右（RR 形）→ 對 ${this._lbl(n)} 左旋`, en: `Right-heavy and right child ${this._lbl(R)} also leans right (RR) → left-rotate ${this._lbl(n)}` }, [n, R]);
                        this.leftRotate(n);
                    } else {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=−2）→ RL`, en: `Imbalance @ ${this._lbl(n)} (bf=-2) → RL` },
                            { zh: `右子 ${this._lbl(R)} 偏左（RL 形）→ 先右旋 ${this._lbl(R)}，再左旋 ${this._lbl(n)}`, en: `Right child ${this._lbl(R)} leans left (RL) → right-rotate ${this._lbl(R)}, then left-rotate ${this._lbl(n)}` }, [n, R]);
                        this.rightRotate(R); this.leftRotate(n);
                    }
                    n = n.parent; if (stopAfterRotate) break; continue;
                }
                n = n.parent;
            }
        }

        insert(key) {
            if (this.find(key)) return null;
            const z = { id: this._id++, key, height: 1, left: null, right: null, parent: null };
            if (!this.root) {
                this.root = z;
                this._emit('insert', { zh: `插入 ${key}`, en: `Insert ${key}` }, { zh: `樹是空的，${key} 直接當根`, en: `The tree is empty, so ${key} becomes the root` }, [z]);
                return z;
            }
            let y = null, x = this.root;
            while (x) { y = x; x = key < x.key ? x.left : x.right; }
            z.parent = y; if (key < y.key) y.left = z; else y.right = z;
            this._emit('insert', { zh: `插入 ${key}`, en: `Insert ${key}` },
                { zh: `照 BST 規則走到底，掛在 ${this._lbl(y)} 的${key < y.key ? '左' : '右'}邊`, en: `Follow the BST rule down; attach as ${this._lbl(y)}'s ${key < y.key ? 'left' : 'right'} child` }, [z, y]);
            this._rebalance(y, true);
            return z;
        }

        delete(key) {
            const z = this.find(key);
            if (!z) return false;
            this._emit('delete', { zh: `刪除 ${key}`, en: `Delete ${key}` }, { zh: `找到 ${this._lbl(z)}，準備刪除`, en: `Found ${this._lbl(z)}, preparing to delete` }, [z]);
            let target = z;
            if (z.left && z.right) {
                const succ = this.min(z.right);
                this._emit('note', { zh: `${this._lbl(z)} 有兩個子節點 → 用中序後繼 ${this._lbl(succ)} 的鍵取代`, en: `${this._lbl(z)} has two children → replace its key with in-order successor ${this._lbl(succ)}` },
                    { zh: `把後繼 ${this._lbl(succ)} 的鍵搬到 ${this._lbl(z)}，改刪那顆（至多一個子節點的）後繼節點`, en: `Copy successor ${this._lbl(succ)}'s key into ${this._lbl(z)}, then remove the successor node (which has at most one child)` }, [z, succ]);
                z.key = succ.key; target = succ;
            }
            const child = target.left || target.right;
            const parent = target.parent;
            if (child) child.parent = parent;
            if (!parent) this.root = child;
            else if (target === parent.left) parent.left = child; else parent.right = child;
            this._rebalance(parent, false);
            return true;
        }
    }

    function _pickLang(m) {
        if (m == null) return '';
        if (typeof m === 'string') return m;
        const zh = (typeof window !== 'undefined' && window.I18N && window.I18N.getCurrentLanguage() === 'zh');
        return zh ? m.zh : m.en;
    }

    const KIND_META = {
        'insert': { cls: 'k-insert', label: { zh: '插入', en: 'Insert' } },
        'update': { cls: 'k-recolor', label: { zh: '更新', en: 'Update' } },
        'rotate-left': { cls: 'k-rotate', label: { zh: '左旋', en: 'Left-rot' } },
        'rotate-right': { cls: 'k-rotate', label: { zh: '右旋', en: 'Right-rot' } },
        'delete': { cls: 'k-delete', label: { zh: '刪除', en: 'Delete' } },
        'note': { cls: 'k-note', label: { zh: '說明', en: 'Note' } },
        'init': { cls: 'k-note', label: { zh: '起點', en: 'Start' } },
    };

    /* ================= 舞台：畫樹 + 補間動畫 ================= */
    const SVGNS = 'http://www.w3.org/2000/svg';
    class Stage {
        constructor(host, opts) {
            this.host = host;
            this.opts = opts || {};
            this.svg = document.createElementNS(SVGNS, 'svg');
            this.gE = document.createElementNS(SVGNS, 'g');
            this.gN = document.createElementNS(SVGNS, 'g');
            this.gM = document.createElementNS(SVGNS, 'g');
            this.svg.append(this.gE, this.gN, this.gM);
            this.empty = document.createElement('div');
            this.empty.className = 'avlviz-empty';
            this.empty.textContent = _pickLang(this.opts.emptyText) || _pickLang({ zh: '空樹', en: 'Empty tree' });
            host.append(this.svg, this.empty);
            this.nodeEls = new Map(); // id -> {g, key, sub}
            this.edgeEls = new Map(); // childId -> line
            this.state = new Map();   // id -> {x,y,s,o}
            this.eState = new Map();  // childId -> {x1,y1,x2,y2,o}
            this._raf = 0;
            this.onNodeClick = null;
            this.gN.addEventListener('click', e => {
                const g = e.target.closest('.nd');
                if (g && this.onNodeClick) this.onNodeClick(g.dataset.key, g.dataset.name || null);
            });
        }

        _layout(snap) {
            const nodes = []; let idx = 0, maxD = 0;
            const walk = (n, d, parentId) => {
                if (!n) return;
                walk(n.left, d + 1, n.id);
                maxD = Math.max(maxD, d);
                nodes.push({ id: n.id, key: n.key, bf: n.bf, height: n.height, d, i: idx++, parentId });
                walk(n.right, d + 1, n.id);
            };
            walk(snap, 0, null);
            return { nodes, cols: idx, maxD };
        }

        applySnapshot(snap, step, animate) {
            if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; this._finish && this._finish(); }
            step = step || {};
            if (!snap) {
                this.empty.style.display = 'flex';
                this.gE.innerHTML = ''; this.gN.innerHTML = ''; this.gM.innerHTML = '';
                this.nodeEls.clear(); this.edgeEls.clear(); this.state.clear(); this.eState.clear();
                this.svg.setAttribute('width', 10); this.svg.setAttribute('height', 10);
                return;
            }
            this.empty.style.display = 'none';
            const { nodes, cols, maxD } = this._layout(snap);
            const COL = 52, ROW = 70, R = 19, PADX = 34, PADY = 32;
            const EXTRA = (this.opts.sub ? 16 : 0) + (this.opts.marker ? 18 : 0);
            const W = cols * COL + PADX * 2, H = (maxD + 1) * ROW + PADY * 2 + EXTRA;
            const hostW = Math.max(this.host.clientWidth - 18, 200);
            const hostH = Math.max(this.host.clientHeight - 22, 200);
            let scale = Math.min(hostW / W, hostH / H, 1.15);
            scale = Math.max(scale, 0.5); // 小於 0.5 就讓它水平捲動，別再縮
            this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
            this.svg.setAttribute('width', Math.round(W * scale));
            this.svg.setAttribute('height', Math.round(H * scale));

            const pos = new Map(); // id -> {x,y}
            for (const n of nodes) pos.set(n.id, { x: PADX + n.i * COL + COL / 2, y: PADY + n.d * ROW });

            // β 子樹（旋轉時換邊的那一包）
            const betaIds = new Set();
            if (step.beta != null) {
                const findAndMark = n => {
                    if (!n) return false;
                    if (n.id === step.beta) { (function all(m) { if (!m) return; betaIds.add(m.id); all(m.left); all(m.right); })(n); return true; }
                    return findAndMark(n.left) || findAndMark(n.right);
                };
                findAndMark(snap);
            }
            const hlIds = new Set(step.hl || []);

            // --- 同步節點 DOM ---
            const present = new Set();
            for (const n of nodes) {
                present.add(n.id);
                let el = this.nodeEls.get(n.id);
                if (!el) {
                    const g = document.createElementNS(SVGNS, 'g');
                    g.setAttribute('class', 'nd');
                    const ring = document.createElementNS(SVGNS, 'circle');
                    ring.setAttribute('class', 'hlring'); ring.setAttribute('r', R + 5.5);
                    const body = document.createElementNS(SVGNS, 'circle');
                    body.setAttribute('class', 'body'); body.setAttribute('r', R);
                    const key = document.createElementNS(SVGNS, 'text');
                    key.setAttribute('y', 4.8); key.setAttribute('font-size', 13.5);
                    g.append(ring, body, key);
                    let sub = null;
                    if (this.opts.sub) {
                        sub = document.createElementNS(SVGNS, 'text');
                        sub.setAttribute('class', 'sub'); sub.setAttribute('y', R + 15);
                        g.append(sub);
                    }
                    this.gN.append(g);
                    el = { g, key, sub };
                    this.nodeEls.set(n.id, el);
                    // 進場：從父節點的目標位置長出來
                    const pp = n.parentId != null && pos.get(n.parentId) ? pos.get(n.parentId) : pos.get(n.id);
                    this.state.set(n.id, { x: pp.x, y: pp.y, s: 0, o: 0 });
                }
                el.g.dataset.key = n.key;
                el.key.textContent = n.key;
                if (el.sub) el.sub.textContent = (n.bf > 0 ? '+' : '') + n.bf;
                el.g.setAttribute('class', 'nd' + (Math.abs(n.bf) >= 2 ? ' imbalanced' : '') +
                    (hlIds.has(n.id) ? ' hl' : betaIds.has(n.id) ? ' beta' : ''));
            }

            // --- 同步邊 DOM ---
            const presentE = new Set();
            for (const n of nodes) {
                if (n.parentId == null) continue;
                presentE.add(n.id);
                let line = this.edgeEls.get(n.id);
                if (!line) {
                    line = document.createElementNS(SVGNS, 'line');
                    line.setAttribute('class', 'edge');
                    this.gE.append(line);
                    this.edgeEls.set(n.id, line);
                    const pp = pos.get(n.parentId);
                    this.eState.set(n.id, { x1: pp.x, y1: pp.y, x2: pp.x, y2: pp.y, o: 0 });
                }
            }

            // --- 目標狀態 ---
            const nTarget = new Map(), eTarget = new Map(), exitN = [], exitE = [];
            for (const [id] of this.nodeEls) {
                if (present.has(id)) { const p = pos.get(id); nTarget.set(id, { x: p.x, y: p.y, s: 1, o: 1 }); }
                else { const c = this.state.get(id); nTarget.set(id, { x: c.x, y: c.y - 14, s: 0, o: 0 }); exitN.push(id); }
            }
            for (const [cid] of this.edgeEls) {
                if (presentE.has(cid)) {
                    const n = nodes.find(m => m.id === cid), p = pos.get(n.parentId), c = pos.get(cid);
                    eTarget.set(cid, { x1: p.x, y1: p.y, x2: c.x, y2: c.y, o: 1 });
                } else { const c = this.eState.get(cid); eTarget.set(cid, Object.assign({}, c, { o: 0 })); exitE.push(cid); }
            }

            // --- 標記「下一個上場」 ---
            this.gM.innerHTML = '';
            if (this.opts.marker && nodes.length) {
                const first = nodes[0], p = pos.get(first.id);
                const t = document.createElementNS(SVGNS, 'text');
                t.textContent = _pickLang({ zh: '▲ 下一個上場', en: '▲ up next' });
                t.setAttribute('x', p.x); t.setAttribute('y', p.y + R + (this.opts.sub ? 30 : 16));
                const gm = document.createElementNS(SVGNS, 'g');
                gm.setAttribute('class', 'next-marker'); gm.append(t);
                this.gM.append(gm);
            }

            const cleanup = () => {
                for (const id of exitN) { const el = this.nodeEls.get(id); if (el) el.g.remove(); this.nodeEls.delete(id); this.state.delete(id); }
                for (const id of exitE) { const l = this.edgeEls.get(id); if (l) l.remove(); this.edgeEls.delete(id); this.eState.delete(id); }
            };
            const write = () => {
                for (const [id, st] of this.state) {
                    const el = this.nodeEls.get(id); if (!el) continue;
                    el.g.setAttribute('transform', `translate(${st.x},${st.y}) scale(${Math.max(st.s, 0.001)})`);
                    el.g.setAttribute('opacity', st.o);
                }
                for (const [id, st] of this.eState) {
                    const l = this.edgeEls.get(id); if (!l) continue;
                    l.setAttribute('x1', st.x1); l.setAttribute('y1', st.y1);
                    l.setAttribute('x2', st.x2); l.setAttribute('y2', st.y2);
                    l.setAttribute('opacity', st.o);
                }
            };

            if (!animate || REDUCED) {
                this.state = nTarget; this.eState = eTarget;
                write(); cleanup();
                return;
            }
            // 補間
            const n0 = new Map(), e0 = new Map();
            for (const [id, v] of this.state) n0.set(id, Object.assign({}, v));
            for (const [id, v] of this.eState) e0.set(id, Object.assign({}, v));
            for (const [id, v] of nTarget) if (!n0.has(id)) n0.set(id, Object.assign({}, v));
            for (const [id, v] of eTarget) if (!e0.has(id)) e0.set(id, Object.assign({}, v));
            const D = 520, t0 = performance.now();
            const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            this._finish = () => { this.state = nTarget; this.eState = eTarget; write(); cleanup(); this._finish = null; };
            const tick = now => {
                const t = Math.min((now - t0) / D, 1), k = ease(t);
                for (const [id, tgt] of nTarget) {
                    const a = n0.get(id), cur = this.state.get(id) || {};
                    cur.x = a.x + (tgt.x - a.x) * k; cur.y = a.y + (tgt.y - a.y) * k;
                    cur.s = a.s + (tgt.s - a.s) * k; cur.o = a.o + (tgt.o - a.o) * k;
                    this.state.set(id, cur);
                }
                for (const [id, tgt] of eTarget) {
                    const a = e0.get(id), cur = this.eState.get(id) || {};
                    for (const kk of ['x1', 'y1', 'x2', 'y2', 'o']) cur[kk] = a[kk] + (tgt[kk] - a[kk]) * k;
                    this.eState.set(id, cur);
                }
                write();
                if (t < 1) this._raf = requestAnimationFrame(tick);
                else { this._raf = 0; this._finish(); }
            };
            this._raf = requestAnimationFrame(tick);
        }
    }

    /* ================= 歷史：可倒帶的步驟序列 ================= */
    class History {
        constructor(cfg) {
            this.tree = cfg.tree;
            this.onPlayEnd = cfg.onPlayEnd || null;
            this.steps = []; this.cursor = 0; this.opSeq = 0;
            this.playing = false; this._timer = 0; this.rows = [];
            this.attach(cfg);
            this.reset(cfg.initText);
        }
        // (Re)bind the DOM this History renders into. Called from the constructor
        // and again whenever renderTreeAVL rebuilds the visualization host
        // (mode/language switches), so the step history survives re-renders.
        attach(cfg) {
            this.stage = cfg.stage;
            this.descEl = cfg.descEl; this.logEl = cfg.logEl;
            this._buildTransport(cfg.transportEl);
            if (this.steps && this.steps.length) {
                this.renderLog();
                this.goTo(this.cursor, false);
            }
        }
        _buildTransport(el) {
            el.innerHTML = '';
            const mk = (txt, title, fn) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'tbtn'; b.textContent = txt; b.title = title;
                b.addEventListener('click', fn); el.append(b); return b;
            };
            mk('⏮', _pickLang({ zh: '上一個操作的開頭', en: 'Start of previous operation' }), () => this.prevOp());
            mk('◀', _pickLang({ zh: '上一步（← 鍵）', en: 'Previous step (←)' }), () => { this.pause(); this.goTo(this.cursor - 1); });
            this.playBtn = mk('▶', _pickLang({ zh: '播放 / 暫停', en: 'Play / Pause' }), () => this.playing ? this.pause() : this.play());
            this.playBtn.classList.add('play');
            mk('▶︎', _pickLang({ zh: '下一步（→ 鍵）', en: 'Next step (→)' }), () => { this.pause(); this.goTo(this.cursor + 1); });
            mk('⏭', _pickLang({ zh: '下一個操作的開頭', en: 'Start of next operation' }), () => this.nextOp());
            this.slider = document.createElement('input');
            this.slider.type = 'range'; this.slider.min = 0; this.slider.max = 0; this.slider.value = 0;
            this.slider.setAttribute('aria-label', _pickLang({ zh: '步驟位置', en: 'Step position' }));
            this.slider.addEventListener('input', () => { this.pause(); this.goTo(+this.slider.value, false); });
            el.append(this.slider);
            this.speedSel = document.createElement('select');
            this.speedSel.innerHTML = '<option value="1500">' + _pickLang({ zh: '慢', en: 'Slow' }) + '</option><option value="900" selected>' + _pickLang({ zh: '中', en: 'Medium' }) + '</option><option value="560">' + _pickLang({ zh: '快', en: 'Fast' }) + '</option>';
            this.speedSel.setAttribute('aria-label', _pickLang({ zh: '播放速度', en: 'Playback speed' }));
            el.append(this.speedSel);
            this.cnt = document.createElement('span'); this.cnt.className = 'cnt';
            el.append(this.cnt);
        }
        reset(initText) {
            this.pause();
            this.steps = [{ snap: null, kind: 'init',
                title: initText || { zh: '空樹', en: 'Empty tree' },
                detail: { zh: '插入節點，或載入一個劇本', en: 'Insert a node, or load a scenario' },
                hl: [], opId: 0, opLabel: { zh: '起點', en: 'Start' } }];
            this.cursor = 0; this.opSeq = 0;
            this.renderLog(); this.goTo(0, false);
        }
        runOp(label, fn, opt) {
            opt = opt || {};
            this.pause();
            if (this.cursor !== this.steps.length - 1) this.goTo(this.steps.length - 1, false);
            const opId = ++this.opSeq, start = this.steps.length;
            this.tree.onStep = s => this.steps.push(Object.assign({ snap: this.tree.serialize(), opId, opLabel: label }, s));
            fn();
            this.tree.onStep = null;
            this.renderLog();
            if (this.steps.length === start) { this.goTo(this.cursor, false); return; }
            if (opt.play === false) this.goTo(this.steps.length - 1, false);
            else this.play();
        }
        goTo(i, animate) {
            i = Math.max(0, Math.min(i, this.steps.length - 1));
            this.cursor = i;
            const st = this.steps[i];
            this.stage.applySnapshot(st.snap, st, animate !== false);
            // 描述橫幅
            const m = KIND_META[st.kind] || KIND_META.note;
            this.descEl.innerHTML = '';
            const badge = document.createElement('span'); badge.className = 'avlviz-badge ' + m.cls; badge.textContent = _pickLang(m.label);
            const txt = document.createElement('div'); txt.className = 'txt';
            const op = document.createElement('div'); op.className = 'op';
            op.textContent = st.opId
                ? _pickLang({ zh: `操作 ${st.opId}／${this.opSeq} ・ `, en: `Op ${st.opId}/${this.opSeq} · ` }) + _pickLang(st.opLabel)
                : _pickLang(st.opLabel);
            const b = document.createElement('b'); b.textContent = _pickLang(st.title);
            const p = document.createElement('p'); p.textContent = _pickLang(st.detail) || '';
            txt.append(op, b, p);
            this.descEl.append(badge, txt);
            // 進度
            this.slider.max = this.steps.length - 1; this.slider.value = i;
            this.cnt.textContent = _pickLang({ zh: `步 ${i} / ${this.steps.length - 1}`, en: `Step ${i} / ${this.steps.length - 1}` });
            this.rows.forEach((r, j) => r && r.classList.toggle('on', j === i));
            const row = this.rows[i];
            if (row) row.scrollIntoView({ block: 'nearest' });
        }
        renderLog() {
            this.logEl.innerHTML = ''; this.rows = [];
            let lastOp = -1;
            this.steps.forEach((st, i) => {
                if (i === 0) { this.rows.push(null); return; }
                if (st.opId !== lastOp) {
                    lastOp = st.opId;
                    const h = document.createElement('div'); h.className = 'op-h';
                    h.textContent = `${st.opId}. ` + _pickLang(st.opLabel);
                    this.logEl.append(h);
                }
                const r = document.createElement('button'); r.type = 'button'; r.className = 'row';
                const m = KIND_META[st.kind] || KIND_META.note;
                const d = document.createElement('span'); d.className = 'dot ' + m.cls;
                r.append(d, document.createTextNode(_pickLang(st.title)));
                r.addEventListener('click', () => { this.pause(); this.goTo(i); });
                this.logEl.append(r);
                this.rows.push(r);
            });
        }
        play() {
            if (this.cursor >= this.steps.length - 1) { this.goTo(0, false); }
            this.playing = true; this.playBtn.textContent = '⏸';
            const tick = () => {
                if (!this.playing) return;
                if (this.cursor >= this.steps.length - 1) { this.pause(); this.onPlayEnd && this.onPlayEnd(); return; }
                this.goTo(this.cursor + 1);
                this._timer = setTimeout(tick, +this.speedSel.value);
            };
            this._timer = setTimeout(tick, 60);
        }
        pause() { this.playing = false; clearTimeout(this._timer); if (this.playBtn) this.playBtn.textContent = '▶'; }
        prevOp() {
            this.pause();
            const cur = this.steps[this.cursor].opId;
            let i = this.cursor;
            while (i > 0 && this.steps[i - 1].opId === cur) i--;
            if (i === this.cursor && i > 0) { const p = this.steps[i - 1].opId; while (i > 0 && this.steps[i - 1].opId === p) i--; }
            this.goTo(i);
        }
        nextOp() {
            this.pause();
            const cur = this.steps[this.cursor].opId;
            let i = this.cursor;
            while (i < this.steps.length - 1 && this.steps[i + 1].opId === cur) i++;
            this.goTo(Math.min(i + 1, this.steps.length - 1));
        }
    }

    /* ================= 劇本（presets） ================= */
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    const PRESETS = [
        { id: 'll', name: { zh: 'LL：單右旋', en: 'LL: single right-rotation' },
          tip: { zh: '左左失衡，插入 1 後對根右旋一次', en: 'Left-left imbalance; inserting 1 triggers one right-rotation at the root' },
          seed: () => [3, 2], final: { op: 'insert', v: 1 } },
        { id: 'rr', name: { zh: 'RR：單左旋', en: 'RR: single left-rotation' },
          tip: { zh: '右右失衡，插入 3 後對根左旋一次', en: 'Right-right imbalance; inserting 3 triggers one left-rotation at the root' },
          seed: () => [1, 2], final: { op: 'insert', v: 3 } },
        { id: 'lr', name: { zh: 'LR：左右雙旋', en: 'LR: left-right double rotation' },
          tip: { zh: '左子偏右，插入 2 後先左旋子、再右旋根', en: 'Left child leans right; inserting 2 left-rotates the child then right-rotates the root' },
          seed: () => [3, 1], final: { op: 'insert', v: 2 } },
        { id: 'rl', name: { zh: 'RL：右左雙旋', en: 'RL: right-left double rotation' },
          tip: { zh: '右子偏左，插入 2 後先右旋子、再左旋根', en: 'Right child leans left; inserting 2 right-rotates the child then left-rotates the root' },
          seed: () => [1, 3], final: { op: 'insert', v: 2 } },
        { id: 'grow-1-15', name: { zh: '成長：依序插入 1–15', en: 'Growth: insert 1–15 in order' },
          tip: { zh: '從空樹看 AVL 靠一路旋轉維持平衡', en: 'Watch an AVL stay balanced through repeated rotations from empty' },
          seed: () => range(1, 15) },
        { id: 'delete-rot', name: { zh: '刪除觸發旋轉', en: 'Delete triggers a rotation' },
          tip: { zh: '刪一個節點造成失衡，靠旋轉修復', en: 'Deleting a node unbalances the tree; a rotation repairs it' },
          seed: () => range(1, 12), final: { op: 'delete', v: 1 } },
        { id: 'random-15', name: { zh: '隨機 15 顆', en: 'Random 15 nodes' }, tip: { zh: '', en: '' },
          seed: () => { const pool = range(1, 99); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } return pool.slice(0, 15); } },
    ];

    const api = { AVLTree, Stage, History, KIND_META, PRESETS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    global.AVLViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
