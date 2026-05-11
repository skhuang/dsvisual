#include <iostream>
#include <memory>
using namespace std;

// Strategy interface
class PaymentStrategy {
public:
    virtual ~PaymentStrategy() {}
    virtual void pay(double amount) const = 0;
};

// Concrete Strategies
class CreditCardPayment : public PaymentStrategy {
private:
    string m_cardNumber;

public:
    CreditCardPayment(const string& cardNumber) : m_cardNumber(cardNumber) {}

    void pay(double amount) const override {
        cout << "Processing credit card payment: $" << amount 
             << " with card " << m_cardNumber.substr(m_cardNumber.length() - 4) << endl;
    }
};

class CryptoCurrencyPayment : public PaymentStrategy {
private:
    string m_walletAddress;

public:
    CryptoCurrencyPayment(const string& walletAddr) : m_walletAddress(walletAddr) {}

    void pay(double amount) const override {
        cout << "Processing cryptocurrency payment: " << amount << " BTC to wallet "
             << m_walletAddress.substr(0, 8) << "..." << endl;
    }
};

class PayPalPayment : public PaymentStrategy {
private:
    string m_email;

public:
    PayPalPayment(const string& email) : m_email(email) {}

    void pay(double amount) const override {
        cout << "Processing PayPal payment: $" << amount << " from " << m_email << endl;
    }
};

// Context
class PaymentProcessor {
private:
    shared_ptr<PaymentStrategy> m_strategy;

public:
    void setStrategy(shared_ptr<PaymentStrategy> strategy) {
        m_strategy = strategy;
    }

    void processPayment(double amount) {
        if (m_strategy) {
            m_strategy->pay(amount);
        } else {
            cout << "No payment strategy set!" << endl;
        }
    }
};

int main() {
    PaymentProcessor processor;

    // Strategy 1: Credit Card
    cout << "--- Using Credit Card ---" << endl;
    auto cc = make_shared<CreditCardPayment>("1234567890123456");
    processor.setStrategy(cc);
    processor.processPayment(99.99);

    // Strategy 2: Cryptocurrency
    cout << "\n--- Using Cryptocurrency ---" << endl;
    auto crypto = make_shared<CryptoCurrencyPayment>("1A1z7agoat2wtQW6wvV8x4L3yzH2Xkq68R");
    processor.setStrategy(crypto);
    processor.processPayment(0.005);

    // Strategy 3: PayPal
    cout << "\n--- Using PayPal ---" << endl;
    auto paypal = make_shared<PayPalPayment>("user@example.com");
    processor.setStrategy(paypal);
    processor.processPayment(50.00);

    return 0;
}
