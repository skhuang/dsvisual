// The 8 symmetries of a square form the dihedral group D4 (4 rotations +
// 4 reflections). Applying any of them to a magic square is just a
// coordinate remap on the 2-D array; the magic property (every row/col/
// diagonal sums to M) is invariant under the group action.
#include <algorithm>
#include <cassert>
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
using Grid = vector<vector<int>>;

Grid siamese(int n) {
    Grid sq(n, vector<int>(n, 0));
    int row = 0, col = n / 2;
    for (int v = 1; v <= n * n; ++v) {
        sq[row][col] = v;
        int up = (row - 1 + n) % n, left = (col - 1 + n) % n;
        if (sq[up][left] != 0) row = (row + 1) % n;
        else { row = up; col = left; }
    }
    return sq;
}

// Ordered exactly like the JS OPS array, so index i below is op i.
const vector<string> OPS = { "id", "r90", "r180", "r270", "flipH", "flipV", "transpose", "antiT" };

// Forward coordinate remap: old (r,c) -> new (row,col). Matches the JS DEST table.
Grid applyOp(const Grid& square, const string& op, int n) {
    int idx = (int)(find(OPS.begin(), OPS.end(), op) - OPS.begin());
    Grid g(n, vector<int>(n, 0));
    for (int r = 0; r < n; ++r) {
        for (int c = 0; c < n; ++c) {
            int tr, tc;
            switch (idx) {
                case 0: tr = r;         tc = c;         break;  // id
                case 1: tr = c;         tc = n - 1 - r; break;  // r90
                case 2: tr = n - 1 - r; tc = n - 1 - c; break;  // r180
                case 3: tr = n - 1 - c; tc = r;         break;  // r270
                case 4: tr = r;         tc = n - 1 - c; break;  // flipH
                case 5: tr = n - 1 - r; tc = c;         break;  // flipV
                case 6: tr = c;         tc = r;         break;  // transpose
                default: tr = n - 1 - c; tc = n - 1 - r; break; // antiT
            }
            g[tr][tc] = square[r][c];
        }
    }
    return g;
}

bool isMagic(const Grid& g, int n) {
    int M = n * (n * n + 1) / 2, diag = 0, anti = 0;
    for (int i = 0; i < n; ++i) {
        int rowSum = 0, colSum = 0;
        for (int j = 0; j < n; ++j) { rowSum += g[i][j]; colSum += g[j][i]; }
        if (rowSum != M || colSum != M) return false;
        diag += g[i][i]; anti += g[i][n - 1 - i];
    }
    return diag == M && anti == M;
}

void printGrid(const Grid& g) {
    for (const auto& row : g) {
        for (int v : row) cout << setw(3) << v;
        cout << "\n";
    }
}

int main() {
    int n = 5;  // n must be odd.
    Grid square = siamese(n);
    assert(isMagic(square, n));
    int magicSum = n * (n * n + 1) / 2;

    cout << "Original Siamese magic square (n=" << n << ", magic sum=" << magicSum << "):\n";
    printGrid(square);

    // Apply all 8 elements of D4 (the orbit of the square under the group
    // action) and confirm the magic property is invariant under each one.
    for (const auto& op : OPS) {
        Grid transformed = applyOp(square, op, n);
        bool stillMagic = isMagic(transformed, n);
        assert(stillMagic);  // magic sum is invariant under the D4 action
        cout << "\n-- op: " << op << "  (still magic: " << (stillMagic ? "yes" : "NO") << ") --\n";
        printGrid(transformed);
    }

    cout << "\nMagic sum = " << magicSum
         << " (still magic after all 8 D4 symmetries: id, r90, r180, r270, "
         << "flipH, flipV, transpose, antiT)\n";
}
