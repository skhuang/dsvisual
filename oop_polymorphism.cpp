#include <iostream>
#include <vector>
using namespace std;

class Shape {
public:
    virtual ~Shape() {}

    virtual void draw() const = 0;
    virtual double area() const = 0;
};

class Circle : public Shape {
private:
    double radius;
public:
    explicit Circle(double r) : radius(r) {}

    void draw() const override {
        cout << "Drawing Circle(" << radius << ")" << endl;
    }

    double area() const override {
        return 3.14159 * radius * radius;
    }
};

class Rectangle : public Shape {
private:
    double width;
    double height;
public:
    Rectangle(double w, double h) : width(w), height(h) {}

    void draw() const override {
        cout << "Drawing Rectangle(" << width << ", " << height << ")" << endl;
    }

    double area() const override {
        return width * height;
    }
};

int main() {
    vector<Shape*> shapes;
    shapes.push_back(new Circle(5.0));
    shapes.push_back(new Rectangle(4.0, 6.0));

    for (const auto* shape : shapes) {
        shape->draw();
        cout << "Area: " << shape->area() << endl;
    }

    for (auto* shape : shapes) {
        delete shape;
    }

    return 0;
}
