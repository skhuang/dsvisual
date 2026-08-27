// 1. 第三方套件 (Prism 語法高亮)
import '../vendor/prism/prism.min.js';
import '../vendor/prism/prism-c.min.js';
import '../vendor/prism/prism-cpp.min.js';
import '../vendor/prism/prism-python.min.js';
import '../vendor/prism/prism-rust.min.js';
import '../vendor/prism/prism-go.min.js';
import '../vendor/prism/prism-markup-templating.min.js';
import '../vendor/prism/prism-php.min.js';

// 2. 核心架構與資料庫
import './core/registry.js';
import './core/domains.js';
import './algos/tree_algos.js';
import './desc_db.js';
import './code_db.js';
import './code_multilang.js';
import './patterns_db.js';
import './examples_store.js';
import './slides_rendered.js';

// 3. 圖論 (Graph) 視覺化
import './graph_matrix_viz.js';
import './viz/viz_graph_matrix.js';
import './graph_components_viz.js';
import './viz/viz_graph_components.js';
import './graph_bipartite_viz.js';
import './viz/viz_graph_bipartite.js';
import './graph_closure_viz.js';
import './viz/viz_graph_closure.js';
import './graph_scc_viz.js';
import './viz/viz_graph_scc.js';
import './graph_maxflow_viz.js';
import './viz/viz_graph_maxflow.js';
import './graph_euler_viz.js';
import './viz/viz_graph_euler.js';
import './graph_aoe_viz.js';
import './viz/viz_graph_aoe.js';
import './viz/viz_graph_workbench.js';
import './viz/viz_graph_drag.js';
import './domains/graph.js';

// 4. 樹狀結構 (Tree) 視覺化
import './tree_traversal_viz.js';
import './viz/viz_tree_traversal.js';
import './tree_general_binary_viz.js';
import './viz/viz_tgb.js';
import './game_tree_viz.js';
import './viz/viz_game_tree.js';
import './huffman_viz.js';
import './viz/viz_huffman.js';
import './tree_obst_viz.js';
import './viz/viz_obst.js';
import './tree_threaded_viz.js';
import './viz/viz_threaded.js';
import './tree_rb_viz.js';
import './tree_avl_viz.js';
import './tree_mway_viz.js';
import './viz/viz_mway.js';
import './tree_expression_viz.js';
import './viz/viz_expr_tree.js';
import './tree_copy_equal_viz.js';
import './viz/viz_tree_copy_equal.js';
import './decision_tree_coins_viz.js';
import './viz/viz_decision_tree_coins.js';
import './tree_catalan_viz.js';
import './viz/viz_tree_catalan.js';
import './tree_array_rep_viz.js';
import './viz/viz_tree_array_rep.js';
import './tree_reconstruct_viz.js';
import './viz/viz_tree_reconstruct.js';
import './domains/tree.js';
import './trie_viz.js';
import './viz/viz_trie.js';

// 5. 排序與搜尋 (Sort & Search)
import './viz/viz_sort_frames.js';
import './domains/sort.js';
import './viz/viz_search_frames.js';
import './domains/search.js';
import './sort_external_viz.js';
import './viz/viz_sort_external.js';
import './sort_polyphase_viz.js';
import './viz/viz_polyphase.js';
import './viz/viz_quickselect.js';

// 6. 高級資料結構 (Advanced Data Structures)
import './heap_models.js';
import './domains/heap.js';
import './viz/viz_bloom.js';
import './viz/viz_skiplist.js';
import './viz/viz_cms.js';
import './viz/viz_segment.js';
import './viz/viz_fenwick.js';
import './dsu_viz.js';
import './viz/viz_dsu.js';

// 7. 線性結構與矩陣 (Linear & Matrix)
import './domains/linear.js';
import './list_doubly_viz.js';
import './viz/viz_list_doubly.js';
import './lru_cache_viz.js';
import './viz/viz_lru.js';
import './matrix_sparse_viz.js';
import './viz/viz_sparse.js';
import './matrix_sparse_list_viz.js';
import './viz/viz_matrix_sparse_list.js';
import './poly_padd_viz.js';
import './viz/viz_poly.js';
import './maze_stack_viz.js';
import './viz/viz_maze.js';
import './list_equivalence_viz.js';
import './viz/viz_list_equivalence.js';

// 8. 字串演算法 (String)
import './viz/viz_strsearch_frames.js';
import './domains/strsearch.js';
import './viz/viz_aho_frames.js';
import './domains/aho.js';
import './viz/viz_suffix_array.js'; // 已修正原有的絕對路徑問題

// 9. 魔術與數學相關 (Magic & Math)
import './expr_infix_postfix_viz.js';
import './viz/viz_expr.js';
import './viz/viz_pattern.js';
import './domains/hash.js';
import './viz/viz_magic.js';
import './magic_latin_viz.js';
import './viz/viz_magic_latin.js';
import './magic_torus_viz.js';
import './viz/viz_magic_torus.js';
import './magic_formula_viz.js';
import './viz/viz_magic_formula.js';
import './magic_symmetry_viz.js';
import './viz/viz_magic_symmetry.js';
import './recursion_viz.js';
import './viz/viz_recursion.js';

// 10. AI / Nano 相關
import './nano_bpe_encode_viz.js';
import './viz/viz_nano_bpe_encode.js';
import './nano_compute_graph_viz.js';
import './viz/viz_nano_compute_graph.js';
import './nano_bpe_train_viz.js';
import './viz/viz_nano_bpe_train.js';
import './nano_ngram_next_viz.js';
import './viz/viz_nano_ngram.js';

// 11. 系統功能、雲端與測驗 (System, Cloud & Quiz)
import './gc_memory_viz.js';
import './viz/viz_gc.js';
import './file_isam_viz.js';
import './viz/viz_file_isam.js';
import './file_inverted_viz.js';
import './viz/viz_file_inverted.js';
import './i18n.js';
import './cloud-config.js';
import './cloud-integration.js';
import './cloud-drawer.js';
import './random_input.js';
import './quiz_attempts.js';
import './quiz_grade.js';
import './quiz_rendered.js';
import './quiz.js';
import './labs_rendered.js';
import './lab.js';

// 12. 主應用程式進入點 (最後載入)
import './app.js';