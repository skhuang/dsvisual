// Euler trail / circuit on an undirected graph — Hierholzer's algorithm.
//
// Euler's theorem (Konigsberg, 1736):
//   * an Euler circuit exists  <=>  the edges are connected and EVERY degree is even;
//   * an Euler path exists     <=>  the edges are connected and EXACTLY TWO degrees are odd
//                                   (the walk must start at one odd vertex and end at the other).
//
// Parallel edges matter — Konigsberg has two bridges between the same pair of
// banks — so edges are stored by id, not as a set of vertex pairs.
#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

struct Graph {
    int n;
    std::vector<std::pair<int, int>> edges;          // edge id -> its two endpoints
    std::vector<std::vector<std::pair<int, int>>> adj;  // v -> list of (neighbour, edge id)

    explicit Graph(int vertices) : n(vertices), adj(vertices) {}

    void addEdge(int u, int v) {
        int id = static_cast<int>(edges.size());
        edges.push_back({u, v});
        adj[u].push_back({v, id});
        adj[v].push_back({u, id});
    }

    std::vector<int> degrees() const {
        std::vector<int> deg(n, 0);
        for (const auto& e : edges) { ++deg[e.first]; ++deg[e.second]; }
        return deg;
    }

    // Only vertices that carry an edge have to be connected; isolated vertices
    // can never appear in a trail.
    bool edgesConnected() const {
        std::vector<int> deg = degrees();
        int seed = -1;
        for (int v = 0; v < n; ++v) if (deg[v] > 0) { seed = v; break; }
        if (seed < 0) return true;                    // no edges at all
        std::vector<bool> seen(n, false);
        std::vector<int> stack{seed};
        seen[seed] = true;
        while (!stack.empty()) {
            int u = stack.back(); stack.pop_back();
            for (const auto& link : adj[u])
                if (!seen[link.first]) { seen[link.first] = true; stack.push_back(link.first); }
        }
        for (int v = 0; v < n; ++v) if (deg[v] > 0 && !seen[v]) return false;
        return true;
    }
};

// Returns "circuit", "path", or "none"; `oddVertices` receives the odd-degree list.
std::string classify(const Graph& g, std::vector<int>& oddVertices) {
    std::vector<int> deg = g.degrees();
    oddVertices.clear();
    for (int v = 0; v < g.n; ++v) if (deg[v] % 2 == 1) oddVertices.push_back(v);
    if (g.edges.empty() || !g.edgesConnected()) return "none";
    if (oddVertices.empty()) return "circuit";
    if (oddVertices.size() == 2) return "path";
    return "none";                                    // 4 odd vertices in Konigsberg
}

// Hierholzer: walk until stuck, pop the dead end onto the output, resume from
// the vertex below it. `cursor[v]` never rewinds, so every edge is examined a
// constant number of times overall — O(V + E).
std::vector<int> hierholzer(const Graph& g, int start) {
    std::vector<bool> used(g.edges.size(), false);
    std::vector<std::size_t> cursor(g.n, 0);
    std::vector<int> stack{start}, out;
    while (!stack.empty()) {
        int v = stack.back();
        while (cursor[v] < g.adj[v].size() && used[g.adj[v][cursor[v]].second]) ++cursor[v];
        if (cursor[v] < g.adj[v].size()) {            // an unused edge remains: walk it
            auto link = g.adj[v][cursor[v]++];
            used[link.second] = true;
            stack.push_back(link.first);
        } else {                                      // stuck: this vertex is finished
            out.push_back(v);
            stack.pop_back();
        }
    }
    std::reverse(out.begin(), out.end());             // the output list is built backwards
    return out;
}

int main() {
    Graph g(5);                                       // all degrees even -> Euler circuit
    g.addEdge(0, 1); g.addEdge(1, 2); g.addEdge(2, 0);
    g.addEdge(2, 3); g.addEdge(3, 4); g.addEdge(4, 2);

    std::vector<int> odd;
    std::string verdict = classify(g, odd);
    std::cout << "verdict: " << verdict << "  odd vertices: " << odd.size() << "\n";
    if (verdict != "none") {
        int start = (verdict == "path") ? odd[0] : 0;
        std::vector<int> trail = hierholzer(g, start);
        for (std::size_t i = 0; i < trail.size(); ++i)
            std::cout << (i ? " -> " : "") << trail[i];
        std::cout << "\n";                            // 0 -> 1 -> 2 -> 3 -> 4 -> 2 -> 0
    }

    Graph bridges(4);                                 // Konigsberg: seven bridges
    bridges.addEdge(0, 2); bridges.addEdge(0, 2); bridges.addEdge(0, 3);
    bridges.addEdge(1, 2); bridges.addEdge(1, 2); bridges.addEdge(1, 3);
    bridges.addEdge(2, 3);
    std::cout << "konigsberg: " << classify(bridges, odd)
              << " (" << odd.size() << " odd vertices)\n";   // none (4 odd vertices)
    return 0;
}
