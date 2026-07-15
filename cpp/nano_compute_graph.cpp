#include <iostream>
#include <vector>
using namespace std;

enum class Op { Const, Add, Mul };

// A tiny computation graph: nodes are built bottom-up, then a DFS from the
// output node (build_forward) produces a topological order, and compute()
// evaluates every node exactly once in that order.
class ComputeGraph {
public:
    int constant(double v)   { return addNode(Op::Const, -1, -1, v); }
    int add(int a, int b)    { return addNode(Op::Add, a, b); }
    int mul(int a, int b)    { return addNode(Op::Mul, a, b); }

    // DFS post-order from the output node => topologically sorted order_.
    void build_forward(int output) {
        order_.clear();
        vector<char> seen(nodes_.size(), 0);
        visit(output, seen);
    }

    void compute() {
        for (int id : order_) {
            GNode& n = nodes_[id];
            switch (n.op) {
                case Op::Const: break;                                    // value preset
                case Op::Add:   n.value = nodes_[n.src0].value + nodes_[n.src1].value; break;
                case Op::Mul:   n.value = nodes_[n.src0].value * nodes_[n.src1].value; break;
            }
        }
    }

    double value(int node) const { return nodes_[node].value; }
    const vector<int>& order() const { return order_; }

private:
    struct GNode { Op op; int src0; int src1; double value; };
    vector<GNode> nodes_;
    vector<int>   order_;

    int addNode(Op op, int a, int b, double v = 0.0) {
        nodes_.push_back(GNode{op, a, b, v});
        return static_cast<int>(nodes_.size()) - 1;
    }

    void visit(int node, vector<char>& seen) {
        if (seen[node]) return;                     // dedup shared nodes
        seen[node] = 1;
        const GNode& n = nodes_[node];
        if (n.src0 >= 0) visit(n.src0, seen);       // parents first
        if (n.src1 >= 0) visit(n.src1, seen);
        order_.push_back(node);                     // post-order => topological
    }
};

int main() {
    // Build:  a = 2, b = 3, c = 4
    //         d = a + b        (= 5)
    //         e = d * c        (= 20)
    ComputeGraph g;
    int a = g.constant(2.0);
    int b = g.constant(3.0);
    int c = g.constant(4.0);
    int d = g.add(a, b);
    int e = g.mul(d, c);

    g.build_forward(e);
    g.compute();

    cout << "topological order: ";
    for (int id : g.order()) cout << id << " ";
    cout << "\n";
    cout << "d = a + b = " << g.value(d) << "\n";
    cout << "e = d * c = " << g.value(e) << "\n";
    return 0;
}
