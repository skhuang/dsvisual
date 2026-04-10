const fs = require('fs');

const mappings = {
    'search_linear.cpp': 'codeSearchLinear',
    'search_binary.cpp': 'codeSearchBinary',
    'sort_bubble.cpp': 'codeSortBubble',
    'sort_selection.cpp': 'codeSortSelect',
    'sort_insertion.cpp': 'codeSortInsert',
    'sort_quick.cpp': 'codeSortQuick',
    'sort_merge.cpp': 'codeSortMerge',
    'sort_shell.cpp': 'codeSortShell',
    'tree_bst.cpp': 'codeTreeBST',
    'tree_avl.cpp': 'codeTreeAVL',
    'tree_rb.cpp': 'codeTreeRB',
    'tree_splay.cpp': 'codeTreeSplay'
};

let out = '// Auto-generated code DB for visualization\\n';
for (const [file, varName] of Object.entries(mappings)) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        out += `const ${varName} = \`${content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;\n\n`;
    }
}

out += `const codeArray = \`#include <iostream>\\nusing namespace std;\\n#define MAX_SIZE 5\\n\\nclass StackArray {\\n// ...\\n};\`;\n`;
out += `const codeLinkedList = \`#include <iostream>\\nusing namespace std;\\nstruct Node { int data; Node* next; };\\n\\nclass StackLinkedList {\\n// ...\\n};\`;\n`;
out += `const codeQueue = \`#include <iostream>\\nusing namespace std;\\n// ...\\n};\`;\n`;
out += `const codeGraph = \`#include <iostream>\\n#include <vector>\\nusing namespace std;\\n// ...\\n};\`;\n`;
out += `const codeListArray = \`#include <iostream>\\nusing namespace std;\\n// ...\\n};\`;\n`;
out += `const codeListLinked = \`#include <iostream>\\nusing namespace std;\\n// ...\\n};\`;\n`;

fs.writeFileSync('code_db.js', out);
