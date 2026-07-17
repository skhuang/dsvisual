(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  let sortArrData = [];
  let dom = null; // { sortContainer, btnSortStart, btnSortRandom }

  function renderSortBars() {
    dom.sortContainer.innerHTML = '';
    sortArrData.forEach((val, i) => { const bar = document.createElement('div'); bar.className = 'sort-bar'; bar.id = 'sb-' + i; bar.style.height = (val * 2.5) + 'px'; bar.innerHTML = '<span>' + val + '</span>'; dom.sortContainer.appendChild(bar); });
  }
  function setBarVal(index, val) { sortArrData[index] = val; const bar = document.getElementById('sb-' + index); if(bar) { bar.style.height = (val * 2.5) + 'px'; bar.innerHTML = '<span>' + val + '</span>'; } }
  function setBarColor(index, classN) { const bar = document.getElementById('sb-' + index); if(bar) bar.className = 'sort-bar ' + classN; }

  function generateSortArray() {
    const showStatus = K().showStatus;
    const inp = window.RandomInput && RandomInput.randomInputFor('sort', K().getInputDifficulty());
    if (inp && Array.isArray(inp.data) && inp.data.length) {
        sortArrData = inp.data.slice();
    } else {
        sortArrData = [];
        for (let i = 0; i < 15; i++) sortArrData.push(Math.floor(Math.random() * 95) + 5);
    }
    renderSortBars();
    showStatus("Generated Random Array.", "#94a3b8");
  }

  async function runBubbleSort() {
    const showStatus = K().showStatus;
    showStatus("Bubble Sort", "#60a5fa"); const n = sortArrData.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            setBarColor(j, 'comparing'); setBarColor(j+1, 'comparing'); await sleep(K().getDelay());
            if (sortArrData[j] > sortArrData[j + 1]) {
                setBarColor(j, 'swapping'); setBarColor(j+1, 'swapping');
                let temp = sortArrData[j]; setBarVal(j, sortArrData[j+1]); setBarVal(j+1, temp); await sleep(K().getDelay());
            }
            setBarColor(j, ''); setBarColor(j+1, '');
        }
        setBarColor(n - i - 1, 'sorted');
    }
    setBarColor(0, 'sorted');
  }
  async function runSelectionSort() {
    const showStatus = K().showStatus;
    showStatus("Selection Sort", "#60a5fa"); const n = sortArrData.length;
    for (let i = 0; i < n - 1; i++) {
        let min_idx = i; setBarColor(min_idx, 'pivot');
        for (let j = i + 1; j < n; j++) {
            setBarColor(j, 'comparing'); await sleep(K().getDelay());
            if (sortArrData[j] < sortArrData[min_idx]) { if(min_idx !== i) setBarColor(min_idx, ''); min_idx = j; setBarColor(min_idx, 'swapping'); } else setBarColor(j, '');
        }
        if(min_idx !== i) { let temp = sortArrData[min_idx]; setBarVal(min_idx, sortArrData[i]); setBarVal(i, temp); }
        setBarColor(min_idx, ''); setBarColor(i, 'sorted');
    }
    setBarColor(n-1, 'sorted');
  }
  async function runInsertionSort() {
    const showStatus = K().showStatus;
    showStatus("Insertion Sort", "#60a5fa"); const n = sortArrData.length; setBarColor(0, 'sorted');
    for (let i = 1; i < n; i++) {
        let key = sortArrData[i]; let j = i - 1; setBarColor(i, 'swapping'); await sleep(K().getDelay());
        while (j >= 0 && sortArrData[j] > key) {
            setBarColor(j, 'comparing'); setBarVal(j + 1, sortArrData[j]); await sleep(K().getDelay());
            setBarColor(j, 'sorted'); setBarColor(j+1, 'sorted'); j = j - 1;
        }
        setBarVal(j + 1, key); setBarColor(j+1, 'sorted');
    }
  }
  async function runQuickSort() { const showStatus = K().showStatus; showStatus("Quick Sort", "#60a5fa"); await qsHelper(0, sortArrData.length - 1); }
  async function qsHelper(low, high) {
    if (low < high) { let pi = await qsPartition(low, high); await qsHelper(low, pi - 1); await qsHelper(pi + 1, high); }
    else if (low >= 0 && high >= 0 && low === high) setBarColor(low, 'sorted');
  }
  async function qsPartition(low, high) {
    let pivot = sortArrData[high]; setBarColor(high, 'pivot'); let i = low - 1;
    for (let j = low; j < high; j++) {
        setBarColor(j, 'comparing'); await sleep(K().getDelay());
        if (sortArrData[j] < pivot) { i++; let temp = sortArrData[i]; setBarVal(i, sortArrData[j]); setBarVal(j, temp); setBarColor(i, 'swapping'); }
        if(i !== j) setBarColor(j, '');
    }
    await sleep(K().getDelay()); let temp = sortArrData[i+1]; setBarVal(i+1, sortArrData[high]); setBarVal(high, temp); setBarColor(high, ''); setBarColor(i+1, 'sorted');
    for(let k=low; k<=i; k++) setBarColor(k, ''); return i + 1;
  }
  async function runMergeSort() { const showStatus = K().showStatus; showStatus("Merge Sort", "#60a5fa"); await msHelper(0, sortArrData.length - 1); }
  async function msHelper(l, r) { if (l >= r) return; let m = Math.floor(l + (r - l) / 2); await msHelper(l, m); await msHelper(m + 1, r); await msMerge(l, m, r); }
  async function msMerge(l, m, r) {
    let n1 = m - l + 1, n2 = r - m; let L = [], R = [];
    for(let i=0; i<n1; i++) L.push(sortArrData[l + i]); for(let j=0; j<n2; j++) R.push(sortArrData[m + 1 + j]);
    let i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        setBarColor(k, 'comparing'); await sleep(K().getDelay());
        if (L[i] <= R[j]) { setBarVal(k, L[i]); i++; } else { setBarVal(k, R[j]); j++; }
        setBarColor(k, 'sorted'); k++;
    }
    while (i < n1) { setBarVal(k, L[i]); setBarColor(k, 'sorted'); i++; k++; await sleep(K().getDelay()/2); }
    while (j < n2) { setBarVal(k, R[j]); setBarColor(k, 'sorted'); j++; k++; await sleep(K().getDelay()/2); }
  }
  async function runShellSort() {
    const showStatus = K().showStatus;
    showStatus("Shell Sort", "#60a5fa"); let n = sortArrData.length;
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        for (let i = gap; i < n; i++) {
            let temp = sortArrData[i]; let j; setBarColor(i, 'pivot');
            for (j = i; j >= gap && sortArrData[j - gap] > temp; j -= gap) {
                setBarColor(j - gap, 'comparing'); await sleep(K().getDelay()); setBarVal(j, sortArrData[j - gap]); setBarColor(j, 'swapping'); setBarColor(j - gap, '');
            }
            setBarVal(j, temp); setBarColor(i, ''); setBarColor(j, '');
        }
    }
  }

  async function runBucketSort() {
    const showStatus = K().showStatus;
    showStatus("Bucket Sort: Distributing elements into logical buckets", "#fbbf24");
    // Simulated visualization: We color code ranges
    let max = Math.max(...sortArrData);
    for(let i=0; i<sortArrData.length; i++) {
        let bucketIdx = Math.floor((sortArrData[i] / max) * 4); // 5 colors map
        const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
        document.getElementById('sb-' + i).style.background = colors[bucketIdx] || colors[4];
        await sleep(K().getDelay() / 4);
    }
    await sleep(K().getDelay());
    showStatus("Bucket Sort: Sorting inside individual buckets & Re-assembling", "#3b82f6");
    for (let i = 1; i < sortArrData.length; i++) {
        let key = sortArrData[i]; let j = i - 1;
        while (j >= 0 && sortArrData[j] > key) {
            sortArrData[j + 1] = sortArrData[j];
            renderSortBars(); await sleep(K().getDelay() / 2); // Visual step
            j = j - 1;
        }
        sortArrData[j + 1] = key;
    }
  }

  async function runCountingSort() {
    const showStatus = K().showStatus;
    showStatus("Counting Sort: Building Frequency Map", "#fbbf24");
    let max = Math.max(...sortArrData); let min = Math.min(...sortArrData);
    let count = new Array(max - min + 1).fill(0); let output = new Array(sortArrData.length).fill(0);

    for (let i = 0; i < sortArrData.length; i++) {
        setBarColor(i, 'active'); await sleep(K().getDelay() / 4);
        count[sortArrData[i] - min]++; setBarColor(i, 'default');
    }
    showStatus("Counting Sort: Re-populating target Array based on accumulated addresses", "#60a5fa");
    for (let i = 1; i < count.length; i++) { count[i] += count[i - 1]; }
    for (let i = sortArrData.length - 1; i >= 0; i--) {
        output[count[sortArrData[i] - min] - 1] = sortArrData[i];
        count[sortArrData[i] - min]--;
    }
    for(let i = 0; i < sortArrData.length; i++) {
        sortArrData[i] = output[i]; renderSortBars(); setBarColor(i, 'sorted'); await sleep(K().getDelay() / 2);
    }
  }

  async function runRadixSort() {
    const showStatus = K().showStatus;
    let max = Math.max(...sortArrData);
    for(let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        showStatus('Radix Sort: Distributing strictly based on digit value (' + exp + 's place)', '#f472b6');
        let output = new Array(sortArrData.length).fill(0); let count = new Array(10).fill(0);
        for(let i=0; i<sortArrData.length; i++) count[Math.floor((sortArrData[i] / exp) % 10)]++;
        for(let i=1; i<10; i++) count[i] += count[i - 1];
        for(let i=sortArrData.length - 1; i>=0; i--) { output[count[Math.floor((sortArrData[i] / exp) % 10)] - 1] = sortArrData[i]; count[Math.floor((sortArrData[i] / exp) % 10)]--; }
        for(let i=0; i<sortArrData.length; i++) {
            sortArrData[i] = output[i]; renderSortBars(); setBarColor(i, 'active'); await sleep(K().getDelay() / 2); setBarColor(i, 'default');
        }
    }
  }

  async function runHeapSort() {
    const showStatus = K().showStatus;
    let n = sortArrData.length;
    async function heapify(n, i) {
        let largest = i; let l = 2*i + 1; let r = 2*i + 2;
        if(l < n && sortArrData[l] > sortArrData[largest]) largest = l;
        if(r < n && sortArrData[r] > sortArrData[largest]) largest = r;
        if(largest !== i) {
            setBarColor(i, 'active'); setBarColor(largest, 'active'); await sleep(K().getDelay());
            let t = sortArrData[i]; sortArrData[i] = sortArrData[largest]; sortArrData[largest] = t;
            renderSortBars(); await sleep(K().getDelay()); await heapify(n, largest);
        }
    }

    showStatus("Heap Sort: Building absolute Max Heap (Heapify Structure)", "#fbbf24");
    for(let i = Math.floor(n / 2) - 1; i >= 0; i--) { await heapify(n, i); }

    showStatus("Heap Sort: Extracting Max Element & Restoring Tree", "#60a5fa");
    for(let i = n - 1; i > 0; i--) {
        setBarColor(0, 'active'); setBarColor(i, 'active'); await sleep(K().getDelay());
        let t = sortArrData[0]; sortArrData[0] = sortArrData[i]; sortArrData[i] = t;
        renderSortBars(); setBarColor(i, 'sorted'); await sleep(K().getDelay()); await heapify(i, 0);
    }
    setBarColor(0, 'sorted');
  }

  async function runShakerSort() {
    const showStatus = K().showStatus;
    showStatus('Shaker Sort: Starting bidirectional bubble passes', '#fbbf24');
    let n = sortArrData.length;
    let left = 0, right = n - 1;
    let swapped;

    while (left < right) {
        // Forward pass (left to right)
        swapped = false;
        for (let i = left; i < right; i++) {
            setBarColor(i, 'comparing'); setBarColor(i + 1, 'comparing'); await sleep(K().getDelay());
            if (sortArrData[i] > sortArrData[i + 1]) {
                setBarColor(i, 'swapping'); setBarColor(i + 1, 'swapping');
                let temp = sortArrData[i]; setBarVal(i, sortArrData[i + 1]); setBarVal(i + 1, temp);
                await sleep(K().getDelay());
                swapped = true;
            }
            setBarColor(i, ''); setBarColor(i + 1, '');
        }
        // Largest element is now at 'right'
        setBarColor(right, 'sorted');
        right--;

        // If no swap occurred, array is sorted
        if (!swapped) break;

        // Backward pass (right to left)
        swapped = false;
        for (let i = right; i > left; i--) {
            setBarColor(i - 1, 'comparing'); setBarColor(i, 'comparing'); await sleep(K().getDelay());
            if (sortArrData[i - 1] > sortArrData[i]) {
                setBarColor(i - 1, 'swapping'); setBarColor(i, 'swapping');
                let temp = sortArrData[i - 1]; setBarVal(i - 1, sortArrData[i]); setBarVal(i, temp);
                await sleep(K().getDelay());
                swapped = true;
            }
            setBarColor(i - 1, ''); setBarColor(i, '');
        }
        // Smallest element is now at 'left'
        setBarColor(left, 'sorted');
        left++;

        // If no swap occurred, array is sorted
        if (!swapped) break;
    }

    // Mark remaining unsorted as sorted
    for (let i = left; i <= right; i++) {
        setBarColor(i, 'sorted');
    }
    showStatus('Shaker Sort complete!', '#34d399');
  }

  function onModeSwitch(mode) {
    if (mode.includes('sort-') && sortArrData.length === 0) generateSortArray();
  }

  function init() {
    dom = {
      sortContainer: document.getElementById('sort-container'),
      btnSortStart: document.getElementById('btn-sort-start'),
      btnSortRandom: document.getElementById('btn-sort-random'),
    };

    dom.btnSortRandom.addEventListener('click', () => { if(animState === 'playing' || animState === 'paused') return; generateSortArray(); });
    dom.btnSortStart.addEventListener('click', () => {
        renderSortBars();
        const currentMode = C().getMode();
        if (currentMode === 'sort-bubble') K().executeAnimWrapper(async () => await runBubbleSort());
        else if (currentMode === 'sort-select') K().executeAnimWrapper(async () => await runSelectionSort());
        else if (currentMode === 'sort-insert') K().executeAnimWrapper(async () => await runInsertionSort());
        else if (currentMode === 'sort-quick') K().executeAnimWrapper(async () => { await runQuickSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
        else if (currentMode === 'sort-merge') K().executeAnimWrapper(async () => { await runMergeSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
        else if (currentMode === 'sort-shell') K().executeAnimWrapper(async () => { await runShellSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
        else if (currentMode === 'sort-bucket') K().executeAnimWrapper(async () => { await runBucketSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
        else if (currentMode === 'sort-count') K().executeAnimWrapper(async () => { await runCountingSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
        else if (currentMode === 'sort-radix') K().executeAnimWrapper(async () => { await runRadixSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
        else if (currentMode === 'sort-heap') K().executeAnimWrapper(async () => { await runHeapSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
        else if (currentMode === 'sort-shaker') K().executeAnimWrapper(async () => { await runShakerSort(); if(animState!=='stopped') {for(let i=0;i<sortArrData.length;i++) setBarColor(i, 'sorted');} });
    });
  }

  R().attach('sort-bubble', { render: renderSortBars, code: () => codeSortBubble, layout: null });
  R().attach('sort-select', { render: renderSortBars, code: () => codeSortSelect, layout: null });
  R().attach('sort-insert', { render: renderSortBars, code: () => codeSortInsert, layout: null });
  R().attach('sort-quick', { render: renderSortBars, code: () => codeSortQuick, layout: null });
  R().attach('sort-merge', { render: renderSortBars, code: () => codeSortMerge, layout: null });
  R().attach('sort-shell', { render: renderSortBars, code: () => codeSortShell, layout: null });
  R().attach('sort-bucket', { render: renderSortBars, code: () => codeSortBucket, layout: null });
  R().attach('sort-count', { render: renderSortBars, code: () => codeSortCounting, layout: null });
  R().attach('sort-radix', { render: renderSortBars, code: () => codeSortRadix, layout: null });
  R().attach('sort-heap', { render: renderSortBars, code: () => codeSortHeap, layout: null });
  R().attach('sort-shaker', { render: renderSortBars, code: () => codeSortShaker, layout: null });
  C().registerDomain({ id: 'sort', init: init, onModeSwitch: onModeSwitch });
})(typeof window !== 'undefined' ? window : globalThis);
