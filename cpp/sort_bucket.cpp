#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

void bucketSort(vector<float>& arr) {
    int n = arr.size();
    if (n <= 0)
        return;

    // 1. Create n empty buckets
    vector<vector<float>> buckets(n);

    // 2. Distribute elements into buckets based on their value
    for (int i = 0; i < n; i++) {
        // Elements are assumed to be normalized between 0.0 and 1.0!
        // For array [0.78, 0.17, 0.39, 0.26, 0.72]
        int bucketIndex = n * arr[i];
        if (bucketIndex >= n)
            bucketIndex = n - 1; // Catch edge cases
        buckets[bucketIndex].push_back(arr[i]);
    }

    // 3. Sort individual buckets (typically using Insertion Sort)
    for (int i = 0; i < n; i++) {
        sort(buckets[i].begin(), buckets[i].end());
    }

    // 4. Concatenate all buckets back into the original array
    int index = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < buckets[i].size(); j++) {
            arr[index++] = buckets[i][j];
        }
    }
}

int main() {
    vector<float> arr = {0.897, 0.565, 0.656, 0.1234, 0.665, 0.3434};
    bucketSort(arr);
    return 0;
}
