'use strict';
/*
 * Red-Black Tree 旋轉觀測站 — ported from the author's standalone
 * red-black-tree-visualizer (rb-core.js + Stage/History from its app.js).
 *
 * Exposes window.RBTreeViz = { RBTree, Stage, History, KIND_META, PRESETS }.
 * The DOM wiring (toolbar, presets, keyboard) lives in app.js renderTreeRB().
 *
 * Every rotation / recolor / graft emits one step via tree.onStep, so the
 * History can be rewound one step at a time.
 */
(function (global) {
    const RED = 'R', BLACK = 'B';
    const REDUCED = typeof matchMedia === 'function'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ================= 紅黑樹核心（CLRS 風格，含 NIL 哨兵） ================= */
    class RBTree {
        constructor() {
            const nil = { id: 0, key: null, color: BLACK, data: null };
            nil.left = nil.right = nil.parent = nil;
            this.NIL = nil;
            this.root = nil;
            this._id = 1;
            this.onStep = null; // (step) => void，於「該步驟的變動完成後」被呼叫
        }

        _lbl(n) {
            if (!n || n === this.NIL || n.key === null) return '·';
            return n.data ? n.data.name : String(n.key);
        }

        _emit(kind, title, detail, nodes, extra) {
            if (!this.onStep) return;
            const hl = (nodes || []).filter(n => n && n !== this.NIL).map(n => n.id);
            this.onStep(Object.assign({ kind, title, detail, hl }, extra || {}));
        }

        serialize() {
            const s = n => n === this.NIL ? null : {
                id: n.id, key: n.key, color: n.color,
                data: n.data ? Object.assign({}, n.data) : null,
                left: s(n.left), right: s(n.right)
            };
            return s(this.root);
        }

        size() { let c = 0; const w = n => { if (n !== this.NIL) { c++; w(n.left); w(n.right); } }; w(this.root); return c; }

        find(key) {
            let x = this.root;
            while (x !== this.NIL) {
                if (key === x.key) return x;
                x = key < x.key ? x.left : x.right;
            }
            return null;
        }

        min(x) {
            x = x || this.root;
            if (x === this.NIL) return null;
            while (x.left !== this.NIL) x = x.left;
            return x;
        }

        /* ---- 旋轉：唯一會改變樹形狀的操作單位 ---- */
        leftRotate(x, note) {
            const y = x.right, beta = y.left;
            x.right = beta;
            if (beta !== this.NIL) beta.parent = x;
            y.parent = x.parent;
            if (x.parent === this.NIL) this.root = y;
            else if (x === x.parent.left) x.parent.left = y;
            else x.parent.right = y;
            y.left = x;
            x.parent = y;
            const b = beta === this.NIL ? null : beta;
            this._emit('rotate-left',
                { zh: (note ? note.zh + '｜' : '') + `左旋 @ ${this._lbl(x)}`,
                  en: (note ? note.en + ' | ' : '') + `Left-rotate @ ${this._lbl(x)}` },
                { zh: `${this._lbl(y)} 升上來當這棵小樹的根，${this._lbl(x)} 下沉成它的左子` +
                    (b ? `；中間子樹 β（根 ${this._lbl(b)}）換邊，改掛到 ${this._lbl(x)} 的右側` : `；β 子樹是空的，不用搬`),
                  en: `${this._lbl(y)} rises to the subtree root and ${this._lbl(x)} sinks to be its left child` +
                    (b ? `; the middle subtree β (root ${this._lbl(b)}) switches sides, re-attaching as ${this._lbl(x)}'s right child` : `; the β subtree is empty, nothing to move`) },
                [x, y],
                { rot: 'L', pivot: x.id, riser: y.id, beta: b ? b.id : null });
        }

        rightRotate(x, note) {
            const y = x.left, beta = y.right;
            x.left = beta;
            if (beta !== this.NIL) beta.parent = x;
            y.parent = x.parent;
            if (x.parent === this.NIL) this.root = y;
            else if (x === x.parent.right) x.parent.right = y;
            else x.parent.left = y;
            y.right = x;
            x.parent = y;
            const b = beta === this.NIL ? null : beta;
            this._emit('rotate-right',
                { zh: (note ? note.zh + '｜' : '') + `右旋 @ ${this._lbl(x)}`,
                  en: (note ? note.en + ' | ' : '') + `Right-rotate @ ${this._lbl(x)}` },
                { zh: `${this._lbl(y)} 升上來當這棵小樹的根，${this._lbl(x)} 下沉成它的右子` +
                    (b ? `；中間子樹 β（根 ${this._lbl(b)}）換邊，改掛到 ${this._lbl(x)} 的左側` : `；β 子樹是空的，不用搬`),
                  en: `${this._lbl(y)} rises to the subtree root and ${this._lbl(x)} sinks to be its right child` +
                    (b ? `; the middle subtree β (root ${this._lbl(b)}) switches sides, re-attaching as ${this._lbl(x)}'s left child` : `; the β subtree is empty, nothing to move`) },
                [x, y],
                { rot: 'R', pivot: x.id, riser: y.id, beta: b ? b.id : null });
        }

        /* ---- 插入 ---- */
        insert(key, data) {
            const z = { id: this._id++, key, color: RED, data: data || null };
            z.left = z.right = z.parent = this.NIL;
            let y = this.NIL, x = this.root;
            while (x !== this.NIL) { y = x; x = key < x.key ? x.left : x.right; } // 相同 key 靠右
            z.parent = y;
            if (y === this.NIL) this.root = z;
            else if (key < y.key) y.left = z;
            else y.right = z;
            this._emit('insert',
                { zh: `插入 ${this._lbl(z)}（先塗紅）`, en: `Insert ${this._lbl(z)} (color it red first)` },
                { zh: y === this.NIL ? `樹是空的，${this._lbl(z)} 直接當根`
                        : `照 BST 規則走到底，掛在 ${this._lbl(y)} 的${key < y.key ? '左' : '右'}邊。新節點一律先塗紅，才不會破壞黑高度`,
                  en: y === this.NIL ? `The tree is empty, so ${this._lbl(z)} becomes the root directly`
                        : `Follow the BST rule to the bottom and attach as ${this._lbl(y)}'s ${key < y.key ? 'left' : 'right'} child. A new node is always colored red first so the black-height isn't disturbed` },
                [z, y]);
            this._insertFixup(z);
            return z;
        }

        _insertFixup(z) {
            while (z.parent.color === RED) {
                const p = z.parent, g = p.parent;
                if (p === g.left) {
                    const u = g.right;
                    if (u.color === RED) {
                        p.color = BLACK; u.color = BLACK; g.color = RED;
                        this._emit('recolor',
                            { zh: `Case 1：叔叔 ${this._lbl(u)} 也是紅的 → 只變色`,
                              en: `Case 1: uncle ${this._lbl(u)} is also red → recolor only` },
                            { zh: `父 ${this._lbl(p)}、叔 ${this._lbl(u)} 轉黑，祖父 ${this._lbl(g)} 轉紅。紅紅衝突沒有消失，而是往上丟給 ${this._lbl(g)} —— 這就是會一路往上竄的那種修復`,
                              en: `Parent ${this._lbl(p)} and uncle ${this._lbl(u)} become black, grandparent ${this._lbl(g)} becomes red. The red-red violation isn't gone — it propagates up to ${this._lbl(g)}, the kind of fix-up that can climb all the way up` },
                            [z, p, u, g]);
                        z = g;
                    } else {
                        if (z === p.right) {
                            z = p;
                            this.leftRotate(z, { zh: `Case 2：${this._lbl(z)} 在內側（LR 形）`, en: `Case 2: ${this._lbl(z)} is on the inner side (LR shape)` });
                        }
                        z.parent.color = BLACK; z.parent.parent.color = RED;
                        this._emit('recolor',
                            { zh: `Case 3：先變色，準備最後一旋`, en: `Case 3: recolor first, ready for the final rotation` },
                            { zh: `父 ${this._lbl(z.parent)} 轉黑、祖父 ${this._lbl(z.parent.parent)} 轉紅，等一下旋轉完顏色才會合法`,
                              en: `Parent ${this._lbl(z.parent)} becomes black and grandparent ${this._lbl(z.parent.parent)} becomes red; the colors will only be legal once the rotation is done` },
                            [z.parent, z.parent.parent]);
                        this.rightRotate(z.parent.parent, { zh: 'Case 3：外側（LL 形）', en: 'Case 3: outer case (LL shape)' });
                    }
                } else {
                    const u = g.left;
                    if (u.color === RED) {
                        p.color = BLACK; u.color = BLACK; g.color = RED;
                        this._emit('recolor',
                            { zh: `Case 1：叔叔 ${this._lbl(u)} 也是紅的 → 只變色`,
                              en: `Case 1: uncle ${this._lbl(u)} is also red → recolor only` },
                            { zh: `父 ${this._lbl(p)}、叔 ${this._lbl(u)} 轉黑，祖父 ${this._lbl(g)} 轉紅。紅紅衝突往上丟給 ${this._lbl(g)}`,
                              en: `Parent ${this._lbl(p)} and uncle ${this._lbl(u)} become black, grandparent ${this._lbl(g)} becomes red. The red-red violation propagates up to ${this._lbl(g)}` },
                            [z, p, u, g]);
                        z = g;
                    } else {
                        if (z === p.left) {
                            z = p;
                            this.rightRotate(z, { zh: `Case 2：${this._lbl(z)} 在內側（RL 形）`, en: `Case 2: ${this._lbl(z)} is on the inner side (RL shape)` });
                        }
                        z.parent.color = BLACK; z.parent.parent.color = RED;
                        this._emit('recolor',
                            { zh: `Case 3：先變色，準備最後一旋`, en: `Case 3: recolor first, ready for the final rotation` },
                            { zh: `父 ${this._lbl(z.parent)} 轉黑、祖父 ${this._lbl(z.parent.parent)} 轉紅，等一下旋轉完顏色才會合法`,
                              en: `Parent ${this._lbl(z.parent)} becomes black and grandparent ${this._lbl(z.parent.parent)} becomes red; the colors will only be legal once the rotation is done` },
                            [z.parent, z.parent.parent]);
                        this.leftRotate(z.parent.parent, { zh: 'Case 3：外側（RR 形）', en: 'Case 3: outer case (RR shape)' });
                    }
                }
            }
            if (this.root.color !== BLACK) {
                this.root.color = BLACK;
                this._emit('recolor',
                    { zh: `根一律塗黑`, en: `Always color the root black` },
                    { zh: `衝突竄到最頂了：把根 ${this._lbl(this.root)} 塗黑收尾，整棵樹黑高度 +1`,
                      en: `The violation reached the top: color the root ${this._lbl(this.root)} black to finish; the whole tree's black-height increases by 1` },
                    [this.root]);
            }
        }

        /* ---- 刪除 ---- */
        _transplant(u, v) {
            if (u.parent === this.NIL) this.root = v;
            else if (u === u.parent.left) u.parent.left = v;
            else u.parent.right = v;
            v.parent = u.parent;
        }

        deleteNode(z) {
            let y = z, yColor = y.color, x;
            const zl = this._lbl(z);
            if (z.left === this.NIL) {
                x = z.right;
                this._transplant(z, z.right);
                this._emit('delete',
                    { zh: `摘掉 ${zl}`, en: `Remove ${zl}` },
                    { zh: `${zl} 沒有左子，右子樹直接接上來頂位`, en: `${zl} has no left child, so its right subtree slots straight into its place` },
                    [x]);
            } else if (z.right === this.NIL) {
                x = z.left;
                this._transplant(z, z.left);
                this._emit('delete',
                    { zh: `摘掉 ${zl}`, en: `Remove ${zl}` },
                    { zh: `${zl} 沒有右子，左子樹直接接上來頂位`, en: `${zl} has no right child, so its left subtree slots straight into its place` },
                    [x]);
            } else {
                y = this.min(z.right); yColor = y.color; x = y.right;
                if (y.parent === z) {
                    x.parent = y;
                } else {
                    this._transplant(y, y.right);
                    y.right = z.right; y.right.parent = y;
                }
                this._transplant(z, y);
                y.left = z.left; y.left.parent = y;
                y.color = z.color;
                this._emit('delete',
                    { zh: `摘掉 ${zl}：後繼 ${this._lbl(y)} 頂上`, en: `Remove ${zl}: successor ${this._lbl(y)} takes its place` },
                    { zh: `${zl} 有兩個小孩，由右子樹最小的 ${this._lbl(y)} 接手它的位置、連顏色一起繼承`,
                      en: `${zl} has two children, so ${this._lbl(y)} — the minimum of its right subtree — takes over its position, inheriting its color too` },
                    [y]);
            }
            if (yColor === BLACK) this._deleteFixup(x);
            else this._emit('note',
                { zh: `不用修復`, en: `No fix-up needed` },
                { zh: `被摘掉的位置原本是紅的，黑高度沒變，直接收工`, en: `The removed spot was red, so the black-height is unchanged — done` },
                []);
            return z;
        }

        delete(key) {
            const z = this.find(key);
            if (!z) return null;
            return this.deleteNode(z);
        }

        _deleteFixup(x) {
            while (x !== this.root && x.color === BLACK) {
                const p = x.parent;
                if (x === p.left) {
                    let w = p.right;
                    if (w.color === RED) {
                        w.color = BLACK; p.color = RED;
                        this._emit('recolor',
                            { zh: `Delete Case 1：兄弟 ${this._lbl(w)} 是紅的`, en: `Delete Case 1: sibling ${this._lbl(w)} is red` },
                            { zh: `先把兄弟 ${this._lbl(w)} 轉黑、父 ${this._lbl(p)} 轉紅，再旋轉把紅兄弟轉開，換一個黑兄弟來處理`,
                              en: `First color sibling ${this._lbl(w)} black and parent ${this._lbl(p)} red, then rotate to swing the red sibling out of the way, leaving a black sibling to handle` },
                            [w, p]);
                        this.leftRotate(p, { zh: 'Delete Case 1', en: 'Delete Case 1' });
                        w = x.parent.right;
                    }
                    if (w.left.color === BLACK && w.right.color === BLACK) {
                        w.color = RED;
                        this._emit('recolor',
                            { zh: `Delete Case 2：兄弟 ${this._lbl(w)} 一家全黑 → 兄弟轉紅`, en: `Delete Case 2: sibling ${this._lbl(w)}'s whole family is black → color the sibling red` },
                            { zh: `這邊少一層黑，乾脆把兄弟 ${this._lbl(w)} 也轉紅，讓整段都少一層 —— 「缺黑」的問題往上丟給 ${this._lbl(x.parent)}，可能一路竄到根`,
                              en: `This side is short one black, so just color sibling ${this._lbl(w)} red too, making the whole segment short one — the "missing black" problem propagates up to ${this._lbl(x.parent)}, and may climb all the way to the root` },
                            [w, x.parent]);
                        x = x.parent;
                    } else {
                        if (w.right.color === BLACK) {
                            w.left.color = BLACK; w.color = RED;
                            this._emit('recolor',
                                { zh: `Delete Case 3：紅侄在內側，先調色`, en: `Delete Case 3: the red nephew is on the inner side, recolor first` },
                                { zh: `${this._lbl(w.left)} 轉黑、${this._lbl(w)} 轉紅，準備把紅侄旋到外側`,
                                  en: `${this._lbl(w.left)} becomes black and ${this._lbl(w)} becomes red, ready to rotate the red nephew to the outer side` },
                                [w.left, w]);
                            this.rightRotate(w, { zh: 'Delete Case 3', en: 'Delete Case 3' });
                            w = x.parent.right;
                        }
                        w.color = x.parent.color; x.parent.color = BLACK; w.right.color = BLACK;
                        this._emit('recolor',
                            { zh: `Delete Case 4：定色，準備收尾旋轉`, en: `Delete Case 4: fix the colors, ready for the final rotation` },
                            { zh: `兄弟 ${this._lbl(w)} 接收父的顏色，父 ${this._lbl(x.parent)} 與紅侄 ${this._lbl(w.right)} 轉黑`,
                              en: `Sibling ${this._lbl(w)} takes the parent's color, and parent ${this._lbl(x.parent)} and red nephew ${this._lbl(w.right)} both become black` },
                            [w, x.parent, w.right]);
                        this.leftRotate(x.parent, { zh: 'Delete Case 4', en: 'Delete Case 4' });
                        x = this.root;
                    }
                } else {
                    let w = p.left;
                    if (w.color === RED) {
                        w.color = BLACK; p.color = RED;
                        this._emit('recolor',
                            { zh: `Delete Case 1：兄弟 ${this._lbl(w)} 是紅的`, en: `Delete Case 1: sibling ${this._lbl(w)} is red` },
                            { zh: `先把兄弟 ${this._lbl(w)} 轉黑、父 ${this._lbl(p)} 轉紅，再旋轉把紅兄弟轉開，換一個黑兄弟來處理`,
                              en: `First color sibling ${this._lbl(w)} black and parent ${this._lbl(p)} red, then rotate to swing the red sibling out of the way, leaving a black sibling to handle` },
                            [w, p]);
                        this.rightRotate(p, { zh: 'Delete Case 1', en: 'Delete Case 1' });
                        w = x.parent.left;
                    }
                    if (w.right.color === BLACK && w.left.color === BLACK) {
                        w.color = RED;
                        this._emit('recolor',
                            { zh: `Delete Case 2：兄弟 ${this._lbl(w)} 一家全黑 → 兄弟轉紅`, en: `Delete Case 2: sibling ${this._lbl(w)}'s whole family is black → color the sibling red` },
                            { zh: `這邊少一層黑，乾脆把兄弟 ${this._lbl(w)} 也轉紅，讓整段都少一層 —— 「缺黑」的問題往上丟給 ${this._lbl(x.parent)}，可能一路竄到根`,
                              en: `This side is short one black, so just color sibling ${this._lbl(w)} red too, making the whole segment short one — the "missing black" problem propagates up to ${this._lbl(x.parent)}, and may climb all the way to the root` },
                            [w, x.parent]);
                        x = x.parent;
                    } else {
                        if (w.left.color === BLACK) {
                            w.right.color = BLACK; w.color = RED;
                            this._emit('recolor',
                                { zh: `Delete Case 3：紅侄在內側，先調色`, en: `Delete Case 3: the red nephew is on the inner side, recolor first` },
                                { zh: `${this._lbl(w.right)} 轉黑、${this._lbl(w)} 轉紅，準備把紅侄旋到外側`,
                                  en: `${this._lbl(w.right)} becomes black and ${this._lbl(w)} becomes red, ready to rotate the red nephew to the outer side` },
                                [w.right, w]);
                            this.leftRotate(w, { zh: 'Delete Case 3', en: 'Delete Case 3' });
                            w = x.parent.left;
                        }
                        w.color = x.parent.color; x.parent.color = BLACK; w.left.color = BLACK;
                        this._emit('recolor',
                            { zh: `Delete Case 4：定色，準備收尾旋轉`, en: `Delete Case 4: fix the colors, ready for the final rotation` },
                            { zh: `兄弟 ${this._lbl(w)} 接收父的顏色，父 ${this._lbl(x.parent)} 與紅侄 ${this._lbl(w.left)} 轉黑`,
                              en: `Sibling ${this._lbl(w)} takes the parent's color, and parent ${this._lbl(x.parent)} and red nephew ${this._lbl(w.left)} both become black` },
                            [w, x.parent, w.left]);
                        this.rightRotate(x.parent, { zh: 'Delete Case 4', en: 'Delete Case 4' });
                        x = this.root;
                    }
                }
            }
            if (x !== this.NIL && x.color === RED) {
                x.color = BLACK;
                this._emit('recolor',
                    { zh: `把 ${this._lbl(x)} 塗黑，補回缺的那層黑`, en: `Color ${this._lbl(x)} black, making up for the missing black` },
                    { zh: `紅節點吸收掉多出來的黑，修復到此為止`, en: `The red node absorbs the extra black; the fix-up ends here` },
                    [x]);
            }
        }
    }

    const KIND_META = {
        'insert': { cls: 'k-insert', label: '插入' },
        'recolor': { cls: 'k-recolor', label: '變色' },
        'rotate-left': { cls: 'k-rotate', label: '左旋' },
        'rotate-right': { cls: 'k-rotate', label: '右旋' },
        'delete': { cls: 'k-delete', label: '刪除' },
        'note': { cls: 'k-note', label: '說明' },
        'init': { cls: 'k-note', label: '起點' },
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
            this.empty.className = 'rbviz-empty';
            this.empty.textContent = this.opts.emptyText || '空樹';
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
                nodes.push({ id: n.id, key: n.key, color: n.color, data: n.data, d, i: idx++, parentId });
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
                if (n.data) el.g.dataset.name = n.data.name;
                el.key.textContent = n.data ? n.data.name : n.key;
                if (el.sub) el.sub.textContent = n.data && n.data.vr != null ? n.data.vr : '';
                el.g.setAttribute('class', 'nd ' + n.color +
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
                t.textContent = '▲ 下一個上場';
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
        // and again whenever renderTreeRB rebuilds the visualization host
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
            mk('⏮', '上一個操作的開頭', () => this.prevOp());
            mk('◀', '上一步（← 鍵）', () => { this.pause(); this.goTo(this.cursor - 1); });
            this.playBtn = mk('▶', '播放 / 暫停', () => this.playing ? this.pause() : this.play());
            this.playBtn.classList.add('play');
            mk('▶︎', '下一步（→ 鍵）', () => { this.pause(); this.goTo(this.cursor + 1); });
            mk('⏭', '下一個操作的開頭', () => this.nextOp());
            this.slider = document.createElement('input');
            this.slider.type = 'range'; this.slider.min = 0; this.slider.max = 0; this.slider.value = 0;
            this.slider.setAttribute('aria-label', '步驟位置');
            this.slider.addEventListener('input', () => { this.pause(); this.goTo(+this.slider.value, false); });
            el.append(this.slider);
            this.speedSel = document.createElement('select');
            this.speedSel.innerHTML = '<option value="1500">慢</option><option value="900" selected>中</option><option value="560">快</option>';
            this.speedSel.setAttribute('aria-label', '播放速度');
            el.append(this.speedSel);
            this.cnt = document.createElement('span'); this.cnt.className = 'cnt';
            el.append(this.cnt);
        }
        reset(initText) {
            this.pause();
            this.steps = [{ snap: null, kind: 'init', title: initText || '空樹', detail: '插入節點，或載入一個劇本', hl: [], opId: 0, opLabel: '起點' }];
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
            const badge = document.createElement('span'); badge.className = 'rbviz-badge ' + m.cls; badge.textContent = m.label;
            const txt = document.createElement('div'); txt.className = 'txt';
            const op = document.createElement('div'); op.className = 'op';
            op.textContent = st.opId ? `操作 ${st.opId}／${this.opSeq} ・ ${st.opLabel}` : st.opLabel;
            const b = document.createElement('b'); b.textContent = st.title;
            const p = document.createElement('p'); p.textContent = st.detail || '';
            txt.append(op, b, p);
            this.descEl.append(badge, txt);
            // 進度
            this.slider.max = this.steps.length - 1; this.slider.value = i;
            this.cnt.textContent = `步 ${i} / ${this.steps.length - 1}`;
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
                    h.textContent = `${st.opId}. ${st.opLabel}`;
                    this.logEl.append(h);
                }
                const r = document.createElement('button'); r.type = 'button'; r.className = 'row';
                const m = KIND_META[st.kind] || KIND_META.note;
                const d = document.createElement('span'); d.className = 'dot ' + m.cls;
                r.append(d, document.createTextNode(st.title));
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
    const DEL31 = [4, 22, 15, 17, 16, 14, 21, 9, 12, 29, 31, 24, 13, 7, 27, 1, 25, 3, 8, 6, 20, 19, 10, 28, 23, 30, 18, 2, 11, 5, 26];
    const DEL16 = [10, 1, 11, 14, 4, 12, 2, 6, 3, 7, 5, 8, 15, 16, 9, 13];
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

    // seed: values inserted silently (play:false)。
    // final: 壓軸操作 —— 載入後停在它前一步，按 ▶ 才播放；沒有 final 的劇本停在第 0 步從頭看。
    const PRESETS = [
        {
            id: 'grow-1-15',
            name: { zh: '樹的成長：依序插入 1–15', en: 'Tree growth: insert 1–15 in order' },
            tip: '從空樹看整棵樹怎麼靠旋轉長平衡 —— 播放中隨時可以暫停、倒帶',
            seed: () => range(1, 15),
        },
        {
            id: 'recolor-18',
            name: { zh: '深樹連鎖 I：變色一路爬頂（18 顆）', en: 'Recolor cascade I: recolor climbs to the root (18 nodes)' },
            tip: '看紅紅衝突連兩次 Case 1 往上竄，最後在頂端旋轉收尾',
            seed: () => range(1, 17), final: { op: 'insert', v: 18 },
        },
        {
            id: 'recolor-38',
            name: { zh: '深樹連鎖 II：更深更長（38 顆）', en: 'Recolor cascade II: deeper and longer (38 nodes)' },
            tip: '三連 Case 1 變色爬了三層，最後旋轉 —— 這就是深樹的連鎖修復',
            seed: () => range(1, 37), final: { op: 'insert', v: 38 },
        },
        {
            id: 'delete-3rot',
            name: { zh: '刪除三連旋（31 顆）', en: 'Delete → three consecutive rotations (31 nodes)' },
            tip: '一次刪除觸發連續三次旋轉 —— 刪除是紅黑樹最兇的路徑',
            seed: () => DEL31.slice(), final: { op: 'delete', v: 15 },
        },
        {
            id: 'delete-recolor',
            name: { zh: '刪除變色上竄（16 顆）', en: 'Delete: recolor propagates up (16 nodes)' },
            tip: '「缺一層黑」靠 Delete Case 2 往上丟兩次，中間夾一次旋轉',
            seed: () => DEL16.slice(), final: { op: 'delete', v: 1 },
        },
        {
            id: 'random-15',
            name: { zh: '隨機 15 顆', en: 'Random 15 nodes' },
            tip: '',
            seed: () => {
                const pool = Array.from({ length: 99 }, (_, i) => i + 1);
                for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
                return pool.slice(0, 15);
            },
        },
    ];

    const api = { RBTree, Stage, History, KIND_META, PRESETS, RED, BLACK };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    global.RBTreeViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
