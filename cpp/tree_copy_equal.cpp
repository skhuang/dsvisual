#include <iostream>
#include <string>

struct TreeNode {
    std::string val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
};

// Deep copy: create the node, then copy each subtree (a top-down build).
TreeNode* copyTree(TreeNode* t) {
    if (!t) return nullptr;
    TreeNode* c = new TreeNode{ t->val, nullptr, nullptr };
    c->left = copyTree(t->left);
    c->right = copyTree(t->right);
    return c;
}

// Structural + content equality.
bool equal(TreeNode* s, TreeNode* t) {
    if (!s && !t) return true;                 // both empty
    if (!s || !t) return false;                // one empty -> shapes differ
    if (s->val != t->val) return false;        // values differ
    return equal(s->left, t->left) && equal(s->right, t->right);
}
