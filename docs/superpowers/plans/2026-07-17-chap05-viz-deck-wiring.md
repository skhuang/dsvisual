# chap05 viz deck-wiring + slides_db — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 5 new chap05 viz `slides_db` explainer decks (so they're lint-valid), then wire all 12 chap05-relevant viz into the ds2026 `chap05_trees_core.md` deck via `<!-- viz: -->` directives.

**Architecture:** Two independent PRs. Part A (dsvisual): append 5 bilingual `slides_db.js` entries and regenerate `slides/**` + `slides_rendered.js` with `build_slides.js`. Part B (ds2026): insert 12 `<!-- viz: id "Title" -->` directives into the lecture deck.

**Tech Stack:** `slides_db.js` (hand-written structured slide data; `{zh,en}` leaves, inline `$…$` LaTeX), `build_slides.js` (Node generator), `pipeline/lint.js` (viz-id validity), ds2026 Marp lecture `.md`.

## Global Constraints

- **Two independent PRs**, dsvisual (Task 1) then ds2026 (Task 2). Part A must merge/exist before Part B is lint-checked (the directives reference the new viz's slide files).
- **dsvisual has a concurrent refactor session** — targeted `git add` of only the named files; NEVER `git add -A`/`.`/`-u`; run `git status` before committing.
- **ds2026 has protected slideshow notebooks** (never touch/stage them); the Part B edit is ONLY `lectures/chap05/chap05_trees_core.md`, additive (directive lines only — do not alter pseudocode/prose/diagrams).
- All new `slides_db` text is bilingual `{zh,en}`. Do NOT hand-edit generated `slides/**` or `js/slides_rendered.js` — they come from `build_slides.js`.
- `slides_db.js` entries are `SLIDES_DB["<id>"] = { … };` assignments; append the 5 new ones immediately before the final `module.exports = SLIDES_DB;` line.

---

### Task 1: dsvisual — `slides_db.js` entries for the 5 new viz + regenerate

**Branch:** `feat/chap05-new-viz-slides` (already checked out; the spec commit is here).

**Files:**
- Modify: `slides_db.js` (append 5 `SLIDES_DB["<id>"] = {…};` blocks before `module.exports = SLIDES_DB;`)
- Regenerate (via `npm run build:slides`, do not hand-edit): `slides/en/{tree-array-rep,tree-reconstruct,tree-catalan,decision-tree-coins,tree-copy-equal}.md`, the same 5 under `slides/zh/`, and `js/slides_rendered.js`.

- [ ] **Step 1: Append the 5 slides_db entries** to `slides_db.js`, immediately before the final `module.exports = SLIDES_DB;` line:

```js
SLIDES_DB["tree-array-rep"] = {
  "category": "Trees",
  "title": { "zh": "循序(陣列)表示", "en": "Sequential (Array) Representation" },
  "slides": [
    { "heading": { "zh": "用陣列存二元樹", "en": "Storing a Binary Tree in an Array" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "把二元樹放進 1-based 陣列,節點位置本身就編碼了結構,不需指標。", "en": "Place a binary tree in a 1-indexed array; the position itself encodes the structure — no pointers needed." } },
        { "type": "bullets", "items": [
          { "zh": "節點 $i$ 的左子在 $2i$", "en": "node $i$'s left child at $2i$" },
          { "zh": "右子在 $2i+1$", "en": "right child at $2i+1$" },
          { "zh": "父節點在 $\\lfloor i/2 \\rfloor$", "en": "parent at $\\lfloor i/2 \\rfloor$" }
        ] }
      ] },
    { "heading": { "zh": "索引運算", "en": "Index Arithmetic" },
      "blocks": [
        { "type": "code", "lang": "cpp", "file": "tree_array_rep.cpp", "code": "int left(int i)  { return 2*i; }\nint right(int i) { return 2*i + 1; }\nint parent(int i){ return i/2; }" },
        { "type": "note", "text": { "zh": "空位以 \"-\" 佔位;層序讀入 token,位置 k 即索引 k。", "en": "Empty slots hold \"-\"; read level-order tokens, position k = index k." } }
      ] },
    { "heading": { "zh": "偏斜樹的浪費", "en": "Waste in a Skewed Tree" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "完全樹沒有浪費;偏斜樹很浪費:高度 $h$ 的樹可能需要 $2^{h+1}-1$ 個槽,卻只有 $h+1$ 個節點。", "en": "A complete tree wastes nothing; a skewed tree is wasteful: a height-$h$ tree may need $2^{h+1}-1$ slots while holding as few as $h+1$ nodes." } }
      ] },
    { "heading": { "zh": "複雜度", "en": "Complexity" },
      "blocks": [
        { "type": "table", "headers": [ { "zh": "面向", "en": "Aspect" }, { "zh": "成本", "en": "Cost" } ],
          "rows": [
            [ { "zh": "索引運算", "en": "Index ops" }, { "zh": "O(1)", "en": "O(1)" } ],
            [ { "zh": "空間(最壞)", "en": "Space (worst)" }, { "zh": "$O(2^h)$", "en": "$O(2^h)$" } ]
          ] }
      ] }
  ]
};
SLIDES_DB["tree-reconstruct"] = {
  "category": "Trees",
  "title": { "zh": "由兩序列重建二元樹", "en": "Reconstruct a Tree from Two Traversals" },
  "slides": [
    { "heading": { "zh": "問題", "en": "The Problem" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "給定相異鍵的兩個走訪序列,重建原二元樹。", "en": "Given two traversal sequences of a tree with distinct keys, rebuild the tree." } },
        { "type": "bullets", "items": [
          { "zh": "前序+中序:唯一(任意二元樹)", "en": "preorder+inorder: unique (any binary tree)" },
          { "zh": "後序+中序:唯一(任意二元樹)", "en": "postorder+inorder: unique (any binary tree)" },
          { "zh": "前序+後序:僅對完全二元樹唯一", "en": "preorder+postorder: unique only for full binary trees" }
        ] }
      ] },
    { "heading": { "zh": "前序+中序", "en": "Preorder + Inorder" },
      "blocks": [
        { "type": "steps", "items": [
          { "zh": "前序頭是根。", "en": "The preorder head is the root." },
          { "zh": "在中序找到根:左段為左子樹、右段為右子樹。", "en": "Find the root in inorder; the left part is the left subtree, the right part the right subtree." },
          { "zh": "對兩段遞迴。", "en": "Recurse on both parts." }
        ] }
      ] },
    { "heading": { "zh": "前序+後序的歧義", "en": "Preorder + Postorder Ambiguity" },
      "blocks": [
        { "type": "note", "text": { "zh": "前序+後序只有在「完全二元樹(每節點 0 或 2 子)」時唯一;單一子節點無法判定是左是右。", "en": "Preorder+postorder is unique only for full binary trees (every node 0 or 2 children); a single-child node can't be placed unambiguously." } }
      ] },
    { "heading": { "zh": "複雜度", "en": "Complexity" },
      "blocks": [
        { "type": "bullets", "items": [
          { "zh": "時間 O(n)(以雜湊表定位根)", "en": "Time O(n) (hash-map to locate the root)" },
          { "zh": "空間 O(n)", "en": "Space O(n)" }
        ] }
      ] }
  ]
};
SLIDES_DB["tree-catalan"] = {
  "category": "Trees",
  "title": { "zh": "計數二元樹(Catalan 數)", "en": "Counting Binary Trees (Catalan)" },
  "slides": [
    { "heading": { "zh": "有幾種形狀?", "en": "How Many Shapes?" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "$n$ 個節點的相異二元樹形狀數,正是第 $n$ 個 Catalan 數 $C_n$。", "en": "The number of distinct binary-tree shapes with $n$ nodes is the $n$th Catalan number $C_n$." } }
      ] },
    { "heading": { "zh": "遞迴", "en": "The Recurrence" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "依根分割:左 $i$ 個、右 $n-1-i$ 個,任一左形狀配任一右形狀。", "en": "Split on the root: $i$ nodes left, $n-1-i$ right; any left shape pairs with any right shape." } },
        { "type": "math", "tex": "C_n = \\sum_{i=0}^{n-1} C_i \\cdot C_{n-1-i}", "caption": { "zh": "卷積遞迴", "en": "convolution recurrence" } }
      ] },
    { "heading": { "zh": "封閉形與數列", "en": "Closed Form & Sequence" },
      "blocks": [
        { "type": "math", "tex": "C_n = \\frac{1}{n+1}\\binom{2n}{n}", "caption": { "zh": "封閉形", "en": "closed form" } },
        { "type": "paragraph", "text": { "zh": "數列:1, 1, 2, 5, 14, 42, 132, 429, …", "en": "Sequence: 1, 1, 2, 5, 14, 42, 132, 429, …" } }
      ] },
    { "heading": { "zh": "還出現在哪裡", "en": "Where Else Catalan Appears" },
      "blocks": [
        { "type": "bullets", "items": [
          { "zh": "合法括號序列", "en": "balanced parenthesis sequences" },
          { "zh": "凸多邊形的三角剖分", "en": "triangulations of a convex polygon" },
          { "zh": "不越過對角線的格路徑", "en": "monotonic lattice paths under the diagonal" }
        ] }
      ] }
  ]
};
SLIDES_DB["decision-tree-coins"] = {
  "category": "Trees",
  "title": { "zh": "八枚硬幣決策樹", "en": "8-Coins Decision Tree" },
  "slides": [
    { "heading": { "zh": "問題", "en": "The Puzzle" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "8 枚硬幣中有一枚偽幣(較重或較輕);用等臂天平在 3 次秤重內找出它與方向。", "en": "Among 8 coins one is counterfeit (heavier or lighter); using an equal-arm balance, find it and its direction in 3 weighings." } }
      ] },
    { "heading": { "zh": "三分決策樹", "en": "A Ternary Decision Tree" },
      "blocks": [
        { "type": "bullets", "items": [
          { "zh": "每次秤重有三種結果:左重 / 平衡 / 右重", "en": "each weighing has three outcomes: left down / balanced / right down" },
          { "zh": "內部節點是一次秤重,三條邊是三種結果", "en": "internal nodes are weighings; the three edges are the outcomes" },
          { "zh": "葉節點指出偽幣與較重/較輕", "en": "leaves name the fake coin and heavy/light" }
        ] }
      ] },
    { "heading": { "zh": "EIGHTCOINS 程序", "en": "The EIGHTCOINS Procedure" },
      "blocks": [
        { "type": "steps", "items": [
          { "zh": "秤 {a,b,c} 對 {d,e,f}。", "en": "Weigh {a,b,c} vs {d,e,f}." },
          { "zh": "平衡 → 偽幣在 {g,h};否則在較重/較輕的那一組。", "en": "Balanced → fake in {g,h}; else in the heavier/lighter group." },
          { "zh": "第二次秤重縮小範圍,第三次與一枚已知好幣比較定案(COMP)。", "en": "A second weighing narrows it; a third compares against a known-good coin (COMP)." }
        ] }
      ] },
    { "heading": { "zh": "資訊理論最佳性", "en": "Information-Theoretic Optimality" },
      "blocks": [
        { "type": "note", "text": { "zh": "3 次三分結果共有 $3^3 = 27$ 個葉,足以區分 16 種答案(8 幣 × 重/輕)。", "en": "Three ternary weighings give $3^3 = 27$ leaves, enough to distinguish the 16 answers (8 coins × heavy/light)." } },
        { "type": "math", "tex": "3^3 = 27 \\geq 16", "caption": { "zh": "為何 3 次足夠", "en": "why 3 weighings suffice" } }
      ] }
  ]
};
SLIDES_DB["tree-copy-equal"] = {
  "category": "Trees",
  "title": { "zh": "二元樹 COPY 與 EQUAL", "en": "Tree COPY & EQUAL" },
  "slides": [
    { "heading": { "zh": "兩個配對操作", "en": "Two Paired Operations" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "COPY 深拷貝一棵樹;EQUAL 判斷兩棵樹是否結構與內容皆相同。", "en": "COPY makes a deep copy of a tree; EQUAL tests whether two trees are identical in structure and content." } }
      ] },
    { "heading": { "zh": "COPY(深拷貝)", "en": "COPY (Deep Copy)" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "先建新節點,再遞迴拷貝左右子樹;得到完全獨立的樹,且 equal(原, 副) 恆為真。", "en": "Create the node, then recursively copy the left and right subtrees; the result is fully independent and equal(original, copy) is always true." } },
        { "type": "code", "lang": "cpp", "file": "tree_copy_equal.cpp", "code": "TreeNode* copyTree(TreeNode* t) {\n    if (!t) return nullptr;\n    TreeNode* c = new TreeNode{ t->val };\n    c->left  = copyTree(t->left);\n    c->right = copyTree(t->right);\n    return c;\n}" }
      ] },
    { "heading": { "zh": "EQUAL(結構 + 內容)", "en": "EQUAL (Structure + Content)" },
      "blocks": [
        { "type": "steps", "items": [
          { "zh": "兩者皆空 → 相等。", "en": "Both empty → equal." },
          { "zh": "一空一非空 → 結構不同。", "en": "One empty, one not → structural mismatch." },
          { "zh": "值不同 → 值不同。", "en": "Different values → value mismatch." },
          { "zh": "否則遞迴比較左右子樹。", "en": "Otherwise recurse on both subtrees." }
        ] }
      ] },
    { "heading": { "zh": "複雜度", "en": "Complexity" },
      "blocks": [
        { "type": "table", "headers": [ { "zh": "操作", "en": "Operation" }, { "zh": "時間", "en": "Time" }, { "zh": "空間", "en": "Space" } ],
          "rows": [
            [ { "zh": "COPY", "en": "COPY" }, { "zh": "O(n)", "en": "O(n)" }, { "zh": "O(h)", "en": "O(h)" } ],
            [ { "zh": "EQUAL", "en": "EQUAL" }, { "zh": "O(n)", "en": "O(n)" }, { "zh": "O(h)", "en": "O(h)" } ]
          ] }
      ] }
  ]
};
```

- [ ] **Step 2: Verify `slides_db.js` still parses** (a syntax error would break the browser + build):

Run: `node -e "const d=require('./slides_db.js'); const ids=['tree-array-rep','tree-reconstruct','tree-catalan','decision-tree-coins','tree-copy-equal']; for(const id of ids){ if(!d[id]||!Array.isArray(d[id].slides)||d[id].slides.length<4) throw new Error('bad '+id); } console.log('OK 5 entries, each >=4 slides');"`
Expected: `OK 5 entries, each >=4 slides`.

- [ ] **Step 3: Regenerate the slide files**

Run: `npm run build:slides`
Expected: exits cleanly. It writes `slides/en/<id>.md` + `slides/zh/<id>.md` for every viz and `js/slides_rendered.js`.

- [ ] **Step 4: Verify the 5 new slide files exist and the diff is clean**

Run:
```bash
cd /Users/skhuang/course/dsvisual
for id in tree-array-rep tree-reconstruct tree-catalan decision-tree-coins tree-copy-equal; do
  test -f "slides/en/$id.md" && test -f "slides/zh/$id.md" && echo "  ✓ $id" || echo "  ✗ $id MISSING"
done
node -e "const {discoverVizIds}=require('./pipeline/lint.js'); const s=discoverVizIds('.'); const ok=['tree-array-rep','tree-reconstruct','tree-catalan','decision-tree-coins','tree-copy-equal'].every(id=>s.has(id)); console.log(ok?'lint sees all 5 new ids':'MISSING from lint set'); process.exit(ok?0:1);"
git status --short
```
Expected: all 5 `✓`; `lint sees all 5 new ids`; `git status` shows ONLY `slides_db.js`, the 10 new `slides/{en,zh}/<id>.md` files, and `js/slides_rendered.js` (plus the already-committed spec). If `build:slides` shows MODIFIED (not just added) for OTHER viz's `slides/**` files, STOP and report — that would be unrelated regeneration churn.

- [ ] **Step 5: Confirm no regression**

Run: `npm run test:unit`
Expected: green (unchanged count).

- [ ] **Step 6: Commit** (targeted — only the slides_db source + generated outputs):

```bash
cd /Users/skhuang/course/dsvisual
git add slides_db.js slides/en/tree-array-rep.md slides/en/tree-reconstruct.md slides/en/tree-catalan.md slides/en/decision-tree-coins.md slides/en/tree-copy-equal.md slides/zh/tree-array-rep.md slides/zh/tree-reconstruct.md slides/zh/tree-catalan.md slides/zh/decision-tree-coins.md slides/zh/tree-copy-equal.md js/slides_rendered.js
git commit -m "feat(dsvisual): slides_db explainer decks for the 5 new chap05 tree viz"
```

---

### Task 2: ds2026 — viz directives in `chap05_trees_core.md`

**Repo/Branch:** `/Users/skhuang/course/ds2026`; create `git checkout -b feat/chap05-viz-links main` (do NOT reuse the dsvisual branch).

**Files:**
- Modify: `lectures/chap05/chap05_trees_core.md` (insert 12 directive lines)

**Interfaces:**
- Consumes (Task 1): the 5 new viz now have `slides/**` files in dsvisual, so all 12 ids are lint-valid.

- [ ] **Step 1: Insert the 12 viz directives.** For each row, add the directive line **on its own line immediately after the heading line** of the named slide (a blank line then the directive is fine; keep it within that slide, before the next `---`). Anchor on the exact heading text:

| After heading (exact) | Insert line |
|---|---|
| `# 5.3 Sequential (Array) Representation` | `<!-- viz: tree-array-rep "Array Representation" -->` |
| `# Recursive Traversal Algorithms` | `<!-- viz: tree-traversal "Tree Traversal" -->` |
| `# POSTORDER_EVAL` | `<!-- viz: tree-expression "Expression Tree (Boolean mode)" -->` |
| `# 5.5 Building More: COPY and EQUAL` | `<!-- viz: tree-copy-equal "Tree COPY & EQUAL" -->` |
| `# Binary Search Tree (BST) — A Sneak Peek` | `<!-- viz: tree-bst "Binary Search Tree" -->` |
| `# 5.6 Threaded Binary Trees — Idea` | `<!-- viz: tree-threaded "Threaded Binary Tree" -->` |
| `# 5.7 Representing a General Tree as a Binary Tree` | `<!-- viz: tree-general-binary "General ↔ Binary Tree" -->` |
| `# 5.8.1 Disjoint Set Representation — Union-Find` | `<!-- viz: tree-dsu "Disjoint Set (Union-Find)" -->` |
| `# 5.8.2 Decision Trees — The 8-Coins Puzzle` | `<!-- viz: decision-tree-coins "8-Coins Decision Tree" -->` |
| `# 5.8.3 Game Trees — The Game of Nim` | `<!-- viz: game-tree "Game Tree (Minimax / α-β)" -->` |
| `# 5.9 Counting Binary Trees — The Problem` | `<!-- viz: tree-catalan "Counting Trees (Catalan)" -->` |
| `# Unique Reconstruction from Two Traversals` | `<!-- viz: tree-reconstruct "Reconstruct Tree" -->` |

Each heading is unique in the file (verified). Do NOT modify any pseudocode/prose/diagram — insert only the 12 lines.

- [ ] **Step 2: Verify the directives are present and additive-only**

Run:
```bash
cd /Users/skhuang/course/ds2026
echo "directive count: $(grep -c '<!-- viz:' lectures/chap05/chap05_trees_core.md)  (expect 12)"
for id in tree-array-rep tree-traversal tree-expression tree-copy-equal tree-bst tree-threaded tree-general-binary tree-dsu decision-tree-coins game-tree tree-catalan tree-reconstruct; do
  grep -q "viz: $id " lectures/chap05/chap05_trees_core.md && echo "  ✓ $id" || echo "  ✗ $id MISSING"
done
git diff --stat            # expect only chap05_trees_core.md, +12 lines
git status --short         # expect only that one file (no protected notebooks)
```
Expected: count 12; all 12 `✓`; diff touches only `lectures/chap05/chap05_trees_core.md` with 12 insertions (0 deletions).

- [ ] **Step 3: Verify lint-clean against dsvisual (Part A must be present in the dsvisual working tree/merged)**

Run: `node /Users/skhuang/course/dsvisual/pipeline/lint.js lectures/chap05/chap05_trees_core.md 2>&1 || true`
Expected: no `viz: unknown id` errors for any of the 12 (the 5 new ids resolve because Task 1 created their `slides/**` files). If the lint script needs a dsvisual-dir argument or isn't directly runnable this way, note it in the report and fall back to confirming each id has `slides/en/<id>.md` in dsvisual.

- [ ] **Step 4: Commit:**

```bash
cd /Users/skhuang/course/ds2026
git add lectures/chap05/chap05_trees_core.md
git commit -m "docs(ds2026): wire chap05 viz links (12 dsvisual visualizations)"
```

---

## Notes for the executor

- **Two repos, two branches, two PRs.** Task 1 is on dsvisual `feat/chap05-new-viz-slides`; Task 2 creates ds2026 `feat/chap05-viz-links`. Do Task 1 first.
- **Generated files:** never hand-edit `slides/**` or `js/slides_rendered.js`; only `slides_db.js` is the source. `build_slides.js` is deterministic — re-running it on unchanged entries must not alter other viz's files (if it does, STOP and report).
- **Protected:** in ds2026, only `lectures/chap05/chap05_trees_core.md` may be staged; never the user's slideshow notebooks. In dsvisual, targeted `git add` only (concurrent refactor session).
- The `slides_db` `code` blocks embed C++ with escaped newlines (`\n`) inside a JS string — keep them exactly as written.
