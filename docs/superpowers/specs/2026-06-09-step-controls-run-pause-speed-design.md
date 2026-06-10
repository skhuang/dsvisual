# 統一步進控制:Run/Pause/Resume + Speed 滑桿 — 設計文件

- 日期:2026-06-09
- Repo:`/Users/skhuang/course/dsvisual`(分支 main)
- 動機:目前共用的 `buildStepControls` 只有 Step / Run / Reset,Run 一旦啟動只能用 Reset 中止,無法暫停/續跑,也無法調速。需讓所有(現有與未來)使用步進控制的視覺化都支援 Pause/Resume 與可調速度。

## 1. 範圍

- 強化單一共用工廠函式 `buildStepControls(onStep, onReset, runIntervalMs)`(app.js),**維持呼叫簽章不變**,向後相容。
- 自動套用於所有現有呼叫者(12 處:搜尋、Prim、Bellman-Ford、Floyd、segment、fenwick、tree-traversal、huffman、graph-aoe、expr-infix-postfix)與未來呼叫者(Batch B obst/external、Batch C 等)。
- 落地順序:本變更先於 Tier-1 Batch B 實作合併,使後續視覺化自動繼承。

### 非目標(YAGNI)
- 不做 Firebase / Firestore 跨裝置同步(現有雲端整合僅 Google Auth + Drive,無 Firestore 設定儲存,且 file:// 不生效;成本高價值低)。日後若要雲端化偏好,另開需求一併處理。
- 不改動既有以 `executeAnimWrapper` + `sleep()` + 既有 pause/stop 按鈕的排序/搜尋/heap 動畫(那套已有暫停與速度滑桿)。
- 不中英化步進控制標籤(維持現行英文)。

## 2. 控制列規格

`buildStepControls` 回傳的 `.stepctl` 區塊包含(`data-action` 鍵維持不變以相容既有測試/選擇器):

| 元素 | 選擇器 | 行為 |
|---|---|---|
| Step | `[data-action="step"]` | 永遠前進一步(呼叫 `onStep()`);若正在 Run,先暫停(停止計時器、切到 Resume 狀態)再前進一步 |
| Run / Pause / Resume(單一切換鍵) | `[data-action="run"]` | idle→「Run」;執行中→「Pause」;暫停→「Resume」;`onStep()` 回 `false` 自動停止並回「Run」 |
| Reset | `[data-action="reset"]` | 停止計時器、回 idle(「Run」)、呼叫 `onReset()` |
| Speed 滑桿(新增) | `.stepctl-speed`(`input[type=range]`) | min=10, max=600,右邊越快;`delay = 610 − value`(與既有 `sort-speed` 慣例一致) |

### 狀態機
- 狀態:`idle`(無計時器)/ `running`(有 `setInterval`)/ `paused`(暫停,保留進度)。
- Run(idle 或 paused 時點):以目前 delay 啟動 `setInterval(() => { if (onStep() === false) stop&回idle })`;鍵變「Pause」。
- Pause(running 時點同一鍵):`clearInterval`,狀態 `paused`,鍵變「Resume」。
- Step:若 running 先 `clearInterval` 轉 `paused`(鍵「Resume」),再 `onStep()` 一次。
- Reset:`clearInterval`、`onReset()`、鍵回「Run」。
- 自動結束(`onStep()` 回 `false`):`clearInterval`、鍵回「Run」。

### 速度即時生效
- 滑桿 `input` 事件:更新 delay;若 `running`,`clearInterval` 後以新 delay 重新 `setInterval`(無縫變速)。

### 持久化(每視覺化各自,localStorage)
- 儲存鍵:`dsvisual.stepSpeed.<currentMode>`(`currentMode` 由 app.js closure 取得)。
- 建立控制列時:讀 `localStorage[key]`;若有則為滑桿初值,否則預設 = `clamp(610 − (runIntervalMs || 500), 10, 600)`。
- 滑桿變動時:寫回 `localStorage[key]`(以 try/catch 包覆,localStorage 不可用時靜默略過)。
- 重整頁面後,各視覺化沿用各自上次速度。

## 3. 既有行為相容
- `step` / `run` / `reset` 的 `data-action` 與既有相同,既有 E2E(多以點 `.stepctl [data-action="step"]`)維持通過。
- 既有呼叫端不需修改(第三參數 `runIntervalMs` 改為「初始 delay 預設值」,僅在無 localStorage 記錄時生效)。
- 切換 method 時殘留計時器的處理沿用現況:各 render 的 `paint()` 已加「host 元素不存在則 return」防護,殘留 tick 無害(本變更不改變此風險面)。

## 4. 測試
- **Playwright E2E**(新增 `tests/step_controls.spec.js`,以一個穩定的步進視覺化如 `graph-aoe` 為對象):
  1. 點 Run → 短暫等待 → 進度前進(例如 `.aoe-table` 內容變化 / 某可觀測狀態前進);鍵文字變「Pause」。
  2. 點 Pause → 鍵變「Resume」→ 等待 → 進度不再前進。
  3. 點 Resume → 進度繼續前進。
  4. 點 Step(從暫停)→ 前進剛好一步。
  5. 調整 `.stepctl-speed` → reload → 同視覺化的滑桿值保留(localStorage 持久化)。
- **既有測試**:`npm run test:all` 全綠(step/run/reset 選擇器不變)。

## 5. 檔案清單
- 修改:`app.js`(改寫 `buildStepControls`)、`style.css`(`.stepctl-speed` 與切換鍵狀態樣式)。
- 新增:`tests/step_controls.spec.js`。
- 不需改 index.html / build 流程 / 資料檔。

## 6. 驗收標準
- 任一步進視覺化:Run 會自動前進;同一鍵可 Pause→Resume;Step 前進一步;Reset 歸零;Speed 滑桿即時變速。
- 每視覺化的速度設定各自以 localStorage 記憶,重整後保留。
- `npm run test:all` 通過,含新 E2E。
- 12 個現有步進視覺化與後續 Batch B/C 全部自動具備此控制(因共用 `buildStepControls`)。

## 7. 風險與緩解
- **滑桿即時變速重設 interval**:以 `clearInterval`+`setInterval` 切換,確保只有一個計時器(每次啟動前先清舊計時器)。
- **localStorage 不可用(隱私模式/file://)**:讀寫以 try/catch 包覆,失敗則退回預設值,功能不受影響。
- **既有測試相容**:保留 `data-action` 鍵;若有測試點 `run` 預期「啟動」,toggle 第一次點仍是啟動,語意相容。
