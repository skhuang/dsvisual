'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const R = (p) => fs.readFileSync(path.join(__dirname, '../../', p), 'utf8');

test('no firebase/drive references remain', () => {
  assert.doesNotMatch(R('index.html'), /firebasejs|firebase-app|firebase-auth/i);
  assert.doesNotMatch(R('js/app.js'), /getPrivateContext|getAccessToken|privateSlidesFolderId|cfg\.drive/);
  assert.doesNotMatch(R('package.json'), /"firebase"/);
  assert.ok(!fs.existsSync(path.join(__dirname, '../../tests/cloud-private-slides.spec.js')));
  assert.doesNotMatch(R('index.html'), /private-decks\.js|slide-markdown\.js/);
});
