#include <iostream>
#include <queue>
#include <vector>
using namespace std;

void bfs(const vector<vector<int>>& adj, int start) {
    int n = adj.size();
    vector<bool> visited(n, false);
    queue<int> q;
    q.push(start);
    visited[start] = true;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        cout << "Visit " << u << "\n";
        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
}

int main() {
    vector<vector<int>> adj(5);
    adj[0] = {1, 4};
    adj[1] = {0, 2, 3, 4};
    adj[2] = {1, 3};
    adj[3] = {1, 2, 4};
    adj[4] = {0, 1, 3};
    bfs(adj, 0); // expected: 0 1 4 2 3
    return 0;
}
