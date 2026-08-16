# Authentication deploy config (maccount SSO)

dsvisual signs users in through **maccount** (the course account portal, a
Cloudflare Worker) using its relying-app SSO. After sign-in dsvisual holds
`{ student_id, providers }`, which gates the lab "Practice on dsjudge" button.
There is no Firebase/Google-Drive integration anymore.

Two sides must agree on three values that all reference the same pair of URLs:

| | Value | Where |
|---|---|---|
| dsvisual site | `https://skhuang.github.io/dsvisual` | GitHub Pages |
| maccount worker | `https://maccount-api.skhuang.workers.dev` | Cloudflare Worker |

## dsvisual side (this repo)

`js/cloud-config.js` ships with a `__MACCOUNT_WORKER_URL__` placeholder that
`scripts/inject-env.mjs` fills at build time from the `MACCOUNT_WORKER_URL`
environment variable (part of `npm run pages:prepare` / `pages:artifact`).

1. **Set the Actions variable.** Repo → Settings → Secrets and variables →
   Actions → **Variables** → New variable:
   - Name: `MACCOUNT_WORKER_URL`
   - Value: `https://maccount-api.skhuang.workers.dev` (worker origin only — no
     trailing slash, no path)

   It is not sensitive, so a *Variable* is correct (a Secret also works). The
   deploy workflow (`.github/workflows/deploy-pages.yml`) reads it as
   `${{ vars.MACCOUNT_WORKER_URL }}`.

2. **Deploy.** Push to `main` (or run the "Deploy GitHub Pages" workflow via
   `workflow_dispatch`). `inject-env.mjs` replaces the placeholder in
   `cloud-config.js`.

   If the variable is unset, the placeholder is replaced with a blank string and
   the auth client falls back to its **unconfigured stub** — `isConfigured:false`,
   `getUser()→null`, sign-in is a no-op. That is the safe local/`file://`
   behavior; it also means "sign-in does nothing on the live site" is almost
   always a missing `MACCOUNT_WORKER_URL`.

3. **Local dev.** `inject-env.mjs` also reads a `.env` file at the repo root
   (git-ignored). For a local build against a real worker:
   ```
   MACCOUNT_WORKER_URL=https://maccount-api.skhuang.workers.dev
   ```
   Opening `index.html` over `file://` always uses the stub regardless.

## maccount side (the worker)

maccount must allowlist dsvisual and hold the token-signing secret. In the
maccount repo (config lives in the git-ignored `wrangler.toml`; see its
`wrangler.toml.example` and README deploy steps):

1. **Allowlist** — `[vars]`:
   ```toml
   APP_ALLOWLIST = "dsvisual=https://skhuang.github.io/dsvisual"
   ```
   Format is `app_id=return_prefix`, `;`-separated for multiple apps. The
   `/api/app/verify` CORS origin is derived from this prefix
   (`https://skhuang.github.io`), and the SSO `return` URL must start with the
   prefix or the request is rejected (anti open-redirect).

2. **Token secret** — separate from `SESSION_SECRET`:
   ```bash
   openssl rand -base64 32 | npx wrangler secret put APP_TOKEN_SECRET
   ```

3. **Deploy** — `npx wrangler deploy`.

## Flow (reference)

1. dsvisual `signIn()` → `GET <worker>/auth/app/start?app=dsvisual&return=<current url>`.
2. maccount logs the user in if needed, then redirects to `<return>#mtoken=<token>`
   (short-lived, `aud`-bound HMAC token in the URL fragment).
3. On load, dsvisual's `handleRedirect()` reads `#mtoken`, `POST`s it to
   `<worker>/api/app/verify` (CORS), stores `{student_id, providers}` in
   sessionStorage, and strips the fragment.

## Verify after deploy

- Live site: open the cloud sign-in → redirected to maccount → back → the drawer
  shows the student id; a lab with a `dsjudgeUrl` shows the enabled
  "Practice on dsjudge" link once signed in.
- `GET https://maccount-api.skhuang.workers.dev/auth/app/start?app=dsvisual&return=https://skhuang.github.io/dsvisual/`
  should (after login) land back with `#mtoken=…`.
- A non-allowlisted `app`/`return` must be rejected with `400`.
