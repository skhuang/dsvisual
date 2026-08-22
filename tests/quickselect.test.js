// tests/quickselect.test.js
const { test, expect } = require('@playwright/test');
const { quickselect } = require('../js/viz/viz_quickselect.js');

test.describe('Quickselect - Duplicate values test', () => {
  test('should return the correct k-th smallest element with duplicate numbers', async () => {
    const arr = [5, 2, 8, 2, 5, 1, 9, 2]; 
    const k = 3;
    const expected = 2;

    const result = quickselect([...arr], k);
    expect(result).toBe(expected);
  });
});