// Minimax with Alpha-Beta pruning over a game tree
#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

struct Node { int value; bool leaf; bool isMax; vector<Node*> children; };

int minimax(Node* n, int alpha, int beta, bool useAB) {
    if (n->leaf) return n->value;
    int best = n->isMax ? INT_MIN : INT_MAX;
    for (Node* c : n->children) {
        int v = minimax(c, alpha, beta, useAB);
        if (n->isMax) { best = max(best, v); alpha = max(alpha, best); }
        else          { best = min(best, v); beta  = min(beta, best); }
        if (useAB && alpha >= beta) break;
    }
    return best;
}

int main() {
    int leaves[] = {3, 5, 6, 9, 1, 2, 0, -1};
    vector<Node*> L;
    for (int v : leaves) L.push_back(new Node{v, true, false, {}});
    vector<Node*> mid;
    for (int i = 0; i < 8; i += 2) mid.push_back(new Node{0, false, false, {L[i], L[i+1]}});
    vector<Node*> upper;
    for (int i = 0; i < 4; i += 2) upper.push_back(new Node{0, false, true, {mid[i], mid[i+1]}});
    Node* root = new Node{0, false, true, {upper[0], upper[1]}};
    cout << "Minimax value: " << minimax(root, INT_MIN, INT_MAX, true) << "\n";
    return 0;
}
