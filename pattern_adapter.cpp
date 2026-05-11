#include <iostream>
using namespace std;

// Existing/Legacy system with incompatible interface
class LegacyDataSource {
public:
    string getDataLegacy() const {
        return "Legacy: Raw Binary Data [0x1A, 0x2B, 0x3C]";
    }
};

// Target interface that modern code expects
class ModernDataInterface {
public:
    virtual ~ModernDataInterface() {}
    virtual string fetch() = 0;
    virtual string getFormat() = 0;
};

// Adapter: Bridges the gap
class LegacyAdapter : public ModernDataInterface {
private:
    LegacyDataSource m_legacy;

public:
    string fetch() override {
        // Adapt legacy method call to modern interface
        return "Adapted: " + m_legacy.getDataLegacy();
    }

    string getFormat() override {
        return "Binary Format Adapted to JSON";
    }
};

int main() {
    // Modern code expects ModernDataInterface
    unique_ptr<ModernDataInterface> adapter = make_unique<LegacyAdapter>();

    cout << "Fetching data: " << adapter->fetch() << endl;
    cout << "Format: " << adapter->getFormat() << endl;

    // Adapter allows using legacy system with modern code without modification
    return 0;
}
