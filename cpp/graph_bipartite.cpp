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

    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // BFS 2-colouring. Fills color[] with 0/1; returns true iff the graph is
    // bipartite (no edge joins two same-coloured vertices, i.e. no odd cycle).
    bool isBipartite(int color[]) {
        for (int i = 0; i < n; i++)
            color[i] = -1;
        for (int s = 0; s < n; s++) {
            if (color[s] != -1)
                continue;
            queue<int> q;
            q.push(s);
            color[s] = 0;
            while (!q.empty()) {
                int v = q.front();
                q.pop();
                for (int w : adj[v]) {
                    if (color[w] == -1) {
                        color[w] = 1 - color[v];
                        q.push(w);
                    } else if (color[w] == color[v]) {
                        return false; // odd cycle
                    }
                }
            }
        }
        return true;
    }
};

int main() {
    Graph g(6);          // C6: an even cycle -> bipartite
    g.addEdge(0, 1);
    g.addEdge(1, 2);
    g.addEdge(2, 3);
    g.addEdge(3, 4);
    g.addEdge(4, 5);
    g.addEdge(5, 0);

    int color[6];
    bool ok = g.isBipartite(color);
    cout << "bipartite = " << (ok ? "true" : "false") << "\n";
    if (ok)
        for (int i = 0; i < 6; i++)
            cout << "color[" << i << "] = " << color[i] << "\n";
    return 0;
}
