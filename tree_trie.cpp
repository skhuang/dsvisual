#include <iostream>
#include <string>
using namespace std;

class TrieNode {
public:
    TrieNode* children[26];
    bool isEndOfWord;
    TrieNode() {
        isEndOfWord = false;
        for (int i = 0; i < 26; i++) children[i] = nullptr;
    }
};

class Trie {
private:
    TrieNode* root;

public:
    Trie() { root = new TrieNode(); }

    void insert(string word) {
        TrieNode* curr = root;
        for (char c : word) {
            int index = c - 'A'; // Assuming uppercase for visualization
            if (curr->children[index] == nullptr) {
                curr->children[index] = new TrieNode();
            }
            curr = curr->children[index];
        }
        curr->isEndOfWord = true;
        cout << "Inserted word: " << word << endl;
    }

    bool search(string word) {
        TrieNode* curr = root;
        for (char c : word) {
            int index = c - 'A';
            if (curr->children[index] == nullptr) return false;
            curr = curr->children[index];
        }
        return curr->isEndOfWord;
    }
};

int main() {
    Trie trie;
    trie.insert("CAR");
    trie.insert("CAT");
    trie.insert("DOG");
    cout << "Contains CAT? " << (trie.search("CAT") ? "Yes" : "No") << endl;
    return 0;
}
