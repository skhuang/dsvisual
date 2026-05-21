#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

const int ALPHABET = 256;

vector<int> buildBadChar(const string& pat) {
    vector<int> badChar(ALPHABET, -1);
    for (int i = 0; i < (int)pat.size(); i++)
        badChar[(unsigned char)pat[i]] = i;
    return badChar;
}

// Strong good-suffix preprocessing: fills shift[] of size m+1.
void buildGoodSuffix(const string& pat, vector<int>& shift) {
    int m = pat.size();
    vector<int> bpos(m + 1, 0);
    shift.assign(m + 1, 0);
    int i = m, j = m + 1;
    bpos[i] = j;
    while (i > 0) {
        while (j <= m && pat[i - 1] != pat[j - 1]) {
            if (shift[j] == 0) shift[j] = j - i;
            j = bpos[j];
        }
        i--; j--;
        bpos[i] = j;
    }
    j = bpos[0];
    for (i = 0; i <= m; i++) {
        if (shift[i] == 0) shift[i] = j;
        if (i == j) j = bpos[j];
    }
}

void boyerMooreSearch(const string& text, const string& pat) {
    int n = text.size(), m = pat.size();
    vector<int> badChar = buildBadChar(pat);
    vector<int> shift;
    buildGoodSuffix(pat, shift);
    int s = 0;
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0 && pat[j] == text[s + j]) j--;
        if (j < 0) {
            cout << "Match at index " << s << endl;
            s += shift[0];
        } else {
            int bcShift = j - badChar[(unsigned char)text[s + j]];
            s += max(shift[j + 1], max(1, bcShift));
        }
    }
}

int main() {
    string text = "ABABDABACDABABCABAB";
    string pattern = "ABABCABAB";
    boyerMooreSearch(text, pattern);   // Match at index 10
    return 0;
}
