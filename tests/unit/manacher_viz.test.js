const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_INPUT_LENGTH,
  normalizeInput,
  buildManacherFrames,
  longestPalindrome,
} = require('../../js/viz/viz_manacher');

function isPalindrome(text) {
  const chars = Array.from(text);
  return chars.join('') === chars.reverse().join('');
}

function bruteForceLongestLength(text) {
  const chars = Array.from(text);
  let best = 0;
  for (let left = 0; left < chars.length; left++) {
    for (let right = left; right < chars.length; right++) {
      const candidate = chars.slice(left, right + 1).join('');
      if (isPalindrome(candidate)) best = Math.max(best, right - left + 1);
    }
  }
  return best;
}

test('finds odd, even, repeated, and single-character palindromes', () => {
  assert.equal(longestPalindrome('abacaba'), 'abacaba');
  assert.equal(longestPalindrome('cbbd'), 'bb');
  assert.equal(longestPalindrome('aaaa'), 'aaaa');
  assert.equal(longestPalindrome('x'), 'x');

  const babad = longestPalindrome('babad');
  assert.equal(babad.length, 3);
  assert.ok(babad === 'bab' || babad === 'aba');
});

test('separator and sentinel-looking input characters are treated as ordinary data', () => {
  assert.equal(longestPalindrome('a#^#a'), 'a#^#a');
  assert.equal(longestPalindrome('$##$'), '$##$');
});

test('empty input falls back to the default and long input is capped for readability', () => {
  assert.equal(normalizeInput(''), 'abacaba');
  assert.equal(Array.from(normalizeInput('x'.repeat(100))).length, MAX_INPUT_LENGTH);
});

test('matches a brute-force answer for every binary string through length seven', () => {
  for (let length = 1; length <= 7; length++) {
    const count = 1 << length;
    for (let mask = 0; mask < count; mask++) {
      let text = '';
      for (let bit = 0; bit < length; bit++) text += ((mask >> bit) & 1) ? 'a' : 'b';
      const result = buildManacherFrames(text);
      assert.equal(result.length, bruteForceLongestLength(text), text);
      assert.equal(Array.from(result.longest).length, result.length, text);
      assert.ok(isPalindrome(result.longest), text);
      assert.ok(text.includes(result.longest), text);
    }
  }
});

test('frames are immutable snapshots and finish with a bilingual done message', () => {
  const result = buildManacherFrames('abba');
  assert.ok(result.frames.length > result.transformed.length);
  assert.deepEqual(result.frames[0].radii, new Array(result.transformed.length).fill(0));
  assert.deepEqual(result.frames.at(-1).radii, result.radii);
  assert.equal(result.frames.at(-1).phase, 'done');
  assert.match(result.frames.at(-1).message.zh, /abba/);
  assert.match(result.frames.at(-1).message.en, /abba/);

  for (const frame of result.frames) {
    assert.equal(frame.radii.length, result.transformed.length);
    assert.ok(frame.radii.every((radius) => Number.isInteger(radius) && radius >= 0));
    assert.ok(frame.right >= frame.center);
  }
});
