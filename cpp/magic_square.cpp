// Odd-order magic square using Coxeter's rule (Siamese method).
// Start in the middle of the top row. Move up-right with wraparound;
// if the target cell is occupied, move one cell down from the current cell.

#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> magicSquare(int n) {
    vector<vector<int>> square(n, vector<int>(n, 0));
    int row = 0;
    int col = n / 2;

    for (int value = 1; value <= n * n; ++value) {
        square[row][col] = value;

        int up = (row - 1 + n) % n;
        int right = (col + 1) % n;

        if (square[up][right] != 0) {
            row = (row + 1) % n;
        } else {
            row = up;
            col = right;
        }
    }

    return square;
}

int main() {
    int n = 5;  // n must be odd.
    auto square = magicSquare(n);
    int magicSum = n * (n * n + 1) / 2;

    cout << "Magic sum = " << magicSum << "\n";
    for (const auto& row : square) {
        for (int value : row) cout << setw(3) << value;
        cout << "\n";
    }
}
