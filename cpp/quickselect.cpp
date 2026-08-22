#include <vector>
#include <algorithm>

// 尋找陣列 A 在 [l, r] 範圍內的第 k 小元素 (1-based index)
int quickSelect(std::vector<int>& arr, int l, int r, int k) {
    if (k > 0 && k <= r - l + 1) {
        int n = r - l + 1;
        std::vector<int> median((n + 4) / 5);
        int i;
        for (i = 0; i < n / 5; i++) {
            std::sort(arr.begin() + l + i * 5, arr.begin() + l + i * 5 + 5);
            median[i] = arr[l + i * 5 + 2];
        }
        if (i * 5 < n) {
            std::sort(arr.begin() + l + i * 5, arr.begin() + l + n);
            median[i] = arr[l + i * 5 + (n - i * 5) / 2];
        }

        // 遞迴尋找中位數的中位數 (Median-of-Medians) 作為 Pivot
        int medOfMed = (i == 1) ? median[0] : quickSelect(median, 0, i - 1, i / 2);

        // Partition 過程
        int pos = l;
        for (int j = l; j <= r; j++) {
            if (arr[j] == medOfMed) {
                std::swap(arr[j], arr[r]);
                break;
            }
        }
        int pivot = arr[r];
        int pivotIdx = l;
        for (int j = l; j < r; j++) {
            if (arr[j] <= pivot) {
                std::swap(arr[pivotIdx], arr[j]);
                pivotIdx++;
            }
        }
        std::swap(arr[pivotIdx], arr[r]);

        // 判斷第 k 小落在哪一個半邊
        if (pivotIdx - l == k - 1)
            return arr[pivotIdx];
        if (pivotIdx - l > k - 1)
            return quickSelect(arr, l, pivotIdx - 1, k);

        return quickSelect(arr, pivotIdx + 1, r, k - (pivotIdx - l + 1));
    }
    return -1;
}

