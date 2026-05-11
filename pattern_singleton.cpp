#include <iostream>
#include <mutex>
using namespace std;

class Singleton {
private:
    static Singleton* m_instance;
    static mutex m_mutex;
    int m_value;

    // Private constructor - prevents external instantiation
    Singleton() : m_value(0) {
        cout << "Singleton constructor called" << endl;
    }

public:
    // Prevent copying
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

    // Get singleton instance with thread-safe lazy initialization
    static Singleton* getInstance() {
        lock_guard<mutex> lock(m_mutex);
        if (m_instance == nullptr) {
            m_instance = new Singleton();
            cout << "Created new Singleton instance" << endl;
        } else {
            cout << "Returning existing Singleton instance" << endl;
        }
        return m_instance;
    }

    void setValue(int val) { 
        m_value = val; 
    }

    int getValue() const { 
        return m_value; 
    }

    ~Singleton() {
        cout << "Singleton destructor called" << endl;
    }
};

// Static member initialization
Singleton* Singleton::m_instance = nullptr;
mutex Singleton::m_mutex;

int main() {
    Singleton* s1 = Singleton::getInstance();
    s1->setValue(42);
    cout << "s1 value: " << s1->getValue() << endl;

    Singleton* s2 = Singleton::getInstance();
    cout << "s2 value: " << s2->getValue() << endl;

    cout << "Same object: " << (s1 == s2 ? "YES" : "NO") << endl;

    return 0;
}
