#include <iostream>
#include <vector>
using namespace std;

// A Fenwick tree (Binary Indexed Tree), 1-indexed. The expression
// i & -i isolates the lowest set bit, which is the span each slot covers.
class FenwickTree {
    int n;
    vector<long long> bit;

public:
    FenwickTree(const vector<int>& a) {
        n = a.size();
        bit.assign(n + 1, 0);
        for (int i = 0; i < n; i++)
            update(i + 1, a[i]);
    }
    // add delta at 1-indexed position i, walking up via i += i & -i
    void update(int i, long long delta) {
        for (; i <= n; i += i & -i)
            bit[i] += delta;
    }
    // sum of [1, i], walking down via i -= i & -i
    long long prefixSum(int i) {
        long long s = 0;
        for (; i > 0; i -= i & -i)
            s += bit[i];
        return s;
    }
    long long rangeSum(int l, int r) { return prefixSum(r) - prefixSum(l - 1); }
};

int main() {
    vector<int> a = {3, 2, 5, 1, 7, 4, 6, 2};
    FenwickTree ft(a);
    cout << "prefixSum(7) = " << ft.prefixSum(7) << "\n"; // 28
    ft.update(3, 5);
    cout << "after +5 at index 3, prefixSum(7) = " << ft.prefixSum(7) << "\n"; // 33
    return 0;
}
