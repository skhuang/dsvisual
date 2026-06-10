#include <iostream>
#include <vector>
using namespace std;

void countingSort(vector<int>& arr) {
    int max = *max_element(arr.begin(), arr.end());
    int min = *min_element(arr.begin(), arr.end());
    int range = max - min + 1;

    // 1. Create a dynamic counting array initialized to 0
    vector<int> count(range, 0);
    vector<int> output(arr.size());

    // 2. Count the frequency of each element
    for (int i = 0; i < arr.size(); i++) {
        count[arr[i] - min]++;
    }

    // 3. Modify count array to store actual positions (Cumulative Sum)
    for (int i = 1; i < count.size(); i++) {
        count[i] += count[i - 1];
    }

    // 4. Build output array dynamically by mapping elements back
    for (int i = arr.size() - 1; i >= 0; i--) {
        output[count[arr[i] - min] - 1] = arr[i];
        count[arr[i] - min]--;
    }

    for (int i = 0; i < arr.size(); i++) {
        arr[i] = output[i];
    }
}

int main() {
    vector<int> arr = {4, 2, 2, 8, 3, 3, 1};
    countingSort(arr);
    return 0;
}
