#include <iostream>
#include <vector>
using namespace std;

class Graph {
private:
    int numVertices;
    vector<vector<int>> adjList;

public:
    Graph(int vertices) {
        numVertices = vertices;
        adjList.resize(vertices);
    }

    void addEdge(int src, int dest) {
        if (src >= numVertices || dest >= numVertices || src < 0 || dest < 0) {
            cout << "Invalid vertex!" << endl;
            return;
        }
        // Add edge from src to dest
        adjList[src].push_back(dest);
        // Add edge from dest to src
        adjList[dest].push_back(src);
        cout << "Added edge between " << src << " and " << dest << endl;
    }

    void printGraph() {
        for (int i = 0; i < numVertices; ++i) {
            cout << "Vertex " << i << ":";
            for (auto node : adjList[i]) {
                cout << " -> " << node;
            }
            cout << endl;
        }
    }
};

int main() {
    // A graph with 5 vertices
    Graph g(5);
    g.addEdge(0, 1);
    g.addEdge(0, 4);
    g.addEdge(1, 2);
    g.addEdge(1, 3);
    g.addEdge(1, 4);
    g.addEdge(2, 3);
    g.addEdge(3, 4);

    g.printGraph();
    return 0;
}
