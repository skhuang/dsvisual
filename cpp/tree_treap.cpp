#include <iostream>
#include <cstdlib>
using namespace std;

struct Node {
    int key, priority;
    Node *left, *right;
    Node(int k) : key(k), priority(rand()), left(nullptr), right(nullptr) {}
};

class Treap {
    Node* rightRotate(Node* y) {
        Node* x = y->left;
        Node* T2 = x->right;
        x->right = y;
        y->left = T2;
        return x;
    }

    Node* leftRotate(Node* x) {
        Node* y = x->right;
        Node* T2 = y->left;
        y->left = x;
        x->right = T2;
        return y;
    }

public:
    Node* root = nullptr;

    Node* insert(Node* node, int key) {
        if (!node)
            return new Node(key);

        if (key < node->key) {
            node->left = insert(node->left, key);
            // Heap property violated -> bubble the higher-priority child up
            if (node->left->priority > node->priority)
                node = rightRotate(node);
        } else if (key > node->key) {
            node->right = insert(node->right, key);
            if (node->right->priority > node->priority)
                node = leftRotate(node);
        }
        // key already present: no-op
        return node;
    }
    void insert(int key) { root = insert(root, key); }

    Node* remove(Node* node, int key) {
        if (!node) return node;

        if (key < node->key) {
            node->left = remove(node->left, key);
        } else if (key > node->key) {
            node->right = remove(node->right, key);
        } else {
            // Found the node — rotate it downward until it's a leaf, then delete it
            if (!node->left) {
                Node* temp = node->right;
                delete node;
                return temp;
            } else if (!node->right) {
                Node* temp = node->left;
                delete node;
                return temp;
            } else if (node->left->priority > node->right->priority) {
                node = rightRotate(node);
                node->right = remove(node->right, key);
            } else {
                node = leftRotate(node);
                node->left = remove(node->left, key);
            }
        }
        return node;
    }
    void remove(int key) { root = remove(root, key); }

    // Split into two treaps: all keys < key go to *left, all keys >= key go to *right
    void split(Node* node, int key, Node** left, Node** right) {
        if (!node) { *left = *right = nullptr; return; }
        if (node->key < key) {
            split(node->right, key, &node->right, right);
            *left = node;
        } else {
            split(node->left, key, left, &node->left);
            *right = node;
        }
    }

    // Merge two treaps where every key in a < every key in b
    Node* merge(Node* a, Node* b) {
        if (!a || !b) return a ? a : b;
        if (a->priority > b->priority) {
            a->right = merge(a->right, b);
            return a;
        } else {
            b->left = merge(a, b->left);
            return b;
        }
    }
};

int main() {
    Treap treap;
    treap.insert(50);
    treap.insert(30);
    treap.insert(70); // 隨機 priority 可能觸發旋轉
    treap.remove(30);
    return 0;
}