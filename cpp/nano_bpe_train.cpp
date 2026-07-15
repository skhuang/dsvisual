#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <utility>
using namespace std;

using Cand = pair<int, string>;   // (count, packed pair key)

struct Symbol { string piece; int prev; int next; bool dead; };
struct Merge  { string left, right; };

// Heap order: higher count wins; on a tie the lexicographically SMALLEST
// key wins, so top() is (max count, min key) and merges are deterministic.
struct Cmp {
    bool operator()(const Cand& a, const Cand& b) const {
        if (a.first != b.first) return a.first < b.first;   // more frequent = higher priority
        return a.second > b.second;                         // tie: smaller key = higher priority
    }
};

class BpeTrainer {
public:
    vector<Merge> train(vector<Symbol> pool, int num_merges) {
        vector<Merge> merges;
        for (int m = 0; m < num_merges; ++m) {
            // Count adjacent pairs (hash map).
            unordered_map<string, int> counts;
            for (size_t i = 0; i < pool.size(); ++i) {
                if (pool[i].dead) continue;
                int n = pool[i].next;
                if (n == -1) continue;
                counts[packKey(pool[i].piece, pool[n].piece)]++;
            }
            if (counts.empty()) break;

            // Heapify all candidates, take the top (most frequent pair).
            priority_queue<Cand, vector<Cand>, Cmp> heap;
            for (const auto& kv : counts) heap.push({kv.second, kv.first});
            if (heap.top().first < 2) break;   // stop once no pair repeats
            const string bestKey = heap.top().second;

            string L, R;
            unpackKey(bestKey, L, R);
            merges.push_back({L, R});

            // Merge every adjacent occurrence of (L,R): O(1) relink of the
            // linked list, extend left's piece, splice right out.
            for (size_t i = 0; i < pool.size(); ++i) {
                if (pool[i].dead) continue;
                int n = pool[i].next;
                if (n == -1 || pool[n].dead) continue;
                if (pool[i].piece == L && pool[n].piece == R) {
                    pool[i].piece += pool[n].piece;
                    pool[i].next = pool[n].next;
                    if (pool[n].next != -1) pool[pool[n].next].prev = static_cast<int>(i);
                    pool[n].dead = true;
                }
            }
        }
        return merges;
    }

private:
    static string packKey(const string& a, const string& b) {
        return a + '\x01' + b;   // \x01 never appears in ASCII word text
    }
    static void unpackKey(const string& key, string& a, string& b) {
        size_t sep = key.find('\x01');
        a = key.substr(0, sep);
        b = key.substr(sep + 1);
    }
};

// Build a doubly-linked symbol pool from a corpus of words, each word split
// into its individual characters (the usual BPE starting point) and joined
// end-to-end with a piece boundary (next == -1) so pairs never merge across
// separate words.
static vector<Symbol> makePool(const vector<string>& words) {
    vector<Symbol> pool;
    for (const string& w : words) {
        int start = static_cast<int>(pool.size());
        for (size_t i = 0; i < w.size(); ++i) {
            int idx = static_cast<int>(pool.size());
            int prev = (i == 0) ? -1 : idx - 1;
            pool.push_back(Symbol{string(1, w[i]), prev, -1, false});
            if (i > 0) pool[idx - 1].next = idx;
        }
        (void)start;
    }
    return pool;
}

int main() {
    vector<string> corpus = {"low", "lower", "newest", "widest"};
    vector<Symbol> pool = makePool(corpus);

    BpeTrainer trainer;
    vector<Merge> merges = trainer.train(pool, 6);

    cout << merges.size() << " merges learned:\n";
    for (size_t i = 0; i < merges.size(); ++i) {
        cout << "  " << (i + 1) << ": \"" << merges[i].left << "\" + \"" << merges[i].right
             << "\" -> \"" << merges[i].left + merges[i].right << "\"\n";
    }
    return 0;
}
