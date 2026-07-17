(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  let hashChData = Array.from({ length: 5 }, () => []); // Array of arrays representing Chains
  let hashOaData = new Array(5).fill(null); // Simple array
  let hashBucketData = Array.from({ length: 4 }, () => []); // 4 buckets, max 2 items each
  let dom = null; // { hashChContainer, hashOaContainer, hashBucketContainer, btnHashAdd, hashVal }

  async function runHashInsert(val) {
    const currentMode = C().getMode();
    const showStatus = K().showStatus;
    if(currentMode === 'hash-chain') {
        const num = 5; let idx = ((val % num) + num) % num;
        showStatus(val + " % " + num + " = " + idx, "#fbbf24"); await sleep(1000);
        hashChData[idx].push(val); renderHashes(); showStatus("Chained at Index " + idx, "#34d399");
    } else if(currentMode === 'hash-open') {
        const num = 5; let idx = ((val % num) + num) % num;
        showStatus(val + " % " + num + " = " + idx, "#fbbf24"); await sleep(800);
        const startIdx = idx;
        while(hashOaData[idx] !== null) {
            showStatus("Index " + idx + " occupied! Probing...", "#f87171");
            const s = document.getElementById("hoa-slot-" + idx); if(s) { s.classList.add('swapping'); await sleep(800); s.classList.remove('swapping'); }
            idx = (idx + 1) % num;
            if(idx === startIdx) { showStatus("Hash Table Full!", "#f87171"); return; }
        }
        hashOaData[idx] = val; renderHashes(); showStatus("Inserted at Index " + idx, "#34d399");
    } else if(currentMode === 'hash-bucket') {
        const numBuckets = 4; const bCapacity = 2; let idx = ((val % numBuckets) + numBuckets) % numBuckets;
        showStatus(val + " % " + numBuckets + " = Bucket " + idx, "#fbbf24"); await sleep(800);
        const startIdx = idx;
        while(hashBucketData[idx].length >= bCapacity) {
            showStatus("Bucket " + idx + " Block full! Overflowing...", "#f87171");
            const b = document.getElementById("hb-block-" + idx); if(b) { b.classList.add('swapping'); await sleep(800); b.classList.remove('swapping'); }
            idx = (idx + 1) % numBuckets;
            if(idx === startIdx) { showStatus("All Buckets Saturated!", "#f87171"); return; }
        }
        hashBucketData[idx].push(val); renderHashes(); showStatus("Inserted into Bucket " + idx, "#34d399");
    }
  }

  function renderHashes() {
    const currentMode = C().getMode();
    if(currentMode === 'hash-chain') {
        dom.hashChContainer.innerHTML = '';
        hashChData.forEach((chain, i) => {
            const row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '10px'; row.style.marginBottom = '15px';
            const head = document.createElement('div'); head.className = 'q-slot'; head.style.borderStyle = 'solid'; head.innerHTML = "<span>[" + i + "]</span>"; row.appendChild(head);
            chain.forEach(v => {
                const arrow = document.createElement('div'); arrow.textContent = '→'; arrow.style.color = '#34d399'; row.appendChild(arrow);
                const node = document.createElement('div'); node.className = 'la-slot'; node.style.background = 'var(--primary-color)'; node.style.borderColor = '#1e1b4b'; node.textContent = v; row.appendChild(node);
            });
            const arrow2 = document.createElement('div'); arrow2.textContent = '→'; arrow2.style.color = '#34d399'; row.appendChild(arrow2);
            const nul = document.createElement('div'); nul.style.color = '#94a3b8'; nul.textContent = 'NULL'; row.appendChild(nul);
            dom.hashChContainer.appendChild(row);
        });
    } else if(currentMode === 'hash-open') {
        dom.hashOaContainer.innerHTML = ''; dom.hashOaContainer.style.display = 'flex'; dom.hashOaContainer.style.gap = '5px';
        hashOaData.forEach((val, i) => {
            const slot = document.createElement('div'); slot.className = 'q-slot'; slot.id = 'hoa-slot-' + i; slot.innerHTML = "<span>[" + i + "]</span>";
            if(val !== null) { const vDiv = document.createElement('div'); vDiv.className = 'q-item'; vDiv.textContent = val; slot.appendChild(vDiv); }
            dom.hashOaContainer.appendChild(slot);
        });
    } else if(currentMode === 'hash-bucket') {
        dom.hashBucketContainer.innerHTML = ''; dom.hashBucketContainer.style.display = 'flex'; dom.hashBucketContainer.style.gap = '25px'; dom.hashBucketContainer.style.flexWrap = 'wrap'; dom.hashBucketContainer.style.marginTop = '20px';
        hashBucketData.forEach((bucket, i) => {
            const bBlock = document.createElement('div'); bBlock.id = 'hb-block-' + i; bBlock.style.border = '3px solid var(--primary-color)'; bBlock.style.borderRadius = '8px'; bBlock.style.padding = '10px'; bBlock.style.position = 'relative'; bBlock.style.display = 'flex'; bBlock.style.flexDirection = 'column'; bBlock.style.gap = '5px'; bBlock.style.transition = 'background 0.3s';
            const label = document.createElement('div'); label.textContent = 'Bucket ' + i; label.style.position = 'absolute'; label.style.top = '-20px'; label.style.left = '50%'; label.style.transform = 'translate(-50%, 0)'; label.style.fontSize = '0.8rem'; label.style.color = '#cbd5e1'; label.style.fontWeight = 'bold'; label.style.whiteSpace = 'nowrap'; bBlock.appendChild(label);
            for(let s=0; s<2; s++) {
                const slot = document.createElement('div'); slot.className = 'la-slot'; slot.style.width = '60px'; slot.style.height = '45px';
                if(bucket[s] !== undefined) { slot.textContent = bucket[s]; slot.style.background = 'var(--node-bg)'; slot.style.borderColor = '#1e293b'; }
                else { slot.textContent = ''; slot.style.background = 'rgba(255,255,255,0.05)'; slot.style.borderStyle = 'dashed'; }
                bBlock.appendChild(slot);
            }
            dom.hashBucketContainer.appendChild(bBlock);
        });
    }
  }

  function onModeSwitch(mode) {
    if (mode === 'hash-chain') hashChData = Array.from({ length: 5 }, () => []);
    else if (mode === 'hash-open') hashOaData = new Array(5).fill(null);
    else if (mode === 'hash-bucket') hashBucketData = Array.from({ length: 4 }, () => []);
  }

  function init() {
    dom = {
      hashChContainer: document.getElementById('hash-ch-container'),
      hashOaContainer: document.getElementById('hash-oa-container'),
      hashBucketContainer: document.getElementById('hash-bucket-container'),
      btnHashAdd: document.getElementById('btn-hash-add'),
      hashVal: document.getElementById('hash-val'),
    };
    dom.btnHashAdd.addEventListener('click', () => {
      const val = parseInt(dom.hashVal.value);
      if (isNaN(val)) return K().showStatus('Enter valid number.', '#f87171');
      K().executeAnimWrapper(async () => await runHashInsert(val));
    });
  }

  R().attach('hash-chain', { render: renderHashes, code: () => codeHashChain, layout: null });
  R().attach('hash-open', { render: renderHashes, code: () => codeHashOpen, layout: null });
  R().attach('hash-bucket', { render: renderHashes, code: () => codeHashBucket, layout: null });
  C().registerDomain({ id: 'hash', init: init, onModeSwitch: onModeSwitch });
})(typeof window !== 'undefined' ? window : globalThis);
