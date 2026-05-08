#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Edge {
    int u, v, w;
};

struct DSU {
    vector<int> p, r;
    DSU(int n): p(n), r(n, 0) { for (int i = 0; i < n; i++) p[i] = i; }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (r[a] < r[b]) swap(a, b);
        p[b] = a;
        if (r[a] == r[b]) r[a]++;
        return true;
    }
};

int main() {
    int V = 5;
    vector<Edge> edges = {
        {0, 1, 4}, {0, 2, 7}, {1, 2, 1},
        {1, 3, 3}, {2, 3, 2}, {3, 4, 6}, {2, 4, 5}
    };

    sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) {
        return a.w < b.w;
    });

    DSU dsu(V);
    vector<Edge> mst;
    int totalWeight = 0;

    for (const auto& e : edges) {
        if (dsu.unite(e.u, e.v)) {
            mst.push_back(e);
            totalWeight += e.w;
            if ((int)mst.size() == V - 1) break;
        }
    }

    cout << "MST edges:\n";
    for (const auto& e : mst) {
        cout << e.u << " - " << e.v << " (w=" << e.w << ")\n";
    }
    cout << "Total weight = " << totalWeight << "\n";
    return 0;
}
