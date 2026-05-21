#include <iostream>
#include <string>
using namespace std;

// Model — owns the data.
class Model {
    string data;
public:
    void setData(const string& d) { data = d; }
    string getData() const { return data; }
};

// View — renders the model.
class View {
public:
    void render(const Model& m) {
        cout << "[View] " << m.getData() << endl;
    }
};

// Controller — handles input, updates the model, refreshes the view.
class Controller {
    Model& model;
    View& view;
public:
    Controller(Model& m, View& v) : model(m), view(v) {}
    void handleInput(const string& input) {
        model.setData(input);
        view.render(model);
    }
};

int main() {
    Model model;
    View view;
    Controller controller(model, view);
    controller.handleInput("Hello, MVC");    // [View] Hello, MVC
    controller.handleInput("Updated text");  // [View] Updated text
    return 0;
}
