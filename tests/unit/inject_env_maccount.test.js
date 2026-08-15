'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('cloud-config exposes the maccount block, no firebase/drive', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../js/cloud-config.js'), 'utf8');
  assert.match(src, /maccount:/);
  assert.match(src, /workerBaseUrl:\s*'__MACCOUNT_WORKER_URL__'/);
  assert.match(src, /appId:\s*'dsvisual'/);
  assert.doesNotMatch(src, /firebase|FIREBASE|drive|DRIVE/i);
});

test('inject-env maps MACCOUNT_WORKER_URL, drops firebase placeholders', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../scripts/inject-env.mjs'), 'utf8');
  assert.match(src, /__MACCOUNT_WORKER_URL__:\s*'MACCOUNT_WORKER_URL'/);
  assert.doesNotMatch(src, /FIREBASE|DRIVE_PRIVATE/);
});
