#include <iostream>
#include <string>
#include <functional>
#include <vector>
using namespace std;

// Event bus — decouples publishers from subscribers.
class EventBus {
    vector<function<void(const string&)>> subscribers;
public:
    void subscribe(function<void(const string&)> handler) {
        subscribers.push_back(handler);
    }
    void publish(const string& event) {
        for (auto& handler : subscribers) handler(event);
    }
};

int main() {
    EventBus bus;
    // Two subscribers — neither knows the publisher or each other.
    bus.subscribe([](const string& e) { cout << "Subscriber A got: " << e << endl; });
    bus.subscribe([](const string& e) { cout << "Subscriber B got: " << e << endl; });
    // Publisher emits through the bus.
    bus.publish("user.signed_in");
    return 0;
}
