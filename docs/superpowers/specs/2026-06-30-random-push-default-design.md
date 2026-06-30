# 隨機 Push/Enqueue 預設值 — 設計文件

- 日期:2026-06-30
- Repo:`/Users/skhuang/course/dsvisual`(main)
- 動機:stack(array/list)的 Push 與 queue 的 Enqueue 目前共用 `#std-value` 輸入框,預設固定值 `10`,連按會一直推入相同值。改為每次預設隨機值,讓示範資料自然有變化。

## 1. 現況

- `index.html`:`<input id="std-value" ... value="10">` — 固定預設 10。
- `js/app.js` `btnStdAdd` 點擊處理器(~line 1791)直接讀 `stdVal.value`,push 到 `stackData` 或 enqueue 到 `qArr`。
- stack-array / stack-list / queue 三者共用此輸入框。

## 2. 需求

- **初始隨機**:載入時 `#std-value` 即為 1–99 的隨機整數(取代固定 10)。
- **按後換值**:每次「成功」Push/Enqueue 後,自動把 `#std-value` 填入新的 1–99 隨機整數。
- 溢位(Stack/Queue Overflow)或輸入無效時不換值(維持原本 early-return 行為)。
- 使用者仍可手動覆寫輸入框再按特定值。
- 不影響 Pop/Dequeue,不影響其他視覺化。

範圍:1–99(兩位數,與其他視覺化隨機值一致)。

## 3. 設計

- 在 `js/app.js` 加 helper:`function randStdValue() { return Math.floor(Math.random() * 99) + 1; }`(回傳 1–99)。
- **初始化**:取得 `stdVal`(`#std-value`)參考後,設 `stdVal.value = randStdValue();`。(HTML 的 `value="10"` 變為無關緊要,可保留或改;由 JS 覆寫。)
- **按後換值**:在 `btnStdAdd` 處理器中,push 與 enqueue 的成功路徑執行完(render 之後)再 `stdVal.value = randStdValue();`。因為無效輸入與溢位都在前面 `return`,所以只有成功時才會換值——把這行放在處理器最後即可。

## 4. 檔案

- 修改:`js/app.js`(helper + 初始化設值 + btnStdAdd 末尾換值)、`index.html`(`#std-value` 的固定 `value="10"` 可移除或保留,行為由 JS 決定)。
- 不需動 build_db / slides / i18n / code_db。

## 5. 測試

- **E2E**(加到既有 spec 或新 `tests/random_push.spec.js`):
  - 載入 stack-array,讀 `#std-value`,值為整數且在 1–99。
  - 按 Push,`#std-value` 變為另一個 1–99 的整數(在範圍內;通常與前值不同)。
  - 同樣對 queue enqueue 驗證一次。
- 全套 `npm run test:all` 綠;計數測試不受影響(未增減方法/群組)。

## 6. 驗收標準

- stack-array / stack-list / queue 載入時 `#std-value` 為 1–99 隨機值。
- 每次成功 Push/Enqueue 後輸入框換成新的 1–99 隨機值;溢位/無效輸入不換。
- 既有 Pop/Dequeue 與其他 viz 行為不變;`js/cloud-config.js` 未動。

## 7. 風險與緩解

- **怕在使用者輸入中途被覆寫**:只在「成功按下後」與「初始化」換值,使用者打字當下不會被改。
- **隨機可能與前值相同**:1–99 偶爾重複屬正常;E2E 斷言「在範圍內」為主,不強制必不同(避免偶發 flaky)。
