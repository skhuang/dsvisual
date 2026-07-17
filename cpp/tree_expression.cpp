#include <stack>
#include <string>
#include <sstream>
#include <cctype>
#include <iostream>
#include <map>
#include <set>
#include <vector>

// Build an expression tree from a postfix expression using a stack of subtrees.
struct ENode {
    std::string val;
    ENode* left = nullptr;
    ENode* right = nullptr;
};

ENode* buildExprTree(const std::string& postfix) {
    std::stack<ENode*> st;
    std::istringstream in(postfix);
    std::string tok;
    auto isOp = [](const std::string& s) {
        return s == "+" || s == "-" || s == "*" || s == "/";
    };
    while (in >> tok) {
        ENode* n = new ENode{ tok, nullptr, nullptr };
        if (isOp(tok)) {
            n->right = st.top(); st.pop();
            n->left = st.top(); st.pop();
        }
        st.push(n);
    }
    return st.empty() ? nullptr : st.top();
}

double evalExprTree(ENode* n) {
    if (!n) return 0;
    if (!n->left && !n->right) return std::stod(n->val);
    double a = evalExprTree(n->left), b = evalExprTree(n->right);
    if (n->val == "+") return a + b;
    if (n->val == "-") return a - b;
    if (n->val == "*") return a * b;
    return a / b;
}

// ---- Boolean (propositional) expression tree: build, evaluate, satisfiability ----
struct BNode {
    std::string val;                 // "&","|","!","^",">", a variable name, or "0"/"1"
    BNode* left = nullptr;
    BNode* right = nullptr;
};

static bool isBoolOp(const std::string& s) {
    return s == "&" || s == "|" || s == "!" || s == "^" || s == ">";
}

BNode* buildBoolExprTree(const std::string& postfix) {
    std::stack<BNode*> st;
    std::istringstream in(postfix);
    std::string tok;
    while (in >> tok) {
        BNode* n = new BNode{ tok, nullptr, nullptr };
        if (tok == "!") {                       // unary NOT
            n->left = st.top(); st.pop();
        } else if (isBoolOp(tok)) {             // binary op
            n->right = st.top(); st.pop();
            n->left = st.top(); st.pop();
        }
        st.push(n);
    }
    return st.empty() ? nullptr : st.top();
}

int evalBool(BNode* n, const std::map<std::string, int>& asg) {
    if (!n) return 0;
    if (!n->left && !n->right) {                // leaf: constant or variable
        if (n->val == "1") return 1;
        if (n->val == "0") return 0;
        auto it = asg.find(n->val);
        return it == asg.end() ? 0 : it->second;
    }
    if (n->val == "!") return evalBool(n->left, asg) ? 0 : 1;
    int a = evalBool(n->left, asg), b = evalBool(n->right, asg);
    if (n->val == "&") return a && b;
    if (n->val == "|") return a || b;
    if (n->val == "^") return a != b;           // XOR
    if (n->val == ">") return (!a) || b;        // implication
    return 0;
}

void collectVars(BNode* n, std::set<std::string>& vars) {
    if (!n) return;
    if (!n->left && !n->right && n->val != "0" && n->val != "1") vars.insert(n->val);
    collectVars(n->left, vars);
    collectVars(n->right, vars);
}

// Sweep all 2^k assignments and classify the formula.
void satReport(BNode* root) {
    std::set<std::string> vs;
    collectVars(root, vs);
    std::vector<std::string> vars(vs.begin(), vs.end());
    int k = (int)vars.size(), total = 1 << k, trues = 0;
    for (int mask = 0; mask < total; ++mask) {
        std::map<std::string, int> asg;
        for (int i = 0; i < k; ++i) asg[vars[i]] = (mask >> (k - 1 - i)) & 1;
        trues += evalBool(root, asg);
    }
    std::cout << (trues == total ? "tautology"
                : trues == 0     ? "contradiction (unsatisfiable)"
                                 : "contingent (satisfiable)") << "\n";
}
