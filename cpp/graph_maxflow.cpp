#include <algorithm>
#include <iostream>
#include <limits>
#include <queue>
#include <vector>

using Matrix = std::vector<std::vector<int>>;

// Edmonds-Karp repeatedly uses BFS to choose a shortest augmenting path in the
// residual graph. The reverse residual edge lets a later path undo an earlier
// routing decision.
int edmondsKarp(const Matrix& capacity, int source, int sink) {
    const int n = static_cast<int>(capacity.size());
    Matrix residual = capacity;
    std::vector<std::vector<int>> adjacency(n);
    for (int u = 0; u < n; ++u) {
        for (int v = u + 1; v < n; ++v) {
            if (capacity[u][v] > 0 || capacity[v][u] > 0) {
                // Keep the reverse neighbour even if it has no original
                // capacity: augmentation may create that residual edge.
                adjacency[u].push_back(v);
                adjacency[v].push_back(u);
            }
        }
    }
    int maximumFlow = 0;

    while (true) {
        std::vector<int> parent(n, -1);
        std::queue<int> frontier;
        frontier.push(source);
        parent[source] = source;

        while (!frontier.empty() && parent[sink] == -1) {
            int u = frontier.front();
            frontier.pop();
            for (int v : adjacency[u]) {
                if (parent[v] == -1 && residual[u][v] > 0) {
                    parent[v] = u;
                    frontier.push(v);
                }
            }
        }
        if (parent[sink] == -1)
            break;

        int bottleneck = std::numeric_limits<int>::max();
        for (int v = sink; v != source; v = parent[v]) {
            bottleneck = std::min(bottleneck, residual[parent[v]][v]);
        }
        for (int v = sink; v != source; v = parent[v]) {
            int u = parent[v];
            residual[u][v] -= bottleneck;
            residual[v][u] += bottleneck;
        }
        maximumFlow += bottleneck;
    }
    return maximumFlow;
}

int main() {
    Matrix capacity(6, std::vector<int>(6, 0));
    const int edges[][3] = {
        {0, 1, 16}, {0, 2, 13}, {1, 2, 10}, {2, 1, 4},  {1, 3, 12},
        {3, 2, 9},  {2, 4, 14}, {4, 3, 7},  {3, 5, 20}, {4, 5, 4},
    };
    for (const auto& edge : edges)
        capacity[edge[0]][edge[1]] += edge[2];
    std::cout << "maximum flow = " << edmondsKarp(capacity, 0, 5) << '\n';
    return 0;
}
