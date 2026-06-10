#include <iostream>
#include <vector>
using namespace std;

void countingSortDigit(vector<int>& arr, int exp) {
    int n = arr.size();
    vector<int> output(n);
    int count[10] = {0}; // Radix is base-10

    // Store count of occurrences for the defined digit (1s, 10s, 100s...)
    for (int i = 0; i < n; i++) {
        count[(arr[i] / exp) % 10]++;
    }

    // Change count[i] so that count[i] now contains actual position
    for (int i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }

    // Build the output array from back to front to maintain stability!
    for (int i = n - 1; i >= 0; i--) {
        output[count[(arr[i] / exp) % 10] - 1] = arr[i];
        count[(arr[i] / exp) % 10]--;
    }

    for (int i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}

void radixSort(vector<int>& arr) {
    int maxEl = *max_element(arr.begin(), arr.end());

    // Do counting sort for every digit.
    // exp is 10^i where i is current digit number
    for (int exp = 1; maxEl / exp > 0; exp *= 10) {
        countingSortDigit(arr, exp);
    }
}

int main() {
    vector<int> arr = {170, 45, 75, 90, 802, 24, 2, 66};
    radixSort(arr);
    return 0;
}
