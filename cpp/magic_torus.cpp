// Siamese magic square, viewed as a walk on a torus: the board wraps mod n,
// so "up-left" is the step vector (-1, -1) and, when blocked, "down" is the
// break vector (+1, 0). On a 3n x 3n tiling of the board (9 copies), a run of
// consecutive up-left steps never wraps: it is one straight diagonal that
// simply crosses a tile border. A break re-anchors the walk to the center
// tile and starts the next straight diagonal.
#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n = 5;  // n must be odd.
    vector<vector<int>> sq(n, vector<int>(n, 0));
    int row = 0, col = n / 2;
    int runs = 1, breaks = 0;

    for (int v = 1; v <= n * n; ++v) {
        sq[row][col] = v;
        if (v == n * n) break;

        // Toroidal wrap: indices are taken mod n, so stepping "up" from row 0
        // wraps to row n-1, and stepping "left" from col 0 wraps to col n-1.
        int up = (row - 1 + n) % n;    // step vector (-1, -1), wrapped mod n
        int left = (col - 1 + n) % n;

        if (sq[up][left] != 0) {
            row = (row + 1) % n;       // break vector (+1, 0): up-left is occupied
            ++breaks;
            ++runs;                    // a break starts a new straight diagonal
        } else {
            row = up;
            col = left;                // run continues: one more up-left step (wraps on the torus)
        }
    }

    cout << "Filled square (n=" << n << ", toroidal Siamese walk):\n";
    for (const auto& r : sq) {
        for (int v : r) cout << setw(3) << v;
        cout << "\n";
    }

    int magicSum = n * (n * n + 1) / 2;
    cout << "\nn=" << n << "  magic sum=" << magicSum
         << "  runs=" << runs << "  breaks=" << breaks << "\n";
    // runs == n and breaks == n-1: each run tiles to one straight diagonal on
    // the 3n x 3n plane (indices wrap mod n on the torus); each break
    // re-anchors the walk to the center tile.
}
