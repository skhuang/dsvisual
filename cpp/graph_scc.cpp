#include <iostream>
#include <vector>
#include <stack>
using namespace std;

const int MAXN = 10;

// Kosaraju's algorithm: DFS on G pushing vertices by finish time, then DFS on the
// transpose G^T popping in reverse finish order — each tree is one SCC.
int n;
vector<int> adj[MAXN], radj[MAXN];
bool visited[MAXN];
int comp[MAXN];

void dfs1(int u, stack<int>& order) {
    visited[u] = true;
    for (int w : adj[u])
        if (!visited[w]) dfs1(w, order);
    order.push(u);                 // finished
}

void dfs2(int u, int cid) {
    comp[u] = cid;
    for (int w : radj[u])
        if (comp[w] == -1) dfs2(w, cid);
}

int main() {
    n = 6;                         // SAMPLE: 0->1,1->2,2->0, 2->3, 3->4,4->3, 4->5
    int E[][2] = {{0,1},{1,2},{2,0},{2,3},{3,4},{4,3},{4,5}};
    for (auto& e : E) { adj[e[0]].push_back(e[1]); radj[e[1]].push_back(e[0]); }

    stack<int> order;
    for (int i = 0; i < n; i++) if (!visited[i]) dfs1(i, order);

    for (int i = 0; i < n; i++) comp[i] = -1;
    int scc = 0;
    while (!order.empty()) {
        int v = order.top(); order.pop();
        if (comp[v] == -1) dfs2(v, scc++);
    }

    cout << scc << " SCC(s)\n";
    for (int c = 0; c < scc; c++) {
        cout << "SCC " << c << ":";
        for (int i = 0; i < n; i++) if (comp[i] == c) cout << " " << i;
        cout << "\n";
    }
    return 0;
}
