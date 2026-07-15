#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
using namespace std;

// Vocabulary is a list of pieces; a piece's id is its index.
class BpeEncoder {
    struct TrieNode {
        unordered_map<char, int> children;  // char -> child node index
        int id = -1;                        // vocab id if a piece ends here
    };
    vector<TrieNode> nodes_;                // trie stored in an array
    vector<string> vocab_;                  // id -> piece text (for lookup)

    void insert(const string& p, int id) {
        int node = 0;
        for (char c : p) {
            auto it = nodes_[node].children.find(c);
            if (it != nodes_[node].children.end()) { node = it->second; continue; }
            int idx = static_cast<int>(nodes_.size());
            nodes_.push_back(TrieNode{});
            nodes_[node].children[c] = idx;
            node = idx;
        }
        nodes_[node].id = id;
    }

public:
    explicit BpeEncoder(const vector<string>& vocab) : vocab_(vocab) {
        nodes_.push_back(TrieNode{});            // index 0 = root
        for (int id = 0; id < (int)vocab.size(); ++id) insert(vocab[id], id);
    }

    // Text -> tokens via greedy longest-match walk over the trie.
    vector<string> encode(const string& word) const {
        vector<string> out;
        for (size_t i = 0; i < word.size(); ) {
            int node = 0, bestId = -1;
            size_t bestLen = 0;
            for (size_t j = i; j < word.size(); ++j) {
                auto it = nodes_[node].children.find(word[j]);
                if (it == nodes_[node].children.end()) break;
                node = it->second;
                if (nodes_[node].id != -1) {      // a piece ends here
                    bestId = nodes_[node].id;
                    bestLen = j - i + 1;
                }
            }
            string tok;
            if (bestId != -1) {
                tok = vocab_[bestId];
            } else {
                tok = word.substr(i, 1);           // no piece matched: byte fallback,
                bestLen = 1;                        // emit the character itself
            }
            out.push_back(tok);
            i += bestLen;
        }
        return out;
    }
};

int main() {
    // A tiny learned vocabulary (as if produced by BPE training on "banana"-like text).
    vector<string> vocab = {"a", "n", "b", "an", "na", "ana", "anan", "banana"};
    BpeEncoder enc(vocab);

    for (const string& word : {string("banana"), string("bandana")}) {
        vector<string> tokens = enc.encode(word);
        cout << word << " -> ";
        for (size_t i = 0; i < tokens.size(); ++i) {
            if (i) cout << " | ";
            cout << tokens[i];
        }
        cout << "  (" << tokens.size() << " tokens)\n";
    }
    return 0;
}
