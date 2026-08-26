#include <iostream>
#include <memory>
#include <vector>

// A persistent segment tree never mutates an existing node. Every update
// walks root-to-leaf and allocates a NEW node for each node on that path
// (O(log n) allocations); every node NOT on the path is shared, unchanged,
// with the previous version. Each update therefore returns a new root while
// every earlier root remains valid and queryable forever.
struct Node {
    int sum;
    std::shared_ptr<Node> left, right;
    Node(int s, std::shared_ptr<Node> l, std::shared_ptr<Node> r)
        : sum(s), left(std::move(l)), right(std::move(r)) {}
};
using NodePtr = std::shared_ptr<Node>;

NodePtr build(const std::vector<int>& arr, int l, int r) {
    if (l == r) return std::make_shared<Node>(arr[l], nullptr, nullptr);
    int mid = (l + r) / 2;
    NodePtr left = build(arr, l, mid);
    NodePtr right = build(arr, mid + 1, r);
    return std::make_shared<Node>(left->sum + right->sum, left, right);
}

// Returns the root of a NEW version with arr[index] = value; `prev` (and every
// node it can still reach) is left completely untouched.
NodePtr update(const NodePtr& prev, int l, int r, int index, int value) {
    if (l == r) return std::make_shared<Node>(value, nullptr, nullptr);
    int mid = (l + r) / 2;
    if (index <= mid) {
        NodePtr newLeft = update(prev->left, l, mid, index, value);
        // prev->right is reused as-is: no allocation, no mutation.
        return std::make_shared<Node>(newLeft->sum + prev->right->sum, newLeft, prev->right);
    }
    NodePtr newRight = update(prev->right, mid + 1, r, index, value);
    return std::make_shared<Node>(prev->left->sum + newRight->sum, prev->left, newRight);
}

int query(const NodePtr& node, int l, int r, int ql, int qr) {
    if (qr < l || r < ql) return 0;                 // disjoint
    if (ql <= l && r <= qr) return node->sum;        // fully covered
    int mid = (l + r) / 2;                           // partial: recurse
    return query(node->left, l, mid, ql, qr) + query(node->right, mid + 1, r, ql, qr);
}

int main() {
    std::vector<int> arr = {5, 8, 6, 3, 2, 7, 2, 6};
    int n = static_cast<int>(arr.size());

    std::vector<NodePtr> roots;
    roots.push_back(build(arr, 0, n - 1));           // version 0

    roots.push_back(update(roots[0], 0, n - 1, 1, 20)); // version 1: index 1 -> 20
    roots.push_back(update(roots[1], 0, n - 1, 4, 9));  // version 2: index 4 -> 9

    // v0 is still exactly as it was — persistence in action.
    std::cout << "sum[2,5] on v0 = " << query(roots[0], 0, n - 1, 2, 5) << '\n';
    std::cout << "sum[2,5] on v2 = " << query(roots[2], 0, n - 1, 2, 5) << '\n';
    return 0;
}
