#include <iostream>
using namespace std;

#define MAX_SIZE 5

class StackArray {
private:
    int arr[MAX_SIZE];
    int topIndex;

public:
    StackArray() {
        topIndex = -1;
    }

    bool push(int val) {
        if (topIndex >= MAX_SIZE - 1) {
            cout << "Stack Overflow!" << endl;
            return false;
        }
        arr[++topIndex] = val;
        cout << "Pushed " << val << endl;
        return true;
    }

    int pop() {
        if (topIndex < 0) {
            cout << "Stack Underflow!" << endl;
            return -1;
        }
        int val = arr[topIndex--];
        cout << "Popped " << val << endl;
        return val;
    }

    bool isEmpty() {
        return topIndex < 0;
    }
};

int main() {
    StackArray s;
    s.push(10);
    s.push(20);
    s.pop();
    return 0;
}
