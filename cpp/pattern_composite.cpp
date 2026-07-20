#include <iostream>
#include <vector>
#include <memory>
using namespace std;

// Component - common interface for leaves and composites
class Component {
protected:
    string m_name;

public:
    Component(const string& name) : m_name(name) {}
    virtual ~Component() {}
    virtual void operation(int depth = 0) const = 0;
};

// Leaf - has no children
class Leaf : public Component {
public:
    Leaf(const string& name) : Component(name) {}

    void operation(int depth = 0) const override {
        cout << string(depth * 2, ' ') << "Leaf: " << m_name << endl;
    }
};

// Composite - holds children and forwards operations recursively
class Composite : public Component {
private:
    vector<shared_ptr<Component>> m_children;

public:
    Composite(const string& name) : Component(name) {}

    void add(shared_ptr<Component> child) { m_children.push_back(child); }

    void remove(shared_ptr<Component> child) {
        // Remove child from list (implementation omitted for brevity)
    }

    void operation(int depth = 0) const override {
        cout << string(depth * 2, ' ') << "Composite: " << m_name << endl;
        for (const auto& child : m_children) {
            child->operation(depth + 1);
        }
    }
};

int main() {
    auto root = make_shared<Composite>("root");

    auto branchA = make_shared<Composite>("branchA");
    branchA->add(make_shared<Leaf>("leaf1"));
    branchA->add(make_shared<Leaf>("leaf2"));

    auto branchB = make_shared<Composite>("branchB");
    branchB->add(make_shared<Leaf>("leaf3"));

    root->add(branchA);
    root->add(branchB);
    root->add(make_shared<Leaf>("leaf4"));

    root->operation();

    return 0;
}
