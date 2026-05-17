// Structured slide content source. Hand-written.
// Consumed only by build_slides.js (Node). Do NOT load this in the browser.
// Text leaves are { zh, en } and may embed inline $...$ LaTeX.

const SLIDES_DB = {
  'stack-array': {
    category: 'Basic Linear Structures',
    title: { zh: '堆疊(陣列實作)', en: 'Stack (Array Implementation)' },
    slides: [
      {
        heading: { zh: '堆疊(陣列實作)', en: 'Stack (Array Implementation)' },
        blocks: [
          { type: 'paragraph', text: {
            zh: '堆疊是一種 LIFO(後進先出)的線性結構,如同一疊盤子:最後放上的最先被取下。',
            en: 'A stack is a LIFO (Last In, First Out) linear structure, like a pile of plates: the last one placed is the first removed.' } },
        ],
      },
      {
        heading: { zh: '核心概念', en: 'Core Concept' },
        blocks: [
          { type: 'paragraph', text: {
            zh: '陣列實作用一塊固定大小的連續記憶體,搭配一個整數索引 `top` 指向頂端元素。',
            en: 'The array implementation uses a fixed-size contiguous block of memory plus an integer index `top` pointing at the top element.' } },
          { type: 'bullets', items: [
            { zh: '`top` 初始為 -1,代表空堆疊。', en: '`top` starts at -1, meaning the stack is empty.' },
            { zh: '`push` 先遞增 `top` 再寫入;`pop` 先讀取再遞減 `top`。', en: '`push` increments `top` then writes; `pop` reads then decrements `top`.' },
            { zh: '容量固定,推入超過上限會發生 Stack Overflow。', en: 'Capacity is fixed; pushing beyond the limit causes a Stack Overflow.' },
          ] },
        ],
      },
      {
        heading: { zh: '運作流程', en: 'Operation Flow' },
        blocks: [
          { type: 'steps', items: [
            { zh: '檢查 `top` 是否已達容量上限,若是則拒絕推入。', en: 'Check whether `top` has reached capacity; if so, reject the push.' },
            { zh: '遞增 `top`,將新值寫入 `arr[top]`。', en: 'Increment `top` and write the new value into `arr[top]`.' },
            { zh: '彈出時讀取 `arr[top]`,再將 `top` 遞減。', en: 'To pop, read `arr[top]`, then decrement `top`.' },
          ] },
          { type: 'mermaid', code: 'flowchart LR\n  E["Empty top=-1"] -->|push a| A["top=0"]\n  A -->|push b| B["top=1"]\n  B -->|pop| A' },
        ],
      },
      {
        heading: { zh: '記憶體結構', en: 'Memory Layout' },
        blocks: [
          { type: 'svg', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 70" width="320" height="70"><g font-family="sans-serif" font-size="13"><rect x="10" y="20" width="50" height="30" fill="#dbeafe" stroke="#2563eb"/><rect x="60" y="20" width="50" height="30" fill="#dbeafe" stroke="#2563eb"/><rect x="110" y="20" width="50" height="30" fill="#fff" stroke="#94a3b8"/><rect x="160" y="20" width="50" height="30" fill="#fff" stroke="#94a3b8"/><text x="35" y="40" text-anchor="middle">a</text><text x="85" y="40" text-anchor="middle">b</text><text x="85" y="15" text-anchor="middle" fill="#2563eb">top</text></g></svg>' },
          { type: 'note', text: {
            zh: '藍色為已使用的格子,白色為閒置空間;`top` 永遠指向最後一個有效元素。',
            en: 'Blue cells are occupied, white cells are free; `top` always points at the last valid element.' } },
        ],
      },
      {
        heading: { zh: '複雜度分析', en: 'Complexity Analysis' },
        blocks: [
          { type: 'table',
            headers: [ { zh: '操作', en: 'Operation' }, { zh: '時間', en: 'Time' }, { zh: '空間', en: 'Space' } ],
            rows: [
              [ { zh: 'push', en: 'push' }, { zh: '$O(1)$', en: '$O(1)$' }, { zh: '$O(N)$', en: '$O(N)$' } ],
              [ { zh: 'pop', en: 'pop' }, { zh: '$O(1)$', en: '$O(1)$' }, { zh: '$O(1)$', en: '$O(1)$' } ],
            ] },
          { type: 'math', tex: 'T_{\\text{push}}(n) = O(1)', caption: {
            zh: '每次推入只做常數次運算,與堆疊大小無關。',
            en: 'Each push performs a constant number of operations, independent of stack size.' } },
        ],
      },
      {
        heading: { zh: '程式碼', en: 'Source Code' },
        blocks: [
          { type: 'code', lang: 'cpp', code: 'bool push(int val) {\n    if (topIndex >= MAX_SIZE - 1) {\n        cout << "Stack Overflow!" << endl;\n        return false;\n    }\n    arr[++topIndex] = val;\n    return true;\n}\n\nint pop() {\n    if (topIndex < 0) return -1;\n    return arr[topIndex--];\n}' },
        ],
      },
      {
        heading: { zh: '優缺點與使用時機', en: 'Pros, Cons & When to Use' },
        blocks: [
          { type: 'bullets', items: [
            { zh: '優點:記憶體連續、無指標額外開銷,快取友善。', en: 'Pro: contiguous memory, no pointer overhead, cache-friendly.' },
            { zh: '缺點:容量固定,需事先決定大小。', en: 'Con: fixed capacity, size must be decided in advance.' },
            { zh: '適用:容量上限已知的場景,如函式呼叫堆疊、括號配對。', en: 'Use when the maximum size is known, e.g. call stacks, bracket matching.' },
          ] },
        ],
      },
      {
        heading: { zh: '小結', en: 'Summary' },
        blocks: [
          { type: 'bullets', items: [
            { zh: 'LIFO:以單一 `top` 索引管理頂端。', en: 'LIFO: a single `top` index manages the top.' },
            { zh: 'push / pop 皆為 $O(1)$。', en: 'Both push and pop are $O(1)$.' },
            { zh: '固定容量是與鏈結串列實作的主要差異。', en: 'Fixed capacity is the key difference from the linked-list implementation.' },
          ] },
        ],
      },
    ],
  },
};

module.exports = SLIDES_DB;
