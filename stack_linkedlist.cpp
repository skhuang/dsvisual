#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class StackLinkedList {
private:
    Node* topNode;

public:
    StackLinkedList() {
        topNode = nullptr;
    }

    void push(int val) {
        Node* newNode = new Node(val);
        newNode->next = topNode;
        topNode = newNode;
        cout << "Pushed " << val << endl;
    }

    int pop() {
        if (!topNode) {
            cout << "Stack Underflow!" << endl;
            return -1;
        }
        int val = topNode->data;
        Node* temp = topNode;
        topNode = topNode->next;
        delete temp;
        cout << "Popped " << val << endl;
        return val;
    }

    bool isEmpty() {
        return topNode == nullptr;
    }
};

int main() {
    StackLinkedList s;
    s.push(10);
    s.push(20);
    s.pop();
    return 0;
}
