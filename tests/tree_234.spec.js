const test = require('node:test');
const assert = require('node:assert');

// 測試 2-3-4 樹資料結構邏輯
class Node234 {
  constructor() {
    this.keys = [];
    this.children = [];
  }
  isLeaf() { return this.children.length === 0; }
  isFull() { return this.keys.length === 3; }
}

class Tree234 {
  constructor() {
    this.root = new Node234();
  }

  insert(key) {
    if (this.root.isFull()) {
      const oldRoot = this.root;
      const newRoot = new Node234();
      this.root = newRoot;
      newRoot.children.push(oldRoot);
      this._splitChild(newRoot, 0);
    }
    this._insertNonFull(this.root, key);
  }

  _splitChild(parent, idx) {
    const fullChild = parent.children[idx];
    const leftChild = new Node234();
    const rightChild = new Node234();

    leftChild.keys = [fullChild.keys[0]];
    const middleKey = fullChild.keys[1];
    rightChild.keys = [fullChild.keys[2]];

    if (!fullChild.isLeaf()) {
      leftChild.children = [fullChild.children[0], fullChild.children[1]];
      rightChild.children = [fullChild.children[2], fullChild.children[3]];
    }

    parent.keys.splice(idx, 0, middleKey);
    parent.children.splice(idx, 1, leftChild, rightChild);
  }

  _insertNonFull(node, key) {
    let i = node.keys.length - 1;
    if (node.isLeaf()) {
      node.keys.push(key);
      node.keys.sort((a, b) => a - b);
      return;
    }
    while (i >= 0 && key < node.keys[i]) i--;
    i++;
    if (node.children[i].isFull()) {
      this._splitChild(node, i);
      if (key > node.keys[i]) i++;
    }
    this._insertNonFull(node.children[i], key);
  }

  inorder(node = this.root, acc = []) {
    if (!node) return acc;
    if (node.isLeaf()) {
      acc.push(...node.keys);
      return acc;
    }
    for (let i = 0; i < node.keys.length; i++) {
      this.inorder(node.children[i], acc);
      acc.push(node.keys[i]);
    }
    this.inorder(node.children[node.keys.length], acc);
    return acc;
  }
}

test('2-3-4 Tree: handles top-down splits and keeps elements sorted', () => {
  const tree = new Tree234();
  const input = [10, 20, 30, 40, 50, 60, 70, 80];
  input.forEach(x => tree.insert(x));

  const sorted = tree.inorder();
  assert.deepStrictEqual(sorted, [10, 20, 30, 40, 50, 60, 70, 80]);
  assert.ok(tree.root.keys.length > 0);
});
