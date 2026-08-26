#include <string>
#include <vector>
#include <functional>
#include <utility>

class CuckooHash
{
private:
    static constexpr int TABLE_SIZE = 11;

    std::vector<std::string> table1;
    std::vector<std::string> table2;

    int hash1(const std::string& key) const
    {
        return static_cast<int>(
            std::hash<std::string>{}(key) % TABLE_SIZE
        );
    }

    int hash2(const std::string& key) const
    {
        std::size_t h = std::hash<std::string>{}(key);
        return static_cast<int>((h / TABLE_SIZE) % TABLE_SIZE);
    }

public:
    CuckooHash()
        : table1(TABLE_SIZE), table2(TABLE_SIZE)
    {
    }

    bool insert(const std::string& key)
    {
        std::string current = key;

        for (int step = 0; step < TABLE_SIZE * 2; ++step)
        {
            int pos1 = hash1(current);

            if (table1[pos1].empty())
            {
                table1[pos1] = current;
                return true;
            }

            std::swap(table1[pos1], current);

            int pos2 = hash2(current);

            if (table2[pos2].empty())
            {
                table2[pos2] = current;
                return true;
            }

            std::swap(table2[pos2], current);
        }

        return false;
    }
};
