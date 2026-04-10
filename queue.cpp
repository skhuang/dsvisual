#include <iostream>
using namespace std;

#define MAX_SIZE 5

class Queue {
private:
    int arr[MAX_SIZE];
    int frontIndex;
    int rearIndex;
    int count;

public:
    Queue() {
        frontIndex = 0;
        rearIndex = -1;
        count = 0;
    }

    bool isFull() {
        return count == MAX_SIZE;
    }

    bool isEmpty() {
        return count == 0;
    }

    void enqueue(int value) {
        if (isFull()) {
            cout << "Queue Overflow! Cannot enqueue.\n";
            return;
        }
        rearIndex = (rearIndex + 1) % MAX_SIZE;
        arr[rearIndex] = value;
        count++;
        cout << "Enqueued " << value << " to queue.\n";
    }

    void dequeue() {
        if (isEmpty()) {
            cout << "Queue Underflow! Cannot dequeue.\n";
            return;
        }
        cout << "Dequeued " << arr[frontIndex] << " from queue.\n";
        frontIndex = (frontIndex + 1) % MAX_SIZE;
        count--;
    }

    int peek() {
        if (isEmpty()) {
            cout << "Queue is empty." << endl;
            return -1;
        }
        return arr[frontIndex];
    }
};

int main() {
    Queue q;
    q.enqueue(10);
    q.enqueue(20);
    q.enqueue(30);
    q.dequeue();
    cout << "Front element is: " << q.peek() << endl;
    return 0;
}
