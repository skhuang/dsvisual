#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int main() {
    int V = 5;
    vector<vector<int>> adj(V);
    vector<int> inDegree(V, 0);
    
    // Build directed acyclic graph (DAG)
    vector<pair<int,int>> edges = {
        {0, 1}, {0, 2}, 
        {1, 2}, {1, 3}, 
        {2, 3}, 
        {3, 4}
    };
    
    cout << "Building DAG with edges:\n";
    for (auto [u, v] : edges) {
        cout << u << " → " << v << "\n";
        adj[u].push_back(v);
        inDegree[v]++;
    }
    cout << "\n";
    
    // Kahn's Algorithm (BFS-based topological sort)
    queue<int> q;
    
    cout << "In-degrees: ";
    for (int i = 0; i < V; i++) {
        cout << i << ":" << inDegree[i] << " ";
        if (inDegree[i] == 0) {
            q.push(i);
        }
    }
    cout << "\n\n";
    
    vector<int> topoOrder;
    cout << "Processing:\n";
    
    while (!q.empty()) {
        int u = q.front(); 
        q.pop();
        topoOrder.push_back(u);
        
        cout << "Visit node " << u << "\n";
        
        // Reduce in-degree for all neighbors
        for (int v : adj[u]) {
            inDegree[v]--;
            cout << "  Reduce in-degree of " << v << " to " << inDegree[v] << "\n";
            
            if (inDegree[v] == 0) {
                cout << "  Node " << v << " now has in-degree 0, add to queue\n";
                q.push(v);
            }
        }
        cout << "\n";
    }
    
    cout << "\n";
    
    // Check for cycle
    if ((int)topoOrder.size() != V) {
        cout << "ERROR: Cycle detected in graph!\n";
        cout << "Only " << topoOrder.size() << " nodes processed out of " << V << "\n";
    } else {
        cout << "Topological Sort (Kahn's Algorithm):\n";
        cout << "====================================\n";
        for (int i = 0; i < (int)topoOrder.size(); i++) {
            cout << topoOrder[i];
            if (i < (int)topoOrder.size() - 1) cout << " → ";
        }
        cout << "\n";
    }
    
    return 0;
}
