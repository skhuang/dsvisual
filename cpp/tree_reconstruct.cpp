#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <functional>

// Rebuild a binary tree from two traversals. Keys are distinct.
struct TNode {
    std::string val;
    TNode* left = nullptr;
    TNode* right = nullptr;
};

// --- preorder + inorder (unique for any binary tree) ---
TNode* buildFromPreIn(const std::vector<std::string>& pre,
                      const std::vector<std::string>& in) {
    std::unordered_map<std::string, int> pos;
    for (int i = 0; i < (int)in.size(); ++i) pos[in[i]] = i;
    int p = 0;
    std::function<TNode*(int, int)> go = [&](int lo, int hi) -> TNode* {
        if (lo > hi) return nullptr;
        TNode* n = new TNode{ pre[p++], nullptr, nullptr };
        int m = pos[n->val];
        n->left = go(lo, m - 1);
        n->right = go(m + 1, hi);
        return n;
    };
    return go(0, (int)in.size() - 1);
}

// --- postorder + inorder (unique for any binary tree) ---
TNode* buildFromPostIn(const std::vector<std::string>& post,
                       const std::vector<std::string>& in) {
    std::unordered_map<std::string, int> pos;
    for (int i = 0; i < (int)in.size(); ++i) pos[in[i]] = i;
    int p = (int)post.size() - 1;
    std::function<TNode*(int, int)> go = [&](int lo, int hi) -> TNode* {
        if (lo > hi) return nullptr;
        TNode* n = new TNode{ post[p--], nullptr, nullptr };
        int m = pos[n->val];
        n->right = go(m + 1, hi);   // right before left (postorder back-to-front)
        n->left = go(lo, m - 1);
        return n;
    };
    return go(0, (int)in.size() - 1);
}

// --- preorder + postorder (unique ONLY for full binary trees) ---
// Sets `ambiguous` if a single-child node is encountered.
TNode* buildFromPrePost(const std::vector<std::string>& pre,
                        const std::vector<std::string>& post, bool& ambiguous) {
    std::unordered_map<std::string, int> pos;
    for (int i = 0; i < (int)post.size(); ++i) pos[post[i]] = i;
    int p = 0;
    std::function<TNode*(int, int)> go = [&](int lo, int hi) -> TNode* {
        if (lo > hi) return nullptr;
        TNode* n = new TNode{ pre[p++], nullptr, nullptr };
        if (lo == hi) return n;                       // leaf
        int j = pos[pre[p]];                          // next preorder = left child's root
        n->left = go(lo, j);
        if (j + 1 <= hi - 1) n->right = go(j + 1, hi - 1);
        else ambiguous = true;                        // single child -> not full -> ambiguous
        return n;
    };
    return go(0, (int)post.size() - 1);
}

void inorderPrint(TNode* n) {
    if (!n) return;
    inorderPrint(n->left);
    std::cout << n->val << ' ';
    inorderPrint(n->right);
}
