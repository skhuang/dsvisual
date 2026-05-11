#include <iostream>
#include <memory>
using namespace std;

// Component interface
class Coffee {
public:
    virtual ~Coffee() {}
    virtual string getDescription() const = 0;
    virtual double getCost() const = 0;
};

// Concrete Component
class SimpleCoffee : public Coffee {
public:
    string getDescription() const override {
        return "Simple Coffee";
    }

    double getCost() const override {
        return 2.00;
    }
};

// Decorator base class
class CoffeeDecorator : public Coffee {
protected:
    shared_ptr<Coffee> m_coffee;

public:
    CoffeeDecorator(shared_ptr<Coffee> coffee) : m_coffee(coffee) {}
};

// Concrete Decorators
class MilkDecorator : public CoffeeDecorator {
public:
    MilkDecorator(shared_ptr<Coffee> coffee) : CoffeeDecorator(coffee) {}

    string getDescription() const override {
        return m_coffee->getDescription() + " + Milk";
    }

    double getCost() const override {
        return m_coffee->getCost() + 0.50;
    }
};

class SugarDecorator : public CoffeeDecorator {
public:
    SugarDecorator(shared_ptr<Coffee> coffee) : CoffeeDecorator(coffee) {}

    string getDescription() const override {
        return m_coffee->getDescription() + " + Sugar";
    }

    double getCost() const override {
        return m_coffee->getCost() + 0.25;
    }
};

class WhippedCreamDecorator : public CoffeeDecorator {
public:
    WhippedCreamDecorator(shared_ptr<Coffee> coffee) : CoffeeDecorator(coffee) {}

    string getDescription() const override {
        return m_coffee->getDescription() + " + Whipped Cream";
    }

    double getCost() const override {
        return m_coffee->getCost() + 0.75;
    }
};

int main() {
    // Create base coffee
    shared_ptr<Coffee> coffee = make_shared<SimpleCoffee>();
    cout << coffee->getDescription() << " => $" << coffee->getCost() << endl;

    // Decorate with milk
    coffee = make_shared<MilkDecorator>(coffee);
    cout << coffee->getDescription() << " => $" << coffee->getCost() << endl;

    // Add sugar
    coffee = make_shared<SugarDecorator>(coffee);
    cout << coffee->getDescription() << " => $" << coffee->getCost() << endl;

    // Add whipped cream
    coffee = make_shared<WhippedCreamDecorator>(coffee);
    cout << coffee->getDescription() << " => $" << coffee->getCost() << endl;

    return 0;
}
