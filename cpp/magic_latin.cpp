// Why the Siamese magic square works: every value splits as v = n*a + b + 1,
// and the digit planes a, b are each a Latin square (every row/col is a
// permutation of 0..n-1), so every row/col/diagonal sums to the same constant.
#include <algorithm>
#include <cassert>
#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> siamese(int n) {
    vector<vector<int>> sq(n, vector<int>(n, 0));
    int row = 0, col = n / 2;
    for (int v = 1; v <= n * n; ++v) {
        sq[row][col] = v;
        int up = (row - 1 + n) % n, left = (col - 1 + n) % n;
        if (sq[up][left] != 0) row = (row + 1) % n;
        else { row = up; col = left; }
    }
    return sq;
}

bool isPermutation(vector<int> v) {  // true iff v is a rearrangement of 0..n-1
    sort(v.begin(), v.end());
    for (int i = 0; i < (int)v.size(); ++i) if (v[i] != i) return false;
    return true;
}

void printGrid(const vector<vector<int>>& g, int n) {
    for (const auto& row : g) {
        for (int v : row) cout << setw(3) << v;
        cout << "\n";
    }
}

int main() {
    int n = 5;  // n must be odd.
    auto square = siamese(n);
    int magicSum = n * (n * n + 1) / 2;
    vector<vector<int>> a(n, vector<int>(n)), b(n, vector<int>(n));

    for (int r = 0; r < n; ++r)
        for (int c = 0; c < n; ++c) {
            int v = square[r][c];
            a[r][c] = (v - 1) / n; b[r][c] = (v - 1) % n;    // digit planes
            assert(v == n * a[r][c] + b[r][c] + 1);          // decomposition identity
        }

    cout << "Siamese magic square (n=" << n << "):\n";
    printGrid(square, n);

    cout << "\nHigh-digit plane a = (v-1)/n  [Latin square]:\n";
    printGrid(a, n);

    cout << "\nLow-digit plane  b = (v-1)%n  [Latin square]:\n";
    printGrid(b, n);

    cout << "\nDecomposition check v = n*a + b + 1 for every cell:\n";
    for (int r = 0; r < n; ++r) {
        for (int c = 0; c < n; ++c) {
            cout << square[r][c] << "=" << n << "*" << a[r][c] << "+" << b[r][c] << "+1";
            if (c + 1 < n) cout << "  ";
        }
        cout << "\n";
    }

    for (int i = 0; i < n; ++i) {
        vector<int> colA(n), colB(n);
        int rowSum = 0, colSum = 0;
        for (int k = 0; k < n; ++k) {
            colA[k] = a[k][i]; colB[k] = b[k][i];
            rowSum += square[i][k]; colSum += square[k][i];
        }
        assert(isPermutation(a[i]) && isPermutation(b[i]));  // row i: both Latin
        assert(isPermutation(colA) && isPermutation(colB));  // col i: both Latin
        assert(rowSum == magicSum && colSum == magicSum);
    }

    int diag = 0, anti = 0;
    for (int i = 0; i < n; ++i) { diag += square[i][i]; anti += square[i][n - 1 - i]; }
    assert(diag == magicSum && anti == magicSum);

    cout << "\nMagic sum = " << magicSum
         << " (every row/col/diagonal verified; a and b are Latin squares)\n";
}
