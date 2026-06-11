// Dynamic storage management: mark-sweep, reference counting, buddy system
#include <iostream>
#include <vector>
using namespace std;

struct Obj { vector<int> refs; bool mark = false; bool freed = false; };

void markSweep(vector<Obj>& heap, const vector<int>& roots) {
    vector<int> stack = roots;
    while (!stack.empty()) {
        int id = stack.back(); stack.pop_back();
        if (heap[id].mark) continue;
        heap[id].mark = true;
        for (int r : heap[id].refs) stack.push_back(r);
    }
    for (auto& o : heap) if (!o.mark) o.freed = true;
}

int main() {
    vector<Obj> heap = { {{2}}, {{3,4}}, {{5}}, {{}}, {{2}}, {{}}, {{}} };
    markSweep(heap, {0, 1});
    for (size_t i = 0; i < heap.size(); ++i)
        cout << "obj " << i << (heap[i].freed ? " freed\n" : " kept\n");
    return 0;
}
