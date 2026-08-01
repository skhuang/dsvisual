(function (global) {
  // ========== TREE ALGORITHMS IN JS ==========
  class TreeNode {
      constructor(val) { this.val = val; this.left = null; this.right = null; this.height = 1; this.color = 'red'; this.parent = null; this.id = 'tid-' + val; }
  }

  // BST
  function insertBST(node, v) {
      if(!node) return new TreeNode(v);
      if(v < node.val) node.left = insertBST(node.left, v);
      else if (v > node.val) node.right = insertBST(node.right, v);
      return node;
  }

  // AVL
  function getHeight(n) { return n ? n.height : 0; }
  function getBalance(n) { return n ? getHeight(n.left) - getHeight(n.right) : 0; }
  function rightRotate(y) {
      let x = y.left; let T2 = x.right; x.right = y; y.left = T2;
      y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1; x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
      return x;
  }
  function leftRotate(x) {
      let y = x.right; let T2 = y.left; y.left = x; x.right = T2;
      x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1; y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
      return y;
  }
  function insertAVL(node, val) {
      if(!node) return new TreeNode(val);
      if(val < node.val) node.left = insertAVL(node.left, val); else if(val > node.val) node.right = insertAVL(node.right, val); else return node;
      node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
      let bal = getBalance(node);
      if(bal > 1 && val < node.left.val) return rightRotate(node);
      if(bal < -1 && val > node.right.val) return leftRotate(node);
      if(bal > 1 && val > node.left.val) { node.left = leftRotate(node.left); return rightRotate(node); }
      if(bal < -1 && val < node.right.val) { node.right = rightRotate(node.right); return leftRotate(node); }
      return node;
  }

  // Splay
  function splayRightRotate(x) { let y = x.left; x.left = y.right; y.right = x; return y; }
  function splayLeftRotate(x) { let y = x.right; x.right = y.left; y.left = x; return y; }
  function splayNode(root, key) {
      if(!root || root.val === key) return root;
      if(root.val > key) {
          if(!root.left) return root;
          if(root.left.val > key) { root.left.left = splayNode(root.left.left, key); root = splayRightRotate(root); }
          else if(root.left.val < key) { root.left.right = splayNode(root.left.right, key); if(root.left.right) root.left = splayLeftRotate(root.left); }
          return root.left ? splayRightRotate(root) : root;
      } else {
          if(!root.right) return root;
          if(root.right.val > key) { root.right.left = splayNode(root.right.left, key); if(root.right.left) root.right = splayRightRotate(root.right); }
          else if(root.right.val < key) { root.right.right = splayNode(root.right.right, key); root = splayLeftRotate(root); }
          return root.right ? splayLeftRotate(root) : root;
      }
  }
  function insertSplay(root, k) {
      if(!root) return new TreeNode(k);
      root = splayNode(root, k);
      if(root.val === k) return root;
      let n = new TreeNode(k);
      if(root.val > k) { n.right = root; n.left = root.left; root.left = null; } else { n.left = root; n.right = root.right; root.right = null; }
      return n;
  }

  // (The former insertRB_Mock/assignRBColors "fake RB" coloring helpers were removed —
  // Red-Black is now the real CLRS observatory in js/tree_rb_viz.js, so the mock was dead.)

  const api = { TreeNode, insertBST, getHeight, getBalance, rightRotate, leftRotate,
    insertAVL, splayRightRotate, splayLeftRotate, splayNode, insertSplay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeAlgos = api;
  // Also expose as bare globals so existing app.js call sites keep working unchanged.
  Object.assign(global, api);
})(typeof window !== 'undefined' ? window : globalThis);
