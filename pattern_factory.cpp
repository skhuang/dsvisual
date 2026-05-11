#include <iostream>
#include <memory>
using namespace std;

// Abstract Product
class Vehicle {
public:
    virtual ~Vehicle() {}
    virtual void display() const = 0;
};

// Concrete Products
class Car : public Vehicle {
public:
    void display() const override {
        cout << "[Car] 4 wheels, sedan, engine: V6" << endl;
    }
};

class Truck : public Vehicle {
public:
    void display() const override {
        cout << "[Truck] 4 wheels, cargo bed, engine: Diesel" << endl;
    }
};

class Bike : public Vehicle {
public:
    void display() const override {
        cout << "[Bike] 2 wheels, lightweight, engine: Gasoline" << endl;
    }
};

// Factory Method
class VehicleFactory {
public:
    static unique_ptr<Vehicle> createVehicle(const string& type) {
        if (type == "car")
            return make_unique<Car>();
        else if (type == "truck")
            return make_unique<Truck>();
        else if (type == "bike")
            return make_unique<Bike>();
        return nullptr;
    }
};

int main() {
    // Client code doesn't know concrete classes, only uses factory
    unique_ptr<Vehicle> v1 = VehicleFactory::createVehicle("car");
    unique_ptr<Vehicle> v2 = VehicleFactory::createVehicle("truck");
    unique_ptr<Vehicle> v3 = VehicleFactory::createVehicle("bike");

    if (v1) v1->display();
    if (v2) v2->display();
    if (v3) v3->display();

    return 0;
}
