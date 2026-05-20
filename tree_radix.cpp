#include <iostream>
#include <map>
#include <string>
using namespace std;

class RadixNode {
public:
    map<string, RadixNode*> edges;
    bool isEndOfWord;
    RadixNode() : isEndOfWord(false) {}
};

class RadixTree {
public:
    RadixNode* root;
    RadixTree() { root = new RadixNode(); }

    void insert(string word) {
        // Warning: Simplified implementation for presentation
        // Real Radix trees actively split existing string edges based on longest common
        // prefix.
        RadixNode* curr = root;

        // Simulating the compressed prefix routing:
        if (curr->edges.find(word) == curr->edges.end()) {
            curr->edges[word] = new RadixNode();
        }
        curr->edges[word]->isEndOfWord = true;
        cout << "Inserted compressed prefix: " << word << endl;
    }
};

int main() {
    RadixTree radix;
    radix.insert("WATER");
    radix.insert("WATCH"); // In real radix, "WAT" splits from "ER" and "CH"
    return 0;
}
