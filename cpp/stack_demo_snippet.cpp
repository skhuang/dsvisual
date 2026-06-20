// cpp/stack_demo_snippet.cpp — self-contained runnable demo pulled into the notebook
// to exercise the code: single-source path.

// >>> demo
#include <iostream>
#include <vector>
class DemoStack {
    std::vector<int> v;
public:
    void push(int x) { v.push_back(x); }
    int  pop()       { int t = v.back(); v.pop_back(); return t; }
    bool empty() const { return v.empty(); }
};
DemoStack ds;
ds.push(1); ds.push(2); ds.push(3);
std::cout << "DemoStack pop sequence: ";
while (!ds.empty()) std::cout << ds.pop() << ' ';
std::cout << '\n';
// <<< demo
