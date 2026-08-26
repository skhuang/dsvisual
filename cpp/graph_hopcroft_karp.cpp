#include <iostream>
#include <vector>
#include <queue>

using namespace std;

class HopcroftKarp {
private:
    int nLeft;
    int nRight;

    vector<vector<int>> adj;

    // pairU[u] = Uu currently matched with which V
    // pairV[v] = Vv currently matched with which U
    // -1 means FREE
    vector<int> pairU;
    vector<int> pairV;

    // BFS layer of every U vertex
    vector<int> dist;

    const int INF = 1000000000;

    // Length of the shortest augmenting path
    // found by the current BFS phase
    int shortestPath;

public:
    HopcroftKarp(int leftSize, int rightSize) {
        nLeft = leftSize;
        nRight = rightSize;

        adj.resize(nLeft);

        pairU.resize(nLeft, -1);
        pairV.resize(nRight, -1);

        dist.resize(nLeft, INF);

        shortestPath = INF;
    }

    void addEdge(int u, int v) {
        if (u >= 0 && u < nLeft &&
            v >= 0 && v < nRight) {

            adj[u].push_back(v);
        }
    }

    void printGraph() {
        cout << "Bipartite Graph" << endl;

        for (int u = 0; u < nLeft; u++) {

            cout << "U" << u << ": ";

            for (int v : adj[u]) {
                cout << "V" << v << " ";
            }

            cout << endl;
        }
    }

    void printMatching() {
        cout << endl;
        cout << "Current Matching" << endl;

        for (int u = 0; u < nLeft; u++) {

            cout << "U" << u << " -> ";

            if (pairU[u] == -1) {
                cout << "FREE";
            }
            else {
                cout << "V" << pairU[u];
            }

            cout << endl;
        }
    }

    void printDistances() {
        cout << endl;
        cout << "BFS Layers" << endl;

        for (int u = 0; u < nLeft; u++) {

            cout << "U" << u << ": ";

            if (dist[u] == INF) {
                cout << "INF";
            }
            else {
                cout << dist[u];
            }

            cout << endl;
        }
    }

    bool bfs() {

        queue<int> q;

        shortestPath = INF;

        // All unmatched U vertices become BFS starting points
        for (int u = 0; u < nLeft; u++) {

            if (pairU[u] == -1) {
                dist[u] = 0;
                q.push(u);
            }
            else {
                dist[u] = INF;
            }
        }

        while (!q.empty()) {

            int u = q.front();
            q.pop();

            // No need to search deeper than the current
            // shortest augmenting path.
            if (dist[u] + 1 > shortestPath) {
                continue;
            }

            for (int v : adj[u]) {

                int matchedU = pairV[v];

                // V is FREE.
                // An augmenting path can end here.
                if (matchedU == -1) {

                    shortestPath =
                        min(shortestPath, dist[u] + 1);
                }

                // V is already matched.
                // Follow the matched edge back to another U.
                else if (
                    dist[matchedU] == INF &&
                    dist[u] + 1 < shortestPath
                ) {

                    dist[matchedU] =
                        dist[u] + 1;

                    q.push(matchedU);
                }
            }
        }

        return shortestPath != INF;
    }

    bool dfs(int u) {

        for (int v : adj[u]) {

            int matchedU = pairV[v];

            // Case 1:
            // V is FREE and this path has exactly the
            // shortest length found by BFS.
            if (
                matchedU == -1 &&
                dist[u] + 1 == shortestPath
            ) {

                pairU[u] = v;
                pairV[v] = u;

                return true;
            }

            // Case 2:
            // V is already matched.
            // Continue only if the matched U is exactly
            // one BFS layer deeper.
            if (
                matchedU != -1 &&
                dist[matchedU] == dist[u] + 1
            ) {

                if (dfs(matchedU)) {

                    pairU[u] = v;
                    pairV[v] = u;

                    return true;
                }
            }
        }

        // No augmenting path through U in this BFS phase.
        dist[u] = INF;

        return false;
    }

    int maximumMatching() {

        int matching = 0;
        int phase = 1;

        while (bfs()) {

            cout << endl;
            cout << "========== BFS Phase "
                 << phase
                 << " =========="
                 << endl;

            cout << "Shortest augmenting path length = "
                 << shortestPath
                 << endl;

            printDistances();

            // Try DFS from every currently FREE U.
            for (int u = 0; u < nLeft; u++) {

                if (pairU[u] == -1) {

                    if (dfs(u)) {

                        matching++;

                        cout << endl;
                        cout << "Augment from U"
                             << u
                             << endl;

                        cout << "Matching size = "
                             << matching
                             << endl;
                    }
                }
            }

            printMatching();

            phase++;
        }

        return matching;
    }
};

int main() {

    HopcroftKarp hk(2, 2);

    hk.addEdge(0, 0);
    hk.addEdge(0, 1);

    hk.addEdge(1, 0);

    hk.printGraph();

    hk.printMatching();

    int result = hk.maximumMatching();

    cout << endl;
    cout << "============================" << endl;

    cout << "Maximum Matching = "
         << result
         << endl;

    hk.printMatching();

    return 0;
}