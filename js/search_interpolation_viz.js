(function (global) {
  function buildInterpFrames(arr, target) {
    const n = arr.length;
    const frames = [];
    let lo = 0, hi = n - 1, foundIndex = -1;
    const snap = (pos, msg) => frames.push({ lo, hi, pos, found: foundIndex, msg });
    snap(-1, { zh: '初始化範圍 [0, ' + (n - 1) + ']', en: 'Init range [0, ' + (n - 1) + ']' });
    while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
      if (arr[hi] === arr[lo]) {
        if (arr[lo] === target) { foundIndex = lo; snap(lo, { zh: '範圍內值相同,命中索引 ' + lo, en: 'Equal-valued range; hit at index ' + lo }); }
        else snap(-1, { zh: '範圍內值相同但不符,結束', en: 'Equal-valued range, no match' });
        break;
      }
      const pos = lo + Math.floor((target - arr[lo]) * (hi - lo) / (arr[hi] - arr[lo]));
      if (arr[pos] === target) { foundIndex = pos; snap(pos, { zh: '內插位置 ' + pos + ' 命中', en: 'Interpolated position ' + pos + ' hits' }); break; }
      else if (arr[pos] < target) { snap(pos, { zh: 'arr[' + pos + ']=' + arr[pos] + ' < 目標,lo = ' + (pos + 1), en: 'arr[' + pos + ']=' + arr[pos] + ' < target; lo = ' + (pos + 1) }); lo = pos + 1; }
      else { snap(pos, { zh: 'arr[' + pos + ']=' + arr[pos] + ' > 目標,hi = ' + (pos - 1), en: 'arr[' + pos + ']=' + arr[pos] + ' > target; hi = ' + (pos - 1) }); hi = pos - 1; }
    }
    if (foundIndex === -1) snap(-1, { zh: '找不到目標', en: 'Target not found' });
    return { frames, foundIndex };
  }

  const api = { buildInterpFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.InterpSearchViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
