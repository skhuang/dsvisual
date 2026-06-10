#include <iostream>
#include <string>
using namespace std;

// Service — an abstraction the consumer depends on.
class Service {
public:
    virtual string fetch() const = 0;
    virtual ~Service() {}
};

// A concrete implementation.
class ConsoleService : public Service {
public:
    string fetch() const override { return "data from ConsoleService"; }
};

// Consumer — receives its dependency; never constructs it.
class Consumer {
    Service& service; // depends on the abstraction
public:
    Consumer(Service& s) : service(s) {} // constructor injection
    void run() { cout << "Consumer used: " << service.fetch() << endl; }
};

int main() {
    // Composition root — wires concrete implementations to abstractions.
    ConsoleService service;
    Consumer consumer(service); // dependency injected, not hard-coded
    consumer.run();
    return 0;
}
