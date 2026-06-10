#include <iostream>
using namespace std;

class ArrayList {
private:
    int* arr;
    int capacity;
    int size;

public:
    ArrayList(int cap = 10) {
        capacity = cap;
        size = 0;
        arr = new int[capacity];
    }
    ~ArrayList() { delete[] arr; }

    void insert(int index, int val) {
        if (index < 0 || index > size || size >= capacity)
            return;
        for (int i = size; i > index; i--) {
            arr[i] = arr[i - 1]; // Shift right
        }
        arr[index] = val;
        size++;
    }

    void remove(int index) {
        if (index < 0 || index >= size)
            return;
        for (int i = index; i < size - 1; i++) {
            arr[i] = arr[i + 1]; // Shift left
        }
        size--;
    }
};

int main() {
    ArrayList list(10);
    list.insert(0, 10);
    list.insert(1, 20);
    list.remove(0);
    return 0;
}
