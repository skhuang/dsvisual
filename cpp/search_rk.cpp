#include <iostream>
#include <string>
using namespace std;

const int BASE = 256;
const int MOD = 101;

void rabinKarpSearch(const string& text, const string& pat) {
    int n = text.size(), m = pat.size();
    if (m > n)
        return;
    int patHash = 0, winHash = 0, h = 1;
    for (int i = 0; i < m - 1; i++)
        h = (h * BASE) % MOD;
    for (int i = 0; i < m; i++) {
        patHash = (BASE * patHash + pat[i]) % MOD;
        winHash = (BASE * winHash + text[i]) % MOD;
    }
    for (int s = 0; s <= n - m; s++) {
        if (patHash == winHash) {
            int j = 0;
            while (j < m && text[s + j] == pat[j])
                j++;
            if (j == m)
                cout << "Match at index " << s << endl;
        }
        if (s < n - m) {
            winHash = (BASE * (winHash - text[s] * h) + text[s + m]) % MOD;
            if (winHash < 0)
                winHash += MOD;
        }
    }
}

int main() {
    string text = "ABABDABACDABABCABAB";
    string pattern = "ABABCABAB";
    rabinKarpSearch(text, pattern); // Match at index 10
    return 0;
}
