// Placeholder values are replaced by scripts/inject-env.mjs at build time.
// At runtime, window.dsvisualCloudConfig is consumed by cloud-integration.js
// (maccount SSO).
(function () {
  'use strict';
  window.dsvisualCloudConfig = {
    maccount: {
      workerBaseUrl: '__MACCOUNT_WORKER_URL__',
      appId: 'dsvisual',
    },
  };
})();
