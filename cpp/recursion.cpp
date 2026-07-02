// Recursion examples: Fibonacci, reverse, permutations, binary search, quicksort
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int fib(int k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); }

string reverseStr(const string& s) { return s.size() <= 1 ? s : reverseStr(s.substr(1)) + s[0]; }

void permute(string prefix, string rest) {
    if (rest.empty()) { cout << prefix << "\n"; return; }
    for (size_t i = 0; i < rest.size(); ++i)
        permute(prefix + rest[i], rest.substr(0, i) + rest.substr(i + 1));
}

int bsearch(const vector<int>& a, int target, int lo, int hi) {
    if (lo > hi) return -1;
    int mid = (lo + hi) / 2;
    if (a[mid] == target) return mid;
    return a[mid] < target ? bsearch(a, target, mid + 1, hi)
                           : bsearch(a, target, lo, mid - 1);
}

void quicksort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; ++j) if (a[j] < pivot) swap(a[i++], a[j]);
    swap(a[i], a[hi]);
    quicksort(a, lo, i - 1);
    quicksort(a, i + 1, hi);
}

int main() {
    cout << "fib(6) = " << fib(6) << "\n";
    cout << "reverse(ABCDE) = " << reverseStr("ABCDE") << "\n";
    permute("", "ABC");
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    cout << "bsearch(23) = " << bsearch(a, 23, 0, a.size() - 1) << "\n";
    vector<int> q = {5, 3, 8, 1, 9, 2, 7, 4};
    quicksort(q, 0, q.size() - 1);
    for (int x : q) cout << x << " ";
    cout << "\n";
    return 0;
}
