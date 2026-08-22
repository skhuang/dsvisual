# C++ Data Structures & Algorithms Visualizer

An interactive, browser-based visualizer for C++ data structures and algorithms. No backend required — open `index.html` directly in a browser.

## Live Demo

```
open index.html
```

## Features

- Side-by-side **animated visualization** and **C++ source code** display
- Step-through animation with **pause / stop** controls
- Algorithm descriptions with **time & space complexity**
- Covers **37+ data structures and algorithms**

## Supported Algorithms

Every entry below is a live, step-by-step visualizer, grouped as in the app's navigation. Entries marked *student contribution* were added by course students (see [Contributors](#contributors)).

### Linear Structures
| Structure | Description |
|-----------|-------------|
| Stack (Array) | LIFO stack backed by an array |
| Stack (List) | LIFO stack backed by a linked list |
| Queue | FIFO queue |
| Array List | Array-backed list with indexed insert/delete |
| Singly Linked List | Node chain with next pointers |
| Deque | Double-ended queue (push/pop both ends) |
| Infix → Postfix | Shunting-yard conversion + stack evaluation |
| Maze (Stack Backtracking) | DFS with an explicit path stack |
| Doubly / Circular Linked List | prev/next pointers, forward & backward |
| Equivalence Classes | Union of relations via a linked-list forest |

### Arrays
| Topic | Description |
|-------|-------------|
| Sparse Matrix (Transpose) | Triple representation + FAST_TRANSPOSE |
| Sparse Matrix (Linked List) | Row/column circular linked-list representation |
| Polynomial Addition | Two-pointer merge of term lists |
| Magic Square — Latin Decomposition | Odd-order magic square via two orthogonal Latin squares |
| Magic Square — Toroidal Tiling | Siamese method viewed as diagonal wrap on a torus |
| Magic Square — O(1) getValue Formula | Closed-form cell value without building the grid |
| Magic Square — Symmetry (D₄) | Dihedral symmetries of the magic square |

### Trees
| Type | Description |
|------|-------------|
| Binary Search Tree | Ordered insert / search / delete |
| AVL Tree | Self-balancing BST with rotations |
| Red-Black Tree | Real CLRS insert/delete; every rotation & recolor a rewindable step — *student contribution* |
| Splay Tree | Splay (zig / zig-zig / zig-zag) operations |
| Trie | Prefix tree with string input |
| Radix Tree | Compressed prefix tree |
| Ternary Search Tree | Character-split BST for strings |
| B-Tree | Multi-way balanced search tree |
| B+ Tree | B-Tree variant with leaf-linked data |
| Disjoint Set (Union-Find) | Union by rank + path compression |
| Segment Tree | Range query / point update over an array |
| Fenwick Tree (BIT) | Prefix sums with O(log n) update |
| Tree Traversal | Pre / In / Post / Level-order, recursive & iterative |
| Huffman Coding | Greedy optimal prefix-code tree |
| Optimal BST | DP table → reconstructed minimum-cost tree |
| Threaded Binary Tree | Inorder-successor threads; stack-free traversal |
| m-way Search Tree | Up to m−1 keys / m children per node |
| Expression Tree | Build from postfix via a subtree stack, then evaluate |
| General ↔ Binary Tree | Left-child / right-sibling conversion |
| Tree COPY & EQUAL | Recursive structural copy and equality |
| 8-Coins Decision Tree | Weighing decision tree for the counterfeit-coin puzzle |
| Counting Trees (Catalan) | Enumerate the Cₙ distinct binary-tree shapes |
| Array Representation | Complete-tree ↔ array index mapping |
| Reconstruct Tree | Rebuild a tree from traversal orders |
| Game Tree (Minimax / α-β) | Minimax search with alpha-beta pruning |

### Graphs
| Algorithm | Description |
|-----------|-------------|
| Undirected Graph | Build and inspect an undirected graph |
| Adjacency List | List-of-neighbours representation |
| Adjacency Multilist | Shared edge nodes for undirected graphs |
| BFS vs DFS (Dual-Pane) | Side-by-side traversal comparison |
| Breadth-First Search | Level-order traversal via a queue |
| Depth-First Search | Backtracking traversal via a stack |
| Kruskal MST | Sort edges + union-find |
| Dijkstra (Shortest Path) | Greedy shortest paths with a priority queue |
| Topological Sort | Kahn / DFS ordering of a DAG |
| Borůvka MST | Component-merging minimum spanning tree |
| Red-Blue Rules (MST) | Cut/cycle rules underlying MST algorithms |
| Bellman-Ford | Shortest paths with negative edges |
| Floyd-Warshall | All-pairs shortest paths (DP matrix) |
| AOE / Critical Path | Forward/backward pass, critical activities |
| Adjacency Matrix | Matrix representation with cell↔edge highlighting |
| Connected Components | Partition an undirected graph into components |
| Bipartite Check | 2-coloring; detect odd cycles |
| Transitive Closure | Reachability closure of a digraph |
| Strongly Connected Components | Directed SCC decomposition |
| Maximum Flow (Edmonds–Karp) | BFS augmenting paths on the residual network — *student contribution* |
| Euler Path / Circuit (Hierholzer) | Stack-based edge traversal building the Euler tour — *student contribution* |

### Hash & Probabilistic
| Structure | Description |
|-----------|-------------|
| Hash Chaining | Separate-chaining hash table |
| Open Addressing | Linear/quadratic probing |
| Bucketing | Bucket hashing |
| Bloom Filter | Probabilistic set membership with k hashes |
| Skip List | Randomized layered linked list |
| Count-Min Sketch | Sublinear frequency estimation |
| LRU Cache | Doubly-linked list + hash map eviction — *student contribution* |

### Heaps / Priority Queues
| Type | Description |
|------|-------------|
| Binary Heap | Array-backed complete-tree heap |
| Binomial Heap | Forest of binomial trees linked by degree |
| Fibonacci Heap | Lazy melding with amortized decrease-key |
| Leftist Heap | Merge-oriented heap on the null-path length |
| Skew Heap | Self-adjusting merge heap |
| 4-ary Heap | d-ary heap with four children per node |
| Pairing Heap | Simple, fast amortized heap |

### Sorting
| Algorithm | Category |
|-----------|----------|
| Bubble Sort | Comparison |
| Selection Sort | Comparison |
| Insertion Sort | Comparison |
| Quick Sort | Comparison |
| Merge Sort | Comparison |
| Shell Sort | Comparison |
| Shaker Sort | Comparison (bidirectional bubble) |
| Heap Sort | Comparison (with a synchronized heap-tree view) |
| Bucket Sort | Non-comparison |
| Counting Sort | Non-comparison |
| Radix Sort | Non-comparison |
| External Merge Sort | Run generation + winner-tree k-way merge |
| Polyphase Merge (Tapes) | Fibonacci-distributed multi-tape external merge |

### Searching & String Matching
| Algorithm | Description |
|-----------|-------------|
| Linear Search | Scan every element until a match is found |
| Binary Search | Halve the search space on each comparison |
| Fibonacci Search | Split a sorted array at Fibonacci offsets |
| Interpolation Search | Probe by linear interpolation of the target |
| KMP (Knuth-Morris-Pratt) | Failure-function prefix matching |
| Boyer-Moore | Bad-character / good-suffix skips |
| Rabin-Karp | Rolling-hash substring search |
| Z-Algorithm | Z-array prefix matching |
| String Matching Compared | Side-by-side of the matching algorithms |
| Aho-Corasick | Multi-pattern trie + failure links |

### File Structures
| Structure | Description |
|-----------|-------------|
| ISAM (Indexed Sequential) | Static index over sequential data blocks |
| Inverted Index | Term → document postings lists |

### Memory / GC
| Topic | Description |
|-------|-------------|
| Dynamic Storage / GC | Allocation, mark-sweep, reference counting, buddy system, pointer reversal, compaction |

### Recursion
| Topic | Description |
|-------|-------------|
| Recursion (Call Tree & Stack) | Visualize the call tree and the runtime stack |

### OOP Concepts
| Concept | Description |
|---------|-------------|
| Class Inheritance | Base/derived relationships |
| Polymorphism (Virtual) | Dynamic dispatch through virtual functions |
| Encapsulation & Access | public / protected / private access |
| Abstraction (Abstract Classes) | Pure-virtual interfaces |
| Ad-hoc Polymorphism (Overloading) | Function/operator overloading |
| Parametric Polymorphism (Templates) | Compile-time generics |

### Design Patterns
| Category | Patterns |
|----------|----------|
| Creational | Builder, Factory Method, Singleton |
| Structural | Adapter, Composite, Decorator |
| Behavioral | Command, Observer, Strategy |
| Architectural | Dependency Injection, Layered Architecture, MVC, Pipe-and-Filter, Publish-Subscribe |

### nano-LLM
| Topic | Description |
|-------|-------------|
| BPE Encode (trie) | Byte-pair-encoding tokenization over a trie |
| Compute Graph (DAG) | Forward/backward passes on a computation graph |
| BPE Train (list+heap) | Learn merges via a frequency list + heap |
| n-gram Sampling (hash) | Next-token sampling from an n-gram hash model |

## Project Structure

```
dsvisual/
├── index.html          # Main UI (mode toggles, visualization canvas, controls)
├── style.css           # Glassmorphism-style CSS
├── js/
│   ├── app.js           # Host: METHOD_GROUPS, dispatch (renderAll/getCodeForMethod), shared UI chrome
│   ├── core/
│   │   └── registry.js  # VizRegistry: attach/behavior/has — id -> {render, code, layout} lookup table
│   ├── algos/
│   │   └── tree_algos.js # Pure tree algorithms shared across viz modules
│   ├── viz/
│   │   └── viz_*.js      # Self-contained visualization modules; each calls VizRegistry.attach(id, {...})
│   ├── code_db.js        # Auto-generated: C++ source strings for display (do not edit manually)
│   ├── desc_db.js        # Algorithm descriptions and complexity notes
│   └── heap_models.js    # Shared heap logic used by UI and unit tests
├── build_db.js          # Node.js script: rebuilds code_db.js from .cpp files
├── *.cpp                # C++ source files (one per algorithm/data structure)
├── tests/
│   ├── visualizer.spec.js       # Core Playwright suite
│   ├── heap_visualizer.spec.js  # Heap E2E suite
│   └── unit/
│       └── heap_models.test.js  # Node unit tests for heap invariants
└── playwright.config.js
```

`js/app.js` exposes `window.VizKit` (host helpers: `acquireDynamicVizHost`, `buildStepControls`, `getInputDifficulty`, `langOf`, `t`) and drives rendering/code-lookup through `window.VizRegistry` — `renderAll`/`getCodeForMethod` consult the registry before falling back to their built-in per-method logic. Note that not every method has migrated: stateful visualizations with heavier shared state (stack/queue/graph/tree/hash/heap) still live directly in `js/app.js`; only the self-contained ones have been extracted into `js/viz/` so far.

**Adding a new visualization** no longer requires editing `app.js`'s dispatch switches. Instead:

1. Create `js/viz/viz_<name>.js` that calls `VizRegistry.attach('<method-id>', { render, code, layout })` (any subset of those keys — `attach` partial-merges).
2. Add its `<script src="js/viz/viz_<name>.js" defer></script>` tag in `index.html`.
3. Add a `METHOD_GROUPS` entry in `js/app.js` so the method shows up in the nav/menu.

## Getting Started

### Prerequisites

- Node.js (for rebuilding the code DB and running tests)
- A modern browser (Chrome recommended)

### Run the Visualizer

No build step needed:

```bash
open index.html
```

### Rebuild `code_db.js` After Editing `.cpp` Files

```bash
node build_db.js
```

This reads all `.cpp` source files and regenerates `code_db.js`, which populates the code panel in the UI.

## Testing

Tests use [Playwright](https://playwright.dev/) and run against the local `index.html`.

### Install dependencies

```bash
npm install
```

### Run tests

```bash
npm test                # Playwright E2E
npm run test:unit       # Heap model unit tests (node:test)
npm run test:all        # Unit + E2E
# or
npx playwright test
```

### View test report

```bash
npx playwright show-report
```

Tests cover initial load state, mode switching, and UI interaction for all major data structures.

## Interactive Heap Tutorials

All 7 heap modes include guided, step-by-step tutorials to help users understand heap operations and invariants:

### Starting a Tutorial

1. Select a heap mode (e.g., **Binary Heap** or **Fibonacci Heap**)
2. Click the **Start Tutorial** button (appears in the Heap Actions panel)
3. A tutorial overlay panel will appear with:
   - Current step number (e.g., "Step 1 / 8")
   - Guidance text explaining the operation
   - Pre-filled input suggestions
   - Highlighted controls to guide interaction

### Tutorial Flow

Each heap tutorial guides you through 8 operations:

| Step | Operation | Goal |
|------|-----------|------|
| 1 | Insert 12 | Create the root node |
| 2 | Insert 7 | Observe key bubbling / tree restructuring |
| 3 | Insert 19 | Build enough structure to inspect |
| 4 | Peek | Verify which value is at the frontier |
| 5 | Merge [3, 8, 15] | See merge/union behavior |
| 6 | Change 19 → 5 | Watch key adjustment and reordering |
| 7 | Extract | Observe root removal and re-heapification |
| 8 | Heap Stats | Review final heap size and structure info |

### Tutorial Navigation

- **Next**: Manually advance to the next step (auto-advances when you complete the expected operation)
- **Restart**: Reset the heap and tutorial progress to the start
- **Exit**: Close the tutorial and return to free-play mode
- **Mode Switch**: Exiting the tutorial's heap mode automatically closes the tutorial

### Heap Modes with Tutorials

- **Binary Heap**: Classic balanced binary tree with complete-structure guarantee
- **Binomial Heap**: Forest of binomial trees linked by degree
- **Fibonacci Heap**: Lazy forest with cut-based amortized optimization
- **Leftist Heap**: Recursive merge-first structure with null-path-length balance
- **Skew Heap**: Self-adjusting skew structure via aggressive swaps
- **4-ary Heap**: Wider branching factor for shallower trees
- **Pairing Heap**: Pairwise meld operations for amortized efficiency

## Architecture

- **No backend** — entirely static, runs from the filesystem
- **Animation engine** — `animState` (`idle` / `paused` / `stopped`) with `async/await sleep()` for step-by-step animation
- **Data separation** — C++ code and descriptions are stored in separate DB files (`code_db.js`, `desc_db.js`) and regenerated by `build_db.js`
- **Syntax highlighting** — powered by [Prism.js](https://prismjs.com/) (C++ theme)
- Visualizations with editable input include an Examples dropdown — see docs/conventions/example-feature.md

## Contributors

Visualizations contributed by students of the Data Structures course, alongside the course maintainer:

| Contributor | Contribution |
|-------------|--------------|
| **Engel Yu** ([@engelyu](https://github.com/engelyu)) | LRU Cache visualization ([#102](https://github.com/skhuang/dsvisual/pull/102)); Red-Black Tree rewrite as the rotation observatory (every rotation & recolor a rewindable step) |
| **brianxuan** ([@brianxuan](https://github.com/brianxuan)) | Max-Flow / Edmonds–Karp residual-network visualizer ([#234](https://github.com/skhuang/dsvisual/pull/234)) |
| **haleychang0530** ([@haleychang0530](https://github.com/haleychang0530)) | Euler path / circuit (Hierholzer) visualizer ([#241](https://github.com/skhuang/dsvisual/pull/241)) |

Contributions welcome — see the existing visualizers under `js/viz/` and the conventions in `docs/conventions/`.

## License

[MIT](LICENSE) © 2026 Shih-Kun Huang and dsvisual contributors
