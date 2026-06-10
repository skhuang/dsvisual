#include <vector>

// Polynomial addition by merging two exponent-descending term lists.
struct Term { int coef, exp; };

std::vector<Term> padd(const std::vector<Term>& A, const std::vector<Term>& B) {
    std::vector<Term> C;
    size_t i = 0, j = 0;
    while (i < A.size() && j < B.size()) {
        if (A[i].exp > B[j].exp) C.push_back(A[i++]);
        else if (A[i].exp < B[j].exp) C.push_back(B[j++]);
        else {
            int sum = A[i].coef + B[j].coef;
            if (sum != 0) C.push_back({ sum, A[i].exp });
            i++; j++;
        }
    }
    while (i < A.size()) C.push_back(A[i++]);
    while (j < B.size()) C.push_back(B[j++]);
    return C;
}
