#include <iostream>
#include <list>
#include <vector>
using namespace std;

class Graph {
    int V;
    vector<list<int>> adj;

public:
    Graph(int v) : V(v), adj(v) {}

    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u); // undirected
    }

    void print() const {
        for (int i = 0; i < V; i++) {
            cout << "[" << i << "] -> ";
            for (int n : adj[i])
                cout << n << " -> ";
            cout << "null\n";
        }
    }
};

int main() {
    Graph g(5);
    g.addEdge(0, 1);
    g.addEdge(0, 4);
    g.addEdge(1, 2);
    g.addEdge(1, 3);
    g.addEdge(1, 4);
    g.addEdge(2, 3);
    g.addEdge(3, 4);
    g.print();
    return 0;
}
