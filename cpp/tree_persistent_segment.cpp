#include <iostream>
#include <vector>
using namespace std;

struct Node {
    int sum;
    Node* left;
    Node* right;

    Node(int s = 0, Node* l = nullptr, Node* r = nullptr)
        : sum(s), left(l), right(r) {}
};

class PersistentSegmentTree {
private:
    vector<Node*> versions;
    int n;

    Node* build(const vector<int>& a, int l, int r) {
        if (l == r) return new Node(a[l]);

        int m = (l + r) / 2;

        Node* left = build(a, l, m);
        Node* right = build(a, m + 1, r);

        return new Node(left->sum + right->sum, left, right);
    }

    Node* update(Node* node, int l, int r,
                 int idx, int val) {

        if (l == r)
            return new Node(val);

        int m = (l + r) / 2;

        if (idx <= m) {
            Node* newLeft =
                update(node->left, l, m, idx, val);

            return new Node(
                newLeft->sum + node->right->sum,
                newLeft,
                node->right
            );
        }

        Node* newRight =
            update(node->right, m + 1, r, idx, val);

        return new Node(
            node->left->sum + newRight->sum,
            node->left,
            newRight
        );
    }

public:
    PersistentSegmentTree(const vector<int>& a) {
        n = a.size();
        versions.push_back(build(a, 0, n - 1));
    }
};