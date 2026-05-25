# Private course slides on Google Drive

Some course slides shouldn't be public. dsvisual can fetch them from a Google
Drive folder at runtime, gated by Drive-native per-user sharing. Each method's
existing public deck and any private Drive decks for that method appear together
in the slide-viewer's deck-picker; private decks get a 🔒 chip and require
sign-in.

## What you need

- A Google account with Drive.
- A Google Cloud project with the Drive API enabled (the same project used by
  Firebase Auth for this deployment).
- The deployment's `cloud-config.js` (filled at build time via inject-env).

## One-time setup

1. **Create a Drive folder.** Name it something memorable, e.g.
   `dsvisual — private slides`. Copy its folder ID from the URL.
2. **Share the folder** with the Google accounts (or Google Group) of the users
   who should see private decks. "Viewer" permission is enough. Revoke any time.
3. **Set the folder ID** in your deployment's environment:
   `DRIVE_PRIVATE_SLIDES_FOLDER_ID=<the folder ID>`.
   Leave it unset to disable the feature entirely.

## Writing a private deck

1. Author your Marp markdown locally (`marp: true` front-matter). Two files per
   deck — `*.en.md` and `*.zh.md` (note: dsvisual uses `zh`, not `zh-TW`).
2. Upload both files to the Drive folder.
3. Add an entry to `private-decks.json` in the same folder:

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

   All six fields per entry are required. **`method` must match a dsvisual
   method ID** — examples: `tree-bst`, `graph-dijkstra`, `hash-chain`,
   `stack-array`. See `app.js` `METHOD_GROUPS` for the full list.

## What users see

- **Signed-in, in the share list:** the deck appears in the slide-viewer's
  deck-picker bar as `🔒 <title>`. Clicking it renders the markdown via the
  same viewer.
- **Signed-in, not in the share list:** no 🔒 row appears at all — the deck is
  invisible (Drive returns 403 for the manifest, app falls back silently).
- **Not signed in:** the deck-picker bar shows a single
  `🔒 Sign in to see private slides` row. Clicking it opens the cloud drawer
  for Google sign-in.

## OAuth scope note

The app requests `https://www.googleapis.com/auth/drive.readonly` alongside
`drive.file`. On the Google consent screen this appears as "See and download
your Drive files". Users who decline see no 🔒 rows.

## Sanity-check from CLI (smoke script)

```bash
export DRIVE_ACCESS_TOKEN=...  # see scripts/smoke-private-decks.mjs comments
export DRIVE_PRIVATE_SLIDES_FOLDER_ID=<your folder id>
node scripts/smoke-private-decks.mjs
```

Prints the deck list the slide-viewer would receive, with per-deck
`✓ ok` / `✗ denied` / `! error` status.

## Limitations

- One Drive folder per deployment.
- No live updates — manifest fetched once per slide-viewer open.
- No editing slides from the app — author in Drive's UI.
- Per-deck sharing isn't first-class — share at the folder level.
- Images referenced from a private deck must live in repo `slides/` or be
  external URLs.
