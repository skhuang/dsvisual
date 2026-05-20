#include <iostream>
#include <mutex>
using namespace std;

class BankAccount {
public:
    explicit BankAccount(double initialBalance) : balance(initialBalance) {}

    void deposit(double amount) {
        lock_guard<mutex> guard(accountLock);
        if (amount > 0) {
            balance += amount;
            cout << "Deposited: " << amount << endl;
        }
    }

    bool withdraw(double amount) {
        lock_guard<mutex> guard(accountLock);
        if (canWithdraw(amount)) {
            balance -= amount;
            log("withdraw", amount);
            return true;
        }
        return false;
    }

    double getBalance() const { return balance; }

protected:
    bool canWithdraw(double amount) const { return amount > 0 && amount <= balance; }

private:
    void log(const string& type, double amount) const {
        cout << "Log: " << type << " " << amount << endl;
    }

    double balance;
    mutable mutex accountLock;
};

int main() {
    BankAccount account(1000.0);

    account.deposit(200.0);
    if (account.withdraw(150.0)) {
        cout << "Withdraw success" << endl;
    }

    cout << "Final balance: " << account.getBalance() << endl;
    return 0;
}
