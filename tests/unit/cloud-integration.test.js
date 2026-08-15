'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load({ hash = '', configured = true, fetchImpl } = {}) {
  const store = new Map();
  const sandbox = {
    window: {},
    location: { protocol: 'http:', href: 'https://skhuang.github.io/dsvisual/', hash,
                assign(u) { this._assigned = u; } },
    history: { replaceState(_s, _t, url) { sandbox.location.href = url; } },
    sessionStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null),
                      setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    fetch: fetchImpl || (async () => ({ ok: true, json: async () => ({ student_id: 'S1', providers: { github: true, google: false } }) })),
    console,
  };
  sandbox.window.dsvisualCloudConfig = configured
    ? { maccount: { workerBaseUrl: 'https://maccount.example', appId: 'dsvisual' } }
    : { maccount: { workerBaseUrl: '__MACCOUNT_WORKER_URL__', appId: 'dsvisual' } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/cloud-integration.js'), 'utf8'), sandbox);
  return sandbox;
}

test('signIn redirects to /auth/app/start with app + encoded return', () => {
  const s = load();
  s.window.cloudClient().signIn();
  assert.equal(s.location._assigned,
    'https://maccount.example/auth/app/start?app=dsvisual&return=' + encodeURIComponent('https://skhuang.github.io/dsvisual/'));
});

test('handleRedirect: #mtoken -> verify -> getUser + fragment stripped', async () => {
  let posted = null;
  const s = load({ hash: '#mtoken=abc.def',
    fetchImpl: async (url, opts) => { posted = { url, body: JSON.parse(opts.body) };
      return { ok: true, json: async () => ({ student_id: 'S9', providers: { github: false, google: true } }) }; } });
  await s.window.cloudClient().handleRedirect();
  assert.equal(posted.url, 'https://maccount.example/api/app/verify');
  assert.equal(posted.body.token, 'abc.def');
  assert.deepEqual(s.window.cloudClient().getUser(), { student_id: 'S9', providers: { github: false, google: true } });
  assert.doesNotMatch(s.location.href, /mtoken/);   // fragment stripped
});

test('verify failure leaves user null', async () => {
  const s = load({ hash: '#mtoken=bad', fetchImpl: async () => ({ ok: false, json: async () => ({}) }) });
  await s.window.cloudClient().handleRedirect();
  assert.equal(s.window.cloudClient().getUser(), null);
});

test('signOut clears the user and notifies', async () => {
  const s = load({ hash: '#mtoken=abc' });
  const c = s.window.cloudClient();
  await c.handleRedirect();
  let seen = 'unset';
  c.subscribeAuthState((u) => { seen = u; });   // fires once with current, then on change
  c.signOut();
  assert.equal(c.getUser(), null);
  assert.equal(seen, null);
});

test('not configured -> stub, getUser null, signIn no-op', () => {
  const s = load({ configured: false });
  const c = s.window.cloudClient();
  assert.equal(c.isConfigured, false);
  assert.equal(c.getUser(), null);
  c.signIn();   // must not throw
  assert.equal(s.location._assigned, undefined);
});

test('no getAccessToken / DRIVE_SCOPES / firebase', () => {
  const s = load();
  assert.equal(typeof s.window.cloudClient().getAccessToken, 'undefined');
  assert.equal(s.window.DRIVE_SCOPES, undefined);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../../js/cloud-integration.js'), 'utf8'), /firebase/i);
});
