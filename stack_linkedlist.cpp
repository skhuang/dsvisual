#include <iostream>
using namespace std;

// Node structure for Linked List
struct Node {
    int data;
    Node* next;
};

class StackLinkedList {
private:
    Node* head;

public:
    StackLinkedList() {
        head = nullptr; // Initialize stack as empty
    }

    bool isEmpty() {
        return head == nullptr;
    }

    void push(int value) {
        Node* newNode = new Node();
        newNode->data = value;
        newNode->next = head;
        head = newNode; // The new node becomes the top of the stack
        cout << "Pushed " << value << " onto linked list stack.\n";
    }

    void pop() {
        if (isEmpty()) {
            cout << "Stack Underflow! Cannot pop from empty stack.\n";
            return;
        }
        Node* temp = head;
        int poppedValue = head->data;
        head = head->next; // Move head to the next node
        delete temp;       // Free the memory
        cout << "Popped " << poppedValue << " from linked list stack.\n";
    }

    int peek() {
        if (isEmpty()) {
            cout << "Stack is empty." << endl;
            return -1;
        }
        return head->data;
    }
    
    // Destructor to clean up memory
    ~StackLinkedList() {
        while (!isEmpty()) {
            pop();
        }
    }
};

int main() {
    StackLinkedList stack;
    stack.push(100);
    stack.push(200);
    stack.push(300);
    stack.pop();
    cout << "Top element is: " << stack.peek() << endl;
    return 0;
}
