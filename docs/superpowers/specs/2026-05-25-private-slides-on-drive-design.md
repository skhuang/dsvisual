# Private Course Slides on Google Drive — Design (dsvisual)

**Date:** 2026-05-25
**Status:** Approved — ready for implementation planning
**Sibling work:** This is the **third deployment** of the same conceptual feature
already shipped in `rdvisual` (PR #6, merged 2026-05-24) and `stvisual` (PR #310,
merged 2026-05-24). dsvisual's implementation **is not a code mirror** — its
architecture is fundamentally different (vanilla CommonJS, single-file `app.js`,
no Firebase, no bundler) so each module is rewritten to fit dsvisual's style.
The **user-facing experience matches** (🔒 chip in deck picker, sign-in row when
configured but signed-out, Drive folder + `private-decks.json` manifest, drive.readonly
OAuth, same operator workflow for course owners).

## Goal

Let dsvisual fetch private Marp `.md` slide decks from a Google Drive folder at
runtime, gated by Drive-native per-user sharing. The decks appear alongside
each method's existing public slides in the `#slide-viewer` overlay, marked with
a 🔒 chip. Course owners author/manage decks entirely through Drive's UI.

## Background — why this is harder than the rdvisual/stvisual ports

dsvisual is structurally a different application:

| | dsvisual | rdvisual / stvisual |
|---|---|---|
| Module system | CommonJS, no bundler | ESM + Vite |
| Entry point | single 315 KB `app.js` at repo root | `src/main.js` + module tree |
| i18n | `data-i18n-key` DOM attributes + `i18n.js` walker | `t()` helper |
| Slide source | structured JS objects (`code_db.js`, `desc_db.js`) → `build_slides.js` → pre-rendered HTML in `slides_rendered.js` | Marp `.md` → `slideDecks.generated.js` |
| Slide viewer | `#slide-viewer` overlay reads `entry.slides[lang]` — array of `{title, body}` — per-method | `parseDeck()` + `SlideViewer.js` overlay — per-section |
| Tests | Playwright + `node --test` | vitest + Playwright |
| Firebase | absent | integrated |
| GitHub Pages deploy | absent (only Playwright CI) | shipped |

So this work adds **from scratch**: Firebase SDK loading, a cloud sign-in UI, a
Drive REST integration, a Marp markdown parser, an `inject-env` script, and a
Pages deploy workflow. The `privateDecks` module logic is the only thing that
ports nearly verbatim from rdvisual (pure function over `fetch`).

## Decisions settled during brainstorming

1. **Drive deck format: Marp `.md` (方案甲).** Same as rdvisual / stvisual. Lets
   one operator manage all three courses with one mental model. dsvisual gains
   a small Marp parser (`slide-markdown.js`, ported from rdvisual ~100 lines, no
   deps). Native dsvisual public slides keep their pre-rendered HTML format
   unchanged.
2. **Sign-in UI: new header ☁ button → cloud drawer modal.** Mirrors rdvisual's
   UX. Visually consistent across all three courses for the operator. The
   existing ⚙ settings button and lang menu are untouched.
3. **🔒 deck attachment: per-method.** Manifest entries carry a `method` field
   matching dsvisual's method IDs (e.g. `tree-bst`, `graph-dijkstra`). When a
   method's `[Slides]` button is clicked, the slide-viewer deck picker shows
   public + private decks merged.
4. **GitHub Pages deploy: added in this cycle.** dsvisual gets its own
   `deploy-pages.yml` + `inject-env.mjs` + cloud config placeholders, sibling
   to rdvisual / stvisual. This unlocks the same secret-based feature
   activation workflow.
5. **Lessons from Plan A/B baked in from day one.** Defensive `__…__`
   placeholder guard in the config reader; `inject-env` + workflow secret
   wired in the same commit set as the config field; silent degradation when
   Drive returns 403; singleton cloud client; both `drive.file` and
   `drive.readonly` scopes declared from the first sign-in.

## Architecture

```
                                ┌────────────────────────────────┐
                                │ Google Drive folder per course │
                                │ (shared with specific accounts)│
                                │   private-decks.json (manifest)│
                                │   tree-bst-instructor.en.md    │
                                │   tree-bst-instructor.zh.md    │
                                └────────────────┬───────────────┘
                                                 │ drive.readonly
                                                 ▼
                            ┌──────────────────────────────────┐
                            │ Drive REST v3 (files.list, get)  │
                            └─────────────────┬────────────────┘
                                              │  Bearer <accessToken>
                            ┌─────────────────┴───────────────┐
                            │ NEW cloud-integration.js        │
                            │   Firebase auth singleton       │
                            │   DRIVE_SCOPES = [file,readonly]│
                            │   getAccessToken()              │
                            └─────────────────┬───────────────┘
                                              │
                                              ▼
                            ┌─────────────────────────────────┐
                            │ NEW private-decks.js            │
                            │   fetchPrivateDecks(token, fid) │
                            │   → [{id, method, en, zh, ...}] │
                            │   per-session cache             │
                            └─────────────────┬───────────────┘
                                              │
                                              ▼
                ┌────────────────────────────────────────────────────────────┐
                │ Existing #slide-viewer (extended via app.js openSlides)    │
                │   public deck (entry.slides[lang]) +                       │
                │   private decks (parsed by slide-markdown.js)              │
                │   rendered as merged deck-picker with 🔒 chip              │
                └────────────────────────────────────────────────────────────┘

                            NEW header ☁ button → cloud-drawer modal
                                   (sign in / sign out / current user)
```

## The Drive layout

One Drive folder per course (operator chooses). Inside:

- **`private-decks.json`** — manifest:
  ```json
  {
    "version": 1,
    "decks": [
      {
        "id": "tree-bst-instructor",
        "method": "tree-bst",
        "files": {
          "en": "tree-bst-instructor.en.md",
          "zh": "tree-bst-instructor.zh.md"
        },
        "titleEn": "BST — instructor notes",
        "titleZh": "BST —— 講師補充"
      }
    ]
  }
  ```
  All six fields per entry required. `method` must match an existing dsvisual
  method ID. Entries with an unknown method are silently dropped (with a
  `console.warn` for the dev).

- One or more Marp `.md` decks referenced from the manifest. Same `--`-
  separated slide format as the other two repos.

Note the lang keys: dsvisual uses `en` / `zh` (its existing convention),
**not** `en` / `zh-TW` like the other two repos. The Drive manifests are
therefore not portable across the three repos — each course has its own
folder anyway (cleaner access management).

Permission model: Drive-native sharing. Course owner shares the folder via
Drive's "Share" dialog; the app honours whatever Drive enforces.

## Config

A new top-level `cloud-config.js` with the same placeholder pattern as
rdvisual / stvisual (UMD-style, no module wrapper — attaches to
`window.dsvisualCloudConfig` for `app.js` to read):

```js
(function () {
  const cloudConfig = {
    firebase: {
      apiKey: "__FIREBASE_API_KEY__",
      authDomain: "__FIREBASE_AUTH_DOMAIN__",
      projectId: "__FIREBASE_PROJECT_ID__",
      storageBucket: "__FIREBASE_STORAGE_BUCKET__",
      messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
      appId: "__FIREBASE_APP_ID__",
      measurementId: "__FIREBASE_MEASUREMENT_ID__",
    },
    drive: {
      privateSlidesFolderId: "__DRIVE_PRIVATE_SLIDES_FOLDER_ID__",
    },
  };
  window.dsvisualCloudConfig = cloudConfig;
})();
```

(dsvisual doesn't have a runtime-config override mechanism like rdvisual's
`globalThis.RDVISUAL_CLOUD_CONFIG`; YAGNI — add later if needed.)

## Auth — Firebase from scratch

In `index.html`, add three `<script>` tags for the Firebase SDK (matching
rdvisual's version pinning):

```html
<script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js" defer></script>
<script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-auth-compat.js" defer></script>
<script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore-compat.js" defer></script>
```

(Firestore is not strictly used by this feature — but loading the SDK now
keeps room for future settings sync, without a second script tag later.
Total extra weight: ~110 KB gzipped. Acceptable for course material.)

A new `cloud-integration.js` (vanilla, IIFE → `window.cloudClient`):

```js
(function () {
  const DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
  ];
  let cachedClient = null;

  function buildClient() {
    // 1. Check window.dsvisualCloudConfig.firebase completeness.
    // 2. If incomplete or origin is file:// → stub client (all methods noop or null).
    // 3. firebase.initializeApp(config) — singleton.
    // 4. Return {
    //      getUser(),
    //      getAccessToken(),
    //      signInWithGoogle(),  // addScope for each DRIVE_SCOPES item
    //      signOutGoogle(),
    //      subscribeAuthState(cb),
    //    }
  }

  window.cloudClient = function () {
    if (cachedClient) return cachedClient;
    cachedClient = buildClient();
    return cachedClient;
  };
  window.DRIVE_SCOPES = DRIVE_SCOPES;  // exported for tests
})();
```

Same singleton + access-token pattern as rdvisual's cloudIntegration.

## The new cloud drawer (header ☁)

In `index.html`, the header gains a third action button (sibling of `lang-menu`
and `settings-toggle`):

```html
<button id="cloud-toggle" type="button" class="cloud-toggle"
        data-i18n-aria-label="aria.cloud-toggle"
        aria-label="Open cloud sign-in">☁</button>
```

And a new modal panel (uses the existing `#slide-viewer`-style backdrop
pattern):

```html
<div id="cloud-drawer" class="cloud-drawer" data-testid="cloud-drawer" hidden>
  <button type="button" class="cloud-drawer-backdrop" data-cloud-close aria-label="Close"></button>
  <section class="cloud-drawer-panel" role="dialog" aria-modal="true" tabindex="-1">
    <header class="cloud-drawer-header">
      <h2 data-i18n-key="cloud.title">Cloud sign-in</h2>
      <button class="cloud-drawer-close" data-cloud-close>×</button>
    </header>
    <div class="cloud-drawer-body" id="cloud-drawer-body">
      <!-- Filled by cloud-drawer.js based on auth state -->
    </div>
  </section>
</div>
```

Logic in **`cloud-drawer.js`** (loaded after Firebase + cloud-integration.js):

- On `☁` click: open modal, render body based on `cloudClient().getUser()`
  - Signed out: `[Sign in with Google]` button + one-line note explaining the
    Drive read permission.
  - Signed in: show `name (email)` + `[Sign out]` button.
- After sign-in success → close drawer, refresh any open slide viewer to
  re-fetch private decks.
- After sign-out → clear cached private decks, refresh any open slide viewer.

**Not in scope** (these are all in rdvisual's `CloudStoragePanel` but
out-of-scope here): personal-settings sync, class results upload, file
upload to Drive, teacher dashboard. dsvisual's drawer is MVP — just
auth presence/absence.

## The new `private-decks.js` module

Ports from rdvisual's `src/framework/privateDecks.js` (123 lines), adapted
to vanilla IIFE:

```js
(function () {
  const PRIVATE_NUM_OFFSET = 1000;
  const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
  let cache = { token: null, decks: null };

  async function fetchPrivateDecks(opts) {
    // Same logic as rdvisual:
    //  - returns [] when folderId or accessToken falsy
    //  - cache by accessToken
    //  - list manifest by name, fetch by id
    //  - per-deck list + alt=media fetch (en + zh)
    //  - manifest 403/404 → return [] silent
    //  - per-deck 403/401/404 → access: 'denied'
    //  - network errors → access: 'error'
    //  - num: PRIVATE_NUM_OFFSET + i + 1
  }

  function _resetPrivateDecksCache() { cache = { token: null, decks: null }; }

  window.privateDecksClient = { fetchPrivateDecks, _resetPrivateDecksCache };
})();
```

Same behavior contract as the other two repos. Only the lang field of the
manifest entry's `files` differs (`zh` not `zh-TW`).

## The new `slide-markdown.js` (Marp parser)

Ports rdvisual's `src/framework/slideMarkdown.js` (a minimal Marp-flavoured
markdown → HTML parser, ~100 lines, no dependencies — just splits on
`---`, strips front-matter, runs a simple markdown subset). Vanilla IIFE
exposing `window.slideMarkdown = { parseDeck }`.

`parseDeck(md)` returns `{ slides: [{ html, notes }] }`.

For dsvisual's slide viewer, each slide gets adapted to its existing
`{title, body}` shape: `{title: '', body: slide.html}`. The dsvisual viewer
doesn't currently render a per-slide title — that's fine for private decks
too (the deck title shows in the picker chip).

## Slide-viewer integration

Existing `openSlides(methodId)` in `app.js` is extended:

1. **Build the deck list** — start with the existing public deck from
   `entry.slides[lang]`, wrap it as `[{ id: methodId + '-public', kind: 'public',
   slides: [...]}]`.
2. **Check the private context**:
   - Read `dsvisualCloudConfig.drive.privateSlidesFolderId`
   - If the value matches `/^__.+__$/` (placeholder) treat as unset
   - If unset → skip step 3
3. **Get the access token** via `cloudClient().getAccessToken()`. If null →
   set a flag `view.privateSignInNeeded = true` and skip fetch.
4. **Fetch private decks** via `privateDecksClient.fetchPrivateDecks(...)`,
   filter by `method === methodId`, parse each with `slideMarkdown.parseDeck`,
   convert to `{title, body}` array, append to the deck list with
   `kind: 'private', access: 'ok' | 'denied' | 'error'`.
5. **Render the deck-picker bar** at the top of `#slide-viewer-body`:
   - Single deck → no picker (current behaviour unchanged).
   - Multiple → tablist of buttons. Public buttons plain; private buttons
     prefixed with `🔒`, class `slide-deck-btn--private`. `denied`/`error`
     decks disabled with a `— no access` suffix.
   - If `view.privateSignInNeeded`, append a `[🔒 Sign in to see private slides]`
     row that closes the slide viewer and opens the cloud drawer.

For a method with NO private decks AND no private folder configured →
behavior is byte-identical to today. Zero regression risk for the existing
slide-viewer.

## i18n keys

Added to `i18n.js`'s translation table (both `en` and `zh`):

| Key | en | zh |
|---|---|---|
| `aria.cloud-toggle` | `Open cloud sign-in` | `開啟雲端登入` |
| `cloud.title` | `Cloud sign-in` | `雲端登入` |
| `cloud.signin-cta` | `Sign in with Google` | `以 Google 登入` |
| `cloud.signin-note` | `Permission "See and download your Drive files" is required to view private slides shared with your account.` | `需要「檢視與下載您的 Google 雲端硬碟檔案」權限,才能讀取分享給您的私人投影片。` |
| `cloud.current-user` | `Signed in as {name}` | `已登入：{name}` |
| `cloud.signout` | `Sign out` | `登出` |
| `slide.private-chip-aria` | `Private deck` | `私人投影片` |
| `slide.private-signin-row` | `🔒 Sign in to see private slides` | `🔒 登入以檢視私人投影片` |
| `slide.private-no-access` | `no access` | `無存取權` |
| `slide.private-fetch-error` | `couldn't load — retry` | `載入失敗 —— 重試` |

## Config injection & deploy

**New: `scripts/inject-env.mjs`** — same pattern as rdvisual: read `.env` (or
`process.env`), replace `__PLACEHOLDER__` tokens in `cloud-config.js` with real
values, fall back to empty when env var unset.

**New: `.github/workflows/deploy-pages.yml`** — modelled on rdvisual's:
- `test` job: `npm ci && npm run test:unit && npx playwright install --with-deps chromium && npm test`
- After tests: `npm run inject-env`, `npm run build:slides`, then `actions/upload-pages-artifact` with the repo root (since dsvisual serves static files from root, no `dist/`).
- `deploy` job: `actions/deploy-pages`.
- `workflow_dispatch:` trigger included from the start (so secret changes can be re-deployed without push).
- `env:` block lists `FIREBASE_*`, `DRIVE_PRIVATE_SLIDES_FOLDER_ID` from `secrets.X`.

**New: `.env.example`** — template with all `FIREBASE_*` + `DRIVE_PRIVATE_SLIDES_FOLDER_ID` lines, plus the explanatory comment about private-slides being optional.

## Testing

Using dsvisual's existing test frameworks (Playwright + `node --test`).

**Unit tests** (`tests/unit/`):
- `private-decks.test.js` — fetch mock, all four error states, happy path, cache, token rotation. Port of rdvisual's `privateDecks.test.js` (9 tests). Use `node --test`.
- `slide-markdown.test.js` — basic slide-splitting + front-matter stripping. Port from rdvisual's `slideMarkdown.test.js`.
- `cloud-integration.test.js` — exports `DRIVE_SCOPES` (both URLs, length 2); `cloudClient()` returns same instance; `getAccessToken()` null when not signed in.

**E2e tests** (Playwright, `e2e/`):
- `cloud-private-slides.spec.js`:
  - **Without folder configured** (default): existing slide-viewer flows unchanged — no 🔒 chip, no sign-in row. (Catches regression.)
  - **With folder mocked + not signed in**: opening a method's slide-viewer shows a sign-in row at the top of the deck-picker.
  - **Sign-in row click**: closes slide-viewer, opens cloud-drawer.
  - **Header ☁ click**: opens cloud-drawer; close button closes it.

**Manual** (after first prod deploy with a configured Drive folder):
- Real Google sign-in via the cloud drawer.
- Verify OAuth consent screen lists `drive.readonly`.
- Open a method with a private deck → deck-picker shows public + 🔒 private → both render correctly.

## Files

**Create at repo root** (matching dsvisual's flat layout):
- `cloud-config.js`
- `cloud-integration.js`
- `cloud-drawer.js`
- `private-decks.js`
- `slide-markdown.js`
- `.env.example`
- `scripts/inject-env.mjs`
- `.github/workflows/deploy-pages.yml`
- `tests/unit/private-decks.test.js`
- `tests/unit/slide-markdown.test.js`
- `tests/unit/cloud-integration.test.js`
- `e2e/cloud-private-slides.spec.js`
- `docs/private-slides.md` (operator guide)
- `docs/private-decks.example.json` (manifest starter template)
- `scripts/smoke-private-decks.mjs` (the smoke test tool, also baked in from day one — Plan A/B added this as a follow-up)

**Modify:**
- `index.html` — Firebase `<script>` tags, header ☁ button, cloud-drawer DOM, `<script>` tags for the new JS files
- `app.js` — extend `openSlides()` (deck-picker, private-fetch flow, sign-in row); hook the ☁ button to open the cloud drawer (or fold cloud-drawer logic in if cleaner — TBD by implementer)
- `style.css` — cloud-drawer styles, deck-picker bar styles, 🔒 chip styles
- `package.json` — add `firebase` dependency, `inject-env` / `pages:prepare` scripts

**`fix/tree-edges-visible` branch is untouched** — this feature ships from a fresh `feat/private-slides-on-drive` branch off `origin/main`. The tree work continues independently.

## Out of scope

- Cloud sync of personal settings, history, results, etc. (rdvisual's CloudStoragePanel does these — dsvisual MVP is just sign-in / sign-out).
- Refactoring dsvisual's existing slide format (`code_db.js` → `slides_rendered.js` pipeline stays unchanged).
- Moving dsvisual from CommonJS to ESM, or introducing a bundler.
- Editing or uploading slides from inside the app (operator edits in Drive's UI).
- Multiple Drive folders per deployment.
- Real-time updates (manifest fetched once per slide-viewer open per session).
- Per-deck sharing (the folder is the share unit).
- Anonymous-but-gated access.
- Hosting deck images on Drive (referenced images must live in repo).

## Rollout — one cycle, ~15-18 tasks

Single subagent-driven plan. No sub-project decomposition — all the pieces
must land together for the feature to work end-to-end. Expected task list
(to be refined during plan-writing):

1. Add `cloud-config.js` + `inject-env.mjs` (placeholder injection)
2. Add Firebase SDK to `index.html` (loaded but not yet used by app.js)
3. Add `cloud-integration.js` + unit tests (singleton, scopes, getAccessToken)
4. Add `cloud-drawer.js` + ☁ button + drawer DOM in `index.html` + styles
5. Add `slide-markdown.js` + unit tests
6. Add `private-decks.js` + unit tests
7. Extend `openSlides()` in `app.js`: deck-picker for multi-deck, private fetch + merge
8. Add per-method 🔒 chip + sign-in row rendering + click handlers
9. i18n strings (`cloud.*` and `slide.private.*`) added to `i18n.js`
10. E2e test for the no-folder regression-safety case
11. E2e test for the sign-in row + cloud-drawer interaction
12. Add `.env.example` + `docs/private-slides.md` + `docs/private-decks.example.json`
13. Add `scripts/smoke-private-decks.mjs`
14. Add `.github/workflows/deploy-pages.yml` (test + deploy, `workflow_dispatch:` included)
15. Add `pages:prepare` + `inject-env` npm scripts in `package.json`; add `firebase` dependency
16. (Implementer self-check) Run full `npm run test:all` + manual smoke
17. (Optional) Verify `__…__` placeholder guard via a unit test
18. Final-review subagent → finishing-a-development-branch → PR → user sets GitHub secrets → re-run workflow → live test

Tasks 1-8 are foundational; 9 polishes; 10-11 verify; 12-15 operator + deploy; 16-18 hand-off.
