#include <algorithm>
#include <string>
#include <vector>

struct ManacherResult {
    std::vector<int> radius;
    int start;
    int length;
};

ManacherResult manacher(const std::string& text) {
    // Negative values are structural tokens; byte values are non-negative.
    // This avoids collisions when the input itself contains '^', '#', or '$'.
    constexpr int START = -3;
    constexpr int SEPARATOR = -2;
    constexpr int END = -1;

    std::vector<int> transformed{START, SEPARATOR};
    for (unsigned char ch : text) {
        transformed.push_back(static_cast<int>(ch));
        transformed.push_back(SEPARATOR);
    }
    transformed.push_back(END);

    std::vector<int> radius(transformed.size(), 0);
    int center = 0;
    int right = 0;
    int bestCenter = 0;
    int bestRadius = 0;

    for (int i = 1; i + 1 < static_cast<int>(transformed.size()); ++i) {
        const int mirror = 2 * center - i;
        if (i < right && mirror >= 0) {
            radius[i] = std::min(right - i, radius[mirror]);
        }

        while (transformed[i - radius[i] - 1] ==
               transformed[i + radius[i] + 1]) {
            ++radius[i];
        }

        if (i + radius[i] > right) {
            center = i;
            right = i + radius[i];
        }
        if (radius[i] > bestRadius) {
            bestCenter = i;
            bestRadius = radius[i];
        }
    }

    const int start = (bestCenter - bestRadius) / 2;
    return {radius, start, bestRadius};
}

std::string longestPalindromicSubstring(const std::string& text) {
    const ManacherResult result = manacher(text);
    return text.substr(result.start, result.length);
}
