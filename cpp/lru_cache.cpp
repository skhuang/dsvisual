#include <iostream>
#include <list>
#include <unordered_map>
using namespace std;

// LRU (Least Recently Used) cache.
// A doubly linked list keeps entries ordered from most- to least-recently
// used, and a hash map gives O(1) lookup from a key to its list node.
// Both get() and put() run in O(1) time.
class LRUCache {
    int capacity;
    list<pair<int, int>> items;                                  // front = MRU, back = LRU
    unordered_map<int, list<pair<int, int>>::iterator> index;    // key -> node

public:
    explicit LRUCache(int cap) : capacity(cap) {}

    // Return the cached value, or -1 on a miss. A hit is promoted to the front.
    int get(int key) {
        auto it = index.find(key);
        if (it == index.end()) return -1;
        items.splice(items.begin(), items, it->second);
        return it->second->second;
    }

    // Insert or update a key. On overflow, evict the least-recently-used entry.
    void put(int key, int value) {
        auto it = index.find(key);
        if (it != index.end()) {
            it->second->second = value;
            items.splice(items.begin(), items, it->second);
            return;
        }
        if ((int)items.size() == capacity) {
            int lru = items.back().first;
            index.erase(lru);
            items.pop_back();
        }
        items.emplace_front(key, value);
        index[key] = items.begin();
    }
};

int main() {
    LRUCache cache(2);
    cache.put(1, 10);
    cache.put(2, 20);
    cout << cache.get(1) << endl;   // 10, key 1 becomes most-recently-used
    cache.put(3, 30);               // capacity reached, evicts key 2 (LRU)
    cout << cache.get(2) << endl;   // -1, key 2 was evicted
    return 0;
}
