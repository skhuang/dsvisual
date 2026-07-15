// Sparse matrix as an orthogonal (row + column) linked list, with transpose.
#include <iostream>
#include <vector>
using namespace std;

struct Node { int row, col, val; Node* right; Node* down; };

int main() {
    int R = 3, C = 4;
    int g[3][4] = {{0,0,3,0},{5,0,0,0},{0,2,0,4}};
    vector<Node*> rowHead(R, nullptr), rowTail(R, nullptr);
    vector<Node*> colHead(C, nullptr), colTail(C, nullptr);

    for (int i = 0; i < R; ++i)
        for (int j = 0; j < C; ++j)
            if (g[i][j] != 0) {
                Node* n = new Node{i, j, g[i][j], nullptr, nullptr};
                if (!rowHead[i]) rowHead[i] = n; else rowTail[i]->right = n; rowTail[i] = n;
                if (!colHead[j]) colHead[j] = n; else colTail[j]->down = n;  colTail[j] = n;
            }

    cout << "Row lists:\n";
    for (int i = 0; i < R; ++i) {
        cout << "  r" << i << ":";
        for (Node* p = rowHead[i]; p; p = p->right) cout << " (" << p->col << "," << p->val << ")";
        cout << "\n";
    }
    cout << "Transpose row lists (former columns):\n";
    for (int j = 0; j < C; ++j) {
        cout << "  r" << j << ":";
        for (Node* p = colHead[j]; p; p = p->down) cout << " (" << p->row << "," << p->val << ")";
        cout << "\n";
    }
    return 0;
}
