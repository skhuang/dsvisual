#include <iostream>
#include <vector>
using namespace std;

class BTreeNode {
public:
    vector<int> keys;
    vector<BTreeNode*> children;
    bool leaf;
    int t; // Minimum degree (defines the range for number of keys)

    BTreeNode(int t, bool leaf) : t(t), leaf(leaf) {}

    void insertNonFull(int k) {
        int i = keys.size() - 1;
        if (leaf) {
            keys.push_back(0); // Make space
            while (i >= 0 && keys[i] > k) {
                keys[i + 1] = keys[i];
                i--;
            }
            keys[i + 1] = k;
        } else {
            while (i >= 0 && keys[i] > k)
                i--;
            if (children[i + 1]->keys.size() == 2 * t - 1) {
                splitChild(i + 1, children[i + 1]);
                if (keys[i + 1] < k)
                    i++;
            }
            children[i + 1]->insertNonFull(k);
        }
    }

    void splitChild(int i, BTreeNode* y) {
        BTreeNode* z = new BTreeNode(y->t, y->leaf);
        for (int j = 0; j < t - 1; j++)
            z->keys.push_back(y->keys[j + t]);
        if (!y->leaf) {
            for (int j = 0; j < t; j++)
                z->children.push_back(y->children[j + t]);
            y->children.resize(t); // Cut children
        }
        keys.insert(keys.begin() + i, y->keys[t - 1]);
        y->keys.resize(t - 1); // Cut keys
        children.insert(children.begin() + i + 1, z);
    }
};

class BTree {
    BTreeNode* root;
    int t;

public:
    BTree(int t) : root(nullptr), t(t) {}

    void insert(int k) {
        if (!root) {
            root = new BTreeNode(t, true);
            root->keys.push_back(k);
        } else {
            if (root->keys.size() == 2 * t - 1) {
                BTreeNode* s = new BTreeNode(t, false);
                s->children.push_back(root);
                s->splitChild(0, root);
                int i = (s->keys[0] < k) ? 1 : 0;
                s->children[i]->insertNonFull(k);
                root = s;
            } else {
                root->insertNonFull(k);
            }
        }
        cout << "Inserted " << k << " into B-Tree block." << endl;
    }
};

int main() {
    BTree t(3); // Order 5 typically, max 5 children, 4 keys
    t.insert(10);
    t.insert(20);
    t.insert(5);
    t.insert(6);
    t.insert(12);
    // As it hits capacity, blocks split!
    return 0;
}
