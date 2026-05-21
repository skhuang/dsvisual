#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<int> computeLPS(const string& pat) {
    int m = pat.size();
    vector<int> lps(m, 0);
    int len = 0;
    for (int i = 1; i < m;) {
        if (pat[i] == pat[len]) {
            lps[i++] = ++len;
        } else if (len != 0) {
            len = lps[len - 1];
        } else {
            lps[i++] = 0;
        }
    }
    return lps;
}

void kmpSearch(const string& text, const string& pat) {
    int n = text.size(), m = pat.size();
    vector<int> lps = computeLPS(pat);
    int i = 0, j = 0;
    while (i < n) {
        if (text[i] == pat[j]) {
            i++;
            j++;
            if (j == m) {
                cout << "Match at index " << (i - j) << endl;
                j = lps[j - 1];
            }
        } else if (j != 0) {
            j = lps[j - 1];
        } else {
            i++;
        }
    }
}

int main() {
    string text = "ABABDABACDABABCABAB";
    string pattern = "ABABCABAB";
    kmpSearch(text, pattern); // Match at index 10
    return 0;
}
