#include <iostream>
#include <vector>
using namespace std;

class BPlusNode {
public:
    vector<int> keys;
    vector<BPlusNode*> children;
    BPlusNode* nextLeaf; // Critical difference: Horizontal chain
    bool isLeaf;
    int MAX;
    
    BPlusNode(int maxKeys, bool isLeaf) : MAX(maxKeys), isLeaf(isLeaf), nextLeaf(nullptr) {}
};

class BPlusTree {
    BPlusNode* root;
    int MAX;
public:
    BPlusTree(int maxKeys = 3) : root(nullptr), MAX(maxKeys) {}
    
    // Core theory of B+ Trees:
    // 1. All actual data resides strictly at the leaf level.
    // 2. Internal nodes strictly act as index routing guides.
    // 3. Leaves are chained together via `nextLeaf` pointer for rapid range queries.
    
    void insert(int k) {
        // Warning: Precise splitting algorithm omitted to maintain focus on structure.
        // A true B+Tree copies the median key UP when a leaf splits, 
        // but pushes the median UP when an internal routing node splits.
        if (!root) {
            root = new BPlusNode(MAX, true);
            root->keys.push_back(k);
        } else {
            cout << "Routing " << k << " to appropriate leaf block..." << endl;
            // ... descent and leaf-splitting logic ...
        }
    }
};

int main() {
    BPlusTree tree(3);
    tree.insert(10);
    tree.insert(20);
    // As sequence fills, leaf nodes expand sideways and index nodes rise up!
    return 0;
}
