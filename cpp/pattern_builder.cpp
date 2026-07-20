#include <iostream>
#include <memory>
using namespace std;

// Product
class House {
private:
    string m_walls;
    string m_roof;
    string m_interior;

public:
    void setWalls(const string& walls) { m_walls = walls; }
    void setRoof(const string& roof) { m_roof = roof; }
    void setInterior(const string& interior) { m_interior = interior; }

    void show() const {
        cout << "House [walls=" << m_walls << ", roof=" << m_roof
             << ", interior=" << m_interior << "]" << endl;
    }
};

// Builder interface
class HouseBuilder {
public:
    virtual ~HouseBuilder() {}
    virtual void buildWalls() = 0;
    virtual void buildRoof() = 0;
    virtual void buildInterior() = 0;
    virtual shared_ptr<House> getResult() = 0;
};

// Concrete Builder
class WoodenHouseBuilder : public HouseBuilder {
private:
    shared_ptr<House> m_house;

public:
    WoodenHouseBuilder() { m_house = make_shared<House>(); }

    void buildWalls() override { m_house->setWalls("Wooden Walls"); }
    void buildRoof() override { m_house->setRoof("Wooden Shingle Roof"); }
    void buildInterior() override { m_house->setInterior("Rustic Interior"); }

    shared_ptr<House> getResult() override { return m_house; }
};

class ConcreteHouseBuilder : public HouseBuilder {
private:
    shared_ptr<House> m_house;

public:
    ConcreteHouseBuilder() { m_house = make_shared<House>(); }

    void buildWalls() override { m_house->setWalls("Concrete Walls"); }
    void buildRoof() override { m_house->setRoof("Flat Concrete Roof"); }
    void buildInterior() override { m_house->setInterior("Modern Interior"); }

    shared_ptr<House> getResult() override { return m_house; }
};

// Director - orchestrates the build steps in a fixed order
class Director {
public:
    shared_ptr<House> construct(HouseBuilder& builder) {
        builder.buildWalls();
        builder.buildRoof();
        builder.buildInterior();
        return builder.getResult();
    }
};

int main() {
    Director director;

    WoodenHouseBuilder woodenBuilder;
    auto woodenHouse = director.construct(woodenBuilder);
    cout << "--- Wooden House ---" << endl;
    woodenHouse->show();

    ConcreteHouseBuilder concreteBuilder;
    auto concreteHouse = director.construct(concreteBuilder);
    cout << "--- Concrete House ---" << endl;
    concreteHouse->show();

    return 0;
}
