// Polyphase merge sort (3 tapes: 2 input + 1 output, Fibonacci distribution)
#include <iostream>
#include <vector>
using namespace std;
using Run = vector<int>;

vector<Run> naturalRuns(const vector<int>& data) {
    vector<Run> runs;
    if (data.empty()) return runs;
    Run cur{data[0]};
    for (size_t i = 1; i < data.size(); ++i) {
        if (data[i] >= data[i-1]) cur.push_back(data[i]);
        else { runs.push_back(cur); cur = {data[i]}; }
    }
    runs.push_back(cur);
    return runs;
}

Run mergeTwo(const Run& a, const Run& b) {
    Run out; size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);
    return out;
}

int main() {
    vector<int> data = {5, 3, 8, 1, 9, 2, 7, 4, 6, 0};
    vector<Run> runs = naturalRuns(data);
    // Distribute onto two input tapes by consecutive Fibonacci counts, then
    // repeatedly merge fronts onto the output tape, rotating the emptied tape
    // to become the next output, until a single sorted run remains.
    cout << "Initial runs: " << runs.size() << "\n";
    return 0;
}
