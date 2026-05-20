#include <iostream>
#include <queue>
#include <stack>
#include <vector>
using namespace std;

vector<int> bfsOrder(const vector<vector<int>>& adj, int start) {
    int n = adj.size();
    vector<bool> visited(n, false);
    vector<int> order;
    queue<int> q;
    q.push(start);
    visited[start] = true;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
    return order;
}

vector<int> dfsOrder(const vector<vector<int>>& adj, int start) {
    int n = adj.size();
    vector<bool> visited(n, false);
    vector<int> order;
    stack<int> s;
    s.push(start);
    while (!s.empty()) {
        int u = s.top();
        s.pop();
        if (visited[u])
            continue;
        visited[u] = true;
        order.push_back(u);
        for (auto it = adj[u].rbegin(); it != adj[u].rend(); ++it) {
            if (!visited[*it])
                s.push(*it);
        }
    }
    return order;
}

int main() {
    vector<vector<int>> adj(5);
    adj[0] = {1, 4};
    adj[1] = {0, 2, 3, 4};
    adj[2] = {1, 3};
    adj[3] = {1, 2, 4};
    adj[4] = {0, 1, 3};
    cout << "BFS from 0:";
    for (int x : bfsOrder(adj, 0))
        cout << " " << x;
    cout << "\nDFS from 0:";
    for (int x : dfsOrder(adj, 0))
        cout << " " << x;
    cout << "\n";
    return 0;
}
