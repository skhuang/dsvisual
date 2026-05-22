#include <iostream>
#include <vector>
#include <climits>
using namespace std;

// Bellman-Ford computes single-source shortest paths and tolerates
// negative edge weights, unlike Dijkstra. After V-1 relaxation passes
// the distances are final; one more pass that can still relax an edge
// proves the graph contains a negative cycle.
struct Edge {
    int u, v, w;
};

int main() {
    const int V = 5;
    // directed weighted edges, including a negative weight; no negative cycle
    vector<Edge> edges = {
        {0, 1, 6}, {0, 2, 7}, {1, 2, 8}, {1, 3, 5}, {1, 4, -4},
        {2, 3, -3}, {2, 4, 9}, {3, 1, -2}, {4, 0, 2}, {4, 3, 7},
    };
    vector<int> dist(V, INT_MAX);
    dist[0] = 0;

    for (int pass = 1; pass <= V - 1; pass++) {
        for (const Edge& e : edges) {
            if (dist[e.u] != INT_MAX && dist[e.u] + e.w < dist[e.v])
                dist[e.v] = dist[e.u] + e.w;
        }
    }

    // a V-th pass that can still relax an edge proves a negative cycle
    bool hasNegativeCycle = false;
    for (const Edge& e : edges) {
        if (dist[e.u] != INT_MAX && dist[e.u] + e.w < dist[e.v])
            hasNegativeCycle = true;
    }

    for (int v = 0; v < V; v++)
        cout << "dist[" << v << "] = " << dist[v] << "\n";
    cout << "negative cycle: " << (hasNegativeCycle ? "yes" : "no") << "\n";
    return 0;
}
