#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cctype>
using namespace std;

// Filter — one transformation stage.
class Filter {
public:
    virtual string process(const string& input) const = 0;
    virtual ~Filter() {}
};

class TrimFilter : public Filter {
public:
    string process(const string& s) const override {
        size_t a = s.find_first_not_of(' ');
        size_t b = s.find_last_not_of(' ');
        return (a == string::npos) ? "" : s.substr(a, b - a + 1);
    }
};

class UpperFilter : public Filter {
public:
    string process(const string& s) const override {
        string r = s;
        transform(r.begin(), r.end(), r.begin(), ::toupper);
        return r;
    }
};

class ExclaimFilter : public Filter {
public:
    string process(const string& s) const override { return s + "!"; }
};

// Pipeline — chains filters; data flows through each pipe.
class Pipeline {
    vector<Filter*> filters;
public:
    void add(Filter* f) { filters.push_back(f); }
    string run(const string& input) const {
        string data = input;
        for (Filter* f : filters) data = f->process(data);
        return data;
    }
};

int main() {
    TrimFilter trim;
    UpperFilter upper;
    ExclaimFilter exclaim;
    Pipeline pipeline;
    pipeline.add(&trim);
    pipeline.add(&upper);
    pipeline.add(&exclaim);
    cout << pipeline.run("  hello  ") << endl;   // HELLO!
    return 0;
}
