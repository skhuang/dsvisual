#include <iostream>
using namespace std;

struct TreeNode {
    int data;
    TreeNode* left;
    TreeNode* right;

    TreeNode(int val) {
        data = val;
        left = nullptr;
        right = nullptr;
    }
};

class BinarySearchTree {
private:
    TreeNode* root;

    TreeNode* insertRecursive(TreeNode* node, int value) {
        if (node == nullptr) {
            cout << "Inserted " << value << endl;
            return new TreeNode(value);
        }

        if (value < node->data) {
            node->left = insertRecursive(node->left, value);
        } else if (value > node->data) {
            node->right = insertRecursive(node->right, value);
        } else {
            cout << value << " already exists." << endl;
        }
        return node;
    }

    void inOrderRecursive(TreeNode* node) {
        if (node != nullptr) {
            inOrderRecursive(node->left);
            cout << node->data << " ";
            inOrderRecursive(node->right);
        }
    }

public:
    BinarySearchTree() { root = nullptr; }

    void insert(int value) { root = insertRecursive(root, value); }

    void printInOrder() {
        cout << "Inorder Traversal: ";
        inOrderRecursive(root);
        cout << endl;
    }
};

int main() {
    BinarySearchTree bst;
    bst.insert(50);
    bst.insert(30);
    bst.insert(70);
    bst.insert(20);
    bst.insert(40);
    bst.printInOrder();
    return 0;
}
