#include <iostream>
using namespace std;

#define MAX_SIZE 5

class CircularQueue {
private:
    int arr[MAX_SIZE];
    int front, rear, count;

public:
    CircularQueue() {
        front = 0;
        rear = -1;
        count = 0;
    }

    // >>> enqueue
    bool enqueue(int val) {
        if (count >= MAX_SIZE) {
            cout << "Queue Overflow!" << endl;
            return false;
        }
        rear = (rear + 1) % MAX_SIZE;
        arr[rear] = val;
        count++;
        cout << "Enqueued " << val << endl;
        return true;
    }
    // <<< enqueue

    // >>> dequeue
    int dequeue() {
        if (count == 0) {
            cout << "Queue Underflow!" << endl;
            return -1;
        }
        int val = arr[front];
        front = (front + 1) % MAX_SIZE;
        count--;
        cout << "Dequeued " << val << endl;
        return val;
    }
    // <<< dequeue

    bool isEmpty() { return count == 0; }
};

int main() {
    CircularQueue q;
    q.enqueue(10);
    q.enqueue(20);
    q.dequeue();
    return 0;
}
