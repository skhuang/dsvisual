#include <iostream>
#include <stack>
#include <queue>
struct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };

void inorderRecursive(Node* n) {
    if (!n) return;
    inorderRecursive(n->left);
    std::cout << n->val << ' ';
    inorderRecursive(n->right);
}

void inorderIterative(Node* root) {
    std::stack<Node*> st; Node* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop();
        std::cout << cur->val << ' ';
        cur = cur->right;
    }
}

void levelOrder(Node* root) {
    if (!root) return;
    std::queue<Node*> q; q.push(root);
    while (!q.empty()) {
        Node* n = q.front(); q.pop();
        std::cout << n->val << ' ';
        if (n->left) q.push(n->left);
        if (n->right) q.push(n->right);
    }
}
