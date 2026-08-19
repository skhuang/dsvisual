# Heap Sort 同時顯示 heap tree 設計文件

- 日期:2026-08-16
- Repo:`dsvisual`;branch `feat/heapsort-tree-view`
- 動機:Heap Sort(`sort-heap`,使用 `sort` observatory visualizer)目前只以長條圖顯示陣列;但 heap sort 的陣列就是一棵完全二元樹。使用者要求**同時顯示 heap tree**,讓 sift-down / extract-max 的樹狀結構一目了然。

## 0. 範圍與決策(已與使用者確認)

- **僅 `sort-heap`** 新增樹狀面板;其他排序不變。
- **版面**:樹在長條圖**下方**(垂直堆疊)。
- **節點集合**:整個陣列畫成一棵完全二元樹,已取出的尾端(`sorted`)節點**變灰保留原位**(呈現堆逐步縮小),連到灰節點的邊淡化。
- 沿用既有 step 控制 / 播放 / 難度 / 🎲;樹與長條圖由**同一組 frames** 同步繪製。

## 1. 現況(已查證,file:line)

- `js/domains/sort.js` `renderSort(methodId)`(:38-77):建控制列 + `stage`(`.sortviz-stage`),`frames = FRAMES[methodId](arr)`,`paint(f)`(:60-64)以 `f.array` + `f.hi[i]` 畫 `.sort-bar`,`K1.buildStepWorkbench({stage, frames, paint, ...})`(:65)驅動動畫。
- 每個 frame:`{ array:[...], hi:{index:class}, message:{zh,en} }`(`js/viz/viz_sort_frames.js:16,157`)。
- `heapFrames`(`viz_sort_frames.js:155-183`):`hi` class 用 `'active'`(sift-down/extract 兩個節點)與 `'sorted'`(取出的尾端,`sorted[e]='sorted'`);建堆 → 反覆 extract-max 到尾端。
- 高亮色(`style.css:526-532`):`active` #818cf8、`sorted` #34d399、預設 `.sort-bar` #60a5fa。樹節點沿用相同色系。

## 2. 設計

### 2.1 `renderSort` 加樹面板(只限 sort-heap)

- 在 `stage` 之後、workbench 之前:若 `methodId === 'sort-heap'`,建立 `treeStage`(`<svg class="sortviz-heaptree" data-testid="heaptree">`,或含 SVG 的 div),append 到 host。
- 改 `paint(f)`:先畫長條圖(不變);若 `methodId === 'sort-heap'`,再呼叫 `renderHeapTree(treeStage, f.array, f.hi)` 同步畫樹。`buildStepWorkbench` 每步呼叫同一個 `paint`,故兩者同步。

### 2.2 `renderHeapTree(svg, array, hi)`(sort.js 內小 helper)

- 完全二元樹佈局:節點 `i` 的層 `L = floor(log2(i+1))`;層內序 `p = i - (2^L - 1)`;層內數 `2^L`;`depth = floor(log2(n)) + 1`。
  - `x = (p + 0.5) / 2^L * W`;`y = (L + 0.5) / depth * H`(W/H 為 viewBox 尺寸;`viewBox` 縮放以容納最寬層)。
- **邊**:對每個 `i>0`,父 `parent = floor((i-1)/2)`,畫線 parent→i;若 `hi[i]==='sorted'` 或 `hi[parent]==='sorted'`,邊加 `dim` class 淡化。
- **節點**:圓 + 值文字;class 依 `hi[i]`:`active` / `sorted` / (預設)。位置用上式。
- SVG 便於畫邊與縮放;節點 ≤ 24(large 難度上限)可讀。`viewBox` 固定、`width:100%` 自適應;必要時外層 `overflow-x:auto`。

### 2.3 CSS(`style.css`)

- `.sortviz-heaptree`:區塊(寬 100%、合理高度、`overflow-x:auto`)。
- `.heaptree-edge`(stroke)+ `.heaptree-edge.dim`(降透明度)。
- `.heaptree-node`(circle,填 #60a5fa)+ `.heaptree-node.active`(#818cf8)+ `.heaptree-node.sorted`(#34d399,可再降透明度)。
- `.heaptree-label`(節點值文字)。
- 響應式:窄螢幕縮放不破版(沿用現有 sort viz 響應式風格)。

### 2.4 不動

- 其他 `sort-*`(不建樹面板);既有長條圖 paint、frames、控制列、🎲、難度;heap.js 的 heap viz;生成檔。

## 3. 檔案清單

- 修改:`js/domains/sort.js`(樹面板 + `renderHeapTree` + paint 擴充,僅 sort-heap)、`style.css`(樹樣式)。
- 測試:`tests/`(Playwright)——sort-heap 同時有長條圖與樹;樹節點數 = 陣列長度;逐步時樹更新且高亮(active/sorted)與長條圖一致;其他排序(如 sort-bubble)**無**樹面板。
- 不動:生成檔、其他 viz。

## 4. 測試

- **sort-heap 有樹**:載入 `sort-heap` → 存在 `[data-testid="heaptree"]`,且含 n 個 `.heaptree-node`(n = 輸入長度)。
- **樹反映陣列**:某步(如建堆後),樹節點值序列 = `f.array`;父子邊存在(節點 i 與 2i+1/2i+2 連線)。
- **高亮同步**:某 sift-down/extract 步,樹中對應 index 的節點有 `active` class;取出後尾端節點有 `sorted` class(且變灰)——與長條圖 `f.hi` 一致。
- **其他排序無樹**:載入 `sort-bubble` → 無 `[data-testid="heaptree"]`。
- **難度/🎲**:切難度或按 🎲 重建後,樹隨新陣列重繪、節點數更新。
- 回歸:`npm run test:all` 綠;既有 sort 測試不退化。

## 5. 驗收標準

- Heap Sort 同時顯示長條圖與 heap tree,兩者由同一 frames 同步;樹為完全二元樹,高亮(active/sorted)與長條圖一致;取出的尾端在樹中變灰、邊淡化(呈現堆縮小)。
- 其他排序不受影響。
- `npm run test:all` 綠。

## 6. 風險與緩解

- **寬輸入(large 24 節點)**:5 層樹較寬——`viewBox` 縮放 + `overflow-x:auto`;節點半徑/字級隨層數縮放,避免重疊。
- **sorted 尾端語意**:`hi[i]==='sorted'` 即已取出;樹中變灰、邊淡化即可,不需另傳 heapSize。
- **paint 效能**:每步重繪 SVG(≤24 節點)成本低。
- **範圍**:僅 sort-heap 加樹;paint 對其他 methodId 行為不變(以 `methodId === 'sort-heap'` 條件包住)。
- **相容**:純前端;不動 frames/演算法/其他 viz/生成檔。
