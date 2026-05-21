#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

// The Z-array: Z[i] is the length of the longest substring starting at i that
// matches a prefix of the string. Built in linear time with a [l, r] window.
std::vector<int> computeZ(const std::string& s) {
    int n = static_cast<int>(s.size());
    std::vector<int> z(n, 0);
    int l = 0, r = 0;
    for (int i = 1; i < n; i++) {
        if (i < r) z[i] = std::min(r - i, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] > r) { l = i; r = i + z[i]; }
    }
    return z;
}

// String matching: build pattern + '$' + text; an index whose Z-value equals
// the pattern length marks an occurrence.
std::vector<int> zSearch(const std::string& text, const std::string& pattern) {
    std::string combined = pattern + "$" + text;
    std::vector<int> z = computeZ(combined);
    std::vector<int> matches;
    int m = static_cast<int>(pattern.size());
    for (int i = 0; i < static_cast<int>(combined.size()); i++) {
        if (z[i] == m) matches.push_back(i - m - 1);  // translate back into text
    }
    return matches;
}

int main() {
    std::string text = "ABABDABACDABABCABAB";
    std::string pattern = "ABABCABAB";
    std::vector<int> matches = zSearch(text, pattern);

    std::cout << "matches at:";
    for (int idx : matches) std::cout << " " << idx;
    std::cout << "\n";
    return 0;
}
