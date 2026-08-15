# dsvisual maccount 認證設計文件 — 以 maccount 取代 Firebase/Drive(B2)

- 日期:2026-08-16
- Repo:`dsvisual`(vanilla JS + GitHub Pages;branch `feat/maccount-auth`)
- 動機:sub-project B 的 B2。dsvisual 目前的雲端整合是 **Firebase Google 登入 + Google Drive token**,唯一用途是「私有投影片(private slides via Drive)」。改為 **maccount 帳號登入**(用 B1 的 relying-app SSO):登入後 dsvisual 取得 `{student_id, providers}` 身分,供未來 sub-project C 的「Practice on dsjudge」gate。**移除 Firebase/Drive/private-slides**(已確認 2a)。

## 0. 範圍與決策(已與使用者確認)

- **以 maccount SSO 取代 Firebase**:`signIn()` 導向 `<worker>/auth/app/start?app=dsvisual&return=<current url>`;載入時讀 URL fragment 的 `#mtoken`,`POST <worker>/api/app/verify` 換 `{student_id, providers}`。
- **丟棄 Drive/private-slides(2a)**:移除 `getAccessToken`、`DRIVE_SCOPES`、`app.js` 的 `getPrivateContext()` 與 Drive 私有投影片路徑、Firebase SDK/設定/CDN。公開投影片不受影響。
- **方法改名**:`signInWithGoogle/signOutGoogle` → `signIn/signOut`(同步更新 `cloud-drawer.js`)。
- **身分持久化 = sessionStorage**(伺服器端 maccount session 仍在;短效 token 模型)。
- **firebase npm devDep 移除**(已確認全專案未 import,只用過 CDN `window.firebase`)。
- **B2 只做 dsvisual 端**;maccount 端(B1)已完成並 merge。「Practice on dsjudge」按鈕啟用為 sub-project C。

## 1. 現況(已查證)

- `js/cloud-config.js`:`window.dsvisualCloudConfig = { firebase:{...6 keys...}, drive:{ privateSlidesFolderId } }`,佔位 `__…__` 由 `scripts/inject-env.mjs` 注入。
- `js/cloud-integration.js`:`window.cloudClient()` 單例,回 `{ isConfigured, missingReason, getUser, getAccessToken, subscribeAuthState, signInWithGoogle, signOutGoogle }`;用 CDN `window.firebase`(`firebase.auth().signInWithPopup(GoogleAuthProvider + DRIVE_SCOPES)`);`file://` 或設定不全 → stub client。另匯出 `window.DRIVE_SCOPES`。
- `js/cloud-drawer.js`:登入抽屜 UI;用 `getUser`、`subscribeAuthState`、`signInWithGoogle`、`signOutGoogle`;body 依登入狀態渲染。
- `js/app.js:730-740`:`getPrivateContext()` 讀 `cfg.drive.privateSlidesFolderId` + `client.getAccessToken()`,供私有投影片(Drive)。
- `index.html`:載入 Firebase CDN(12-14:app-compat/auth-compat/firestore-compat)、`js/cloud-config.js`(496)、`js/cloud-integration.js`(497)、`js/cloud-drawer.js`(500);`#cloud-drawer` 面板容器(287-294)。
- `scripts/inject-env.mjs`:把 6 個 `__FIREBASE_*__` 佔位換成 env。
- `package.json`:`firebase` devDep(未被 import,只 CDN 使用)。
- **B1 契約(已 merge 到 maccount main)**:`GET <worker>/auth/app/start?app=&return=`(登入→ `<return>#mtoken=<token>`);`POST <worker>/api/app/verify` body `{token}` → `{student_id, providers:{github,google}}`(CORS,只給 allowlist origin)。

## 2. 設計

### 2.1 `js/cloud-config.js`

- 改為:`window.dsvisualCloudConfig = { maccount: { workerBaseUrl: '__MACCOUNT_WORKER_URL__', appId: 'dsvisual' } }`。移除 `firebase`/`drive` 區塊。
- `scripts/inject-env.mjs`:佔位映射改為 `{ __MACCOUNT_WORKER_URL__: 'MACCOUNT_WORKER_URL' }`(移除 6 個 Firebase 映射)。未注入時維持 `__MACCOUNT_WORKER_URL__` 佔位 → 視為未設定(client stub)。

### 2.2 `js/cloud-integration.js`(重寫為 maccount client)

- `window.cloudClient()` 單例,回:
  - `isConfigured`:`workerBaseUrl` 有值且非 `__…__` 佔位、且非 `file://`。
  - `getUser()`:回目前 `{student_id, providers}` 或 `null`(從記憶體/`sessionStorage`)。
  - `subscribeAuthState(cb)`:註冊 listener,登入/登出時以目前 user 呼叫;回 unsubscribe。載入即以目前狀態呼叫一次(比照 Firebase `onAuthStateChanged` 語意)。
  - `signIn()`:`window.location.assign(workerBaseUrl + '/auth/app/start?app=' + appId + '&return=' + encodeURIComponent(location.href))`。
  - `signOut()`:清 `sessionStorage` 身分 + 記憶體 + 通知 subscribers。(可選:提供 `logoutUrl()` 連 `<worker>/logout`;預設只清本地。)
- **載入時 `handleRedirect()`**:若 `location.hash` 內含 `mtoken=` → 取出 token → `fetch(workerBaseUrl + '/api/app/verify', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token})})` → 成功則存 `{student_id, providers}`(sessionStorage,key `dsvisual:maccount:user`)、**清掉 fragment**(`history.replaceState` 移除 `#mtoken=…`)、通知 subscribers;失敗則忽略(不改狀態)。
- 未設定/`file://` → stub client(`isConfigured:false`,`getUser→null`,`signIn`/`signOut` no-op 或明確訊息),比照現況 stub 精神。
- **移除**:`getAccessToken`、`DRIVE_SCOPES`、所有 Firebase(`initializeApp`/`auth`/popup)。

### 2.3 `js/cloud-drawer.js`

- 改用 `signIn`/`signOut`/`getUser`;登入後顯示 `student_id` + 已綁 providers(github/google 徽章);未登入顯示「以 NYCU 帳號登入」按鈕呼叫 `signIn()`。`subscribeAuthState` 重繪不變。

### 2.4 `js/app.js`

- 移除 `getPrivateContext()` 與私有投影片(Drive)路徑;`publicSlidesFor()` 與公開投影片流程不動。移除對 `getAccessToken`/`cfg.drive` 的引用。

### 2.5 `index.html`

- 移除 3 個 Firebase CDN `<script>`(12-14)。保留 `cloud-config.js`/`cloud-integration.js`/`cloud-drawer.js` 載入順序與 `#cloud-drawer` 容器。

### 2.6 i18n / 文案

- `cloud.*` 文案:登入按鈕改「以 NYCU 帳號登入 / Sign in with NYCU」;顯示學號 + providers 的字串(en/zh)。

## 3. 檔案清單(dsvisual)

- 修改:`js/cloud-config.js`(maccount 設定)、`js/cloud-integration.js`(重寫)、`js/cloud-drawer.js`(改用 signIn/signOut + 顯示身分)、`js/app.js`(移除 Drive private-slides)、`index.html`(移除 Firebase CDN)、`scripts/inject-env.mjs`(佔位映射)、`js/i18n.js`(文案)、`package.json`(移除 firebase devDep)、（可選 `style.css` 徽章樣式)。
- 測試:`tests/`(Playwright)+ 可能的 unit——以 stub `fetch` + 假 workerBaseUrl 驗:`#mtoken` → verify → `getUser()` 有身分 + fragment 被清;`signIn()` 組出正確 `/auth/app/start` URL;drawer 依登入態渲染;未設定 → stub。
- 不動:`js/quiz*`、`js/lab*`、`labs/`、`js/cloud-config.js` 以外的雲端、slides 管線、viz。

## 4. 測試

- **redirect 回來**:`location.hash = '#mtoken=<t>'` + stub `fetch('/api/app/verify')` 回 `{student_id:'S1', providers:{github:true,google:false}}` → 載入後 `getUser()` 回該身分、`location.hash` 被清、subscribers 收到。
- **signIn**:呼叫 → `location.assign` 目標為 `<worker>/auth/app/start?app=dsvisual&return=<encoded href>`(以 spy/stub 驗 URL,不真跳轉)。
- **signOut**:清 sessionStorage + `getUser()` 回 null + subscribers 收到 null。
- **verify 失敗**:`/api/app/verify` 回非 200 → 狀態不變、不存身分。
- **未設定 / file://**:`isConfigured:false`,`getUser→null`,`signIn` 不炸。
- **drawer**:未登入顯示登入鈕;登入顯示學號 + providers;點登出回未登入態。
- **移除確認**:無 `getAccessToken`/`DRIVE_SCOPES`/Firebase 參照;`app.js` 無 `getPrivateContext`;`index.html` 無 firebase CDN;`package.json` 無 firebase。
- **回歸**:`npm run test:all` 綠;quiz/lab/slides/viz 不退化;`js/code_db.js`/`js/quiz_rendered.js`/`js/labs_rendered.js`/`js/slides_rendered.js` 未動。

## 5. 驗收標準

- 設定 `MACCOUNT_WORKER_URL` 後,dsvisual「登入」→ 跳 maccount → 回來即以 `#mtoken` 換得並顯示 `{student_id, providers}`;重整(同分頁)仍登入(sessionStorage);登出清除。
- Firebase/Drive/private-slides 完全移除;公開投影片、quiz、lab 不受影響。
- 未設定 worker URL 時安全降級(stub,不炸、不亂跳)。
- `npm run test:all` 綠。

## 6. 風險與緩解

- **token 在 fragment**:`handleRedirect` 換完身分後立即 `history.replaceState` 清除 fragment,避免殘留於 URL/歷史。
- **跨源 verify**:`fetch` 到 maccount worker(CORS 已在 B1 對 allowlist origin 開放);dsvisual origin 必須在 maccount `APP_ALLOWLIST`(部署設定)。
- **sessionStorage 範圍**:僅同分頁;關閉分頁需重新 SSO(maccount session 仍在,通常免再登入,體驗可接受)。
- **移除 Drive 的既有使用者**:私有投影片功能移除——已與使用者確認(2a);公開投影片不影響。
- **設定缺失**:未注入 `MACCOUNT_WORKER_URL` → stub,不影響 quiz/lab/viz。
- **相容**:純 dsvisual 前端;不動題庫/lab/slides 管線與 viz;`code_db`/生成檔不動。
- **範圍界線**:B2 僅 dsvisual auth。「Practice on dsjudge」按鈕(讀 `dsjudgeUrl`、gate 於登入)為 sub-project C。
