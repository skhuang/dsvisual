#include <iostream>
#include <string>
#include <vector>
#include <utility>
#include <unordered_map>
#include <algorithm>
#include <sstream>
using namespace std;

// Successor counts for one fixed (n-1)-token context, e.g. one entry of the
// hash map  unordered_map<string, unordered_map<string,int>>  that NgramModel
// builds while training (context key -> next-token -> count).
using Candidate = pair<string, int>;   // (token, count)

// Prefix sum of counts: cumulative[i] = total count of tokens 0..i.
vector<long> cumulativeCounts(const vector<Candidate>& candidates) {
    vector<long> cumulative;
    cumulative.reserve(candidates.size());
    long running = 0;
    for (const auto& kv : candidates) {
        running += kv.second;
        cumulative.push_back(running);
    }
    return cumulative;
}

// Sample the next token: draw r in [0,1), scale to target = r * total, then
// binary search for the first bucket whose cumulative count exceeds target.
// Rule: pick the smallest index i such that target < cumulative[i].
string sampleNext(const vector<Candidate>& candidates, double r) {
    vector<long> cumulative = cumulativeCounts(candidates);
    long total = cumulative.empty() ? 0 : cumulative.back();
    double target = r * static_cast<double>(total);

    int lo = 0, hi = static_cast<int>(candidates.size()) - 1, ans = hi;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (target < static_cast<double>(cumulative[mid])) {
            ans = mid;          // this bucket qualifies; look for an earlier one
            hi = mid - 1;
        } else {
            lo = mid + 1;       // target lies beyond this bucket
        }
    }
    return candidates[ans].first;
}

// Build a bigram (n=2) frequency table from a corpus: context -> next-token -> count.
static unordered_map<string, unordered_map<string, int>> trainBigram(const vector<string>& tokens) {
    unordered_map<string, unordered_map<string, int>> model;
    for (size_t i = 0; i + 1 < tokens.size(); ++i) {
        model[tokens[i]][tokens[i + 1]]++;
    }
    return model;
}

// Turn one context's next-token counts into a candidate list ordered by
// (count desc, token asc) so a deterministic pick (highest count, ties broken
// by the smaller token) lands at index 0.
static vector<Candidate> orderedCandidates(const unordered_map<string, int>& counts) {
    vector<Candidate> out(counts.begin(), counts.end());
    sort(out.begin(), out.end(), [](const Candidate& a, const Candidate& b) {
        if (a.second != b.second) return a.second > b.second;
        return a.first < b.first;
    });
    return out;
}

int main() {
    vector<string> corpus = {
        "the", "cat", "sat", "on", "the", "mat",
        "the", "cat", "ran", "on", "the", "mat",
        "a", "dog", "sat", "a", "cat", "sat"
    };
    auto model = trainBigram(corpus);

    for (const string& context : {string("the"), string("sat")}) {
        vector<Candidate> candidates = orderedCandidates(model[context]);
        cout << "context \"" << context << "\": ";
        for (size_t i = 0; i < candidates.size(); ++i) {
            if (i) cout << ", ";
            cout << candidates[i].first << "=" << candidates[i].second;
        }
        // r = 0.0 deterministically hits the first (highest-count) bucket.
        string predicted = sampleNext(candidates, 0.0);
        cout << "  -> predict \"" << predicted << "\"\n";
    }
    return 0;
}
