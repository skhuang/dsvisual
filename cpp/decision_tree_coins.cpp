#include <iostream>
#include <array>

// The 8-coins puzzle as a ternary decision tree (Horowitz & Sahni EIGHTCOINS).
// One of coins a..h is counterfeit (heavier or lighter); find it in 3 weighings.
struct Result { char coin; bool heavy; };

// z is a known-good coin; exactly one of x,y is the fake.
Result comp(int x, char lx, int y, char ly, int z) {
    if (x > z) return { lx, true };
    else       return { ly, false };
}

// weights a..h at indices 0..7 (base value, the fake is ±1).
Result eightCoins(const std::array<int, 8>& w) {
    int a = w[0], b = w[1], c = w[2], d = w[3], e = w[4], f = w[5], g = w[6], h = w[7];
    if (a + b + c == d + e + f) {                    // fake in {g, h}
        return (g > h) ? comp(g, 'g', h, 'h', a) : comp(h, 'h', g, 'g', a);
    } else if (a + b + c > d + e + f) {              // abc side heavier
        if (a + d == b + e) return comp(c, 'c', f, 'f', a);
        else if (a + d > b + e) return comp(a, 'a', e, 'e', b);
        else return comp(b, 'b', d, 'd', a);
    } else {                                          // def side heavier
        if (a + d == b + e) return comp(f, 'f', c, 'c', a);
        else if (a + d > b + e) return comp(d, 'd', b, 'b', a);
        else return comp(e, 'e', a, 'a', b);
    }
}
