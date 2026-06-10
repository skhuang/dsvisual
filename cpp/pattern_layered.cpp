#include <iostream>
#include <string>
using namespace std;

// Data layer — lowest layer, returns raw data.
class DataLayer {
public:
    string fetch() { return "raw record"; }
};

// Business layer — applies rules; calls only the layer below.
class BusinessLayer {
    DataLayer data;

public:
    string process() { return "[validated] " + data.fetch(); }
};

// Presentation layer — formats output; calls only the layer below.
class PresentationLayer {
    BusinessLayer business;

public:
    void show() { cout << "Display: " << business.process() << endl; }
};

int main() {
    PresentationLayer ui;
    ui.show(); // Display: [validated] raw record
    return 0;
}
