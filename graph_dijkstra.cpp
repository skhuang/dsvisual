#include <iostream>
#include <vector>
#include <queue>
#include <limits>
using namespace std;

const int INF = 1e9;

int main() {
    int V = 5;
    vector<vector<pair<int,int>>> adj(V); // adjacency list: {neighbor, weight}
    
    // Build undirected weighted graph
    auto addEdge = [&](int u, int v, int w) {
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    };
    
    addEdge(0, 1, 4);
    addEdge(0, 2, 1);
    addEdge(1, 2, 2);
    addEdge(1, 3, 3);
    addEdge(2, 3, 1);
    addEdge(3, 4, 3);
    addEdge(2, 4, 5);
    
    int source = 0;
    vector<int> dist(V, INF);
    vector<bool> visited(V, false);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;
    
    dist[source] = 0;
    pq.push({0, source});
    
    cout << "Dijkstra's Shortest Path from node " << source << ":\n";
    cout << "======================================\n\n";
    
    while (!pq.empty()) {
        auto [d, u] = pq.top(); 
        pq.pop();
        
        if (visited[u]) continue;
        visited[u] = true;
        
        cout << "Processing node " << u << " (distance = " << d << ")\n";
        
        for (auto [v, w] : adj[u]) {
            if (!visited[v]) {
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.push({dist[v], v});
                    cout << "  Updated distance to node " << v << ": " << dist[v] << "\n";
                }
            }
        }
        cout << "\n";
    }
    
    cout << "Final shortest distances from node " << source << ":\n";
    for (int i = 0; i < V; i++) {
        cout << "Node " << i << ": ";
        if (dist[i] == INF) {
            cout << "INF (unreachable)\n";
        } else {
            cout << dist[i] << "\n";
        }
    }
    
    return 0;
}
