#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>

using namespace std;

class HopcroftKarp {
private:
    int n, m; 
    vector<vector<int>> adj;
    vector<int> pairU, pairV, dist;
    const int INF = 1e9;

    bool bfs() {
        queue<int> q;
        for (int u = 1; u <= n; ++u) {
            if (pairU[u] == 0) {
                dist[u] = 0;
                q.push(u);
            } else {
                dist[u] = INF;
            }
        }
        int dis = INF;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            if (dist[u] < dis) {
                for (int v : adj[u]) {
                    if (pairV[v] == 0) {
                        dis = dist[u] + 1;
                    } else if (dist[pairV[v]] == INF) {
                        dist[pairV[v]] = dist[u] + 1;
                        q.push(pairV[v]);
                    }
                }
            }
        }
        return dis != INF;
    }

    bool dfs(int u) {
        for (int v : adj[u]) {
            if (pairV[v] == 0 || (dist[pairV[v]] == dist[u] + 1 && dfs(pairV[v]))) {
                pairU[u] = v;
                pairV[v] = u;
                return true;
            }
        }
        dist[u] = INF;
        return false;
    }

public:
    HopcroftKarp(int n, int m) : n(n), m(m), adj(n + 1), pairU(n + 1, 0), pairV(m + 1, 0), dist(n + 1, 0) {}

    void addEdge(int u, int v) {
        adj[u].push_back(v);
    }

    int maxMatching() {
        int matching = 0;
        while (bfs()) {
            for (int u = 1; u <= n; ++u) {
                if (pairU[u] == 0 && dfs(u)) {
                    matching++;
                }
            }
        }
        return matching;
    }
};

int main() {
    HopcroftKarp hk(3, 3);
    hk.addEdge(1, 1);
    hk.addEdge(2, 2);
    hk.addEdge(3, 3);

    cout << "Max Matching: " << hk.maxMatching() << endl;
    return 0;
}