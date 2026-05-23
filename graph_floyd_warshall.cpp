#include <iostream>
using namespace std;

// Floyd-Warshall computes all-pairs shortest paths by letting each
// vertex k in turn serve as an intermediate point on every path.
int main() {
    const int V = 4;
    const int INF = 1000000;
    // directed weighted adjacency matrix; INF means no direct edge
    int dist[V][V] = {
        {0, 3, INF, 7},
        {8, 0, 2, INF},
        {5, INF, 0, 1},
        {2, INF, INF, 0},
    };

    for (int k = 0; k < V; k++)
        for (int i = 0; i < V; i++)
            for (int j = 0; j < V; j++)
                if (dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];

    for (int i = 0; i < V; i++) {
        for (int j = 0; j < V; j++)
            cout << dist[i][j] << "\t";
        cout << "\n";
    }
    return 0;
}
