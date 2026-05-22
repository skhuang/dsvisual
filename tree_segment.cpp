#include <iostream>
#include <vector>
using namespace std;

// A segment tree over an array, aggregating range sums, with lazy
// propagation so a whole range can be updated in O(log n).
class SegmentTree {
    int n;
    vector<long long> tree, lazy;

    void build(const vector<int>& a, int node, int lo, int hi) {
        if (lo == hi) { tree[node] = a[lo]; return; }
        int mid = (lo + hi) / 2;
        build(a, 2 * node, lo, mid);
        build(a, 2 * node + 1, mid + 1, hi);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    void applyLazy(int node, int lo, int hi, long long val) {
        tree[node] += (long long)(hi - lo + 1) * val;
        lazy[node] += val;
    }
    void pushDown(int node, int lo, int hi) {
        if (lazy[node] == 0) return;
        int mid = (lo + hi) / 2;
        applyLazy(2 * node, lo, mid, lazy[node]);
        applyLazy(2 * node + 1, mid + 1, hi, lazy[node]);
        lazy[node] = 0;
    }
    void update(int node, int lo, int hi, int ql, int qr, long long val) {
        if (qr < lo || hi < ql) return;
        if (ql <= lo && hi <= qr) { applyLazy(node, lo, hi, val); return; }
        pushDown(node, lo, hi);
        int mid = (lo + hi) / 2;
        update(2 * node, lo, mid, ql, qr, val);
        update(2 * node + 1, mid + 1, hi, ql, qr, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    long long query(int node, int lo, int hi, int ql, int qr) {
        if (qr < lo || hi < ql) return 0;
        if (ql <= lo && hi <= qr) return tree[node];
        pushDown(node, lo, hi);
        int mid = (lo + hi) / 2;
        return query(2 * node, lo, mid, ql, qr) +
               query(2 * node + 1, mid + 1, hi, ql, qr);
    }

public:
    SegmentTree(const vector<int>& a) {
        n = a.size();
        tree.assign(4 * n, 0);
        lazy.assign(4 * n, 0);
        build(a, 1, 0, n - 1);
    }
    void rangeUpdate(int l, int r, long long val) { update(1, 0, n - 1, l, r, val); }
    long long rangeQuery(int l, int r) { return query(1, 0, n - 1, l, r); }
};

int main() {
    vector<int> a = {5, 8, 6, 3, 2, 7, 2, 6};
    SegmentTree st(a);
    cout << "sum[2,5] = " << st.rangeQuery(2, 5) << "\n";          // 18
    st.rangeUpdate(1, 4, 3);
    cout << "after +3 on [1,4], sum[2,5] = " << st.rangeQuery(2, 5) << "\n";  // 27
    return 0;
}
