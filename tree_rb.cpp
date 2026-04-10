#include <iostream>
using namespace std;

enum Color { RED, BLACK };

struct Node {
    int data; bool color; 
    Node *left, *right, *parent;
    Node(int d) : data(d), color(RED), left(nullptr), right(nullptr), parent(nullptr) {}
};

class RBTree {
public:
    Node* root = nullptr;

    void rotateLeft(Node*& root, Node*& pt) {
        Node* pt_right = pt->right;
        pt->right = pt_right->left;
        if (pt->right != nullptr) pt->right->parent = pt;
        pt_right->parent = pt->parent;
        if (pt->parent == nullptr) root = pt_right;
        else if (pt == pt->parent->left) pt->parent->left = pt_right;
        else pt->parent->right = pt_right;
        pt_right->left = pt; pt->parent = pt_right;
    }

    void rotateRight(Node*& root, Node*& pt) {
        Node* pt_left = pt->left;
        pt->left = pt_left->right;
        if (pt->left != nullptr) pt->left->parent = pt;
        pt_left->parent = pt->parent;
        if (pt->parent == nullptr) root = pt_left;
        else if (pt == pt->parent->left) pt->parent->left = pt_left;
        else pt->parent->right = pt_left;
        pt_left->right = pt; pt->parent = pt_left;
    }

    void fixViolation(Node*& root, Node*& pt) {
        Node* parent_pt = nullptr; Node* grand_parent_pt = nullptr;
        while ((pt != root) && (pt->color != BLACK) && (pt->parent->color == RED)) {
            parent_pt = pt->parent; grand_parent_pt = pt->parent->parent;
            if (parent_pt == grand_parent_pt->left) {
                Node* uncle_pt = grand_parent_pt->right;
                if (uncle_pt != nullptr && uncle_pt->color == RED) {
                    grand_parent_pt->color = RED; parent_pt->color = BLACK;
                    uncle_pt->color = BLACK; pt = grand_parent_pt;
                } else {
                    if (pt == parent_pt->right) { rotateLeft(root, parent_pt); pt = parent_pt; parent_pt = pt->parent; }
                    rotateRight(root, grand_parent_pt); swap(parent_pt->color, grand_parent_pt->color); pt = parent_pt;
                }
            } else {
                Node* uncle_pt = grand_parent_pt->left;
                if ((uncle_pt != nullptr) && (uncle_pt->color == RED)) {
                    grand_parent_pt->color = RED; parent_pt->color = BLACK;
                    uncle_pt->color = BLACK; pt = grand_parent_pt;
                } else {
                    if (pt == parent_pt->left) { rotateRight(root, parent_pt); pt = parent_pt; parent_pt = pt->parent; }
                    rotateLeft(root, grand_parent_pt); swap(parent_pt->color, grand_parent_pt->color); pt = parent_pt;
                }
            }
        }
        root->color = BLACK;
    }

    void insert(int data) {
        Node* pt = new Node(data);
        if(root == nullptr) { root = pt; root->color = BLACK; return; }
        // ... Standard BST insertion, then fixViolation(root, pt);
    }
};

int main() {
    RBTree tree;
    tree.insert(7);
    return 0;
}
