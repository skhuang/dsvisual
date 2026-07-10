# nano-LLM visualizations (design)

Four new standalone dsvisual visualizations, one per nano-LLM OJ capstone lab,
so students can *see* the data structure each lab builds. Companion to the
dsjudge problems `nano-bpe-encode`, `nano-compute-graph`, `nano-bpe-train`,
`nano-ngram-next` and the ds2026 lectures.

## Decisions (settled in brainstorming)

- **4 new standalone viz** (not an extra mode on existing trie/topo/heap/hash
  viz) — each maps 1:1 to a lab and can be linked from the OJ statement and the
  lecture.
- **New "nano-LLM" menu category** grouping the four, so the capstone set is
  discoverable together.
- **viz ids == lab ids** (`nano-bpe-encode`, `nano-compute-graph`,
  `nano-bpe-train`, `nano-ngram-next`) so the `<!-- viz: <id> -->` lecture
  directive and OJ links resolve with no mapping table.
- **C++ shown = trimmed reference** from `ds2026/nano-llm/*.hpp` (the lab
  solutions), so the code panel matches what students implement.
- Reuse existing rendering idioms (trie/tree layout, graph/DAG layout, heap
  array, hash table, distribution bars) rather than new drawing primitives.

## How a viz wires into dsvisual (the pattern to follow — from `cache-lru`)

Each new viz touches the same 7 points (model on `lru`):

1. **`js/<name>_viz.js`** — an IIFE on `global` exposing a **pure**
   `buildFrames(...)` that returns `{ frames, ... }`; also `module.exports` so it
   is unit-testable in node. No DOM in this module.
2. **`index.html`** — `<script src="js/<name>_viz.js" defer></script>`.
3. **`js/app.js`**
   - menu entry in the category list (near line 175):
     `{ id: '<id>', title: '<Title>', file: '<id>.cpp', visualizer: '<key>', controls: '<key>' }`
   - code map (near line 371): `'<id>': code<Name>`
   - code title (near line 2432): `codeTitle.textContent = '<id>.cpp'`
   - render dispatch (near line 2679): `else if (currentMode === '<id>') render<Name>();`
   - a `render<Name>()` fn + `_<name>State` (near line 5898): builds the controls
     row, calls `buildFrames`, and animates frames with the shared stepper
     (`pause/step/stop`, same as `renderLruCache`).
4. **`js/code_db.js`** — `const code<Name> = \`…trimmed C++…\`;`
5. **`js/desc_db.js`** — description + time/space complexity.
6. **`js/i18n.js`** — `'method.<id>'` label in the `en` and `zh` maps.
7. **`slides/zh/<id>.md`** — a topic slide (the OJ/lecture link target).

**Tests:** `tests/unit/<name>_viz.test.js` asserts the `buildFrames` frame
sequence (model on `tests/unit/lru_cache_viz.test.js`); a Playwright smoke test
selects the mode and steps once.

## Global constraints

- No backend; pure client JS; must work opening `index.html` directly.
- `buildFrames` is deterministic and DOM-free (randomness for sampling takes an
  explicit seed arg so tests are stable).
- Keep each `js/<name>_viz.js` focused; follow the existing light theme + i18n.
- New category must not regress the existing 6-category nav (Playwright suite).

---

## Viz 1 — `nano-bpe-encode` (trie longest-match tokenization)

**Lab/DS:** `nano-bpe-encode` · Trie (Ch5). **Ref C++:** `ds2026/nano-llm/bpe_encoder.hpp` + `vocab.hpp`.

**Idea:** Given a BPE vocab, build a trie; encode an input string by greedy
**longest-match**: walk the trie from the cursor, remember the last vocab-token
node seen, emit it, jump the cursor past it, restart at root.

**Model:** `buildFrames(vocab: string[], input: string)`
- Build trie once (nodes with `children`, `isToken`, `tokenId`).
- Frame = `{ cursor, path: nodeId[], lastMatchEnd, lastToken, tokens: string[], status: 'walk'|'emit'|'restart'|'done' }`.
- One `walk` frame per char descended; an `emit` frame when the longest match is
  fixed; a `restart` frame resetting to root at the new cursor.

**Render:** trie drawn with the tree layout (reuse `tree_*` layout helpers);
input string as a row of char cells with the cursor + current match span
highlighted; a growing token-stream strip below. Controls: editable vocab
(comma list) + input string; `random_input.js`-style randomize.

**Slide:** `slides/zh/nano-bpe-encode.md`.

---

## Viz 2 — `nano-compute-graph` (compute-graph DAG + topological forward pass)

**Lab/DS:** `nano-compute-graph` · Graph / topological sort (Ch6). **Ref C++:** `ds2026/nano-llm/graph.hpp` + `tensor.hpp`.

**Idea:** A small neural compute graph — nodes are tensors/ops, edges are data
deps. Show the **topological order**, then a **forward pass** evaluating each
node once its inputs are ready.

**Model:** `buildFrames(graph: { nodes:[{id,op,shape}], edges:[[from,to]] })`
- Compute a topo order (Kahn); flag cycles as invalid (input is a DAG).
- Frame = `{ topoIndex, readyNodes:Set, evaluated:Set, active: nodeId, values: map, status: 'order'|'forward'|'done' }`.
- Phase 1 frames reveal the topo order (node numbering). Phase 2 frames light up
  `active` as each node is evaluated (show op + result shape/value).

**Render:** DAG layout (reuse `graph_*`/`graph_aoe_viz` layered layout); nodes
colored by state (pending / ready / evaluated); an ordered list showing the topo
sequence. Controls: pick from 2–3 preset graphs (e.g. `a*b+c`, a tiny MLP layer).

**Slide:** `slides/zh/nano-compute-graph.md`.

---

## Viz 3 — `nano-bpe-train` (pair-count → merge; linked list + heap + hash)

**Lab/DS:** `nano-bpe-train` · Linked list + heap + count-hash (Ch4/7). **Ref C++:** `ds2026/nano-llm/bpe_trainer.hpp`.

**Idea:** Train BPE merges: represent the corpus as a **linked list of symbols**;
count adjacent **pair frequencies** (hash); a **max-heap** yields the most
frequent pair; **merge** all its occurrences into a new symbol; repeat.

**Model:** `buildFrames(corpus: string[], numMerges: number)`
- Frame = `{ symbols: string[], pairCounts: [[pair,count]], heapTop: pair, merged: pair|null, mergeStep, status: 'count'|'select'|'merge'|'done' }`.
- Per merge round: `count` frame (populate pair table), `select` frame (heap
  pops the max pair), `merge` frame (highlight + fuse every occurrence in the
  symbol list), then the next round.

**Render:** the symbol list as a row (with the merged pair highlighted); a
pair-count table; the max-heap as an array/tree (reuse `heap_models.js` /
`heap-binary` drawing). Controls: editable corpus + number of merges.

**Slide:** `slides/zh/nano-bpe-train.md`.

---

## Viz 4 — `nano-ngram-next` (n-gram counts → sampling; hash + binary search)

**Lab/DS:** `nano-ngram-next` · Hash map + cumulative-distribution binary search / top-k heap (Ch9). **Ref C++:** `ds2026/nano-llm/ngram_model.hpp` + `sampler.hpp` + `generator.hpp`.

**Idea:** Build an n-gram model (**hash map** context → next-token counts). To
sample the next token: form the candidate distribution, build the **cumulative
sum array**, draw `r`, and **binary-search** for the bucket (or take the
**top-k** via a heap). Loop to generate a short sequence (ring buffer).

**Model:** `buildFrames(counts: map, context: string[], r: number|seed, topK?: number)`
- Frame = `{ context, candidates:[[token,count]], cumulative:number[], draw:r, lo, hi, mid, picked: token|null, generated: string[], status: 'lookup'|'cumsum'|'bsearch'|'pick'|'emit'|'done' }`.
- Frames: hash lookup of the context; build cumulative array; binary-search
  steps (lo/mid/hi) on `draw`; pick token; append to generated; advance context.

**Render:** the context tokens; a distribution bar chart of candidate counts; the
cumulative array with the binary-search window highlighted and the `draw` marker;
the generated sequence strip. Controls: seed/`r` slider, optional top-k toggle.

**Slide:** `slides/zh/nano-ngram-next.md`.

---

## Menu placement

Add one **"nano-LLM"** category (after the existing categories) in `app.js`'s
category list, containing the four entries above, each `visualizer`/`controls`
key equal to a short name (`bpeEncode`, `computeGraph`, `bpeTrain`, `ngramNext`).

## Testing

- `tests/unit/nano_bpe_encode_viz.test.js`, `…compute_graph…`, `…bpe_train…`,
  `…ngram_next…`: assert the `buildFrames` frame sequence on a tiny fixed input
  (frame count, key transitions, final `tokens`/`values`/`generated`), mirroring
  `lru_cache_viz.test.js`. Sampling test passes a fixed `r`/seed.
- Playwright: a smoke spec that opens each of the 4 modes, clicks step once, and
  asserts the canvas/controls render (extends the existing viewer specs).

## Integration (out of this repo, noted for follow-up)

- **ds2026 lectures:** add `<!-- viz: nano-bpe-encode -->` (etc.) directives in
  the relevant chapter decks so the notebook/marp build links to the viz.
- **dsjudge:** the four `nano-*` problem statements can link to the matching
  dsvisual viz for a worked visual.
- The `slides/zh/<id>.md` slides feed the same rendered-slides path as the other
  101 topics.

## Scope / YAGNI

- **In:** 4 viz modules + wiring + C++ panels + slides + unit tests + the
  nano-LLM category.
- **Out:** editing real tensors/backprop (forward pass only), full BPE training
  on large corpora (small demo corpus), actual model weights / GGUF parsing
  (the file-format lab stays code-only), and changes to the OJ graders.

## Success criteria

1. Four new modes appear under a "nano-LLM" category and step through their
   animation with pause/step/stop, side-by-side with the reference C++.
2. Each `buildFrames` is pure + unit-tested; `npm test` + Playwright green.
3. viz ids match the lab ids so `<!-- viz: <id> -->` and OJ links resolve.
