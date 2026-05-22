#include <iostream>
#include <vector>
#include <climits>
using namespace std;

// Prim's algorithm grows a minimum spanning tree one vertex at a time,
// always adding the cheapest edge that crosses out of the current tree.
int main() {
    const int V = 5;
    // adjacency matrix of an undirected weighted graph (0 = no edge)
    int w[V][V] = {
        {0, 2, 0, 6, 0},
        {2, 0, 3, 8, 5},
        {0, 3, 0, 0, 7},
        {6, 8, 0, 0, 9},
        {0, 5, 7, 9, 0},
    };
    vector<bool> inMST(V, false);
    vector<int> key(V, INT_MAX), parent(V, -1);
    key[0] = 0;

    for (int count = 0; count < V; count++) {
        int u = -1;
        for (int v = 0; v < V; v++)
            if (!inMST[v] && (u == -1 || key[v] < key[u])) u = v;
        inMST[u] = true;
        for (int v = 0; v < V; v++)
            if (w[u][v] && !inMST[v] && w[u][v] < key[v]) {
                key[v] = w[u][v];
                parent[v] = u;
            }
    }

    int total = 0;
    for (int v = 1; v < V; v++) {
        cout << "edge " << parent[v] << "-" << v << " weight " << key[v] << "\n";
        total += key[v];
    }
    cout << "MST total weight = " << total << "\n";  // 16
    return 0;
}
