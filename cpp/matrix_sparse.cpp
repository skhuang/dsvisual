#include <vector>

// Sparse matrix as (row, col, value) triples, then FAST_TRANSPOSE in O(cols + terms).
struct Triple { int r, c, v; };

std::vector<Triple> fastTranspose(const std::vector<Triple>& a, int rows, int cols) {
    std::vector<Triple> b(a.size());
    std::vector<int> rowSize(cols, 0), startPos(cols, 0);
    for (const auto& t : a) rowSize[t.c]++;
    for (int c = 1; c < cols; c++) startPos[c] = startPos[c - 1] + rowSize[c - 1];
    for (const auto& t : a) {
        int dst = startPos[t.c]++;
        b[dst] = { t.c, t.r, t.v };
    }
    (void)rows;
    return b;
}
