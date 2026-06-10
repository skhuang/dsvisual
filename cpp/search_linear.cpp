#include <iostream>
using namespace std;

int linearSearch(int arr[], int size, int target) {
    for (int i = 0; i < size; i++) {
        if (arr[i] == target) {
            return i; // Found at index i
        }
    }
    return -1; // Not found
}

int main() {
    int arr[] = {23, 12, 56, 8, 38, 2, 72, 91, 16, 5};
    int size = sizeof(arr) / sizeof(arr[0]);
    int target = 38;

    int result = linearSearch(arr, size, target);

    if (result != -1)
        cout << "Element " << target << " found at index " << result << endl;
    else
        cout << "Element " << target << " not found." << endl;

    return 0;
}
