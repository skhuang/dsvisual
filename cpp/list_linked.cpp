#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class LinkedList {
private:
    Node* head;

public:
    LinkedList() : head(nullptr) {}

    void insert(int index, int val) {
        Node* newNode = new Node(val);
        if (index == 0) {
            newNode->next = head;
            head = newNode;
            return;
        }
        Node* temp = head;
        for (int i = 0; temp != nullptr && i < index - 1; i++) {
            temp = temp->next;
        }
        if (!temp)
            return; // Out of bounds
        newNode->next = temp->next;
        temp->next = newNode;
    }

    void remove(int index) {
        if (!head)
            return;
        if (index == 0) {
            Node* temp = head;
            head = head->next;
            delete temp;
            return;
        }
        Node* temp = head;
        for (int i = 0; temp != nullptr && i < index - 1; i++) {
            temp = temp->next;
        }
        if (!temp || !temp->next)
            return;
        Node* delNode = temp->next;
        temp->next = delNode->next;
        delete delNode;
    }
};

int main() {
    LinkedList list;
    list.insert(0, 10);
    list.insert(1, 20);
    list.remove(0);
    return 0;
}
