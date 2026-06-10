#include <iostream>
using namespace std;

class Animal {
public:
    Animal() { cout << "Animal constructor" << endl; }
    virtual ~Animal() { cout << "Animal destructor" << endl; }

    virtual void speak() { cout << "Animal sound" << endl; }
};

class Dog : public Animal {
public:
    Dog() { cout << "Dog constructor" << endl; }
    ~Dog() override { cout << "Dog destructor" << endl; }

    void speak() override { cout << "Woof" << endl; }
};

class Cat : public Animal {
public:
    Cat() { cout << "Cat constructor" << endl; }
    ~Cat() override { cout << "Cat destructor" << endl; }

    void speak() override { cout << "Meow" << endl; }
};

int main() {
    Animal* animals[2];
    animals[0] = new Dog();
    animals[1] = new Cat();

    for (int i = 0; i < 2; i++) {
        animals[i]->speak();
        delete animals[i];
    }

    return 0;
}
