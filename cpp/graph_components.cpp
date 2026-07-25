#include <iostream>
#include <queue>
#include <vector>
using namespace std;

const int MAXN = 10;

class Graph {
    int n;
    vector<int> adj[MAXN];

public:
    Graph(int v) : n(v) {}

    // Undirected edge.
    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // BFS flood-fill (COMP): from the lowest unlabelled vertex, label its whole
    // connected component, then repeat. Fills comp[] and returns the count.
    int connectedComponents(int comp[]) {
        for (int i = 0; i < n; i++)
            comp[i] = -1;
        int k = 0;
        for (int s = 0; s < n; s++) {
            if (comp[s] != -1)
                continue;
            queue<int> q;
            q.push(s);
            comp[s] = k;
            while (!q.empty()) {
                int v = q.front();
                q.pop();
                for (int w : adj[v])
                    if (comp[w] == -1) {
                        comp[w] = k;
                        q.push(w);
                    }
            }
            k++;
        }
        return k;
    }
};

int main() {
    Graph g(5);          // G3: two edges, one isolated vertex -> 3 components
    g.addEdge(0, 1);
    g.addEdge(2, 3);

    int comp[5];
    int k = g.connectedComponents(comp);

    cout << "components = " << k << "\n";
    for (int i = 0; i < 5; i++)
        cout << "comp[" << i << "] = " << comp[i] << "\n";
    return 0;
}
