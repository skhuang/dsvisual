// Dynamic storage management: mark-sweep, reference counting, buddy system
#include <iostream>
#include <unordered_map>
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

// --- Pointer-Reversal Mark (MARK2): Deutsch-Schorr-Waite, stack-free ---
// tag=1 nodes carry a DLINK sublist; tag=0 nodes are atoms reached via RLINK.
// While descending, the link just followed is reversed to record the path
// back; on the way up, each reversed link is restored to its original value.
struct M2Node {
    bool tag;                    // 1 = list node (has a DLINK sublist), 0 = atom
    bool mark = false;
    bool c = false;              // which link is currently reversed: DLINK (false) or RLINK (true)
    M2Node* dlink = nullptr;
    M2Node* rlink = nullptr;
};

void mark2(M2Node* root) {
    M2Node* p = root;
    M2Node* q = nullptr;         // q: reversed back-pointer, replaces the explicit stack
    while (true) {
        if (p && !p->mark) {                       // first visit: mark, descend, reverse
            p->mark = true;
            if (p->tag) { p->c = false; M2Node* t = p->dlink; p->dlink = q; q = p; p = t; }
            else        { p->c = true;  M2Node* t = p->rlink; p->rlink = q; q = p; p = t; }
        } else {                                    // dead end: back up, restoring links
            if (!q) return;
            if (!q->c) { q->c = true; M2Node* t = q->dlink; q->dlink = p; p = q->rlink; q->rlink = t; }
            else       {              M2Node* t = q->rlink; q->rlink = p; p = q; q = t; }
        }
    }
}

// --- Compaction (COMPACT): 3-pass sliding compaction ---
// After marking, live and free blocks are interleaved in memory. Compaction
// slides every live block toward one end, in three passes over the same array.
struct CBlock { int addr; int size; bool live; int link; int newAddr = 0; };

void compact(vector<CBlock>& mem) {                                     // mem is in address order
    int av = 1;                                                        // pass 1: assign new addresses
    for (auto& b : mem) if (b.live) { b.newAddr = av; av += b.size; }
    unordered_map<int, int> remap; remap[0] = 0;                       // pass 2: rewrite links old -> new
    for (auto& b : mem) if (b.live) remap[b.addr] = b.newAddr;
    for (auto& b : mem) if (b.live) b.link = remap[b.link];
    for (auto& b : mem) if (b.live) b.addr = b.newAddr;                // pass 3: relocate
}
