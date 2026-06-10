(function (global) {
  function buildFibSearchFrames(arr, target) {
    const n = arr.length;
    const frames = [];
    let fib2 = 0, fib1 = 1, fibM = fib2 + fib1;
    while (fibM < n) { fib2 = fib1; fib1 = fibM; fibM = fib2 + fib1; }
    let offset = -1, foundIndex = -1;
    const snap = (probe, msg) => frames.push({ probe, lo: offset, fibM, fib1, fib2, range: [offset + 1, n - 1], found: foundIndex, msg });
    snap(-1, { zh: '初始化:取 ≥ n 的最小費氏數 ' + fibM, en: 'Init: smallest Fibonacci ≥ n is ' + fibM });
    while (fibM > 1) {
      const i = Math.min(offset + fib2, n - 1);
      if (arr[i] < target) {
        snap(i, { zh: 'arr[' + i + ']=' + arr[i] + ' < 目標,往右縮小範圍', en: 'arr[' + i + ']=' + arr[i] + ' < target; shrink right' });
        fibM = fib1; fib1 = fib2; fib2 = fibM - fib1; offset = i;
      } else if (arr[i] > target) {
        snap(i, { zh: 'arr[' + i + ']=' + arr[i] + ' > 目標,往左縮小範圍', en: 'arr[' + i + ']=' + arr[i] + ' > target; shrink left' });
        fibM = fib2; fib1 = fib1 - fib2; fib2 = fibM - fib1;
      } else {
        foundIndex = i;
        snap(i, { zh: '命中!目標在索引 ' + i, en: 'Hit! target at index ' + i });
        return { frames, foundIndex };
      }
    }
    if (fib1 === 1 && offset + 1 < n && arr[offset + 1] === target) {
      foundIndex = offset + 1;
      snap(foundIndex, { zh: '比對最後一個元素,命中索引 ' + foundIndex, en: 'Check last element; hit at index ' + foundIndex });
    } else {
      snap(-1, { zh: '找不到目標', en: 'Target not found' });
    }
    return { frames, foundIndex };
  }

  const api = { buildFibSearchFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.FibSearchViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
