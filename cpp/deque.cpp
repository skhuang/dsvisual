#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* prev;
    Node* next;
    Node(int v) : val(v), prev(nullptr), next(nullptr) {}
};

class Deque {
private:
    Node* head;
    Node* tail;
    int count;

public:
    Deque() : head(nullptr), tail(nullptr), count(0) {}

    // >>> pushFront
    void pushFront(int v) {
        Node* node = new Node(v);
        if (!head) {
            head = tail = node;
        } else {
            node->next = head;
            head->prev = node;
            head = node;
        }
        count++;
    }
    // <<< pushFront

    // >>> pushBack
    void pushBack(int v) {
        Node* node = new Node(v);
        if (!tail) {
            head = tail = node;
        } else {
            node->prev = tail;
            tail->next = node;
            tail = node;
        }
        count++;
    }
    // <<< pushBack

    // >>> popFront
    int popFront() {
        if (!head) {
            cout << "Deque is empty" << endl;
            return -1;
        }
        Node* node = head;
        int v = node->val;
        head = head->next;
        if (head)
            head->prev = nullptr;
        else
            tail = nullptr;
        delete node;
        count--;
        return v;
    }
    // <<< popFront

    // >>> popBack
    int popBack() {
        if (!tail) {
            cout << "Deque is empty" << endl;
            return -1;
        }
        Node* node = tail;
        int v = node->val;
        tail = tail->prev;
        if (tail)
            tail->next = nullptr;
        else
            head = nullptr;
        delete node;
        count--;
        return v;
    }
    // <<< popBack

    void print() {
        cout << "null <-> ";
        for (Node* p = head; p; p = p->next)
            cout << p->val << " <-> ";
        cout << "null" << endl;
    }
};

int main() {
    Deque dq;
    dq.pushBack(10);
    dq.pushBack(20);
    dq.pushFront(5);
    dq.print(); // null <-> 5 <-> 10 <-> 20 <-> null
    dq.popBack();
    dq.popFront();
    dq.print(); // null <-> 10 <-> null
    return 0;
}
