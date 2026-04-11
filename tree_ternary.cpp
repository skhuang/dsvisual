#include <iostream>
#include <string>
using namespace std;

struct TSTNode {
    char data;
    bool isEndOfWord;
    TSTNode *left, *eq, *right;

    TSTNode(char data) : data(data), isEndOfWord(false), left(nullptr), eq(nullptr), right(nullptr) {}
};

class TernarySearchTree {
private:
    TSTNode* insertRecursive(TSTNode* root, const string& word, int index) {
        if (!root) root = new TSTNode(word[index]);

        if (word[index] < root->data) {
            root->left = insertRecursive(root->left, word, index);
        } else if (word[index] > root->data) {
            root->right = insertRecursive(root->right, word, index);
        } else {
            if (index + 1 < word.length()) {
                root->eq = insertRecursive(root->eq, word, index + 1);
            } else {
                root->isEndOfWord = true;
            }
        }
        return root;
    }

public:
    TSTNode* root;
    TernarySearchTree() { root = nullptr; }

    void insert(string word) {
        root = insertRecursive(root, word, 0);
        cout << "Inserted " << word << " via ternary logic." << endl;
    }
};

int main() {
    TernarySearchTree tst;
    tst.insert("CAR");
    tst.insert("CAT"); // 'T' goes > 'R' under the 'A' middle branch
    return 0;
}
