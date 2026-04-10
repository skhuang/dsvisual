#include <iostream>
using namespace std;

struct Node {
    int key; 
    Node *left, *right; 
    int height;
    Node(int k) : key(k), left(nullptr), right(nullptr), height(1) {}
};

class AVLTree {
    int height(Node* N) { return N ? N->height : 0; }
    int max(int a, int b) { return (a > b) ? a : b; }
    int getBalance(Node* N) { return N ? height(N->left) - height(N->right) : 0; }
    
    Node* rightRotate(Node* y) {
        Node* x = y->left; Node* T2 = x->right;
        x->right = y; y->left = T2;
        y->height = max(height(y->left), height(y->right)) + 1;
        x->height = max(height(x->left), height(x->right)) + 1;
        return x;
    }
    
    Node* leftRotate(Node* x) {
        Node* y = x->right; Node* T2 = y->left;
        y->left = x; x->right = T2;
        x->height = max(height(x->left), height(x->right)) + 1;
        y->height = max(height(y->left), height(y->right)) + 1;
        return y;
    }
public:
    Node* root = nullptr;
    Node* insert(Node* node, int key) {
        if (!node) return new Node(key);
        if (key < node->key) node->left = insert(node->left, key);
        else if (key > node->key) node->right = insert(node->right, key);
        else return node;

        node->height = 1 + max(height(node->left), height(node->right));
        int balance = getBalance(node);

        if (balance > 1 && key < node->left->key) return rightRotate(node);
        if (balance < -1 && key > node->right->key) return leftRotate(node);
        if (balance > 1 && key > node->left->key) {
            node->left = leftRotate(node->left); return rightRotate(node);
        }
        if (balance < -1 && key < node->right->key) {
            node->right = rightRotate(node->right); return leftRotate(node);
        }
        return node;
    }
    void insert(int key) { root = insert(root, key); }
};

int main() {
    AVLTree tree;
    tree.insert(10);
    tree.insert(20);
    tree.insert(30); // Triggers Left Rotation
    return 0;
}
