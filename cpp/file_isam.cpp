// ISAM: indexed sequential access — index of block min-keys + sorted data blocks
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> keys = {10, 20, 30, 40, 50, 60, 70, 80, 90};
    int blockSize = 3;
    sort(keys.begin(), keys.end());
    vector<vector<int>> blocks;
    for (size_t i = 0; i < keys.size(); i += blockSize)
        blocks.push_back(vector<int>(keys.begin() + i, keys.begin() + min(keys.size(), i + blockSize)));

    int target = 50, bi = 0;
    for (size_t i = 0; i < blocks.size(); ++i)
        if (!blocks[i].empty() && blocks[i][0] <= target) bi = i; else break;
    bool found = false;
    for (int k : blocks[bi]) if (k == target) found = true;
    cout << "key " << target << (found ? " found" : " not found") << " in block " << bi << "\n";
    return 0;
}
