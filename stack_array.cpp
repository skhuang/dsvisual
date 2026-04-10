#include <iostream>
using namespace std;

#define MAX_SIZE 5

class StackArray {
private:
    int arr[MAX_SIZE];
    int topIndex;

public:
    StackArray() {
        topIndex = -1; // Initialize stack as empty
    }

    bool isFull() {
        return topIndex >= MAX_SIZE - 1;
    }

    bool isEmpty() {
        return topIndex < 0;
    }

    void push(int value) {
        if (isFull()) {
            cout << "Stack Overflow! Cannot push " << value << endl;
            return;
        }
        arr[++topIndex] = value;
        cout << "Pushed " << value << " onto array stack.\n";
    }

    void pop() {
        if (isEmpty()) {
            cout << "Stack Underflow! Cannot pop from empty stack.\n";
            return;
        }
        int poppedValue = arr[topIndex--];
        cout << "Popped " << poppedValue << " from array stack.\n";
    }

    int peek() {
        if (isEmpty()) {
            cout << "Stack is empty." << endl;
            return -1; // Return dummy value to indicate error
        }
        return arr[topIndex];
    }
};

int main() {
    StackArray stack;
    stack.push(10);
    stack.push(20);
    stack.push(30);
    stack.pop();
    cout << "Top element is: " << stack.peek() << endl;
    return 0;
}
