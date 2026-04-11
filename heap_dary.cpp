#include <iostream>
#include <vector>
#include <stdexcept>
using namespace std;

class DAryHeap {
private:
    vector<int> data;
    int d;
    bool isMinHeap;

    bool cmp(int a, int b) const {
        return isMinHeap ? (a < b) : (a > b);
    }

    int parent(int index) const {
        return (index - 1) / d;
    }

    int child(int index, int offset) const {
        return index * d + offset + 1;
    }

    void siftUp(int index) {
        while (index > 0) {
            int p = parent(index);
            if (!cmp(data[index], data[p])) break;
            swap(data[index], data[p]);
            index = p;
        }
    }

    void siftDown(int index) {
        while (true) {
            int best = index;
            for (int offset = 0; offset < d; ++offset) {
                int c = child(index, offset);
                if (c < static_cast<int>(data.size()) && cmp(data[c], data[best])) {
                    best = c;
                }
            }
            if (best == index) break;
            swap(data[index], data[best]);
            index = best;
        }
    }

public:
    explicit DAryHeap(int arity = 4, bool minHeap = true) : d(arity), isMinHeap(minHeap) {
        if (d < 2) throw runtime_error("Arity must be at least 2");
    }

    void insert(int value) {
        data.push_back(value);
        siftUp(static_cast<int>(data.size()) - 1);
    }

    int peek() const {
        if (data.empty()) throw runtime_error("Heap is empty");
        return data[0];
    }

    int extractTop() {
        if (data.empty()) throw runtime_error("Heap is empty");
        int top = data[0];
        data[0] = data.back();
        data.pop_back();
        if (!data.empty()) siftDown(0);
        return top;
    }

    void changeKey(int index, int newValue) {
        if (index < 0 || index >= static_cast<int>(data.size())) {
            throw runtime_error("Index out of range");
        }
        int oldValue = data[index];
        data[index] = newValue;
        if (cmp(newValue, oldValue)) siftUp(index);
        else siftDown(index);
    }

    void mergeFrom(const vector<int>& other) {
        for (int value : other) insert(value);
    }

    void print() const {
        cout << d << "-ary " << (isMinHeap ? "min" : "max") << " heap: ";
        for (int value : data) cout << value << " ";
        cout << "\n";
    }
};

int main() {
    DAryHeap heap(4, true);
    heap.insert(20);
    heap.insert(7);
    heap.insert(3);
    heap.insert(12);
    heap.insert(1);
    heap.print();

    cout << "Peek: " << heap.peek() << "\n";
    cout << "Extract: " << heap.extractTop() << "\n";
    heap.changeKey(2, 2);
    heap.mergeFrom({9, 4, 15});
    heap.print();
    return 0;
}