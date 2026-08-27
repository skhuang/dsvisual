#include <iostream>
#include <vector>
#include <algorithm>

struct Node234 {
    std::vector<int> keys;
    std::vector<Node234*> children;

    bool isLeaf() const { return children.empty(); }
    bool isFull() const { return keys.size() == 3; }
};

class Tree234 {
private:
    Node234* root;

    void splitChild(Node234* parent, int idx) {
        Node234* fullChild = parent->children[idx];
        Node234* leftChild = new Node234();
        Node234* rightChild = new Node234();

        leftChild->keys = {fullChild->keys[0]};
        int middleKey = fullChild->keys[1];
        rightChild->keys = {fullChild->keys[2]};

        if (!fullChild->isLeaf()) {
            leftChild->children = {fullChild->children[0], fullChild->children[1]};
            rightChild->children = {fullChild->children[2], fullChild->children[3]};
        }

        parent->keys.insert(parent->keys.begin() + idx, middleKey);
        parent->children.erase(parent->children.begin() + idx);
        parent->children.insert(parent->children.begin() + idx, rightChild);
        parent->children.insert(parent->children.begin() + idx, leftChild);
        delete fullChild;
    }

    void insertNonFull(Node234* node, int key) {
        int i = static_cast<int>(node->keys.size()) - 1;
        if (node->isLeaf()) {
            node->keys.push_back(key);
            std::sort(node->keys.begin(), node->keys.end());
            return;
        }
        while (i >= 0 && key < node->keys[i]) i--;
        i++;
        if (node->children[i]->isFull()) {
            splitChild(node, i);
            if (key > node->keys[i]) i++;
        }
        insertNonFull(node->children[i], key);
    }

public:
    Tree234() : root(new Node234()) {}

    void insert(int key) {
        if (root->isFull()) {
            Node234* oldRoot = root;
            root = new Node234();
            root->children.push_back(oldRoot);
            splitChild(root, 0);
        }
        insertNonFull(root, key);
    }
};