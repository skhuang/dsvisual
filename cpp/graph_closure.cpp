#include <iostream>
using namespace std;

const int MAXN = 10;

// Warshall's transitive closure: R[i][j] = 1 iff j is reachable from i via >= 1 edge.
// R is initialized to the adjacency matrix; R[i][i] becomes 1 only if i lies on a cycle.
void warshall(int R[MAXN][MAXN], int n) {
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (R[i][k] && R[k][j])
                    R[i][j] = 1;
}

int main() {
    int n = 4;                    // SAMPLE: 0->1, 1->2, 2->3, 3->1 (chain + cycle 1-2-3)
    int R[MAXN][MAXN] = {};
    R[0][1] = R[1][2] = R[2][3] = R[3][1] = 1;

    warshall(R, n);

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++)
            cout << R[i][j] << (j + 1 < n ? " " : "");
        cout << "\n";
    }
    return 0;
}
