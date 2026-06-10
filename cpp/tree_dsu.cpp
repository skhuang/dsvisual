#include <iostream>
#include <vector>
using namespace std;

struct DSU {
    vector<int> p, r;
    DSU(int n) : p(n), r(n, 0) {
        for (int i = 0; i < n; i++)
            p[i] = i;
    }
    int find(int x) {
        return p[x] == x ? x : p[x] = find(p[x]); // path compression
    }
    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b)
            return false;
        if (r[a] < r[b])
            swap(a, b);
        p[b] = a; // union by rank
        if (r[a] == r[b])
            r[a]++;
        return true;
    }
};

int main() {
    DSU d(8);
    d.unite(0, 1);
    d.unite(2, 3);
    d.unite(4, 5);
    d.unite(6, 7);
    d.unite(0, 2); // merges {0,1} U {2,3}
    d.unite(4, 6); // merges {4,5} U {6,7}
    d.unite(0, 4); // merges all
    cout << "find(7) = " << d.find(7) << "\n";
    cout << "rank[0] = " << d.r[d.find(0)] << "\n";
    return 0;
}
