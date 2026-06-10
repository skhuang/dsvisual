#include <iostream>
using namespace std;

struct Node {
    int key;
    Node *left, *right;
    Node(int k) : key(k), left(nullptr), right(nullptr) {}
};

class SplayTree {
    Node* rightRotate(Node* x) {
        Node* y = x->left;
        x->left = y->right;
        y->right = x;
        return y;
    }

    Node* leftRotate(Node* x) {
        Node* y = x->right;
        x->right = y->left;
        y->left = x;
        return y;
    }

public:
    Node* root = nullptr;

    Node* splay(Node* root, int key) {
        if (!root || root->key == key)
            return root;

        if (root->key > key) {
            if (!root->left)
                return root;
            if (root->left->key > key) {
                root->left->left = splay(root->left->left, key);
                root = rightRotate(root);
            } else if (root->left->key < key) {
                root->left->right = splay(root->left->right, key);
                if (root->left->right)
                    root->left = leftRotate(root->left);
            }
            return (root->left == nullptr) ? root : rightRotate(root);
        } else {
            if (!root->right)
                return root;
            if (root->right->key > key) {
                root->right->left = splay(root->right->left, key);
                if (root->right->left)
                    root->right = rightRotate(root->right);
            } else if (root->right->key < key) {
                root->right->right = splay(root->right->right, key);
                root = leftRotate(root);
            }
            return (root->right == nullptr) ? root : leftRotate(root);
        }
    }

    void insert(int k) {
        if (!root) {
            root = new Node(k);
            return;
        }
        root = splay(root, k);
        if (root->key == k)
            return;
        Node* n = new Node(k);
        if (root->key > k) {
            n->right = root;
            n->left = root->left;
            root->left = nullptr;
        } else {
            n->left = root;
            n->right = root->right;
            root->right = nullptr;
        }
        root = n;
    }

    void search(int k) { root = splay(root, k); }
};

int main() {
    SplayTree tree;
    tree.insert(10);
    tree.insert(20);
    tree.insert(30);
    tree.search(10); // Splays 10 to the top
    return 0;
}
