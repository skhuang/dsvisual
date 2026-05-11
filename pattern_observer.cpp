#include <iostream>
#include <vector>
#include <memory>
using namespace std;

// Observer interface
class Observer {
public:
    virtual ~Observer() {}
    virtual void update(const string& message) = 0;
};

// Subject
class Subject {
private:
    vector<shared_ptr<Observer>> m_observers;
    string m_state;

public:
    void attach(shared_ptr<Observer> observer) {
        m_observers.push_back(observer);
    }

    void detach(shared_ptr<Observer> observer) {
        // Remove observer from list (implementation omitted for brevity)
    }

    void setState(const string& state) {
        m_state = state;
        notify();
    }

    string getState() const {
        return m_state;
    }

private:
    void notify() {
        cout << "Subject state changed to: " << m_state << endl;
        for (auto observer : m_observers) {
            observer->update(m_state);
        }
    }
};

// Concrete Observers
class ConcreteObserverA : public Observer {
public:
    void update(const string& message) override {
        cout << "ObserverA received update: " << message << endl;
    }
};

class ConcreteObserverB : public Observer {
public:
    void update(const string& message) override {
        cout << "ObserverB received update: " << message << endl;
    }
};

class ConcreteObserverC : public Observer {
public:
    void update(const string& message) override {
        cout << "ObserverC received update: " << message << endl;
    }
};

int main() {
    auto subject = make_shared<Subject>();

    auto obs_a = make_shared<ConcreteObserverA>();
    auto obs_b = make_shared<ConcreteObserverB>();
    auto obs_c = make_shared<ConcreteObserverC>();

    subject->attach(obs_a);
    subject->attach(obs_b);
    subject->attach(obs_c);

    cout << "--- Setting state to 'Event1' ---" << endl;
    subject->setState("Event1");

    cout << "\n--- Setting state to 'Event2' ---" << endl;
    subject->setState("Event2");

    return 0;
}
