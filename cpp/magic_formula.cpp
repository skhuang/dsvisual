// Closed-form O(1) getValue: no n x n array is ever stored or needed.
// The Siamese/Coxeter magic square decomposes as v = n*a + b + 1 (see
// magic_latin.cpp); the two digit planes a, b turn out to be LINEAR in
// (i, j) mod n, so any single cell can be computed directly:
//   a = (i - j + (n-1)/2) mod n
//   b = (i - 2*j + (n-1)) mod n
#include <iomanip>
#include <iostream>
using namespace std;

int mod(int x, int m) { return ((x % m) + m) % m; }  // guard negative remainders

int getValue(int n, int i, int j) {
    int a = mod(i - j + (n - 1) / 2, n);
    int b = mod(i - 2 * j + (n - 1), n);
    return n * a + b + 1;
}

int main() {
    int n = 5;  // n must be odd.

    // Fill the whole square by calling getValue independently per cell —
    // no n x n array is stored; each call is O(1) time, O(1) extra space.
    cout << "Magic square from the closed-form formula (n=" << n << "):\n";
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) cout << setw(3) << getValue(n, i, j);
        cout << '\n';
    }

    // Query one arbitrary cell directly — O(1), independent of every other cell.
    int qi = 2, qj = 3;
    cout << "\nvalue(" << qi << "," << qj << ") = " << getValue(n, qi, qj) << '\n';

    // Fidelity check: no array was ever stored, yet every row, column, and
    // both diagonals must sum to the magic constant M = n*(n^2+1)/2.
    int magicSum = n * (n * n + 1) / 2;
    bool ok = true;
    for (int i = 0; i < n; ++i) {
        int rowSum = 0, colSum = 0;
        for (int j = 0; j < n; ++j) { rowSum += getValue(n, i, j); colSum += getValue(n, j, i); }
        if (rowSum != magicSum || colSum != magicSum) ok = false;
    }
    int diag = 0, anti = 0;
    for (int i = 0; i < n; ++i) { diag += getValue(n, i, i); anti += getValue(n, i, n - 1 - i); }
    if (diag != magicSum || anti != magicSum) ok = false;

    cout << "Magic sum = " << magicSum
         << "  (rows/cols/diagonals all match: " << (ok ? "yes" : "NO") << ")\n";
}
