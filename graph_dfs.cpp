#include <iostream>
#include <stack>
#include <vector>
using namespace std;

void dfsRecursive(const vector<vector<int>>& adj, int u, vector<bool>& visited) {
    visited[u] = true;
    cout << "Visit " << u << "\n";
    for (int v : adj[u]) {
        if (!visited[v])
            dfsRecursive(adj, v, visited);
    }
}

void dfsIterative(const vector<vector<int>>& adj, int start) {
    int n = adj.size();
    vector<bool> visited(n, false);
    stack<int> s;
    s.push(start);
    while (!s.empty()) {
        int u = s.top();
        s.pop();
        if (visited[u])
            continue;
        visited[u] = true;
        cout << "Visit " << u << "\n";
        // push in reverse so smallest neighbor is popped first
        for (auto it = adj[u].rbegin(); it != adj[u].rend(); ++it) {
            if (!visited[*it])
                s.push(*it);
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
    vector<bool> visited(5, false);
    dfsRecursive(adj, 0, visited); // expected: 0 1 2 3 4
    return 0;
}
