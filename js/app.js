// C++ Source Code loaded from code_db.js


let animState = 'idle'; 
async function sleep(ms) {
    let waited = 0;
    while (waited < ms) {
        if (animState === 'stopped') throw 'STOPPED';
        if (animState === 'paused') await new Promise(r => setTimeout(r, 50));
        else { const step = Math.min(20, ms - waited); await new Promise(r => setTimeout(r, step)); waited += step; }
    }
}

// The 11 migrated patterns keep their pre-refactor display order; any pattern
// newly added to a category (via PatternsDB, not yet present pre-refactor) is
// appended after them. This keeps METHOD_GROUPS / the category-scoped
// pattern-mode-select stable for existing users while new patterns still show up.
const LEGACY_PATTERN_ORDER = [
    'pattern-singleton', 'pattern-factory', 'pattern-adapter', 'pattern-decorator',
    'pattern-observer', 'pattern-strategy', 'pattern-mvc', 'pattern-layered',
    'pattern-pubsub', 'pattern-pipefilter', 'pattern-di',
];
function orderedPatternsByCategory(categoryId) {
    const db = (typeof window !== 'undefined' && window.PatternsDB) ? window.PatternsDB : null;
    if (!db) return [];
    return db.patternsByCategory(categoryId).slice().sort((a, b) => {
        const ia = LEGACY_PATTERN_ORDER.indexOf(a.id);
        const ib = LEGACY_PATTERN_ORDER.indexOf(b.id);
        const ra = ia === -1 ? Infinity : ia;
        const rb = ib === -1 ? Infinity : ib;
        return ra - rb;
    });
}
function patternGroupMethods(categoryId) {
    return orderedPatternsByCategory(categoryId).map((p) => ({
        id: p.id, title: p.title, file: p.cpp, visualizer: 'pattern', controls: 'pattern',
    }));
}

const METHOD_GROUPS = [
    {
        id: 'linear',
        title: 'Linear Structures',
        methods: [
            { id: 'stack-array', title: 'Stack (Array)', file: 'stack_array.cpp', visualizer: 'stack', controls: 'standard' },
            { id: 'stack-list', title: 'Stack (List)', file: 'stack_linkedlist.cpp', visualizer: 'linked-stack', controls: 'standard' },
            { id: 'queue', title: 'Queue', file: 'queue.cpp', visualizer: 'queue', controls: 'standard' },
            { id: 'list-array', title: 'Array List', file: 'list_array.cpp', visualizer: 'array-list', controls: 'list' },
            { id: 'list-linked', title: 'Singly Linked List', file: 'list_linked.cpp', visualizer: 'linked-list', controls: 'list' },
            { id: 'deque', title: 'Deque (Double-Ended Queue)', file: 'deque.cpp', visualizer: 'deque', controls: 'deque' },
            { id: 'expr-infix-postfix', title: 'Infix → Postfix (Stack)', file: 'expr_infix_postfix.cpp', visualizer: 'expr', controls: 'expr' },
            { id: 'maze-stack', title: 'Maze (Stack Backtracking)', file: 'maze_stack.cpp', visualizer: 'maze', controls: 'maze' },
            { id: 'list-doubly', title: 'Doubly / Circular Linked List', file: 'list_doubly.cpp', visualizer: 'doubly', controls: 'doubly' },
            { id: 'list-equivalence', title: 'Equivalence Classes (Linked List)', file: 'list_equivalence.cpp', visualizer: 'equiv', controls: 'equiv' },
        ],
    },
    {
        id: 'arrays',
        title: 'Arrays',
        methods: [
            { id: 'matrix-sparse', title: 'Sparse Matrix (Transpose)', file: 'matrix_sparse.cpp', visualizer: 'sparse', controls: 'sparse' },
            { id: 'matrix-sparse-list', title: 'Sparse Matrix (Linked List)', file: 'matrix_sparse_list.cpp', visualizer: 'msl', controls: 'msl' },
            { id: 'poly-padd', title: 'Polynomial Addition', file: 'poly_padd.cpp', visualizer: 'poly', controls: 'poly' },
            { id: 'magic-square', title: "Magic Square (Coxeter's Rule)", file: 'magic_square.cpp', visualizer: 'magic-square', controls: 'magic-square' },
            { id: 'magic-latin', title: 'Magic Square — Latin Decomposition', file: 'magic_latin.cpp', visualizer: 'magicLatin', controls: 'magicLatin' },
            { id: 'magic-torus', title: 'Magic Square — Toroidal Tiling', file: 'magic_torus.cpp', visualizer: 'magicTorus', controls: 'magicTorus' },
            { id: 'magic-formula', title: 'Magic Square — O(1) getValue Formula', file: 'magic_formula.cpp', visualizer: 'magicFormula', controls: 'magicFormula' },
            { id: 'magic-symmetry', title: 'Magic Square — Symmetry (D₄)', file: 'magic_symmetry.cpp', visualizer: 'magicSymmetry', controls: 'magicSymmetry' },
        ],
    },
    {
        id: 'trees',
        title: 'Trees',
        methods: [
            { id: 'tree-bst', title: 'Binary Search Tree', file: 'tree_bst.cpp', visualizer: 'tree', controls: 'tree' },
            { id: 'tree-avl', title: 'AVL Tree', file: 'tree_avl.cpp', visualizer: 'avltree', controls: 'avltree', codeDrawer: true },
            { id: 'tree-rb', title: 'Red-Black Tree', file: 'tree_rb.cpp', visualizer: 'rbtree', controls: 'rbtree', codeDrawer: true },
            { id: 'tree-splay', title: 'Splay Tree', file: 'tree_splay.cpp', visualizer: 'tree', controls: 'tree' },
            { id: 'tree-trie', title: 'Trie', file: 'tree_trie.cpp', visualizer: 'trie', controls: 'trie', codeDrawer: true },
            { id: 'tree-radix', title: 'Radix Tree', file: 'tree_radix.cpp', visualizer: 'text-tree', controls: 'text-tree' },
            { id: 'tree-ternary', title: 'Ternary Search Tree', file: 'tree_ternary.cpp', visualizer: 'text-tree', controls: 'text-tree' },
            { id: 'tree-btree', title: 'B-Tree', file: 'tree_btree.cpp', visualizer: 'advanced-tree', controls: 'tree' },
            { id: 'tree-bplus', title: 'B+ Tree', file: 'tree_bplus.cpp', visualizer: 'advanced-tree', controls: 'tree' },
            { id: 'tree-dsu', title: 'Disjoint Set (Union-Find)', file: 'tree_dsu.cpp', visualizer: 'dsu', controls: 'dsu', codeDrawer: true },
            { id: 'tree-segment', title: 'Segment Tree', file: 'tree_segment.cpp', visualizer: 'segtree', controls: 'segtree', codeDrawer: true },
            { id: 'tree-fenwick', title: 'Fenwick Tree (BIT)', file: 'tree_fenwick.cpp', visualizer: 'fenwick', controls: 'fenwick', codeDrawer: true },
            { id: 'tree-traversal', title: 'Tree Traversal', file: 'tree_traversal.cpp', visualizer: 'tree', controls: 'tree' },
            { id: 'huffman', title: 'Huffman Coding', file: 'huffman.cpp', visualizer: 'tree', controls: 'tree' },
            { id: 'tree-obst', title: 'Optimal BST', file: 'tree_obst.cpp', visualizer: 'obst', controls: 'obst', codeDrawer: true },
            { id: 'tree-threaded', title: 'Threaded Binary Tree', file: 'tree_threaded.cpp', visualizer: 'threaded', controls: 'threaded', codeDrawer: true },
            { id: 'tree-mway', title: 'm-way Search Tree', file: 'tree_mway.cpp', visualizer: 'mway', controls: 'mway', codeDrawer: true },
            { id: 'tree-expression', title: 'Expression Tree', file: 'tree_expression.cpp', visualizer: 'exprtree', controls: 'exprtree', codeDrawer: true },
            { id: 'tree-general-binary', title: 'General ↔ Binary Tree', file: 'tree_general_binary.cpp', visualizer: 'tgb', controls: 'tgb', codeDrawer: true },
            { id: 'tree-copy-equal', title: 'Tree COPY & EQUAL', file: 'tree_copy_equal.cpp', visualizer: 'copyequal', controls: 'copyequal' },
            { id: 'decision-tree-coins', title: '8-Coins Decision Tree', file: 'decision_tree_coins.cpp', visualizer: 'coins', controls: 'coins' },
            { id: 'tree-catalan', title: 'Counting Trees (Catalan)', file: 'tree_catalan.cpp', visualizer: 'catalan', controls: 'catalan', codeDrawer: true },
            { id: 'tree-array-rep', title: 'Array Representation', file: 'tree_array_rep.cpp', visualizer: 'arrayrep', controls: 'arrayrep', codeDrawer: true },
            { id: 'tree-reconstruct', title: 'Reconstruct Tree', file: 'tree_reconstruct.cpp', visualizer: 'reconstruct', controls: 'reconstruct' },
            { id: 'game-tree', title: 'Game Tree (Minimax / α-β)', file: 'game_tree.cpp', visualizer: 'gametree', controls: 'gametree', codeDrawer: true },
        ],
    },
    {
        id: 'graphs',
        title: 'Graphs',
        methods: [
            { id: 'graph', title: 'Undirected Graph', file: 'graph.cpp', visualizer: 'graph', controls: 'graph' },
            { id: 'graph-adjlist', title: 'Adjacency List', file: 'graph_adjlist.cpp', visualizer: 'graph', controls: 'graph' },
            { id: 'graph-multilist', title: 'Adjacency Multilist', file: 'graph_multilist.cpp', visualizer: 'graph', controls: 'graph' },
            { id: 'graph-traversal', title: 'BFS vs DFS (Dual-Pane)', file: 'graph_traversal.cpp', visualizer: 'graph-dual', controls: 'graph-traversal' },
            { id: 'graph-bfs', title: 'Breadth-First Search', file: 'graph_bfs.cpp', visualizer: 'graph', controls: 'graph', codeDrawer: true },
            { id: 'graph-dfs', title: 'Depth-First Search', file: 'graph_dfs.cpp', visualizer: 'graph', controls: 'graph', codeDrawer: true },
            { id: 'graph-kruskal', title: 'Kruskal MST', file: 'graph_kruskal.cpp', visualizer: 'graph', controls: 'graph', codeDrawer: true },
            { id: 'graph-dijkstra', title: 'Dijkstra (Shortest Path)', file: 'graph_dijkstra.cpp', visualizer: 'graph', controls: 'graph', codeDrawer: true },
            { id: 'graph-topo', title: 'Topological Sort', file: 'graph_topo.cpp', visualizer: 'graph', controls: 'graph', codeDrawer: true },
            { id: 'graph-prim', title: "Prim's MST", file: 'graph_prim.cpp', visualizer: 'graph-step', controls: 'graph-step', codeDrawer: true },
            { id: 'graph-boruvka', title: 'Borůvka MST', file: 'graph_boruvka.cpp', visualizer: 'graph-step', controls: 'graph-step', codeDrawer: true },
            { id: 'graph-redblue', title: 'Red-Blue Rules (MST)', file: 'graph_redblue.cpp', visualizer: 'graph-step', controls: 'graph-step', codeDrawer: true },
            { id: 'graph-bellman-ford', title: 'Bellman-Ford', file: 'graph_bellman_ford.cpp', visualizer: 'graph-step', controls: 'graph-step', codeDrawer: true },
            { id: 'graph-floyd-warshall', title: 'Floyd-Warshall', file: 'graph_floyd_warshall.cpp', visualizer: 'matrix', controls: 'matrix' },
            { id: 'graph-aoe', title: 'AOE / Critical Path', file: 'graph_aoe.cpp', visualizer: 'aoe', controls: 'aoe' },
            { id: 'graph-matrix', title: 'Adjacency Matrix', file: 'graph_matrix.cpp', visualizer: 'graph-matrix', controls: 'graph-matrix', codeDrawer: true },
            { id: 'graph-components', title: 'Connected Components', file: 'graph_components.cpp', visualizer: 'graph-components', controls: 'graph-components', codeDrawer: true },
            { id: 'graph-bipartite', title: 'Bipartite Check', file: 'graph_bipartite.cpp', visualizer: 'graph-bipartite', controls: 'graph-bipartite', codeDrawer: true },
            { id: 'graph-closure', title: 'Transitive Closure', file: 'graph_closure.cpp', visualizer: 'graph-closure', controls: 'graph-closure', codeDrawer: true },
            { id: 'graph-scc', title: 'Strongly Connected Components', file: 'graph_scc.cpp', visualizer: 'graph-scc', controls: 'graph-scc', codeDrawer: true },
        ],
    },
    {
        id: 'hash',
        title: 'Hash & Probabilistic',
        methods: [
            { id: 'hash-chain', title: 'Hash Chaining', file: 'hash_chaining.cpp', visualizer: 'hash', controls: 'hash' },
            { id: 'hash-open', title: 'Open Addressing', file: 'hash_open_address.cpp', visualizer: 'hash', controls: 'hash' },
            { id: 'hash-bucket', title: 'Bucketing', file: 'hash_bucket.cpp', visualizer: 'hash', controls: 'hash' },
            { id: 'bloom-filter', title: 'Bloom Filter', file: 'bloom_filter.cpp', visualizer: 'bloom', controls: 'bloom' },
            { id: 'skip-list', title: 'Skip List', file: 'skip_list.cpp', visualizer: 'skiplist', controls: 'skiplist' },
            { id: 'count-min-sketch', title: 'Count-Min Sketch', file: 'count_min_sketch.cpp', visualizer: 'cms', controls: 'cms' },
            { id: 'cache-lru', title: 'LRU Cache', file: 'lru_cache.cpp', visualizer: 'lru', controls: 'lru' },
        ],
    },
    {
        id: 'heaps',
        title: 'Heaps / Priority Queues',
        methods: [
            { id: 'heap-binary', title: 'Binary Heap', file: 'heap_binary.cpp', visualizer: 'heap', controls: 'heap' },
            { id: 'heap-binomial', title: 'Binomial Heap', file: 'heap_binomial.cpp', visualizer: 'heap', controls: 'heap' },
            { id: 'heap-fibonacci', title: 'Fibonacci Heap', file: 'heap_fibonacci.cpp', visualizer: 'heap', controls: 'heap' },
            { id: 'heap-leftist', title: 'Leftist Heap', file: 'heap_leftist.cpp', visualizer: 'heap', controls: 'heap' },
            { id: 'heap-skew', title: 'Skew Heap', file: 'heap_skew.cpp', visualizer: 'heap', controls: 'heap' },
            { id: 'heap-dary', title: '4-ary Heap', file: 'heap_dary.cpp', visualizer: 'heap', controls: 'heap' },
            { id: 'heap-pairing', title: 'Pairing Heap', file: 'heap_pairing.cpp', visualizer: 'heap', controls: 'heap' },
        ],
    },
    {
        id: 'sorting',
        title: 'Sorting',
        methods: [
            { id: 'sort-bubble', title: 'Bubble Sort', file: 'sort_bubble.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-select', title: 'Selection Sort', file: 'sort_selection.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-insert', title: 'Insertion Sort', file: 'sort_insertion.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-quick', title: 'Quick Sort', file: 'sort_quick.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-merge', title: 'Merge Sort', file: 'sort_merge.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-shell', title: 'Shell Sort', file: 'sort_shell.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-bucket', title: 'Bucket Sort', file: 'sort_bucket.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-count', title: 'Counting Sort', file: 'sort_counting.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-radix', title: 'Radix Sort', file: 'sort_radix.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-heap', title: 'Heap Sort', file: 'sort_heap.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-shaker', title: 'Shaker Sort', file: 'sort_shaker.cpp', visualizer: 'sort', controls: 'sort', codeDrawer: true },
            { id: 'sort-external', title: 'External Merge Sort', file: 'sort_external.cpp', visualizer: 'extsort', controls: 'extsort' },
            { id: 'sort-polyphase', title: 'Polyphase Merge (Tapes)', file: 'sort_polyphase.cpp', visualizer: 'polyphase', controls: 'polyphase' },
        ],
    },
    {
        id: 'searching',
        title: 'Searching & String Matching',
        methods: [
            { id: 'search-linear', title: 'Linear Search', file: 'search_linear.cpp', visualizer: 'search', controls: 'search', codeDrawer: true },
            { id: 'search-binary', title: 'Binary Search', file: 'search_binary.cpp', visualizer: 'search', controls: 'search', codeDrawer: true },
            { id: 'search-kmp', title: 'KMP (Knuth-Morris-Pratt)', file: 'search_kmp.cpp', visualizer: 'string-search', controls: 'string-search', codeDrawer: true },
            { id: 'search-bm', title: 'Boyer-Moore', file: 'search_bm.cpp', visualizer: 'string-search', controls: 'string-search', codeDrawer: true },
            { id: 'search-rk', title: 'Rabin-Karp', file: 'search_rk.cpp', visualizer: 'string-search', controls: 'string-search', codeDrawer: true },
            { id: 'search-strcompare', title: 'String Matching Compared', file: 'search_strcompare.cpp', visualizer: 'string-compare', controls: 'string-compare', codeDrawer: true },
            { id: 'search-zalgo', title: 'Z-Algorithm', file: 'search_zalgo.cpp', visualizer: 'string-search', controls: 'string-search', codeDrawer: true },
            { id: 'search-aho', title: 'Aho-Corasick', file: 'search_aho.cpp', visualizer: 'aho-corasick', controls: 'aho-corasick', codeDrawer: true },
            { id: 'search-fibonacci', title: 'Fibonacci Search', file: 'search_fibonacci.cpp', visualizer: 'fibsearch', controls: 'fibsearch', codeDrawer: true },
            { id: 'search-interpolation', title: 'Interpolation Search', file: 'search_interpolation.cpp', visualizer: 'interpsearch', controls: 'interpsearch', codeDrawer: true },
        ],
    },
    {
        id: 'files',
        title: 'File Structures',
        methods: [
            { id: 'file-isam', title: 'ISAM (Indexed Sequential)', file: 'file_isam.cpp', visualizer: 'isam', controls: 'isam' },
            { id: 'file-inverted', title: 'Inverted Index', file: 'file_inverted.cpp', visualizer: 'inverted', controls: 'inverted' },
        ],
    },
    {
        id: 'memory',
        title: 'Memory / GC',
        methods: [
            { id: 'gc-memory', title: 'Dynamic Storage / GC', file: 'gc_memory.cpp', visualizer: 'gcmem', controls: 'gcmem' },
        ],
    },
    {
        id: 'recursion',
        title: 'Recursion',
        methods: [
            { id: 'recursion', title: 'Recursion (Call Tree & Stack)', file: 'recursion.cpp', visualizer: 'recursion', controls: 'recursion' },
        ],
    },
    {
        id: 'oop',
        title: 'OOP Concepts',
        methods: [
            { id: 'oop-inheritance', title: 'Class Inheritance', file: 'oop_inheritance.cpp', visualizer: 'oop', controls: 'oop' },
            { id: 'oop-polymorphism', title: 'Polymorphism (Virtual)', file: 'oop_polymorphism.cpp', visualizer: 'oop', controls: 'oop' },
            { id: 'oop-encapsulation', title: 'Encapsulation & Access', file: 'oop_encapsulation.cpp', visualizer: 'oop', controls: 'oop' },
            { id: 'oop-abstraction', title: 'Abstraction (Abstract Classes)', file: 'oop_abstraction.cpp', visualizer: 'oop', controls: 'oop' },
            { id: 'oop-adhoc', title: 'Ad-hoc Polymorphism (Overloading)', file: 'oop_adhoc.cpp', visualizer: 'oop', controls: 'oop' },
            { id: 'oop-templates', title: 'Parametric Polymorphism (Templates)', file: 'oop_templates.cpp', visualizer: 'oop', controls: 'oop' },
        ],
    },
    {
        id: 'patterns-creational',
        title: 'Creational',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: patternGroupMethods('patterns-creational'),
    },
    {
        id: 'patterns-structural',
        title: 'Structural',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: patternGroupMethods('patterns-structural'),
    },
    {
        id: 'patterns-behavioral',
        title: 'Behavioral',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: patternGroupMethods('patterns-behavioral'),
    },
    {
        id: 'patterns-architectural',
        title: 'Architectural',
        parent: 'patterns',
        parentTitle: 'Design Patterns',
        methods: patternGroupMethods('patterns-architectural'),
    },
    {
        id: 'nano-llm',
        title: 'nano-LLM',
        methods: [
            { id: 'nano-bpe-encode', title: 'BPE Encode (trie)', file: 'nano-bpe-encode.cpp', visualizer: 'bpeEncode', controls: 'bpeEncode' },
            { id: 'nano-compute-graph', title: 'Compute Graph (DAG)', file: 'nano-compute-graph.cpp', visualizer: 'computeGraph', controls: 'computeGraph' },
            { id: 'nano-bpe-train', title: 'BPE Train (list+heap)', file: 'nano-bpe-train.cpp', visualizer: 'bpeTrain', controls: 'bpeTrain' },
            { id: 'nano-ngram-next', title: 'n-gram Sampling (hash)', file: 'nano-ngram-next.cpp', visualizer: 'ngramNext', controls: 'ngramNext' },
        ],
    },
];

function getMethodGroupById(groupId) {
    return METHOD_GROUPS.find((group) => group.id === groupId) || METHOD_GROUPS[0];
}

function getMethodGroupForMode(mode) {
    return METHOD_GROUPS.find((group) => group.methods.some((method) => method.id === mode)) || METHOD_GROUPS[0];
}

function getCodeForMethod(methodId) {
    const b = (typeof window !== 'undefined' && window.VizRegistry) ? window.VizRegistry.behavior(methodId) : null;
    if (b && b.code) return b.code();
    const codeByMethod = {
        'stack-array': codeArray,
        'stack-list': codeLinkedList,
        queue: codeQueue,
        'list-array': codeListArray,
        'list-linked': codeListLinked,
        'deque': codeDeque,
        'expr-infix-postfix': codeExprInfixPostfix,
        'maze-stack': codeMazeStack,
        'list-doubly': codeListDoubly,
        'list-equivalence': codeListEquivalence,
        'tree-bst': codeTreeBST,
        'tree-avl': codeTreeAVL,
        'tree-rb': codeTreeRB,
        'tree-splay': codeTreeSplay,
        'tree-trie': codeTreeTrie,
        'tree-radix': codeTreeRadix,
        'tree-ternary': codeTreeTST,
        'tree-btree': codeTreeBTree,
        'tree-bplus': codeTreeBPlus,
        'tree-dsu': codeTreeDSU,
        'tree-segment': codeTreeSegment,
        'tree-fenwick': codeTreeFenwick,
        'tree-traversal': codeTreeTraversal,
        'huffman': codeHuffman,
        'matrix-sparse': codeMatrixSparse,
        'matrix-sparse-list': codeMatrixSparseList,
        'poly-padd': codePolyPadd,
        'magic-square': codeMagicSquare,
        'magic-latin': codeMagicLatin,
        'magic-torus': codeMagicTorus,
        'magic-formula': codeMagicFormula,
        'magic-symmetry': codeMagicSymmetry,
        'tree-obst': codeTreeObst,
        'tree-threaded': codeTreeThreaded,
        'tree-mway': codeTreeMway,
        'tree-expression': codeTreeExpression,
        'tree-general-binary': codeTreeGeneralBinary,
        'game-tree': codeGameTree,
        'sort-external': codeSortExternal,
        'gc-memory': codeGcMemory,
        'recursion': codeRecursion,
        'file-isam': codeFileIsam,
        'file-inverted': codeFileInverted,
        'sort-polyphase': codeSortPolyphase,
        graph: codeGraph,
        'graph-adjlist': codeGraphAdjlist,
        'graph-multilist': codeGraphMultilist,
        'graph-traversal': codeGraphTraversal,
        'graph-bfs': codeGraphBFS,
        'graph-dfs': codeGraphDFS,
        'graph-kruskal': codeGraphKruskal,
        'graph-dijkstra': codeGraphDijkstra,
        'graph-topo': codeGraphTopo,
        'graph-prim': codeGraphPrim,
        'graph-boruvka': codeGraphBoruvka,
        'graph-redblue': codeGraphRedblue,
        'graph-bellman-ford': codeGraphBellmanFord,
        'graph-floyd-warshall': codeGraphFloydWarshall,
        'graph-aoe': codeGraphAoe,
        'hash-chain': codeHashChain,
        'hash-open': codeHashOpen,
        'hash-bucket': codeHashBucket,
        'bloom-filter': codeBloomFilter,
        'skip-list': codeSkipList,
        'count-min-sketch': codeCountMinSketch,
        'cache-lru': codeLruCache,
        'nano-bpe-encode': codeNanoBpeEncode,
        'nano-compute-graph': codeNanoComputeGraph,
        'nano-bpe-train': codeNanoBpeTrain,
        'nano-ngram-next': codeNanoNgramNext,
        'search-linear': codeSearchLinear,
        'search-binary': codeSearchBinary,
        'search-kmp': codeSearchKMP,
        'search-bm': codeSearchBM,
        'search-rk': codeSearchRK,
        'search-strcompare': codeSearchStrCompare,
        'search-zalgo': codeSearchZAlgo,
        'search-aho': codeSearchAho,
        'search-fibonacci': codeSearchFibonacci,
        'search-interpolation': codeSearchInterpolation,
        'sort-bubble': codeSortBubble,
        'sort-select': codeSortSelect,
        'sort-insert': codeSortInsert,
        'sort-quick': codeSortQuick,
        'sort-merge': codeSortMerge,
        'sort-shell': codeSortShell,
        'sort-bucket': codeSortBucket,
        'sort-count': codeSortCounting,
        'sort-radix': codeSortRadix,
        'sort-heap': codeSortHeap,
        'sort-shaker': codeSortShaker,
        'heap-binary': codeHeapBinary,
        'heap-binomial': codeHeapBinomial,
        'heap-fibonacci': codeHeapFibonacci,
        'heap-leftist': codeHeapLeftist,
        'heap-skew': codeHeapSkew,
        'heap-dary': codeHeapDary,
        'heap-pairing': codeHeapPairing,
        'oop-inheritance': codeOOPInheritance,
        'oop-polymorphism': codeOOPPolymorphism,
        'oop-encapsulation': codeOOPEncapsulation,
        'oop-abstraction': codeOOPAbstraction,
        'oop-adhoc': codeOOPAdhoc,
        'oop-templates': codeOOPTemplates,
    };
    return codeByMethod[methodId] || '// Source code pending.';
}

// MAIN DOM INTERACTION
document.addEventListener('DOMContentLoaded', () => {
    if (window.I18N) {
        window.I18N.applyTranslations(document);
    }

    const categoryNav = document.getElementById('category-nav');
    const methodSections = document.getElementById('method-sections');
    const slideViewer = document.getElementById('slide-viewer');
    const slideViewerTitle = document.getElementById('slide-viewer-title');
    const slideViewerProgress = document.getElementById('slide-viewer-progress');
    const slideViewerBody = document.getElementById('slide-viewer-body');
    const slideViewerNotes = slideViewer ? slideViewer.querySelector('.slideviewer-notes') : null;
    const slideNotesToggle = slideViewer ? slideViewer.querySelector('.slideviewer-notes-toggle') : null;
    if (slideViewerNotes) {
        slideViewerNotes.setAttribute('aria-label', 'Slide speaker notes');
        slideViewerNotes.setAttribute('role', 'region');
    }
    const slidePrev = document.getElementById('slide-prev');
    const slideNext = document.getElementById('slide-next');
    const slideCloseButtons = document.querySelectorAll('[data-slide-close]');
    const runtimeControls = document.querySelector('.visualization-panel .controls');
    const runtimeVisualizer = document.querySelector('.stack-container-wrapper');
    
    const categoryButtons = new Map();
    const subTabButtons = new Map();
    const methodDropdownButtons = new Map();
    const overviewPillButtons = new Map();
    let dropdownGlobalListenersRegistered = false;

    const overviewSection = document.getElementById('overview-section');
    const overviewGrid = document.querySelector('[data-testid="overview-grid"]');

    function isOverviewVisible() {
        return overviewSection && !overviewSection.hidden;
    }

    function renderOverview() {
        if (!overviewGrid) return;
        overviewGrid.innerHTML = '';
        const renderedParents = new Set();
        METHOD_GROUPS.forEach((group) => {
            let displayGroupId;
            let methods;
            if (group.parent) {
                if (renderedParents.has(group.parent)) return;
                renderedParents.add(group.parent);
                displayGroupId = group.parent;
                methods = METHOD_GROUPS
                    .filter((g) => g.parent === group.parent)
                    .flatMap((g) => g.methods.map((m) => ({ id: m.id, _groupId: g.id })));
            } else {
                displayGroupId = group.id;
                methods = group.methods.map((m) => ({ id: m.id, _groupId: group.id }));
            }
            const card = document.createElement('div');
            card.className = 'overview-category';
            card.dataset.group = displayGroupId;
            const header = document.createElement('h3');
            header.className = 'overview-category-title';
            header.textContent = t('group.' + displayGroupId);
            card.appendChild(header);
            const tiles = document.createElement('div');
            tiles.className = 'overview-methods';
            methods.forEach((m) => {
                const tile = document.createElement('button');
                tile.type = 'button';
                tile.className = 'overview-tile';
                tile.dataset.methodId = m.id;
                tile.textContent = t('method.' + m.id);
                tile.addEventListener('click', () => {
                    hideOverview();
                    setActiveCategory(m._groupId);
                    selectMethod(m.id);
                    scrollToCategory(m._groupId);
                });
                tiles.appendChild(tile);
            });
            card.appendChild(tiles);
            overviewGrid.appendChild(card);
        });
    }

    function showOverview() {
        if (!overviewSection) return;
        if (methodSections) methodSections.classList.add('is-collapsed');
        overviewSection.hidden = false;
        overviewPillButtons.forEach((b) => {
            b.classList.add('active');
            b.setAttribute('aria-current', 'true');
        });
        categoryButtons.forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-current', 'false');
        });
        subTabButtons.forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-current', 'false');
        });
        const subTabRow = categoryNav && categoryNav.querySelector('.category-subtab-row');
        if (subTabRow) subTabRow.classList.remove('visible');
        renderOverview();
        // Scroll so the user lands at the top of the overview, not mid-page.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideOverview() {
        if (!overviewSection || overviewSection.hidden) return;
        overviewSection.hidden = true;
        if (methodSections) methodSections.classList.remove('is-collapsed');
        overviewPillButtons.forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-current', 'false');
        });
    }

    function setActiveCategory(groupId) {
        const group = getMethodGroupById(groupId);
        const parentId = group && group.parent;
        categoryButtons.forEach((button, id) => {
            const isActive = id === groupId || id === parentId;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
        subTabButtons.forEach((button, id) => {
            const isActive = id === groupId;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
        const subTabRow = categoryNav && categoryNav.querySelector('.category-subtab-row');
        if (subTabRow) subTabRow.classList.toggle('visible', !!parentId);
    }

    function expandModeGroup(groupId) {
        setActiveCategory(groupId);
        renderMethodSections(groupId);
    }

    function getEscapedCode(methodId) {
        return getCodeForMethod(methodId)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function bindZoomControls(section) {
        const scaled = section.querySelector('.viz-body-scaled');
        const controls = section.querySelector('.viz-zoom-controls');
        const visualHost = section.querySelector('.method-section-visual');
        if (!scaled || !controls || !visualHost) return;
        const resetBtn = controls.querySelector('[data-zoom="reset"]');
        const inBtn = controls.querySelector('[data-zoom="in"]');
        const outBtn = controls.querySelector('[data-zoom="out"]');
        let zoom = 1.0;
        function applyZoom(z) {
            zoom = Math.max(0.5, Math.min(2.0, Math.round(z * 100) / 100));
            scaled.style.setProperty('--viz-zoom', String(zoom));
            resetBtn.textContent = Math.round(zoom * 100) + '%';
            requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); }); // host-fitting viz repaint at new zoom
        }
        inBtn.addEventListener('click', () => applyZoom(zoom + 0.1));
        outBtn.addEventListener('click', () => applyZoom(zoom - 0.1));
        resetBtn.addEventListener('click', () => applyZoom(1.0));

        // Zoom is controlled exclusively via the +/−/reset buttons above.
        // Gesture-based zoom (mouse wheel + multi-touch pinch) is intentionally NOT bound:
        // on a Mac trackpad, two-finger scroll and pinch both arrive as `wheel` events, which
        // made the visualization zoom during ordinary scrolling. Keeping zoom button-only avoids
        // that and lets the page scroll normally over the visualizer.
        applyZoom(1.0);
    }

    function mountActiveRuntime(section) {
        const visualHost = section.querySelector('.method-section-visual');
        if (!visualHost) return;
        if (!runtimeControls || !runtimeVisualizer) return;
        visualHost.classList.add('method-section-visual-live');
        visualHost.setAttribute('aria-label', 'Active interactive visualization');
        visualHost.innerHTML = '';

        const scaled = document.createElement('div');
        scaled.className = 'viz-body-scaled';
        scaled.appendChild(runtimeControls);
        scaled.appendChild(runtimeVisualizer);
        visualHost.appendChild(scaled);

        bindZoomControls(section);
    }

    function renderMethodSections(groupId) {
        if (!methodSections) return;
        const group = getMethodGroupById(groupId);
        const runtimeFragment = document.createDocumentFragment();
        if (runtimeControls?.parentNode) runtimeFragment.appendChild(runtimeControls);
        if (runtimeVisualizer?.parentNode) runtimeFragment.appendChild(runtimeVisualizer);
        methodSections.innerHTML = '';
        const activeMethodId = arguments[1] || (
            group.methods.some((method) => method.id === visualizerRuntime.activeMode)
                ? visualizerRuntime.activeMode
                : group.methods[0]?.id
        );
        const method = group.methods.find((candidate) => candidate.id === activeMethodId) || group.methods[0];
        if (!method) return;

        const heading = document.createElement('div');
        heading.className = 'method-sections-heading';
        const titleGroup = document.createElement('div');
        titleGroup.className = 'method-sections-title';
        const titleRow = document.createElement('div');
        titleRow.className = 'method-title-row';
        const title = document.createElement('h2');
        const groupLabel = t('group.' + group.id);
        const methodLabel = t('method.' + method.id);
        title.textContent = groupLabel;
        const methodPicker = document.createElement('span');
        methodPicker.className = 'method-heading-title';
        methodPicker.dataset.testid = 'method-heading-title';
        methodPicker.textContent = methodLabel;
        const countText = document.createElement('p');
        countText.textContent = t('app.methods-available', { count: group.methods.length });
        titleRow.appendChild(title);
        titleRow.appendChild(methodPicker);
        titleGroup.appendChild(titleRow);
        titleGroup.appendChild(countText);
        heading.appendChild(titleGroup);
        methodSections.appendChild(heading);

        if (visualizerRuntime.activeMode !== method.id) visualizerRuntime.setMode(method.id);
        const section = document.createElement('section');
        section.className = 'method-section-card active';
        section.dataset.methodSection = method.id;
        section.dataset.runtimeState = 'active';
        // Methods flagged codeDrawer keep the C++ source in a collapsed side
        // drawer (opened via a header button) so the visualization gets the
        // full card width. Everyone else keeps the side-by-side grid.
        const useCodeDrawer = !!method.codeDrawer;
        const codePanelHtml = `
                <div class="code-panel" data-language="cpp">
                    <div class="code-panel-header">
                        <span class="code-panel-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                        <span class="code-panel-filename">${method.file}</span>
                        <button type="button" class="code-panel-copy" data-code-copy aria-label="Copy code">⧉ Copy</button>
                    </div>
                    <pre class="code-panel-body"><code class="language-cpp">${getEscapedCode(method.id)}</code></pre>
                </div>`;
        section.innerHTML = `
            <div class="method-section-header">
                <div>
                    <span class="method-section-kicker">${groupLabel}</span>
                    <h3>${methodLabel}</h3>
                </div>
                <div class="method-section-actions">
                    <div class="viz-zoom-controls" role="toolbar" aria-label="Zoom controls">
                        <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
                        <button type="button" data-zoom="reset" aria-label="Reset zoom">100%</button>
                        <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
                    </div>
                    ${useCodeDrawer ? `<button type="button" class="btn secondary code-drawer-toggle" data-testid="code-drawer-toggle" aria-expanded="false" aria-haspopup="dialog">&lt;/&gt; ${method.file}</button>` : ''}
                    <button type="button" class="btn secondary viz-focus-toggle" data-testid="viz-focus-toggle" aria-pressed="${document.body.classList.contains('viz-focus') ? 'true' : 'false'}" data-i18n-aria-label="aria.fullscreen-toggle" aria-label="Toggle fullscreen focus mode" title="${t('btn.fullscreen')}">⛶ ${t('btn.fullscreen')}</button>
                    <button type="button" class="btn secondary method-slides-btn" data-method="${method.id}">Slides</button>
                    ${(window.QUIZ_RENDERED && window.QUIZ_RENDERED[method.id]) ? `<button type="button" class="btn secondary method-quiz-btn" data-method="${method.id}" data-testid="method-quiz-btn">${t('btn.quiz')}</button>` : ''}
                    ${(window.LAB_RENDERED && window.LAB_RENDERED[method.id]) ? `<button type="button" class="btn secondary method-lab-btn" data-method="${method.id}" data-testid="method-lab-btn">${t('btn.lab')}</button>` : ''}
                </div>
            </div>
            <div class="method-section-grid${useCodeDrawer ? ' method-section-grid--full' : ''}">
                <div class="method-section-visual" aria-label="${methodLabel} visualization shell">
                    <span>${method.visualizer}</span>
                    <strong>${methodLabel}</strong>
                </div>
                ${useCodeDrawer ? '' : codePanelHtml}
            </div>
            ${useCodeDrawer ? `
            <aside class="code-drawer" data-testid="code-drawer" hidden>
                <button type="button" class="code-drawer-backdrop" data-code-drawer-close aria-label="Close code panel"></button>
                <section class="code-drawer-panel" role="dialog" aria-modal="true" aria-label="${method.file}" tabindex="-1">
                    <header class="code-drawer-header">
                        <h3>${method.file}</h3>
                        <button type="button" class="code-drawer-close" data-code-drawer-close aria-label="Close">×</button>
                    </header>
                    <div class="code-drawer-body">${codePanelHtml}</div>
                </section>
            </aside>` : ''}
        `;
        section.querySelector('.method-slides-btn').addEventListener('click', () => openSlides(method.id));
        const quizBtn = section.querySelector('.method-quiz-btn');
        if (quizBtn) quizBtn.addEventListener('click', () => { if (window.QuizViewer) window.QuizViewer.open(method.id); });
        const labBtn = section.querySelector('.method-lab-btn');
        if (labBtn) labBtn.addEventListener('click', () => { if (window.LabViewer) window.LabViewer.open(method.id); });
        const codeDrawerToggle = section.querySelector('.code-drawer-toggle');
        if (codeDrawerToggle) {
            const drawer = section.querySelector('.code-drawer');
            const drawerPanel = drawer.querySelector('.code-drawer-panel');
            const onDrawerKeydown = (e) => { if (e.key === 'Escape') closeDrawer(); };
            const openDrawer = () => {
                drawer.hidden = false;
                drawer.classList.add('open');
                codeDrawerToggle.setAttribute('aria-expanded', 'true');
                drawerPanel.focus();
                document.addEventListener('keydown', onDrawerKeydown);
            };
            const closeDrawer = () => {
                drawer.hidden = true;
                drawer.classList.remove('open');
                codeDrawerToggle.setAttribute('aria-expanded', 'false');
                document.removeEventListener('keydown', onDrawerKeydown);
            };
            codeDrawerToggle.addEventListener('click', openDrawer);
            drawer.querySelectorAll('[data-code-drawer-close]').forEach((btn) => btn.addEventListener('click', closeDrawer));
        }
        methodSections.appendChild(section);
        mountActiveRuntime(section);
        if (window.Prism) Prism.highlightAllUnder(section);
        // Wrap each line in .code-line so the CSS line-number gutter renders.
        section.querySelectorAll('.code-panel-body > code').forEach((codeEl) => {
          const lines = codeEl.innerHTML.split('\n');
          codeEl.innerHTML = lines.map((line) =>
            '<span class="code-line">' + line + '</span>'
          ).join('\n');
        });
    }

    function selectMethod(methodId) {
        switchMode(methodId);
        const want = '#m=' + methodId;
        if (window.location.hash !== want) {
            history.replaceState(null, '', want);
        }
    }

    // Deck list = [{ id, kind: 'public', titleEn, titleZh, slides: [{title,body}], access }]
    // Single-deck case (deckList.length === 1) hides the picker bar.
    let slideDeckList = [];
    let slideDeckIndex = 0;
    let slideIndex = 0;
    let slideMethodId = null;
    const slideLangToggle = document.getElementById('slide-lang-toggle');

    function getMethodById(methodId) {
        for (const group of METHOD_GROUPS) {
            const method = group.methods.find((candidate) => candidate.id === methodId);
            if (method) return method;
        }
        return null;
    }

    function publicSlidesFor(methodId) {
        const lang = window.I18N ? window.I18N.getCurrentLanguage() : 'en';
        const entry = window.SLIDES_RENDERED && window.SLIDES_RENDERED[methodId];
        if (!entry || !entry.slides[lang] || entry.slides[lang].length === 0) {
            return [{ title: t('method.' + methodId) || methodId,
                      body: '<p>' + t('slide.no-slides') + '</p>' }];
        }
        return entry.slides[lang];
    }

    function publicDeckFor(methodId) {
        // Both titleEn/titleZh get the current-language value; openSlides()
        // re-rebuilds the deck list when language changes, so the picker
        // re-renders with the correct title for the new language.
        const title = t('method.' + methodId) || methodId;
        return {
            id: methodId + '-public',
            kind: 'public',
            titleEn: title,
            titleZh: title,
            slides: publicSlidesFor(methodId),
            access: 'ok',
        };
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    function deckTitle(deck) {
        const lang = window.I18N ? window.I18N.getCurrentLanguage() : 'en';
        return (lang === 'zh') ? deck.titleZh : deck.titleEn;
    }

    function renderDeckBar() {
        if (slideDeckList.length <= 1) return '';
        const html = slideDeckList.map((d, i) => {
            const classes = ['slideviewer-deck-btn'];
            if (i === slideDeckIndex) classes.push('slideviewer-deck-btn--active');
            return '<button type="button" class="' + classes.join(' ') + '"' +
                   ' data-deck-index="' + i + '" data-testid="slide-deck-' + i + '">' +
                   deckTitle(d) + '</button>';
        }).join('');
        return '<div class="slideviewer-decks" data-testid="slideviewer-decks">' + html + '</div>';
    }

    function renderSlide() {
        if (!slideViewer || slideDeckList.length === 0) return;
        const deck = slideDeckList[slideDeckIndex];
        const slide = deck.slides[slideIndex] || { title: '', body: '', notes: '' };

        // Bar shows deck name as small label (per-slide title goes in body below).
        slideViewerTitle.textContent = deckTitle(deck);

        // Progress / counter — now in foot meta
        slideViewerProgress.textContent = t('slide.progress', {
            n: slideIndex + 1,
            total: deck.slides.length,
        });

        // Deck bar — rendered into bar between title and lang-toggle.
        // Single-deck case: omit (title stands alone, matching rdvisual).
        const bar = slideViewer.querySelector('.slideviewer-bar');
        const existingDecks = bar.querySelector('.slideviewer-decks');
        if (existingDecks) existingDecks.remove();
        if (slideDeckList.length > 1) {
            const decksHtml = renderDeckBar();
            // renderDeckBar returns '<div class="slideviewer-decks">…</div>'; insert
            // after title so order is: title, decks, lang-toggle, close.
            slideViewerTitle.insertAdjacentHTML('afterend', decksHtml);
            bar.querySelectorAll('[data-deck-index]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-deck-index'), 10);
                    if (slideDeckList[idx]) {
                        slideDeckIndex = idx;
                        slideIndex = 0;
                        renderSlide();
                    }
                });
            });
        }

        // Slide body — inject slide.title as <h1> if present (matches rdvisual
        // presentation style: title is large, in the slide content area).
        const titleHtml = slide.title
            ? `<h1 class="slide-title">${escapeHtml(slide.title)}</h1>`
            : '';
        slideViewerBody.innerHTML = titleHtml + slide.body;
        slideViewerBody.scrollTop = 0;

        // Notes panel — show toggle if slide has notes; hide both panel and toggle if not.
        const hasNotes = Boolean(slide.notes && slide.notes.trim());
        if (hasNotes) {
            slideViewerNotes.textContent = slide.notes;
            slideNotesToggle.hidden = false;
            // Don't auto-open on slide change — respect prior toggle state.
            // Panel visibility tracked via slideViewerNotes.hidden.
        } else {
            slideViewerNotes.textContent = '';
            slideViewerNotes.hidden = true;
            slideNotesToggle.hidden = true;
        }

        slidePrev.disabled = slideIndex === 0;
        slideNext.disabled = slideIndex >= deck.slides.length - 1;
    }

    function openSlides(methodId) {
        slideMethodId = methodId;
        slideDeckList = [publicDeckFor(methodId)];
        slideDeckIndex = 0;
        slideIndex = 0;
        if (slideViewerNotes) slideViewerNotes.hidden = true;
        renderSlide();
        slideViewer.hidden = false;
        slideViewer.classList.add('open');
        slideViewer.querySelector('.slideviewer-panel').focus();
        slideViewer.addEventListener('keydown', handleSlideKeydown);
    }

    function closeSlides() {
        if (!slideViewer) return;
        slideViewer.hidden = true;
        slideViewer.classList.remove('open');
        slideViewer.removeEventListener('keydown', handleSlideKeydown);
    }

    function handleSlideKeydown(e) {
        const deck = slideDeckList[slideDeckIndex];
        if (!deck) return;
        if (e.key === 'Escape') {
            closeSlides();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            if (slideIndex < deck.slides.length - 1) { slideIndex++; renderSlide(); }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (slideIndex > 0) { slideIndex--; renderSlide(); }
        }
    }

    slideCloseButtons.forEach((button) => button.addEventListener('click', closeSlides));

    // Click anywhere on overlay background (but not the panel) closes the modal.
    // Replaces the removed .slide-viewer-backdrop button.
    slideViewer.addEventListener('click', (e) => {
        if (e.target === slideViewer) closeSlides();
    });

    slidePrev.addEventListener('click', () => {
        const deck = slideDeckList[slideDeckIndex];
        if (deck && slideIndex > 0) { slideIndex--; renderSlide(); }
    });
    slideNext.addEventListener('click', () => {
        const deck = slideDeckList[slideDeckIndex];
        if (deck && slideIndex < deck.slides.length - 1) { slideIndex++; renderSlide(); }
    });

    if (slideNotesToggle) {
        slideNotesToggle.addEventListener('click', () => {
            slideViewerNotes.hidden = !slideViewerNotes.hidden;
        });
    }

    if (slideLangToggle) {
        slideLangToggle.addEventListener('click', () => {
            const next = window.I18N.getCurrentLanguage() === 'zh' ? 'en' : 'zh';
            window.I18N.setLanguage(next);
            if (!slideViewer.hidden && slideMethodId) {
                // Rebuild deck list with the new language.
                openSlides(slideMethodId);
            }
        });
    }

    function updateLangToggleLabel() {
        if (!slideLangToggle) return;
        const cur = window.I18N ? window.I18N.getCurrentLanguage() : 'en';
        // Label shows the TARGET language using the "switch to X" idiom.
        slideLangToggle.textContent = cur === 'zh' ? 'EN' : '中';
        slideLangToggle.setAttribute('data-lang', cur);
    }
    updateLangToggleLabel();

    const langMenu = document.querySelector('.lang-menu');
    const langMenuCurrent = document.querySelector('.lang-menu-current');
    const langMenuOptions = document.querySelectorAll('.lang-menu-option');

    function langDisplayName(lang) {
        return lang === 'zh' ? '中文' : 'English';
    }

    function updateLangMenuLabel() {
        const cur = window.I18N ? window.I18N.getCurrentLanguage() : 'en';
        if (langMenuCurrent) langMenuCurrent.textContent = langDisplayName(cur);
        langMenuOptions.forEach((opt) => {
            opt.classList.toggle('is-current-lang', opt.dataset.lang === cur);
        });
    }
    updateLangMenuLabel();

    langMenuOptions.forEach((opt) => {
        opt.addEventListener('click', () => {
            const next = opt.dataset.lang;
            if (window.I18N) window.I18N.setLanguage(next);
            if (langMenu) langMenu.classList.remove('open');
        });
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-code-copy]');
      if (!btn) return;
      const panel = btn.closest('.code-panel');
      if (!panel) return;
      const codeEl = panel.querySelector('code');
      if (!codeEl) return;
      navigator.clipboard.writeText(codeEl.textContent).then(() => {
        btn.dataset.copied = '1';
        const original = btn.textContent;
        btn.textContent = t('btn.copied');
        setTimeout(() => { btn.textContent = original; delete btn.dataset.copied; }, 1500);
      });
    });

    const DENSITY_STORAGE_KEY = 'dsvisual.codeDensity';
    const DIFFICULTY_VALUES = ['normal', 'special', 'edge', 'large'];
    const DIFFICULTY_GLOBAL_KEY = 'dsvisual.inputDifficulty.global';
    const DIFFICULTY_VIZ_PREFIX = 'dsvisual.inputDifficulty.viz.';

    function getGlobalDifficulty() {
        let v = null;
        try { v = localStorage.getItem(DIFFICULTY_GLOBAL_KEY); } catch (e) { v = null; }
        return DIFFICULTY_VALUES.indexOf(v) === -1 ? 'normal' : v;
    }
    function getVizOverride(methodId) {
        let v = null;
        try { v = localStorage.getItem(DIFFICULTY_VIZ_PREFIX + methodId); } catch (e) { v = null; }
        return DIFFICULTY_VALUES.indexOf(v) === -1 ? null : v;
    }
    function getInputDifficulty() {
        return getVizOverride(currentMode) || getGlobalDifficulty();
    }
    function setGlobalDifficulty(value) {
        if (DIFFICULTY_VALUES.indexOf(value) === -1) return;
        try { localStorage.setItem(DIFFICULTY_GLOBAL_KEY, value); } catch (e) { /* ignore */ }
    }
    function setVizOverride(methodId, value) {
        try {
            if (value && DIFFICULTY_VALUES.indexOf(value) !== -1) localStorage.setItem(DIFFICULTY_VIZ_PREFIX + methodId, value);
            else localStorage.removeItem(DIFFICULTY_VIZ_PREFIX + methodId);
        } catch (e) { /* ignore */ }
    }

    function syncDifficultySelect() {
        const sel = document.getElementById('input-difficulty');
        if (!sel) return;
        sel.value = getGlobalDifficulty();
        const cap = document.getElementById('input-difficulty-cat');
        if (cap) cap.textContent = '';
    }

    function bindDifficultySelect() {
        const sel = document.getElementById('input-difficulty');
        if (!sel) return;
        sel.addEventListener('change', () => { setGlobalDifficulty(sel.value); });
        syncDifficultySelect();
    }

    function buildInlineDifficultySelect() {
        const sel = document.createElement('select');
        sel.className = 'viz-difficulty';
        sel.setAttribute('data-testid', 'viz-difficulty');
        sel.setAttribute('aria-label', (typeof t === 'function' ? t('aria.viz-difficulty') : 'Random input difficulty (this visualizer)'));

        const follow = document.createElement('option');
        follow.value = '';
        follow.textContent = (typeof t === 'function' ? t('difficulty.follow-global') : 'Follow global');
        sel.appendChild(follow);
        DIFFICULTY_VALUES.forEach((v) => {
            const o = document.createElement('option');
            o.value = v;
            o.textContent = (typeof t === 'function' ? t('difficulty.' + v) : v);
            sel.appendChild(o);
        });
        sel.value = getVizOverride(currentMode) || '';
        sel.addEventListener('change', () => { setVizOverride(currentMode, sel.value); });
        return sel;
    }

    function injectInlineDifficulty(root) {
        const scope = root || document;
        scope.querySelectorAll('.ex-select').forEach((ex) => {
            const next = ex.nextElementSibling;
            if (next && next.classList.contains('viz-difficulty')) return;
            ex.insertAdjacentElement('afterend', buildInlineDifficultySelect());
        });
    }

    function initInlineDifficulty() {
        if (!runtimeVisualizer) return;
        injectInlineDifficulty(runtimeVisualizer);
        const obs = new MutationObserver(() => injectInlineDifficulty(runtimeVisualizer));
        obs.observe(runtimeVisualizer, { childList: true, subtree: true });
    }

    function applySavedDensity() {
        const v = localStorage.getItem(DENSITY_STORAGE_KEY);
        if (v) document.documentElement.style.setProperty('--code-line-height', v);
    }

    function bindSettingsDrawer() {
        const toggle = document.getElementById('settings-toggle');
        const drawer = document.getElementById('settings-drawer');
        if (!toggle || !drawer) return;
        const closers = drawer.querySelectorAll('[data-settings-close]');
        const panel = drawer.querySelector('.settings-drawer-panel');
        function onKeydown(e) {
            if (e.key === 'Escape') close();
        }
        function open() {
            drawer.hidden = false;
            drawer.classList.add('open');
            panel.focus();
            document.addEventListener('keydown', onKeydown);
        }
        function close() {
            drawer.hidden = true;
            drawer.classList.remove('open');
            document.removeEventListener('keydown', onKeydown);
        }
        toggle.addEventListener('click', open);
        closers.forEach((btn) => btn.addEventListener('click', close));
    }

    function bindDensitySlider() {
        const slider = document.getElementById('code-density-slider');
        const display = document.getElementById('code-density-value');
        const resetBtn = document.getElementById('code-density-reset');
        if (!slider || !display || !resetBtn) return;
        const saved = localStorage.getItem(DENSITY_STORAGE_KEY) || '1.55';
        slider.value = saved;
        display.textContent = saved;
        slider.addEventListener('input', () => {
            document.documentElement.style.setProperty('--code-line-height', slider.value);
            display.textContent = slider.value;
            localStorage.setItem(DENSITY_STORAGE_KEY, slider.value);
        });
        resetBtn.addEventListener('click', () => {
            slider.value = '1.55';
            display.textContent = '1.55';
            document.documentElement.style.removeProperty('--code-line-height');
            localStorage.removeItem(DENSITY_STORAGE_KEY);
        });
    }

    let applyHashRoute = function () {};   // reassigned inside renderCategoryNav

    function renderCategoryNav() {
        if (!categoryNav) return;
        categoryNav.innerHTML = '';
        categoryButtons.clear();
        subTabButtons.clear();
        methodDropdownButtons.clear();
        overviewPillButtons.clear();

        // Overview pill — always leftmost, no dropdown, click toggles the overview view.
        const overviewItem = document.createElement('div');
        overviewItem.className = 'category-nav-item category-nav-item-overview';
        overviewItem.dataset.group = '__overview__';
        const overviewBtn = document.createElement('button');
        overviewBtn.type = 'button';
        overviewBtn.className = 'category-nav-btn';
        overviewBtn.dataset.group = '__overview__';
        overviewBtn.textContent = t('nav.overview');
        overviewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            categoryNav.querySelectorAll('.category-nav-item.open')
                .forEach((it) => it.classList.remove('open'));
            showOverview();
        });
        overviewItem.appendChild(overviewBtn);
        categoryNav.appendChild(overviewItem);
        overviewPillButtons.set('__overview__', overviewBtn);

        function activateGroup(groupId, methodId) {
            const group = getMethodGroupById(groupId);
            if (!group) return;
            hideOverview();
            const nextMethod = methodId || group.methods[0]?.id;
            setActiveCategory(group.id);
            if (nextMethod) {
                selectMethod(nextMethod);
            }
            scrollToCategory(group.id);
        }

        applyHashRoute = function () {
            const m = /^#m=([A-Za-z0-9-]+)$/.exec(window.location.hash || '');
            if (!m) return;                                   // no/!matching hash -> leave default
            const id = m[1];
            if (!getMethodById(id)) return;                   // unknown id -> leave default (no error)
            if (visualizerRuntime && visualizerRuntime.activeMode === id) return;  // already active
            const group = METHOD_GROUPS.find((g) => g.methods.some((x) => x.id === id));
            if (group) activateGroup(group.id, id);
        };

        function closeAllDropdowns() {
            categoryNav.querySelectorAll('.category-nav-item.open')
                .forEach((it) => it.classList.remove('open'));
        }

        function buildPillItem(parentId, parentTitle, subGroups) {
            const item = document.createElement('div');
            item.className = 'category-nav-item';
            item.dataset.group = parentId;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'category-nav-btn';
            btn.dataset.group = parentId;
            btn.textContent = parentTitle;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasOpen = item.classList.contains('open');
                closeAllDropdowns();
                if (!wasOpen) item.classList.add('open');
            });

            const dropdown = document.createElement('div');
            dropdown.className = 'category-nav-dropdown' +
                (subGroups.length > 1 ? ' category-nav-dropdown-grouped' : '');

            subGroups.forEach((sg) => {
                if (subGroups.length > 1) {
                    const header = document.createElement('button');
                    header.type = 'button';
                    header.className = 'category-nav-group-header';
                    header.dataset.subgroup = sg.id;
                    header.textContent = t('group.' + sg.id);
                    header.addEventListener('click', (e) => {
                        e.stopPropagation();
                        activateGroup(sg.id);
                        closeAllDropdowns();
                    });
                    dropdown.appendChild(header);
                }
                sg.methods.forEach((m) => {
                    const mb = document.createElement('button');
                    mb.type = 'button';
                    mb.className = 'category-nav-method';
                    mb.dataset.methodId = m.id;
                    mb.textContent = t('method.' + m.id);
                    mb.addEventListener('click', () => {
                        activateGroup(sg.id, m.id);
                        closeAllDropdowns();
                        // Suppress the CSS :hover re-open until the cursor leaves the item,
                        // so the dropdown closes immediately after a selection.
                        item.classList.add('nav-picked');
                        item.addEventListener('mouseleave', () => item.classList.remove('nav-picked'), { once: true });
                    });
                    methodDropdownButtons.set(m.id, mb);
                    dropdown.appendChild(mb);
                });
            });

            item.appendChild(btn);
            item.appendChild(dropdown);
            categoryButtons.set(parentId, btn);
            return item;
        }

        const subTabRow = document.createElement('div');
        subTabRow.className = 'category-subtab-row';
        subTabRow.dataset.testid = 'category-subtab-row';

        const renderedParents = new Set();
        METHOD_GROUPS.forEach((group) => {
            if (group.parent) {
                if (!renderedParents.has(group.parent)) {
                    renderedParents.add(group.parent);
                    const subGroups = METHOD_GROUPS.filter((g) => g.parent === group.parent);
                    const item = buildPillItem(group.parent, t('group.' + group.parent), subGroups);
                    categoryNav.appendChild(item);
                }
                const tabBtn = document.createElement('button');
                tabBtn.type = 'button';
                tabBtn.className = 'category-subtab-btn';
                tabBtn.dataset.subgroup = group.id;
                tabBtn.dataset.parent = group.parent;
                tabBtn.textContent = t('group.' + group.id);
                tabBtn.addEventListener('click', () => activateGroup(group.id));
                subTabButtons.set(group.id, tabBtn);
                subTabRow.appendChild(tabBtn);
            } else {
                const item = buildPillItem(group.id, t('group.' + group.id), [group]);
                categoryNav.appendChild(item);
            }
        });

        categoryNav.appendChild(subTabRow);

        if (!dropdownGlobalListenersRegistered) {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.category-nav-item')) closeAllDropdowns();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeAllDropdowns();
            });
            dropdownGlobalListenersRegistered = true;
        }

        const initialGroup = getMethodGroupForMode('stack-array');
        setActiveCategory(initialGroup.id);
    }

    function scrollToCategory(groupId) {
        const section = document.querySelector(`[data-testid="method-sections"]`);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    applySavedDensity();
    bindSettingsDrawer();
    bindDensitySlider();
    renderCategoryNav();
    // Register after the first renderCategoryNav(): that call reassigns applyHashRoute
    // from its no-op placeholder to the real impl (it closes over activateGroup, defined
    // inside renderCategoryNav). Keep this line below — moving it above would no-op routing.
    window.addEventListener('hashchange', applyHashRoute);
    document.addEventListener('languagechange', () => {
        const overviewWasVisible = isOverviewVisible();
        renderCategoryNav();
        if (typeof currentMode === 'string' && currentMode) {
            switchMode(currentMode);
        }
        updateLangToggleLabel();
        updateLangMenuLabel();
        if (slideViewer && !slideViewer.hidden && slideMethodId) {
            slideDeck = buildSlides(slideMethodId);
            if (slideIndex >= slideDeck.length) slideIndex = slideDeck.length - 1;
            renderSlide();
        }
        if (overviewWasVisible) {
            showOverview();
        }
    });

    // Containers
    const arrayContainer = document.getElementById('array-container'); const linkedListContainer = document.getElementById('linkedlist-container');
    const queueContainer = document.getElementById('queue-container'); const graphContainer = document.getElementById('graph-container');
    const treeContainer = document.getElementById('tree-container');
    const listArrContainer = document.getElementById('list-arr-container'); const listLLContainer = document.getElementById('list-ll-container');

    // Action Bars
    const stdActions = document.getElementById('std-actions'); const graphActions = document.getElementById('graph-actions');
    const treeActions = document.getElementById('tree-actions');
    const listActions = document.getElementById('list-actions');
    const heapActions = document.getElementById('heap-actions');

    const statusMsg = document.getElementById('status-message');
    const codeDisplay = document.getElementById('code-display') || document.createElement('code');
    const codeTitle = document.getElementById('code-title') || document.createElement('span');

    // Controls
    const btnStdAdd = document.getElementById('btn-std-add'); const btnStdRemove = document.getElementById('btn-std-remove');
    const btnGraphAdd = document.getElementById('btn-graph-add'); const graphU = document.getElementById('graph-u'); const graphV = document.getElementById('graph-v');
    const graphW = document.getElementById('graph-w'); const btnGraphKruskal = document.getElementById('btn-graph-kruskal'); const btnGraphClear = document.getElementById('btn-graph-clear');
    const graphSource = document.getElementById('graph-source'); const graphTarget = document.getElementById('graph-target');
    const btnGraphDijkstra = document.getElementById('btn-graph-dijkstra'); const btnGraphTopo = document.getElementById('btn-graph-topo');
    const btnTreeSearch = document.getElementById('btn-tree-search');

    const heapContainer = document.getElementById('heap-container');
    const heapEdges = document.getElementById('heap-edges');
    const heapNodesContainer = document.getElementById('heap-nodes-container');
    const heapOrderSelect = document.getElementById('heap-order');
    const heapValInput = document.getElementById('heap-val');
    const heapExtraInput = document.getElementById('heap-extra');
    const btnHeapInsert = document.getElementById('btn-heap-insert');
    const btnHeapPeek = document.getElementById('btn-heap-peek');
    const btnHeapExtract = document.getElementById('btn-heap-extract');
    const btnHeapMerge = document.getElementById('btn-heap-merge');
    const btnHeapChange = document.getElementById('btn-heap-change');
    const btnHeapDelete = document.getElementById('btn-heap-delete');
    const btnHeapFindMin = document.getElementById('btn-heap-find-min');
    const btnHeapStats = document.getElementById('btn-heap-stats');
    const btnHeapTutorial = document.getElementById('btn-heap-tutorial');
    const heapTutorialPanel = document.getElementById('heap-tutorial-panel');
    const heapTutorialMode = document.getElementById('heap-tutorial-mode');
    const heapTutorialProgress = document.getElementById('heap-tutorial-progress');
    const heapTutorialTitle = document.getElementById('heap-tutorial-title');
    const heapTutorialText = document.getElementById('heap-tutorial-text');
    const btnHeapTutorialNext = document.getElementById('btn-heap-tutorial-next');
    const btnHeapTutorialRestart = document.getElementById('btn-heap-tutorial-restart');
    const btnHeapTutorialExit = document.getElementById('btn-heap-tutorial-exit');

    const hashActions = document.getElementById('hash-actions');
    const hashChContainer = document.getElementById('hash-ch-container');
    const hashOaContainer = document.getElementById('hash-oa-container');
    const hashBucketContainer = document.getElementById('hash-bucket-container');

    const textTreeActions = document.getElementById('text-tree-actions');
    const advTreeContainer = document.getElementById('advanced-tree-container');

    const oopActions = document.getElementById('oop-actions');
    const oopModeSelect = document.getElementById('oop-mode-select');
    const btnOopDemo = document.getElementById('btn-oop-demo');
    const btnOopReset = document.getElementById('btn-oop-reset');
    const oopContainer = document.getElementById('oop-container');
    const oopInheritanceView = document.getElementById('oop-inheritance-view');
    const oopPolymorphismView = document.getElementById('oop-polymorphism-view');
    const oopEncapsulationView = document.getElementById('oop-encapsulation-view');
    const oopAbstractionView = document.getElementById('oop-abstraction-view');
    const oopAdhocView = document.getElementById('oop-adhoc-view');
    const oopTemplatesView = document.getElementById('oop-templates-view');

    const patternActions = document.getElementById('pattern-actions');
    const patternModeSelect = document.getElementById('pattern-mode-select');
    const btnPatternDemo = document.getElementById('btn-pattern-demo');
    const btnPatternReset = document.getElementById('btn-pattern-reset');
    const patternContainer = document.getElementById('pattern-container');

    let currentMode = 'stack-array';
    const visualizerRuntime = {
        activeMode: currentMode,
        activeGroupId: getMethodGroupForMode(currentMode).id,
        loadedMethods: new Set([currentMode]),
        setMode(mode) {
            this.activeMode = mode;
            this.activeGroupId = getMethodGroupForMode(mode).id;
            this.loadedMethods.add(mode);
            currentMode = mode;
        },
    };
    renderMethodSections(getMethodGroupForMode(currentMode).id);
    window.VizKit = {
        acquireDynamicVizHost,
        buildFrameControls,
        buildStepWorkbench,
        getInputDifficulty,
        langOf: (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en,
        t,
        showStatus,
        executeAnimWrapper,
        getDelay,
        markFocusFit,
        observeFocusFit,
        fitFocusSize,
    };
    if (window.VizCore) {
        window.VizCore.bindMode(() => currentMode, (m) => { currentMode = m; });
        window.VizCore.domains().forEach((d) => { if (d.init) d.init(); });
    }
    registerBehaviors();
    bindDifficultySelect();
    initInlineDifficulty();
    initVizFocus();

        // OOP state variables
        let oopInheritanceAnimationState = null;
        let oopPolymorphismAnimationState = null;
        let oopEncapsulationAnimationState = null;
        const oopStepState = {
            inheritance: 0,
            polymorphism: 0,
            encapsulation: 0,
            abstraction: 0,
            adhoc: 0,
            templates: 0,
        };

    updateLayout();

    function switchMode(nextMode) {
        visualizerRuntime.setMode(nextMode);
        if (window.VizCore) window.VizCore.domains().forEach((d) => { if (d.onModeSwitch) d.onModeSwitch(currentMode); });
        renderMethodSections(getMethodGroupForMode(currentMode).id);
        updateLayout();
        renderAll();
        statusMsg.textContent = t('status.switched-to', { mode: t('method.' + currentMode) }); statusMsg.style.color = '#34d399';
        methodDropdownButtons.forEach((btn, mid) => {
            btn.classList.toggle('is-current-method', mid === currentMode);
        });
        if(currentMode === 'tree-splay') btnTreeSearch.classList.remove('hidden'); else btnTreeSearch.classList.add('hidden');
    }

    function initVizFocus() {
        const body = document.body;
        const exitBtn = document.getElementById('viz-focus-exit');
        const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
        const fsRequest = (el) => {
            const fn = el.requestFullscreen || el.webkitRequestFullscreen;
            return fn ? fn.call(el) : null;
        };
        const fsExit = () => {
            const fn = document.exitFullscreen || document.webkitExitFullscreen;
            if (fn) fn.call(document);
        };
        const setPressed = (on) => {
            const btn = document.querySelector('.method-section-card.active .viz-focus-toggle');
            if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        };
        const onKeydown = (e) => { if (e.key === 'Escape') exitFocus(); };
        function enterFocus() {
            if (body.classList.contains('viz-focus')) return;
            body.classList.add('viz-focus');
            setPressed(true);
            // Reset any dragged position so the button starts at its CSS default
            // (bottom-right) on each entry.
            if (exitBtn) { exitBtn.style.left = ''; exitBtn.style.top = ''; exitBtn.style.right = ''; exitBtn.style.bottom = ''; }
            document.addEventListener('keydown', onKeydown);
            requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });   // re-fit host-fitting viz to the enlarged window
            try {
                const p = fsRequest(document.documentElement);
                if (p && p.then) {
                    p.then(function () {
                        // If focus was exited before fullscreen engaged, undo it now.
                        if (!body.classList.contains('viz-focus') && fsElement()) { try { fsExit(); } catch (_) {} }
                    }, function () {});
                }
            } catch (_) {}
        }
        function exitFocus() {
            if (!body.classList.contains('viz-focus')) return;
            body.classList.remove('viz-focus');
            setPressed(false);
            document.removeEventListener('keydown', onKeydown);
            requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });   // restore natural size
            if (fsElement()) { try { fsExit(); } catch (_) {} }
        }
        const onFsChange = () => {
            if (!fsElement() && body.classList.contains('viz-focus')) exitFocus();
        };
        document.addEventListener('click', (e) => {
            if (e.target && e.target.closest && e.target.closest('.viz-focus-toggle')) {
                if (body.classList.contains('viz-focus')) exitFocus(); else enterFocus();
            }
        });
        if (exitBtn) {
            // Click exits — unless the click concludes a drag (guard flag below).
            exitBtn.addEventListener('click', () => {
                if (exitBtn.dataset.dragged === '1') { delete exitBtn.dataset.dragged; return; }
                exitFocus();
            });
            makeExitDraggable(exitBtn);
        }
        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);
    }

    // Lets the fullscreen exit button be dragged anywhere so it never blocks a
    // viz's controls. Uses pointer events (mouse + touch); a move past a small
    // threshold sets data-dragged so the trailing click does NOT exit focus.
    function makeExitDraggable(el) {
        let dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0;
        el.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            dragging = true; moved = false;
            const r = el.getBoundingClientRect();
            ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
            try { el.setPointerCapture(e.pointerId); } catch (_) {}
        });
        el.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - sx, dy = e.clientY - sy;
            if (!moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
            moved = true;
            const w = el.offsetWidth, h = el.offsetHeight;
            const nx = Math.max(0, Math.min(window.innerWidth - w, ox + dx));
            const ny = Math.max(0, Math.min(window.innerHeight - h, oy + dy));
            el.style.left = nx + 'px'; el.style.top = ny + 'px';
            el.style.right = 'auto'; el.style.bottom = 'auto';
        });
        const end = (e) => {
            if (!dragging) return;
            dragging = false;
            try { el.releasePointerCapture(e.pointerId); } catch (_) {}
            if (moved) el.dataset.dragged = '1';   // suppress the trailing click's exit
        };
        el.addEventListener('pointerup', end);
        el.addEventListener('pointercancel', end);
    }

    // ----------- LOGIC & RENDER OMITTED -----------
    // (Search, Sort layout bindings omitted for strictness matching original JS...)
    function handlePauseClick() { if (animState === 'playing') { animState = 'paused'; setAnimControls(true); showStatus('Paused', '#fbbf24'); } else if (animState === 'paused') { animState = 'playing'; setAnimControls(true); showStatus('Resumed', '#34d399'); } }
    function handleStopClick() { if(animState === 'playing' || animState === 'paused') { animState = 'stopped'; setTimeout(() => { animState = 'idle'; setAnimControls(false); if(currentMode.includes('sort')) { const b = window.VizRegistry && window.VizRegistry.behavior(currentMode); if (b && b.render) b.render(); } else if (currentMode.includes('heap-')) { const b = window.VizRegistry && window.VizRegistry.behavior(currentMode); if (b && b.render) b.render(); } showStatus('Stopped & Reset.', '#f87171'); }, 100); } }
    function setAnimControls(isPlaying) {
        if (currentMode.includes('heap-')) {
            btnHeapInsert.disabled = isPlaying;
            btnHeapPeek.disabled = isPlaying;
            btnHeapExtract.disabled = isPlaying;
            btnHeapMerge.disabled = isPlaying;
            btnHeapChange.disabled = isPlaying;
            btnHeapDelete.disabled = isPlaying;
            btnHeapFindMin.disabled = isPlaying;
            btnHeapStats.disabled = isPlaying;
            btnHeapTutorial.disabled = isPlaying;
            heapOrderSelect.disabled = isPlaying;
        } else if (currentMode.includes('graph')) {
            btnGraphAdd.disabled = isPlaying;
            btnGraphKruskal.disabled = isPlaying;
            btnGraphClear.disabled = isPlaying;
            graphU.disabled = isPlaying;
            graphV.disabled = isPlaying;
            graphW.disabled = isPlaying;
        } else if (currentMode.includes('oop-')) {
            btnOopDemo.disabled = isPlaying;
            btnOopReset.disabled = isPlaying;
            oopModeSelect.disabled = isPlaying;
        }
        if (window.VizCore) window.VizCore.domains().forEach((d) => { if (d.syncChrome) d.syncChrome(); });
    }
    async function executeAnimWrapper(fn) {
        if(animState === 'playing' || animState === 'paused') return; animState = 'playing'; setAnimControls(true);
        try {
            const result = await fn();
            if(animState === 'playing') {
                animState = 'idle';
                setAnimControls(false);
                if(result !== '__KEEP_STATUS__') showStatus("Execution Complete!", "#34d399");
            }
        } catch (e) { if (e === 'STOPPED') return; else throw e; }
    }

    function showStatus(msg, color) { statusMsg.textContent = msg; statusMsg.style.color = color; }
    function getDelay() { return 510; }
    function updateLayout() {
        const containers = [arrayContainer, linkedListContainer, queueContainer, graphContainer, treeContainer, advTreeContainer, listArrContainer, listLLContainer, hashChContainer, hashOaContainer, hashBucketContainer, heapContainer, oopContainer, patternContainer];
        const actions = [stdActions, graphActions, treeActions, textTreeActions, listActions, hashActions, heapActions, oopActions, patternActions];
        containers.forEach(c => c.classList.add('hidden')); actions.forEach(a => a.classList.add('hidden'));
        const dynHost = document.getElementById('dynamic-viz-host');
        if (dynHost) dynHost.classList.add('hidden');
        const vizHolder = document.getElementById('visualizer-container');
        if (vizHolder) vizHolder.classList.remove('hidden');

        if(currentMode === 'stack-array') { codeTitle.textContent = 'stack_array.cpp'; codeDisplay.textContent = codeArray; arrayContainer.classList.remove('hidden'); stdActions.classList.remove('hidden'); btnStdAdd.textContent = t('btn.push'); btnStdRemove.textContent = t('btn.pop'); }
        else if (currentMode === 'stack-list') { codeTitle.textContent = 'stack_linkedlist.cpp'; codeDisplay.textContent = codeLinkedList; linkedListContainer.classList.remove('hidden'); stdActions.classList.remove('hidden'); btnStdAdd.textContent = t('btn.push'); btnStdRemove.textContent = t('btn.pop'); }
        else if (currentMode === 'queue') { codeTitle.textContent = 'queue.cpp'; codeDisplay.textContent = codeQueue; queueContainer.classList.remove('hidden'); stdActions.classList.remove('hidden'); btnStdAdd.textContent = t('btn.enqueue'); btnStdRemove.textContent = t('btn.dequeue'); }
        // graph, graph-adjlist, graph-traversal, graph-bfs/dfs, graph-kruskal,
        // graph-dijkstra, graph-topo all render via the workbench into the dynamic
        // viz host (built-in toolbar). Like graph-prim/bellman-ford below, they only
        // set the code panel here — the legacy #graph-actions editor bar and static
        // #graph-edges container stay hidden (removed with the old editor in #185).
        else if (currentMode === 'graph') { codeTitle.textContent = 'graph.cpp'; codeDisplay.textContent = codeGraph; }
        else if (currentMode === 'graph-adjlist') { codeTitle.textContent = 'graph_adjlist.cpp'; codeDisplay.textContent = codeGraphAdjlist; }
        else if (currentMode === 'graph-multilist') { codeTitle.textContent = 'graph_multilist.cpp'; codeDisplay.textContent = codeGraphMultilist; }
        else if (currentMode === 'graph-traversal') { codeTitle.textContent = 'graph_traversal.cpp'; codeDisplay.textContent = codeGraphTraversal; }
        else if (currentMode === 'graph-bfs') { codeTitle.textContent = 'graph_bfs.cpp'; codeDisplay.textContent = codeGraphBFS; }
        else if (currentMode === 'graph-dfs') { codeTitle.textContent = 'graph_dfs.cpp'; codeDisplay.textContent = codeGraphDFS; }
        else if (currentMode === 'graph-kruskal') { codeTitle.textContent = 'graph_kruskal.cpp'; codeDisplay.textContent = codeGraphKruskal; }
        else if (currentMode === 'graph-dijkstra') { codeTitle.textContent = 'graph_dijkstra.cpp'; codeDisplay.textContent = codeGraphDijkstra; }
        else if (currentMode === 'graph-topo') { codeTitle.textContent = 'graph_topo.cpp'; codeDisplay.textContent = codeGraphTopo; }
        else if (currentMode === 'graph-prim') {
            codeTitle.textContent = 'graph_prim.cpp';
            codeDisplay.textContent = codeGraphPrim;
        }
        else if (currentMode === 'graph-boruvka') { codeTitle.textContent = 'graph_boruvka.cpp'; codeDisplay.textContent = codeGraphBoruvka; }
        else if (currentMode === 'graph-redblue') { codeTitle.textContent = 'graph_redblue.cpp'; codeDisplay.textContent = codeGraphRedblue; }
        else if (currentMode === 'graph-bellman-ford') {
            codeTitle.textContent = 'graph_bellman_ford.cpp';
            codeDisplay.textContent = codeGraphBellmanFord;
        }
        else if (currentMode === 'graph-floyd-warshall') {
            codeTitle.textContent = 'graph_floyd_warshall.cpp';
            codeDisplay.textContent = codeGraphFloydWarshall;
        }
        else if (['tree-bst', 'tree-splay'].includes(currentMode)) {
            treeContainer.classList.remove('hidden'); treeActions.classList.remove('hidden');
            if(currentMode === 'tree-bst') { codeTitle.textContent = 'tree_bst.cpp'; codeDisplay.textContent = codeTreeBST; }
            if(currentMode === 'tree-splay') { codeTitle.textContent = 'tree_splay.cpp'; codeDisplay.textContent = codeTreeSplay; }
        }
        else if (currentMode === 'tree-rb') {
            // Rendered by renderTreeRB() into the dynamic viz host.
            codeTitle.textContent = 'tree_rb.cpp'; codeDisplay.textContent = codeTreeRB;
        }
        else if (currentMode === 'tree-avl') {
            // Rendered by renderTreeAVL() into the dynamic viz host.
            codeTitle.textContent = 'tree_avl.cpp'; codeDisplay.textContent = codeTreeAVL;
        }
        else if (['tree-radix', 'tree-ternary'].includes(currentMode)) {
            advTreeContainer.classList.remove('hidden'); textTreeActions.classList.remove('hidden');
            if(currentMode === 'tree-radix') { codeTitle.textContent = 'tree_radix.cpp'; codeDisplay.textContent = codeTreeRadix; }
            if(currentMode === 'tree-ternary') { codeTitle.textContent = 'tree_ternary.cpp'; codeDisplay.textContent = codeTreeTST; }
        }
        else if (currentMode === 'tree-trie') {
            // Rendered by viz_trie.js into the dynamic viz host.
        }
        else if (['tree-btree', 'tree-bplus'].includes(currentMode)) {
            advTreeContainer.classList.remove('hidden'); treeActions.classList.remove('hidden');
            if(currentMode === 'tree-btree') { codeTitle.textContent = 'tree_btree.cpp'; codeDisplay.textContent = codeTreeBTree; }
            if(currentMode === 'tree-bplus') { codeTitle.textContent = 'tree_bplus.cpp'; codeDisplay.textContent = codeTreeBPlus; }
        }
        else if (currentMode === 'tree-dsu') {
            codeTitle.textContent = 'tree_dsu.cpp';
            codeDisplay.textContent = codeTreeDSU;
        }
        else if (currentMode === 'tree-segment') {
            codeTitle.textContent = 'tree_segment.cpp';
            codeDisplay.textContent = codeTreeSegment;
        }
        else if (currentMode === 'tree-fenwick') {
            codeTitle.textContent = 'tree_fenwick.cpp';
            codeDisplay.textContent = codeTreeFenwick;
        }
        else if (currentMode === 'tree-traversal') {
            codeTitle.textContent = 'tree_traversal.cpp';
            codeDisplay.textContent = codeTreeTraversal;
        }
        else if (currentMode === 'tree-general-binary') {
            codeTitle.textContent = 'tree_general_binary.cpp';
            codeDisplay.textContent = codeTreeGeneralBinary;
        }
        else if (currentMode === 'game-tree') {
            codeTitle.textContent = 'game_tree.cpp';
            codeDisplay.textContent = codeGameTree;
        }
        else if (currentMode === 'huffman') {
            codeTitle.textContent = 'huffman.cpp';
            codeDisplay.textContent = codeHuffman;
        }
        else if (currentMode === 'matrix-sparse-list') {
            codeTitle.textContent = 'matrix_sparse_list.cpp';
            codeDisplay.textContent = codeMatrixSparseList;
        }
        else if (currentMode === 'poly-padd') {
            codeTitle.textContent = 'poly_padd.cpp';
            codeDisplay.textContent = codePolyPadd;
        }
        else if (currentMode === 'magic-square') {
            codeTitle.textContent = 'magic_square.cpp';
            codeDisplay.textContent = codeMagicSquare;
        }
        else if (currentMode === 'magic-latin') {
            codeTitle.textContent = 'magic_latin.cpp';
            codeDisplay.textContent = codeMagicLatin;
        }
        else if (currentMode === 'magic-torus') {
            codeTitle.textContent = 'magic_torus.cpp';
            codeDisplay.textContent = codeMagicTorus;
        }
        else if (currentMode === 'magic-formula') {
            codeTitle.textContent = 'magic_formula.cpp';
            codeDisplay.textContent = codeMagicFormula;
        }
        else if (currentMode === 'magic-symmetry') {
            codeTitle.textContent = 'magic_symmetry.cpp';
            codeDisplay.textContent = codeMagicSymmetry;
        }
        else if (currentMode === 'tree-obst') {
            codeTitle.textContent = 'tree_obst.cpp';
            codeDisplay.textContent = codeTreeObst;
        }
        else if (currentMode === 'tree-threaded') {
            codeTitle.textContent = 'tree_threaded.cpp';
            codeDisplay.textContent = codeTreeThreaded;
        }
        else if (currentMode === 'tree-mway') {
            codeTitle.textContent = 'tree_mway.cpp';
            codeDisplay.textContent = codeTreeMway;
        }
        else if (currentMode === 'tree-expression') {
            codeTitle.textContent = 'tree_expression.cpp';
            codeDisplay.textContent = codeTreeExpression;
        }
        else if (currentMode === 'sort-external') {
            codeTitle.textContent = 'sort_external.cpp';
            codeDisplay.textContent = codeSortExternal;
        }
        else if (currentMode === 'gc-memory') { codeTitle.textContent = 'gc_memory.cpp'; codeDisplay.textContent = codeGcMemory; }
        else if (currentMode === 'recursion') { codeTitle.textContent = 'recursion.cpp'; codeDisplay.textContent = codeRecursion; }
        else if (currentMode === 'file-isam') { codeTitle.textContent = 'file_isam.cpp'; codeDisplay.textContent = codeFileIsam; }
        else if (currentMode === 'file-inverted') { codeTitle.textContent = 'file_inverted.cpp'; codeDisplay.textContent = codeFileInverted; }
        else if (currentMode === 'sort-polyphase') {
            codeTitle.textContent = 'sort_polyphase.cpp';
            codeDisplay.textContent = codeSortPolyphase;
        }
        else if (currentMode === 'graph-aoe') {
            codeTitle.textContent = 'graph_aoe.cpp';
            codeDisplay.textContent = codeGraphAoe;
        }
        else if (currentMode === 'expr-infix-postfix') {
            codeTitle.textContent = 'expr_infix_postfix.cpp';
            codeDisplay.textContent = codeExprInfixPostfix;
        }
        else if (currentMode === 'maze-stack') {
            codeTitle.textContent = 'maze_stack.cpp';
            codeDisplay.textContent = codeMazeStack;
        }
        else if (currentMode === 'list-doubly') {
            codeTitle.textContent = 'list_doubly.cpp';
            codeDisplay.textContent = codeListDoubly;
        }
        else if (currentMode === 'list-equivalence') {
            codeTitle.textContent = 'list_equivalence.cpp';
            codeDisplay.textContent = codeListEquivalence;
        }
        else if (currentMode === 'cache-lru') {
            codeTitle.textContent = 'lru_cache.cpp';
            codeDisplay.textContent = codeLruCache;
        }
        else if (currentMode === 'nano-bpe-encode') {
            codeTitle.textContent = 'nano-bpe-encode.cpp';
            codeDisplay.textContent = codeNanoBpeEncode;
        }
        else if (currentMode === 'nano-compute-graph') {
            codeTitle.textContent = 'nano-compute-graph.cpp';
            codeDisplay.textContent = codeNanoComputeGraph;
        }
        else if (currentMode === 'nano-bpe-train') {
            codeTitle.textContent = 'nano-bpe-train.cpp';
            codeDisplay.textContent = codeNanoBpeTrain;
        }
        else if (currentMode === 'nano-ngram-next') {
            codeTitle.textContent = 'nano-ngram-next.cpp';
            codeDisplay.textContent = codeNanoNgramNext;
        }
        else if (currentMode === 'search-linear') { codeTitle.textContent = 'search_linear.cpp'; codeDisplay.textContent = codeSearchLinear; }
        else if (currentMode === 'search-binary') { codeTitle.textContent = 'search_binary.cpp'; codeDisplay.textContent = codeSearchBinary; }
        else if (currentMode === 'search-kmp') {
            codeTitle.textContent = 'search_kmp.cpp';
            codeDisplay.textContent = codeSearchKMP;
        }
        else if (currentMode === 'search-bm') {
            codeTitle.textContent = 'search_bm.cpp';
            codeDisplay.textContent = codeSearchBM;
        }
        else if (currentMode === 'search-rk') {
            codeTitle.textContent = 'search_rk.cpp';
            codeDisplay.textContent = codeSearchRK;
        }
        else if (currentMode === 'search-strcompare') {
            codeTitle.textContent = 'search_strcompare.cpp';
            codeDisplay.textContent = codeSearchStrCompare;
        }
        else if (currentMode === 'search-zalgo') {
            codeTitle.textContent = 'search_zalgo.cpp';
            codeDisplay.textContent = codeSearchZAlgo;
        }
        else if (currentMode === 'search-aho') {
            codeTitle.textContent = 'search_aho.cpp';
            codeDisplay.textContent = codeSearchAho;
        }
        else if (currentMode === 'search-fibonacci') { codeTitle.textContent = 'search_fibonacci.cpp'; codeDisplay.textContent = codeSearchFibonacci; }
        else if (currentMode === 'search-interpolation') { codeTitle.textContent = 'search_interpolation.cpp'; codeDisplay.textContent = codeSearchInterpolation; }
        else if (currentMode === 'list-array') { codeTitle.textContent = 'list_array.cpp'; codeDisplay.textContent = codeListArray; listArrContainer.classList.remove('hidden'); listActions.classList.remove('hidden'); }
        else if (currentMode === 'list-linked') { codeTitle.textContent = 'list_linked.cpp'; codeDisplay.textContent = codeListLinked; listLLContainer.classList.remove('hidden'); listActions.classList.remove('hidden'); }
        else if (currentMode === 'deque') {
            codeTitle.textContent = 'deque.cpp';
            codeDisplay.textContent = codeDeque;
        }
        else if (currentMode === 'bloom-filter') {
            codeTitle.textContent = 'bloom_filter.cpp';
            codeDisplay.textContent = codeBloomFilter;
        }
        else if (currentMode === 'skip-list') {
            codeTitle.textContent = 'skip_list.cpp';
            codeDisplay.textContent = codeSkipList;
        }
        else if (currentMode === 'count-min-sketch') {
            codeTitle.textContent = 'count_min_sketch.cpp';
            codeDisplay.textContent = codeCountMinSketch;
        }
        else if (currentMode.includes('hash-')) {
            hashActions.classList.remove('hidden');
            if(currentMode === 'hash-chain') { codeTitle.textContent = 'hash_chaining.cpp'; codeDisplay.textContent = codeHashChain; hashChContainer.classList.remove('hidden'); }
            if(currentMode === 'hash-open') { codeTitle.textContent = 'hash_open_address.cpp'; codeDisplay.textContent = codeHashOpen; hashOaContainer.classList.remove('hidden'); }
            if(currentMode === 'hash-bucket') { codeTitle.textContent = 'hash_bucket.cpp'; codeDisplay.textContent = codeHashBucket; hashBucketContainer.classList.remove('hidden'); }
        }
        else if (currentMode === 'sort-bubble') { codeTitle.textContent = 'sort_bubble.cpp'; codeDisplay.textContent = codeSortBubble; }
        else if (currentMode === 'sort-select') { codeTitle.textContent = 'sort_selection.cpp'; codeDisplay.textContent = codeSortSelect; }
        else if (currentMode === 'sort-insert') { codeTitle.textContent = 'sort_insertion.cpp'; codeDisplay.textContent = codeSortInsert; }
        else if (currentMode === 'sort-quick') { codeTitle.textContent = 'sort_quick.cpp'; codeDisplay.textContent = codeSortQuick; }
        else if (currentMode === 'sort-merge') { codeTitle.textContent = 'sort_merge.cpp'; codeDisplay.textContent = codeSortMerge; }
        else if (currentMode === 'sort-shell') { codeTitle.textContent = 'sort_shell.cpp'; codeDisplay.textContent = codeSortShell; }
        else if (currentMode === 'sort-heap') { codeTitle.textContent = 'sort_heap.cpp'; codeDisplay.textContent = codeSortHeap; }
        else if (currentMode === 'sort-bucket') { codeTitle.textContent = 'sort_bucket.cpp'; codeDisplay.textContent = codeSortBucket; }
        else if (currentMode === 'sort-count') { codeTitle.textContent = 'sort_counting.cpp'; codeDisplay.textContent = codeSortCounting; }
        else if (currentMode === 'sort-radix') { codeTitle.textContent = 'sort_radix.cpp'; codeDisplay.textContent = codeSortRadix; }
        else if (currentMode === 'sort-shaker') { codeTitle.textContent = 'sort_shaker.cpp'; codeDisplay.textContent = codeSortShaker; }
        else if (currentMode.includes('heap-')) {
            heapContainer.classList.remove('hidden');
            heapActions.classList.remove('hidden');
            if(currentMode === 'heap-binary') { codeTitle.textContent = 'heap_binary.cpp'; codeDisplay.textContent = codeHeapBinary; }
            else if(currentMode === 'heap-binomial') { codeTitle.textContent = 'heap_binomial.cpp'; codeDisplay.textContent = codeHeapBinomial; }
            else if(currentMode === 'heap-fibonacci') { codeTitle.textContent = 'heap_fibonacci.cpp'; codeDisplay.textContent = codeHeapFibonacci; }
            else if(currentMode === 'heap-leftist') { codeTitle.textContent = 'heap_leftist.cpp'; codeDisplay.textContent = codeHeapLeftist; }
            else if(currentMode === 'heap-skew') { codeTitle.textContent = 'heap_skew.cpp'; codeDisplay.textContent = codeHeapSkew; }
            else if(currentMode === 'heap-dary') { codeTitle.textContent = 'heap_dary.cpp'; codeDisplay.textContent = codeHeapDary; }
            else if(currentMode === 'heap-pairing') { codeTitle.textContent = 'heap_pairing.cpp'; codeDisplay.textContent = codeHeapPairing; }
        }
        else if (currentMode.includes('oop-')) {
            oopContainer.classList.remove('hidden');
            oopActions.classList.remove('hidden');
            oopInheritanceView.classList.add('hidden');
            oopPolymorphismView.classList.add('hidden');
            oopEncapsulationView.classList.add('hidden');
            oopAbstractionView.classList.add('hidden');
            oopAdhocView.classList.add('hidden');
            oopTemplatesView.classList.add('hidden');
            if (currentMode === 'oop-inheritance') {
                codeTitle.textContent = 'oop_inheritance.cpp';
                codeDisplay.textContent = codeOOPInheritance;
                oopInheritanceView.classList.remove('hidden');
                oopModeSelect.value = 'inheritance';
            }
            else if (currentMode === 'oop-polymorphism') {
                codeTitle.textContent = 'oop_polymorphism.cpp';
                codeDisplay.textContent = codeOOPPolymorphism;
                oopPolymorphismView.classList.remove('hidden');
                oopModeSelect.value = 'polymorphism';
            }
            else if (currentMode === 'oop-encapsulation') {
                codeTitle.textContent = 'oop_encapsulation.cpp';
                codeDisplay.textContent = codeOOPEncapsulation;
                oopEncapsulationView.classList.remove('hidden');
                oopModeSelect.value = 'encapsulation';
            }
            else if (currentMode === 'oop-abstraction') {
                codeTitle.textContent = 'oop_abstraction.cpp';
                codeDisplay.textContent = codeOOPAbstraction;
                oopAbstractionView.classList.remove('hidden');
                oopModeSelect.value = 'abstraction';
            }
            else if (currentMode === 'oop-adhoc') {
                codeTitle.textContent = 'oop_adhoc.cpp';
                codeDisplay.textContent = codeOOPAdhoc;
                oopAdhocView.classList.remove('hidden');
                oopModeSelect.value = 'adhoc';
            }
            else if (currentMode === 'oop-templates') {
                codeTitle.textContent = 'oop_templates.cpp';
                codeDisplay.textContent = codeOOPTemplates;
                oopTemplatesView.classList.remove('hidden');
                oopModeSelect.value = 'templates';
            }
        }
        else if (currentMode.includes('pattern-')) {
            patternContainer.classList.remove('hidden');
            patternActions.classList.remove('hidden');
            const p = window.PatternsDB && window.PatternsDB.getPattern(currentMode);
            if (p) {
                codeTitle.textContent = p.cpp;
                codeDisplay.textContent = (window.CODE_DB && window.CODE_DB[p.cpp]) || '';
                document.getElementById('pattern-title').textContent = p.label;
                const stepped = !!(p.diagram && p.diagram.steps);
                btnPatternDemo.style.display = stepped ? 'none' : '';
                btnPatternReset.style.display = stepped ? 'none' : '';
                // category-scoped select (from PR #146), now sourced from the registry:
                patternModeSelect.innerHTML = orderedPatternsByCategory(p.category)
                    .map((q) => '<option value="' + q.id.replace(/^pattern-/, '') + '">' + q.label + '</option>').join('');
                patternModeSelect.value = currentMode.replace(/^pattern-/, '');
            }
        }
        if (window.VizCore) window.VizCore.domains().forEach((d) => { if (d.syncChrome) d.syncChrome(); });
        if (window.Prism && codeDisplay.isConnected) Prism.highlightElement(codeDisplay);
    }
    function registerBehaviors() {
        const R = window.VizRegistry;
        if (!R) return;
        const reg = (id, render, code, layout) => R.attach(id, { render, code, layout: layout || null });
        // Arrays
        // Trees
        // Searching & String Matching
        // File Structures
        // Memory / GC
        // Recursion
        // OOP Concepts
        reg('oop-inheritance', renderOOP, () => codeOOPInheritance, null);
        reg('oop-polymorphism', renderOOP, () => codeOOPPolymorphism, null);
        reg('oop-encapsulation', renderOOP, () => codeOOPEncapsulation, null);
        reg('oop-abstraction', renderOOP, () => codeOOPAbstraction, null);
        reg('oop-adhoc', renderOOP, () => codeOOPAdhoc, null);
        reg('oop-templates', renderOOP, () => codeOOPTemplates, null);
        // Design Patterns
        if (window.PatternsDB) {
            window.PatternsDB.PATTERNS.forEach((p) => reg(p.id, () => {
                const svg = document.getElementById('pattern-svg');
                window.PatternViz.render(svg, p);
            }, () => window.CODE_DB[p.cpp], null));
        }
        // nano-LLM
    }
    function renderAll() {
        syncDifficultySelect();
        const b = window.VizRegistry && window.VizRegistry.behavior(currentMode);
        if (b && b.render) { b.render(); return; }
        if (currentMode.includes('oop-')) renderOOP();
    }

    function acquireDynamicVizHost() {
        const vizContainer = document.getElementById('visualizer-container');
        if (vizContainer) vizContainer.classList.add('hidden');
        let host = document.getElementById('dynamic-viz-host');
        if (!host) {
            host = document.createElement('div');
            host.id = 'dynamic-viz-host';
            runtimeVisualizer.appendChild(host);
        }
        host.classList.remove('hidden');
        host.innerHTML = '';
        host.style.width = '';
        return host;
    }

    function buildFrameControls(frames, paint, opts) {
        opts = opts || {};
        const last = Math.max(0, frames.length - 1);
        const mode = (typeof currentMode !== 'undefined' && currentMode) ? currentMode : 'default';
        const storeKey = 'dsvisual.stepSpeed.' + mode;
        const clampV = (v) => Math.max(10, Math.min(600, v));
        let sliderVal = clampV(610 - (opts.runIntervalMs || 500));
        try { const s = localStorage.getItem(storeKey); if (s !== null && s !== '') { const n = parseInt(s, 10); if (Number.isFinite(n)) sliderVal = clampV(n); } } catch (e) { /* ignore */ }
        const L = (zh, en) => { try { return (typeof I18N !== 'undefined' && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? zh : en; } catch (e) { return en; } };

        let idx = Math.max(0, Math.min(opts.initialIndex || 0, last));
        let timer = null, playing = false;

        const strip = document.createElement('div');
        strip.className = 'stepctl';
        strip.innerHTML =
            '<button type="button" class="tbtn" data-action="reset" title="' + L('回到開頭', 'To start') + '">⏮</button>' +
            '<button type="button" class="tbtn" data-action="back" title="' + L('上一步', 'Previous step') + '">◀</button>' +
            '<button type="button" class="tbtn play" data-action="run" title="' + L('播放 / 暫停', 'Play / Pause') + '">▶</button>' +
            '<button type="button" class="tbtn" data-action="step" title="' + L('下一步', 'Next step') + '">▶︎</button>' +
            '<input type="range" class="stepctl-scrubber" min="0" max="' + last + '" value="' + idx + '" title="' + L('步驟位置', 'Step position') + '">' +
            '<label class="stepctl-speed-wrap">' + L('速度', 'Speed') + ' <input type="range" class="stepctl-speed" min="10" max="600" value="' + sliderVal + '"></label>' +
            '<span class="stepctl-count"></span>';

        const runBtn = strip.querySelector('[data-action="run"]');
        const scrub = strip.querySelector('.stepctl-scrubber');
        const speed = strip.querySelector('.stepctl-speed');
        const cnt = strip.querySelector('.stepctl-count');
        const delay = () => 610 - parseInt(speed.value, 10);

        function render() {
            paint(frames[idx], idx);
            scrub.value = idx;
            cnt.textContent = L('步 ', 'Step ') + idx + ' / ' + last;
            runBtn.textContent = playing ? '⏸' : '▶';
            if (opts.onIndexChange) opts.onIndexChange(idx);
        }
        function goTo(i) { idx = Math.max(0, Math.min(i, last)); render(); }
        function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
        function pause() { stopTimer(); playing = false; runBtn.textContent = '▶'; }
        function play() {
            if (idx >= last) goTo(0);
            playing = true; runBtn.textContent = '⏸';
            stopTimer();
            timer = setInterval(() => {
                if (!strip.isConnected) { stopTimer(); return; } // orphaned (swapped out / re-rendered) — stop, no more repaints
                if (idx >= last) { pause(); return; }
                goTo(idx + 1);
            }, delay());
        }

        strip.querySelector('[data-action="reset"]').onclick = () => { pause(); goTo(0); };
        strip.querySelector('[data-action="back"]').onclick = () => { pause(); goTo(idx - 1); };
        strip.querySelector('[data-action="step"]').onclick = () => { pause(); goTo(idx + 1); };
        runBtn.onclick = () => { if (playing) pause(); else play(); };
        scrub.addEventListener('input', () => { pause(); goTo(+scrub.value); });
        speed.addEventListener('input', () => {
            try { localStorage.setItem(storeKey, String(speed.value)); } catch (e) { /* ignore */ }
            if (playing && idx < last) play(); // re-apply new speed live (skip at last frame — about to auto-pause)
        });

        const onResize = () => {
            if (!strip.isConnected) { window.removeEventListener('resize', onResize); return; } // orphaned — detach
            if (strip._fcRaf) cancelAnimationFrame(strip._fcRaf);
            strip._fcRaf = requestAnimationFrame(() => { strip._fcRaf = 0; render(); });        // repaint current frame; idx unchanged
        };
        window.addEventListener('resize', onResize);

        render();
        return strip;
    }

    // Wrap a viz's stage + VCR transport (left) beside a clickable step-log
    // column (right) into a .viz-workbench. Reuses buildFrameControls (unchanged):
    // its onIndexChange highlights the current row; a row click drives the scrubber.
    // getMessage(frame, i) -> the row's text. Returns the .viz-workbench element.
    function buildStepWorkbench(opts) {
        opts = opts || {};
        const L = (zh, en) => (window.I18N && window.I18N.getCurrentLanguage && window.I18N.getCurrentLanguage() === 'zh') ? zh : en;
        const frames = opts.frames || [];
        const getMessage = opts.getMessage || (() => '');
        const wb = document.createElement('div');
        wb.className = 'viz-workbench';
        const stagecol = document.createElement('div');
        stagecol.className = 'viz-stagecol';
        const logcol = document.createElement('aside');
        logcol.className = 'viz-logcol';
        logcol.innerHTML = '<h4>' + L('步驟紀錄', 'Step Log') + '</h4><div class="viz-steplog" data-testid="viz-steplog"></div>';
        const logEl = logcol.querySelector('.viz-steplog');
        logEl.innerHTML = frames.map((f, i) =>
            '<button type="button" class="viz-logrow" data-i="' + i + '">' +
              '<span class="viz-logidx">' + i + '</span><span class="viz-logmsg"></span>' +
            '</button>').join('');
        const rows = logEl.querySelectorAll('.viz-logrow');
        rows.forEach((r, i) => { r.querySelector('.viz-logmsg').textContent = getMessage(frames[i], i); });
        function highlight(i) {
            rows.forEach((r, k) => r.classList.toggle('on', k === i));
            if (rows[i]) rows[i].scrollIntoView({ block: 'nearest' });
        }
        if (opts.stage) stagecol.appendChild(opts.stage);
        stagecol.appendChild(buildFrameControls(frames, opts.paint, { runIntervalMs: opts.runIntervalMs, onIndexChange: highlight }));
        const scrub = stagecol.querySelector('.stepctl-scrubber');
        rows.forEach((r) => r.addEventListener('click', () => {
            scrub.value = r.dataset.i;
            scrub.dispatchEvent(new Event('input', { bubbles: true }));
        }));
        wb.appendChild(stagecol);
        wb.appendChild(logcol);
        return wb;
    }

    // --- vizfit: shared fullscreen fit/zoom + bounded-scroll mechanism (see docs vizfit spec) ---
    let _vizfitObs = null;
    function _vizfitReadZoom(scrollEl) {
        const el = scrollEl && scrollEl.closest ? scrollEl.closest('.viz-body-scaled') : null;
        const v = el ? parseFloat(getComputedStyle(el).getPropertyValue('--viz-zoom')) : 1;
        return (v && isFinite(v) && v > 0) ? v : 1;
    }
    function fitFocusSize(scrollEl, natW, natH) {
        if (!scrollEl || !document.body.classList.contains('viz-focus')) return { w: natW, h: natH };
        // availW comes from the fullscreen container, not the scroll region (whose width tracks
        // the drawing's own content under flex centering, so it could never drive growth). -24 =
        // the container's horizontal padding (.method-section-visual-live: 12px each side).
        const box = scrollEl.closest && scrollEl.closest('.method-section-visual');
        const availW = Math.max((box ? box.clientWidth : scrollEl.clientWidth) - 24, 120);
        let below = 0;
        for (let sib = scrollEl.nextElementSibling; sib; sib = sib.nextElementSibling) below += sib.getBoundingClientRect().height;
        const availH = Math.max(window.innerHeight - scrollEl.getBoundingClientRect().top - below - 8, 120);
        let fit = Math.min(availW / natW, availH / natH);
        fit = Math.max(0.3, Math.min(fit, 3));
        const zoom = _vizfitReadZoom(scrollEl);
        return { w: Math.round(natW * fit * zoom), h: Math.round(natH * fit * zoom) };
    }
    function observeFocusFit(scrollEl) {
        if (_vizfitObs) { try { _vizfitObs.disconnect(); } catch (e) { /* ignore */ } _vizfitObs = null; }
        if (!scrollEl || typeof ResizeObserver === 'undefined') return;
        let raf = 0;
        _vizfitObs = new ResizeObserver(function () {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(function () { raf = 0; window.dispatchEvent(new Event('resize')); });
        });
        _vizfitObs.observe(scrollEl);
    }
    function markFocusFit(hostOrEl, opts) {
        opts = opts || {};
        const card = hostOrEl && hostOrEl.closest ? hostOrEl.closest('.method-section-card') : null;
        if (card) { card.classList.add('viz-fit'); if (opts.svg) card.classList.add('viz-fit-svg'); }
        const scrollEl = hostOrEl && hostOrEl.querySelector ? hostOrEl.querySelector('.vizfit-scroll') : null;
        observeFocusFit(scrollEl);
    }

    // End original routines mappings

    // OOP Visualization Functions
    const OOP_STEPS = {
        inheritance: [
            'Base class Animal defines the shared interface.',
            'Derived classes Dog and Cat inherit the common contract.',
            'Overrides specialize behavior while preserving the same API.',
            'Use a base pointer/reference to treat derived objects uniformly.',
        ],
        polymorphism: [
            'An object stores a vptr that points at its virtual table.',
            'The vtable holds function addresses for the concrete type.',
            'A base pointer calls speak(); dispatch follows vptr to Dog::speak.',
            'The same call expression dispatches to Cat::speak for a Cat object.',
        ],
        encapsulation: [
            'The class boundary owns its data and invariants.',
            'public members form the controlled external interface.',
            'protected members are available to derived classes only.',
            'private data is hidden; methods guard all direct access.',
        ],
        abstraction: [
            'Abstract Shape names the operation without implementation.',
            'Concrete classes implement area() with their own formulas.',
            'Instantiating Shape directly is rejected by the compiler.',
            'Code can still depend on Shape* and call the abstract interface.',
        ],
        adhoc: [
            'Several overloads share one function name.',
            'Argument types choose the exact overload at compile time.',
            'Operator overloading gives user types natural expressions.',
            'No runtime dispatch is needed; binding is static.',
        ],
        templates: [
            'A template is a compile-time blueprint parameterized by T.',
            'The compiler instantiates Box<int> where int is used.',
            'Other concrete types get their own generated class.',
            'Parametric polymorphism keeps one source definition type-safe.',
        ],
    };

    const OOP_COLORS = {
        blue: '#1d4ed8',
        pink: '#be185d',
        green: '#047857',
        amber: '#b45309',
        violet: '#6d28d9',
        red: '#b91c1c',
        slate: '#334155',
        cyan: '#0e7490',
    };

    function oopSvgEl(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) el.setAttribute(k, String(attrs[k]));
        return el;
    }

    function oopStep(mode) {
        const steps = OOP_STEPS[mode] || [];
        return Math.max(0, Math.min(oopStepState[mode] || 0, Math.max(steps.length - 1, 0)));
    }

    function setOopStep(mode, idx) {
        const steps = OOP_STEPS[mode] || [];
        oopStepState[mode] = Math.max(0, Math.min(idx, Math.max(steps.length - 1, 0)));
    }

    function oopActiveClass(step, refs) {
        return refs.includes(step) ? ' oop-step-active' : ' oop-step-dim';
    }

    function drawOopBox(svg, opts) {
        const rect = oopSvgEl('rect', {
            x: opts.x, y: opts.y, width: opts.w, height: opts.h, rx: opts.rx || 8,
            class: (opts.className || 'oop-class-rect') + (opts.activeClass || ''),
        });
        if (opts.dashed) rect.setAttribute('stroke-dasharray', '6 4');
        svg.appendChild(rect);
        const cx = opts.x + opts.w / 2;
        const title = oopSvgEl('text', {
            x: cx, y: opts.y + 24, 'text-anchor': 'middle',
            class: 'oop-member-text oop-title-text' + (opts.activeClass || ''),
            style: 'fill:' + (opts.titleColor || OOP_COLORS.blue) + ';' + (opts.dashed ? 'font-style:italic;' : ''),
        });
        title.textContent = opts.title;
        svg.appendChild(title);
        (opts.lines || []).forEach((ln, i) => {
            const t = oopSvgEl('text', {
                x: cx, y: opts.y + 48 + i * 18, 'text-anchor': 'middle',
                class: 'oop-member-text' + (opts.activeClass || ''),
                style: 'fill:' + (ln.color || OOP_COLORS.slate) + ';',
            });
            t.textContent = ln.text;
            svg.appendChild(t);
        });
    }

    function drawOopLabel(svg, x, y, text, color, activeClass) {
        const t = oopSvgEl('text', {
            x: x, y: y, 'text-anchor': 'middle',
            class: 'oop-member-text oop-label-text' + (activeClass || ''),
            style: 'fill:' + (color || OOP_COLORS.slate) + ';',
        });
        t.textContent = text;
        svg.appendChild(t);
    }

    function drawOopLine(svg, x1, y1, x2, y2, activeClass) {
        svg.appendChild(oopSvgEl('line', {
            x1: x1, y1: y1, x2: x2, y2: y2,
            class: 'oop-inheritance-line' + (activeClass || ''),
        }));
    }

    function drawOopStepBadge(svg, mode) {
        const step = oopStep(mode);
        const total = OOP_STEPS[mode].length;
        drawOopLabel(svg, 57, 37, 'Step ' + (step + 1) + '/' + total, OOP_COLORS.slate, ' oop-step-badge-text');
        drawOopLabel(svg, 250, 336, OOP_STEPS[mode][step], OOP_COLORS.slate, ' oop-step-caption');
    }

    function syncOopStepControls() {
        if (!oopActions) return;
        let slot = oopActions.querySelector('[data-oop-step-controls]');
        const mode = oopModeSelect.value;
        if (slot && slot.getAttribute('data-oop-step-mode') === mode) return;
        if (slot) slot.remove();
        slot = document.createElement('div');
        slot.setAttribute('data-oop-step-controls', '');
        slot.setAttribute('data-oop-step-mode', mode);
        // Append the (empty) slot BEFORE building the frame controls: buildFrameControls
        // paints frame 0 synchronously during construction, and that paint calls renderOOP(),
        // which calls back into syncOopStepControls(). Appending early means that reentrant
        // call finds this slot already in the DOM with a matching mode and no-ops, instead of
        // recursing (early stepped-viz controls never painted synchronously, so this never came up before).
        oopActions.appendChild(slot);
        slot.appendChild(buildFrameControls(OOP_STEPS[mode], (frame, i) => {
            setOopStep(mode, i);
            renderOOP();
            showStatus(OOP_STEPS[mode][i], '#2563eb');
        }, {
            runIntervalMs: 900,
            initialIndex: oopStep(mode),
            onIndexChange: (i) => setOopStep(mode, i),
        }));
    }

    function renderOOP() {
        const mode = oopModeSelect.value;
        if (mode === 'inheritance') renderOOPInheritance();
        else if (mode === 'polymorphism') renderOOPPolymorphism();
        else if (mode === 'encapsulation') renderOOPEncapsulation();
        else if (mode === 'abstraction') renderOOPAbstraction();
        else if (mode === 'adhoc') renderOOPAdhoc();
        else if (mode === 'templates') renderOOPTemplates();
        syncOopStepControls();
    }

    function renderOOPInheritance() {
        const svg = document.getElementById('oop-inheritance-svg');
        if (!svg) return;
        const step = oopStep('inheritance');
        svg.innerHTML = '';
        drawOopStepBadge(svg, 'inheritance');
        drawOopBox(svg, { x: 180, y: 56, w: 140, h: 84, title: 'Animal (Base)', titleColor: OOP_COLORS.blue,
            activeClass: oopActiveClass(step, [0, 3]), lines: [{ text: '+ virtual speak()', color: OOP_COLORS.amber }] });
        drawOopBox(svg, { x: 70, y: 188, w: 130, h: 86, title: 'Dog', titleColor: OOP_COLORS.pink,
            className: 'oop-derived-rect', activeClass: oopActiveClass(step, [1, 2, 3]), lines: [{ text: 'speak() override', color: OOP_COLORS.green }] });
        drawOopBox(svg, { x: 320, y: 188, w: 130, h: 86, title: 'Cat', titleColor: OOP_COLORS.pink,
            className: 'oop-derived-rect', activeClass: oopActiveClass(step, [1, 2, 3]), lines: [{ text: 'speak() override', color: OOP_COLORS.green }] });
        drawOopLine(svg, 135, 188, 220, 140, oopActiveClass(step, [1, 3]));
        drawOopLine(svg, 385, 188, 280, 140, oopActiveClass(step, [1, 3]));
        drawOopLabel(svg, 250, 166, 'is-a relationship', OOP_COLORS.cyan, oopActiveClass(step, [1]));
        drawOopLabel(svg, 250, 306, 'Animal* p can point to Dog or Cat', OOP_COLORS.green, oopActiveClass(step, [3]));
    }

    function renderOOPPolymorphism() {
        const svg = document.getElementById('oop-poly-svg');
        if (!svg) return;
        const step = oopStep('polymorphism');
        svg.innerHTML = '';
        drawOopStepBadge(svg, 'polymorphism');
        drawOopBox(svg, { x: 34, y: 72, w: 180, h: 78, title: 'Animal* p', titleColor: OOP_COLORS.blue,
            activeClass: oopActiveClass(step, [2, 3]), lines: [{ text: 'p->speak()', color: OOP_COLORS.slate }] });
        drawOopBox(svg, { x: 34, y: 196, w: 180, h: 78, title: 'Object memory', titleColor: OOP_COLORS.amber,
            className: 'oop-vptr-box', activeClass: oopActiveClass(step, [0]), lines: [{ text: 'vptr -> vtable', color: OOP_COLORS.amber }] });
        drawOopBox(svg, { x: 306, y: 54, w: 170, h: 114, title: 'Dog VTable', titleColor: OOP_COLORS.green,
            activeClass: oopActiveClass(step, [1, 2]), lines: [{ text: 'speak: Dog::speak', color: OOP_COLORS.green }, { text: 'dtor: Dog::~Dog', color: OOP_COLORS.slate }] });
        drawOopBox(svg, { x: 306, y: 190, w: 170, h: 114, title: 'Cat VTable', titleColor: OOP_COLORS.pink,
            activeClass: oopActiveClass(step, [1, 3]), lines: [{ text: 'speak: Cat::speak', color: OOP_COLORS.pink }, { text: 'dtor: Cat::~Cat', color: OOP_COLORS.slate }] });
        drawOopLine(svg, 214, 235, 306, 112, oopActiveClass(step, [0, 1, 2]));
        drawOopLine(svg, 214, 235, 306, 248, oopActiveClass(step, [0, 1, 3]));
        drawOopLabel(svg, 254, 96, 'dispatch', OOP_COLORS.green, oopActiveClass(step, [2]));
        drawOopLabel(svg, 254, 268, 'same call, different target', OOP_COLORS.pink, oopActiveClass(step, [3]));
    }

    function renderOOPEncapsulation() {
        const svg = document.getElementById('oop-encap-svg');
        if (!svg) return;
        const step = oopStep('encapsulation');
        svg.innerHTML = '';
        drawOopStepBadge(svg, 'encapsulation');
        drawOopBox(svg, { x: 52, y: 56, w: 396, h: 250, title: 'class BankAccount', titleColor: OOP_COLORS.blue,
            activeClass: oopActiveClass(step, [0]), lines: [] });
        drawOopBox(svg, { x: 84, y: 94, w: 330, h: 64, title: 'public:', titleColor: OOP_COLORS.green,
            activeClass: oopActiveClass(step, [1]), lines: [{ text: '+ deposit()   + withdraw()   + getBalance()', color: OOP_COLORS.green }] });
        drawOopBox(svg, { x: 84, y: 170, w: 330, h: 58, title: 'protected:', titleColor: OOP_COLORS.amber,
            activeClass: oopActiveClass(step, [2]), lines: [{ text: '# validate()   # logTransaction()', color: OOP_COLORS.amber }] });
        drawOopBox(svg, { x: 84, y: 240, w: 330, h: 58, title: 'private:', titleColor: OOP_COLORS.violet,
            activeClass: oopActiveClass(step, [3]), lines: [{ text: '- m_balance   - m_lock', color: OOP_COLORS.violet }] });
        drawOopLabel(svg, 250, 326, step === 3 ? 'Only member functions touch private state directly.' : 'Access modifiers define who may use each member.', OOP_COLORS.slate, '');
    }

    function renderOOPAbstraction() {
        const svg = document.getElementById('oop-abstraction-svg');
        if (!svg) return;
        const step = oopStep('abstraction');
        svg.innerHTML = '';
        drawOopStepBadge(svg, 'abstraction');
        drawOopBox(svg, { x: 170, y: 58, w: 160, h: 78, title: 'Shape abstract', titleColor: OOP_COLORS.violet,
            dashed: true, activeClass: oopActiveClass(step, [0, 2, 3]), lines: [{ text: '+ area() = 0', color: OOP_COLORS.amber }] });
        drawOopBox(svg, { x: 54, y: 200, w: 156, h: 72, title: 'Circle', titleColor: OOP_COLORS.pink,
            className: 'oop-derived-rect', activeClass: oopActiveClass(step, [1, 3]), lines: [{ text: '+ area() override', color: OOP_COLORS.green }] });
        drawOopBox(svg, { x: 290, y: 200, w: 156, h: 72, title: 'Rectangle', titleColor: OOP_COLORS.pink,
            className: 'oop-derived-rect', activeClass: oopActiveClass(step, [1, 3]), lines: [{ text: '+ area() override', color: OOP_COLORS.green }] });
        drawOopLine(svg, 132, 200, 224, 136, oopActiveClass(step, [1, 3]));
        drawOopLine(svg, 368, 200, 276, 136, oopActiveClass(step, [1, 3]));
        drawOopLabel(svg, 250, 168, 'Shape s; compile error', OOP_COLORS.red, oopActiveClass(step, [2]));
        drawOopLabel(svg, 250, 306, 'Shape* p = new Circle(); p->area();', OOP_COLORS.green, oopActiveClass(step, [3]));
    }

    function renderOOPAdhoc() {
        const svg = document.getElementById('oop-adhoc-svg');
        if (!svg) return;
        const step = oopStep('adhoc');
        svg.innerHTML = '';
        drawOopStepBadge(svg, 'adhoc');
        drawOopLabel(svg, 110, 64, 'Call sites', OOP_COLORS.slate, oopActiveClass(step, [0, 1]));
        drawOopLabel(svg, 390, 64, 'Selected overload', OOP_COLORS.slate, oopActiveClass(step, [0, 1]));
        const calls = ['print(42)', 'print(3.14)', 'print("hi")'];
        const funcs = ['print(int)', 'print(double)', 'print(string)'];
        for (let i = 0; i < 3; i++) {
            const y = 84 + i * 48;
            drawOopBox(svg, { x: 34, y: y, w: 154, h: 36, title: calls[i], titleColor: OOP_COLORS.blue, activeClass: oopActiveClass(step, [0, 1]) });
            drawOopBox(svg, { x: 314, y: y, w: 154, h: 36, title: funcs[i], titleColor: OOP_COLORS.green, activeClass: oopActiveClass(step, [0, 1]) });
            drawOopLine(svg, 188, y + 18, 314, y + 18, oopActiveClass(step, [1]));
        }
        drawOopBox(svg, { x: 34, y: 254, w: 154, h: 52, title: 'v1 + v2', titleColor: OOP_COLORS.blue,
            activeClass: oopActiveClass(step, [2]), lines: [{ text: 'Vector2D values', color: OOP_COLORS.slate }] });
        drawOopBox(svg, { x: 314, y: 254, w: 154, h: 52, title: 'operator+', titleColor: OOP_COLORS.green,
            activeClass: oopActiveClass(step, [2]), lines: [{ text: 'Vector2D::operator+', color: OOP_COLORS.slate }] });
        drawOopLine(svg, 188, 280, 314, 280, oopActiveClass(step, [2]));
        drawOopLabel(svg, 250, 230, 'Static binding: the compiler chooses before runtime.', OOP_COLORS.amber, oopActiveClass(step, [3]));
    }

    function renderOOPTemplates() {
        const svg = document.getElementById('oop-templates-svg');
        if (!svg) return;
        const step = oopStep('templates');
        svg.innerHTML = '';
        drawOopStepBadge(svg, 'templates');
        drawOopBox(svg, { x: 152, y: 64, w: 196, h: 78, title: 'template<typename T>', titleColor: OOP_COLORS.violet,
            dashed: true, activeClass: oopActiveClass(step, [0, 3]), lines: [{ text: 'class Box { T value; }', color: OOP_COLORS.amber }] });
        const insts = ['Box<int>', 'Box<double>', 'Box<string>'];
        for (let i = 0; i < 3; i++) {
            const x = 38 + i * 154;
            drawOopBox(svg, { x: x, y: 212, w: 130, h: 62, title: insts[i], titleColor: i === 0 ? OOP_COLORS.green : OOP_COLORS.cyan,
                activeClass: oopActiveClass(step, i === 0 ? [1, 3] : [2, 3]), lines: [{ text: 'concrete class', color: OOP_COLORS.slate }] });
            drawOopLine(svg, 250, 142, x + 65, 212, oopActiveClass(step, i === 0 ? [1, 3] : [2, 3]));
        }
        drawOopLabel(svg, 250, 180, 'The source stays generic; generated code is concrete.', OOP_COLORS.slate, oopActiveClass(step, [3]));
    }

    // OOP Button Listeners
    oopModeSelect.addEventListener('change', () => {
        currentMode = 'oop-' + oopModeSelect.value;
        updateLayout();
        renderAll();
    });

    btnOopDemo.addEventListener('click', () => {
        currentMode = 'oop-' + oopModeSelect.value;
        updateLayout();
        renderAll();
        executeAnimWrapper(async () => await visualizeOOPSteps(oopModeSelect.value));
    });

    btnOopReset.addEventListener('click', () => {
        oopInheritanceAnimationState = null;
        oopPolymorphismAnimationState = null;
        oopEncapsulationAnimationState = null;
        renderOOP();
        showStatus('OOP visualization reset.', '#6366f1');
    });

    async function visualizeOOPSteps(mode) {
        setOopStep(mode, 0);
        renderOOP();
        for (let i = 0; i < OOP_STEPS[mode].length; i++) {
            setOopStep(mode, i);
            renderOOP();
            showStatus(OOP_STEPS[mode][i], '#2563eb');
            await sleep(850);
        }
        return '__KEEP_STATUS__';
    }

    async function visualizeOOPInheritance() {
        return visualizeOOPSteps('inheritance');
    }

    async function visualizeOOPPolymorphism() {
        return visualizeOOPSteps('polymorphism');
    }

    async function visualizeOOPEncapsulation() {
        return visualizeOOPSteps('encapsulation');
    }


    // Event listeners for Pattern actions
    btnPatternDemo.addEventListener('click', () => {
        const p = window.PatternsDB && window.PatternsDB.getPattern(currentMode);
        if (p) window.PatternViz.playNarration(p.narration);
    });

    btnPatternReset.addEventListener('click', () => {
        renderAll();
        showStatus('Pattern visualization reset.', '#6366f1');
    });

    applyHashRoute();
});
