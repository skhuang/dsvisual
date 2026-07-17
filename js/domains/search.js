(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  // Search Vectors
  const arrLinear = [23, 12, 56, 8, 38, 2, 72, 91, 16, 5];
  const arrBinary = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

  let dom = null; // { searchVal, btnSearchGo, btnSearchRandom }

  function renderSearchArray(arr) {
    const sa = document.getElementById('search-array'); const sp = document.getElementById('search-pointers'); sa.innerHTML = ''; sp.innerHTML = '';
    arr.forEach((v, i) => { const slot = document.createElement('div'); slot.className = 's-slot'; slot.id = 'ss-' + i; slot.innerHTML = "<span>[" + i + "]</span>" + v; sa.appendChild(slot); });
    ['ptr-l', 'ptr-r', 'ptr-m'].forEach(cls => { const p = document.createElement('div'); p.className = 's-ptr ' + cls; p.id = cls; if(cls === 'ptr-l') p.textContent = 'L'; else if(cls === 'ptr-r') p.textContent = 'R'; else p.textContent = 'M'; sp.appendChild(p); });
  }

  async function runLinearSearch(target) {
    const showStatus = K().showStatus;
    renderSearchArray(arrLinear); showStatus('Linear Search', '#60a5fa');
    const lPtr = document.getElementById('ptr-l'); lPtr.classList.add('visible'); lPtr.textContent = 'i';
    for (let i = 0; i < arrLinear.length; i++) {
        const slot = document.getElementById('ss-' + i); lPtr.style.left = slot.offsetLeft + 'px'; slot.classList.add('active'); await sleep(800);
        if (arrLinear[i] === target) { slot.classList.remove('active'); slot.classList.add('found'); return; } else { slot.classList.remove('active'); slot.classList.add('dim'); }
    }
    lPtr.classList.remove('visible');
  }
  async function runBinarySearch(target) {
    const showStatus = K().showStatus;
    renderSearchArray(arrBinary); showStatus('Starting Binary Search...', '#60a5fa');
    const lPtr = document.getElementById('ptr-l'); const rPtr = document.getElementById('ptr-r'); const mPtr = document.getElementById('ptr-m');
    lPtr.classList.add('visible'); rPtr.classList.add('visible'); let left = 0; let right = arrBinary.length - 1;
    while (left <= right) {
        const slotL = document.getElementById('ss-' + left); const slotR = document.getElementById('ss-' + right);
        lPtr.style.left = slotL.offsetLeft + 'px'; rPtr.style.left = slotR.offsetLeft + 'px';
        for(let i=0; i<arrBinary.length; i++) { const s = document.getElementById('ss-' + i); if(i < left || i > right) s.classList.add('dim'); }
        await sleep(1000); let mid = Math.floor(left + (right - left) / 2); showStatus("L=" + left + ", R=" + right + " => M=" + mid, '#fcd34d');
        const slotM = document.getElementById('ss-' + mid); mPtr.style.left = slotM.offsetLeft + 'px'; mPtr.classList.add('visible'); slotM.classList.add('mid');
        await sleep(1200);
        if (arrBinary[mid] === target) { slotM.classList.remove('mid'); slotM.classList.add('found'); showStatus("Found " + target + " at index " + mid + "!", '#34d399'); return; }
        if (arrBinary[mid] < target) { showStatus("arr[" + mid + "] < " + target + ". Ignore left half.", '#94a3b8'); left = mid + 1; }
        else { showStatus("arr[" + mid + "] > " + target + ". Ignore right half.", '#94a3b8'); right = mid - 1; }
        slotM.classList.remove('mid'); mPtr.classList.remove('visible'); await sleep(800);
    }
    showStatus(target + " not found in array.", '#f87171'); lPtr.classList.remove('visible'); rPtr.classList.remove('visible');
  }

  function init() {
    dom = {
      searchVal: document.getElementById('search-val'),
      btnSearchGo: document.getElementById('btn-search-go'),
      btnSearchRandom: document.getElementById('btn-search-random'),
    };

    dom.btnSearchGo.addEventListener('click', () => { const showStatus = K().showStatus; const target = parseInt(dom.searchVal.value); if(isNaN(target)) return showStatus('Enter valid target.', '#f87171'); const currentMode = C().getMode(); if (currentMode === 'search-linear') K().executeAnimWrapper(async () => await runLinearSearch(target)); else if (currentMode === 'search-binary') K().executeAnimWrapper(async () => await runBinarySearch(target)); });
    dom.btnSearchRandom.addEventListener('click', () => {
        if (animState === 'playing' || animState === 'paused') return;
        const currentMode = C().getMode();
        const inp = window.RandomInput && RandomInput.randomInputFor(currentMode, K().getInputDifficulty());
        if (!inp) return;
        const arr = currentMode === 'search-binary' ? arrBinary : arrLinear;
        arr.length = 0;
        inp.arr.forEach((v) => arr.push(v));
        dom.searchVal.value = inp.target;
        renderSearchArray(arr);
    });
  }

  R().attach('search-linear', { render: () => renderSearchArray(arrLinear), code: () => codeSearchLinear, layout: null });
  R().attach('search-binary', { render: () => renderSearchArray(arrBinary), code: () => codeSearchBinary, layout: null });
  C().registerDomain({ id: 'search', init: init });
})(typeof window !== 'undefined' ? window : globalThis);
