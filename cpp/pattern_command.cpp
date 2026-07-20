#include <iostream>
#include <memory>
#include <vector>
using namespace std;

// Receiver - knows how to perform the actual work
class Light {
private:
    string m_name;

public:
    Light(const string& name) : m_name(name) {}

    void on() const { cout << m_name << " light is ON" << endl; }
    void off() const { cout << m_name << " light is OFF" << endl; }
};

// Command interface
class Command {
public:
    virtual ~Command() {}
    virtual void execute() = 0;
    virtual void undo() = 0;
};

// Concrete Commands
class LightOnCommand : public Command {
private:
    Light& m_light;

public:
    LightOnCommand(Light& light) : m_light(light) {}

    void execute() override { m_light.on(); }
    void undo() override { m_light.off(); }
};

class LightOffCommand : public Command {
private:
    Light& m_light;

public:
    LightOffCommand(Light& light) : m_light(light) {}

    void execute() override { m_light.off(); }
    void undo() override { m_light.on(); }
};

// Invoker - triggers commands without knowing their concrete type
class RemoteControl {
private:
    vector<shared_ptr<Command>> m_history;

public:
    void submit(shared_ptr<Command> command) {
        command->execute();
        m_history.push_back(command);
    }

    void undoLast() {
        if (m_history.empty()) return;
        m_history.back()->undo();
        m_history.pop_back();
    }
};

int main() {
    Light kitchenLight("Kitchen");

    auto onCommand = make_shared<LightOnCommand>(kitchenLight);
    auto offCommand = make_shared<LightOffCommand>(kitchenLight);

    RemoteControl remote;
    remote.submit(onCommand);
    remote.submit(offCommand);

    cout << "--- Undo last command ---" << endl;
    remote.undoLast();

    return 0;
}
