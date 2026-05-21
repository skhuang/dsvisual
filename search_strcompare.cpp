#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Each function returns the number of character/hash comparisons performed.

int kmpCompares(const string& text, const string& pat) {
    int n = text.size(), m = pat.size(), cmp = 0;
    vector<int> lps(m, 0);
    for (int len = 0, i = 1; i < m;) {
        if (pat[i] == pat[len]) lps[i++] = ++len;
        else if (len) len = lps[len - 1];
        else lps[i++] = 0;
    }
    int i = 0, j = 0;
    while (i < n) {
        cmp++;
        if (text[i] == pat[j]) { i++; j++; if (j == m) j = lps[j - 1]; }
        else if (j) j = lps[j - 1];
        else i++;
    }
    return cmp;
}

// Trimmed Boyer-Moore (bad-character heuristic only).
int bmCompares(const string& text, const string& pat) {
    int n = text.size(), m = pat.size(), cmp = 0;
    vector<int> bad(256, -1);
    for (int i = 0; i < m; i++) bad[(unsigned char)pat[i]] = i;
    int s = 0;
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0) {
            cmp++;
            if (pat[j] != text[s + j]) break;
            j--;
        }
        if (j < 0) s += 1;
        else s += max(1, j - bad[(unsigned char)text[s + j]]);
    }
    return cmp;
}

int rkCompares(const string& text, const string& pat) {
    const int BASE = 256, MOD = 101;
    int n = text.size(), m = pat.size(), cmp = 0;
    if (m > n) return 0;
    int ph = 0, wh = 0, h = 1;
    for (int i = 0; i < m - 1; i++) h = (h * BASE) % MOD;
    for (int i = 0; i < m; i++) {
        ph = (BASE * ph + pat[i]) % MOD;
        wh = (BASE * wh + text[i]) % MOD;
    }
    for (int s = 0; s <= n - m; s++) {
        cmp++;  // one hash comparison per window
        if (ph == wh) {
            int j = 0;
            while (j < m && text[s + j] == pat[j]) { cmp++; j++; }
        }
        if (s < n - m) {
            wh = (BASE * (wh - text[s] * h) + text[s + m]) % MOD;
            if (wh < 0) wh += MOD;
        }
    }
    return cmp;
}

int main() {
    string text = "ABABDABACDABABCABAB";
    string pattern = "ABABCABAB";
    cout << "KMP comparisons: " << kmpCompares(text, pattern) << endl;
    cout << "BM  comparisons: " << bmCompares(text, pattern) << endl;
    cout << "RK  comparisons: " << rkCompares(text, pattern) << endl;
    return 0;
}
