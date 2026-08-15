// maccount SSO client for dsvisual. Singleton on window.cloudClient().
// Replaces the former cloud/Drive sign-in integration. See B2 spec.
(function () {
  'use strict';

  const USER_KEY = 'dsvisual:maccount:user';
  let cachedClient = null;

  function isPlaceholder(v) { return !v || /^__.+__$/.test(v); }

  function stubClient(reason) {
    return {
      isConfigured: false, missingReason: reason,
      getUser() { return null; },
      subscribeAuthState(cb) { cb(null); return function () {}; },
      signIn() { /* no-op when unconfigured */ },
      signOut() { /* no-op */ },
      handleRedirect() { return Promise.resolve(); },
    };
  }

  function buildClient() {
    const cfg = (typeof window !== 'undefined' && window.dsvisualCloudConfig
                 && window.dsvisualCloudConfig.maccount) || null;
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
      return stubClient('Sign-in requires http:// or https:// — not file://.');
    }
    if (!cfg || isPlaceholder(cfg.workerBaseUrl)) {
      return stubClient('maccount worker URL not configured.');
    }
    const base = cfg.workerBaseUrl.replace(/\/$/, '');
    const appId = cfg.appId || 'dsvisual';
    const subs = [];
    let user = readUser();
    let redirectPromise = null;

    function readUser() {
      try { const raw = sessionStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; }
      catch (e) { return null; }
    }
    function setUser(u) {
      user = u;
      try { if (u) sessionStorage.setItem(USER_KEY, JSON.stringify(u)); else sessionStorage.removeItem(USER_KEY); }
      catch (e) { /* ignore quota/availability */ }
      subs.forEach(function (cb) { try { cb(user); } catch (e) { /* ignore */ } });
    }

    return {
      isConfigured: true, missingReason: '',
      getUser() { return user; },
      subscribeAuthState(cb) {
        subs.push(cb); try { cb(user); } catch (e) { /* ignore */ }
        return function () { const i = subs.indexOf(cb); if (i >= 0) subs.splice(i, 1); };
      },
      signIn() {
        location.assign(base + '/auth/app/start?app=' + encodeURIComponent(appId)
          + '&return=' + encodeURIComponent(location.href));
      },
      signOut() { setUser(null); },
      handleRedirect() {
        if (!redirectPromise) {
          redirectPromise = runRedirect().then(function (ok) {
            if (!ok) redirectPromise = null;   // allow retry after a failed/no-op exchange
            return ok;
          });
        }
        return redirectPromise;
      },
    };

    async function runRedirect() {
      const hash = (location.hash || '');
      const m = hash.match(/[#&]mtoken=([^&]+)/);
      if (!m) return false;
      let res;
      try {
        const token = decodeURIComponent(m[1]);
        res = await fetch(base + '/api/app/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token }),
        });
      } catch (e) { return false; }
      if (!res || !res.ok) return false;
      let data; try { data = await res.json(); } catch (e) { return false; }
      if (!data || !data.student_id) return false;
      // strip the fragment so the token doesn't linger in the URL/history
      try { history.replaceState(null, '', location.href.replace(/#.*$/, '')); } catch (e) { /* ignore */ }
      setUser({
        student_id: data.student_id,
        providers: {
          github: !!(data.providers && data.providers.github),
          google: !!(data.providers && data.providers.google),
        },
      });
      return true;
    }
  }

  function cloudClient() {
    if (cachedClient) return cachedClient;
    cachedClient = buildClient();
    return cachedClient;
  }

  window.cloudClient = cloudClient;
  // Kick off token exchange on load (safe no-op when there's no #mtoken).
  try { cloudClient().handleRedirect(); } catch (e) { /* ignore */ }
})();
