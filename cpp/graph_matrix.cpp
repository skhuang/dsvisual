#include <iostream>
using namespace std;

const int MAXN = 10;

class Graph {
    int n;
    int adj[MAXN][MAXN] = {};

public:
    Graph(int v) : n(v) {}

    // adj[u][v] = w always; for an undirected graph also mirror adj[v][u].
    void addEdge(int u, int v, int w, bool directed) {
        adj[u][v] = w;
        if (!directed)
            adj[v][u] = w;
    }

    // Out-degree: count of nonzero entries in row i.
    int outDegree(int i) const {
        int d = 0;
        for (int j = 0; j < n; j++)
            if (adj[i][j] != 0)
                d++;
        return d;
    }

    // In-degree: count of nonzero entries in column j.
    int inDegree(int j) const {
        int d = 0;
        for (int i = 0; i < n; i++)
            if (adj[i][j] != 0)
                d++;
        return d;
    }

    void print() const {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++)
                cout << adj[i][j] << " ";
            cout << "\n";
        }
    }
};

int main() {
    Graph g(5);
    bool directed = false;
    g.addEdge(0, 1, 4, directed);
    g.addEdge(0, 4, 1, directed);
    g.addEdge(1, 2, 3, directed);
    g.addEdge(1, 3, 2, directed);
    g.addEdge(1, 4, 5, directed);
    g.addEdge(2, 3, 6, directed);
    g.addEdge(3, 4, 7, directed);

    g.print();
    for (int i = 0; i < 5; i++)
        cout << "deg(" << i << ") = " << g.outDegree(i) << "\n";
    return 0;
}
