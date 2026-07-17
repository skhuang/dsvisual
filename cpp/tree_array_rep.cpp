#include <iostream>
#include <vector>
#include <string>
#include <sstream>

// Sequential (array) representation of a binary tree.
// 1-indexed: node i has left child 2i, right child 2i+1, parent i/2.
// Empty slots hold "-"; a skewed tree wastes many slots.
struct ArrayTree {
    std::vector<std::string> a;             // a[0] unused
    static const std::string EMPTY;

    int left(int i)   const { return 2 * i; }
    int right(int i)  const { return 2 * i + 1; }
    int parent(int i) const { return i / 2; }

    // Parse a level-order description ("A B C - D"); position k -> index k.
    void fromLevel(const std::string& s) {
        a.assign(1, EMPTY);                 // index 0 placeholder
        std::istringstream in(s);
        std::string tok;
        while (in >> tok) a.push_back(tok);
    }

    int size() const { return (int)a.size() - 1; }
    bool present(int i) const { return i >= 1 && i < (int)a.size() && a[i] != EMPTY; }

    int nodeCount() const {
        int c = 0;
        for (int i = 1; i <= size(); ++i) if (present(i)) ++c;
        return c;
    }
    int wastedSlots() const { return size() - nodeCount(); }

    // Inorder traversal over the array layout.
    void inorder(int i) const {
        if (i > size() || !present(i)) return;
        inorder(left(i));
        std::cout << a[i] << ' ';
        inorder(right(i));
    }
};
const std::string ArrayTree::EMPTY = "-";
