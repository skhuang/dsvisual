#include <queue>
#include <vector>
#include <string>
#include <unordered_map>
struct HNode { int freq; char sym; HNode* l; HNode* r;
    HNode(int f, char s):freq(f),sym(s),l(nullptr),r(nullptr){} };
struct Cmp { bool operator()(HNode* a, HNode* b){ return a->freq > b->freq; } };

HNode* buildHuffman(const std::unordered_map<char,int>& freq) {
    std::priority_queue<HNode*, std::vector<HNode*>, Cmp> pq;
    for (auto& kv : freq) pq.push(new HNode(kv.second, kv.first));
    while (pq.size() > 1) {
        HNode* a = pq.top(); pq.pop();
        HNode* b = pq.top(); pq.pop();
        HNode* m = new HNode(a->freq + b->freq, '\0');
        m->l = a; m->r = b;
        pq.push(m);
    }
    return pq.empty() ? nullptr : pq.top();
}

void assignCodes(HNode* n, std::string p, std::unordered_map<char,std::string>& out) {
    if (!n) return;
    if (!n->l && !n->r) { out[n->sym] = p.empty() ? "0" : p; return; }
    assignCodes(n->l, p + "0", out);
    assignCodes(n->r, p + "1", out);
}
