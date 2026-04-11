#include <iostream>
#include <vector>
#include <climits>
using namespace std;

struct PNode {
    int key;
    PNode* child;
    PNode* sibling;
    explicit PNode(int value) : key(value), child(nullptr), sibling(nullptr) {}
};

class PairingHeap {
private:
    PNode* root = nullptr;
    bool isMinHeap;

    bool cmp(int a, int b) const {
        return isMinHeap ? (a < b) : (a > b);
    }

    PNode* meld(PNode* a, PNode* b) {
        if (!a) return b;
        if (!b) return a;
        if (!cmp(a->key, b->key)) swap(a, b);
        b->sibling = a->child;
        a->child = b;
        return a;
    }

    PNode* mergePairs(PNode* node) {
        if (!node || !node->sibling) return node;
        PNode* first = node;
        PNode* second = node->sibling;
        PNode* rest = second->sibling;
        first->sibling = nullptr;
        second->sibling = nullptr;
        return meld(meld(first, second), mergePairs(rest));
    }

    void clearNode(PNode* node) {
        if (!node) return;
        clearNode(node->child);
        clearNode(node->sibling);
        delete node;
    }

public:
    explicit PairingHeap(bool minHeap = true) : isMinHeap(minHeap) {}
    ~PairingHeap() { clearNode(root); }

    void insert(int value) {
        root = meld(root, new PNode(value));
    }

    int peek() const {
        return root ? root->key : (isMinHeap ? INT_MAX : INT_MIN);
    }

    int extractTop() {
        if (!root) return isMinHeap ? INT_MAX : INT_MIN;
        int top = root->key;
        PNode* oldRoot = root;
        root = mergePairs(root->child);
        oldRoot->child = nullptr;
        delete oldRoot;
        return top;
    }

    void merge(PairingHeap& other) {
        root = meld(root, other.root);
        other.root = nullptr;
    }

    void printRoot() const {
        if (!root) cout << "Pairing heap empty\n";
        else cout << (isMinHeap ? "Min" : "Max") << " pairing root: " << root->key << "\n";
    }
};

int main() {
    PairingHeap h1(true), h2(true);
    h1.insert(12);
    h1.insert(5);
    h1.insert(30);
    h2.insert(7);
    h2.insert(2);
    h2.insert(18);

    h1.merge(h2);
    h1.printRoot();
    cout << "Extract: " << h1.extractTop() << "\n";
    h1.printRoot();
    return 0;
}