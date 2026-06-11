// General tree to Binary tree (Left-Child / Right-Sibling representation)
#include <iostream>
#include <map>
#include <vector>
#include <string>
using namespace std;

struct BinNode { string id; BinNode* left = nullptr; BinNode* right = nullptr; };

map<string, vector<string>> children;

BinNode* toBinary(const string& node) {
    BinNode* bn = new BinNode{node};
    BinNode* prev = nullptr;
    const auto& kids = children[node];
    for (size_t i = 0; i < kids.size(); ++i) {
        BinNode* c = toBinary(kids[i]);
        if (i == 0) bn->left = c;
        else prev->right = c;
        prev = c;
    }
    return bn;
}

int main() {
    children["A"] = {"B", "C", "D"};
    children["B"] = {"E", "F"};
    children["C"] = {"G"};
    BinNode* root = toBinary("A");
    cout << "Root: " << root->id
         << " left=" << (root->left ? root->left->id : "-")
         << " right=" << (root->right ? root->right->id : "-") << "\n";
    return 0;
}
