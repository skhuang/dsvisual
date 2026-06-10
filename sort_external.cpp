#include <vector>
#include <queue>
#include <algorithm>

// External merge sort (in-memory model): generate sorted runs of size M,
// then k-way merge them with a min-heap (a practical stand-in for a
// selection/loser tree).
std::vector<int> externalSort(std::vector<int> data, int M) {
    std::vector<std::vector<int>> runs;
    for (size_t i = 0; i < data.size(); i += M) {
        std::vector<int> run(data.begin() + i, data.begin() + std::min(data.size(), i + (size_t)M));
        std::sort(run.begin(), run.end());
        runs.push_back(run);
    }
    using Item = std::tuple<int, int, int>;
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> pq;
    for (int r = 0; r < (int)runs.size(); r++) if (!runs[r].empty()) pq.push({runs[r][0], r, 0});

    std::vector<int> out;
    while (!pq.empty()) {
        auto [val, r, pos] = pq.top(); pq.pop();
        out.push_back(val);
        if (pos + 1 < (int)runs[r].size()) pq.push({runs[r][pos + 1], r, pos + 1});
    }
    return out;
}
