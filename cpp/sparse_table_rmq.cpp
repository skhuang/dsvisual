#include <iostream>
#include <vector>
using namespace std;

// Sparse Table for Range Minimum Query (RMQ). Static structure: no updates
// after build, but every query answers in O(1) once built.
//
// st[k][i] = min of the window a[i .. i + 2^k - 1] (length 2^k).
// Doubling: st[k][i] = min(st[k-1][i], st[k-1][i + 2^(k-1)]) — two half
// windows of length 2^(k-1) that together cover the full 2^k window.
class SparseTable {
    int n;
    vector<vector<int>> st; // st[k][i]
    vector<int> logTable;   // logTable[len] = floor(log2(len))

public:
    SparseTable(const vector<int>& a) {
        n = a.size();
        int K = 1;
        while ((1 << K) <= n) K++;
        st.assign(K, vector<int>(n));
        st[0] = a;
        for (int k = 1; k < K; k++)
            for (int i = 0; i + (1 << k) <= n; i++)
                st[k][i] = min(st[k - 1][i], st[k - 1][i + (1 << (k - 1))]);

        logTable.assign(n + 1, 0);
        for (int len = 2; len <= n; len++)
            logTable[len] = logTable[len / 2] + 1;
    }

    // Inclusive range [l, r], 0-indexed. Two overlapping windows of the same
    // power-of-two length cover [l, r]; overlap is harmless for min/max/gcd.
    int query(int l, int r) {
        int len = r - l + 1;
        int k = logTable[len];
        return min(st[k][l], st[k][r - (1 << k) + 1]);
    }
};

int main() {
    vector<int> a = {7, 2, 3, 9, 4, 6, 1, 8};
    SparseTable rmq(a);
    cout << "min[1,4] = " << rmq.query(1, 4) << "\n"; // 2
    cout << "min[3,7] = " << rmq.query(3, 7) << "\n"; // 1
    return 0;
}
