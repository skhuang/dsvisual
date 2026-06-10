#include <vector>
#include <limits>

// Optimal Binary Search Tree via dynamic programming.
// keys sorted ascending; freq[i] = access frequency of keys[i].
// cost[i][j] = min weighted path length for the subrange keys[i..j].
int optimalBST(const std::vector<int>& freq) {
    int n = (int)freq.size();
    std::vector<std::vector<int>> cost(n, std::vector<int>(n, 0));
    std::vector<std::vector<int>> w(n, std::vector<int>(n, 0));
    for (int i = 0; i < n; i++) { cost[i][i] = freq[i]; w[i][i] = freq[i]; }
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            w[i][j] = w[i][j - 1] + freq[j];
            cost[i][j] = std::numeric_limits<int>::max();
            for (int r = i; r <= j; r++) {
                int left = (r > i) ? cost[i][r - 1] : 0;
                int right = (r < j) ? cost[r + 1][j] : 0;
                int c = left + right + w[i][j];
                if (c < cost[i][j]) cost[i][j] = c;
            }
        }
    }
    return n ? cost[0][n - 1] : 0;
}
