(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  const MAX_SIZE = 5;
  function randStdValue() { return Math.floor(Math.random() * 99) + 1; }

  // Core sets
  let stackData = []; let qArr = new Array(5).fill(null); let qFront = 0; let qRear = -1; let qCount = 0;
  let mainListData = [];
  let _dequeData = null;

  let dom = null; // { arrayContainer, linkedListContainer, queueContainer, listArrContainer, listLLContainer, btnStdAdd, btnStdRemove, btnListAdd, btnListRemove, stdVal, listIdx, listValInput }

  function renderLists() {
    const currentMode = C().getMode();
    if (currentMode === 'list-array') { dom.listArrContainer.innerHTML = ''; mainListData.forEach((val, i) => { const s = document.createElement('div'); s.className = 'la-slot'; s.setAttribute('data-index', i); s.textContent = val; dom.listArrContainer.appendChild(s); });
    } else if (currentMode === 'list-linked') {
        dom.listLLContainer.innerHTML = '';
        mainListData.forEach((val, i) => {
            const w = document.createElement('div'); w.className = 'lll-node-wrapper'; const n = document.createElement('div'); n.className = 'lll-node'; n.innerHTML = "<div class='lll-data'>" + val + "</div><div class='lll-next'></div>"; w.appendChild(n);
            if (i < mainListData.length - 1) { const c = document.createElement('div'); c.className = 'lll-conn'; w.appendChild(c); }
            dom.listLLContainer.appendChild(w);
        });
        if (mainListData.length > 0) { const n = document.createElement('div'); n.style.padding = '0 10px'; n.style.color = '#f87171'; n.style.fontFamily = 'monospace'; n.textContent = "NULL"; dom.listLLContainer.appendChild(n); }
    }
  }
  function renderStack(action) {
    const currentMode = C().getMode();
    if(currentMode === 'stack-array') {
        const slots = dom.arrayContainer.querySelectorAll('.slot'); slots.forEach(slot => { const ext = slot.querySelector('.item-block'); if(ext && action !== 'pop_animating') slot.removeChild(ext); });
        stackData.forEach((val, idx) => { const s = slots[4 - idx]; const blk = document.createElement('div'); blk.className = 'item-block'; blk.textContent = val; if(action === 'push' && idx === stackData.length - 1) blk.classList.add('anim-push'); s.appendChild(blk); });
        if(action === 'pop') { const s = slots[4 - stackData.length]; if(s) { const d = document.createElement('div'); d.className = 'item-block anim-pop'; d.textContent = "∅"; d.style.background = "#4b5563"; s.appendChild(d); setTimeout(() => { if(s.contains(d)) s.removeChild(d); }, 400); } }
    } else if (currentMode === 'stack-list') {
        const ns = document.getElementById('nodes-container'); ns.innerHTML = ''; const rev = [...stackData].reverse();
        rev.forEach((val, index) => {
            const wrapper = document.createElement('div'); wrapper.className = 'll-node-wrapper'; const node = document.createElement('div'); node.className = 'll-node'; node.innerHTML = "<div class='ll-data'>" + val + "</div><div class='ll-next'></div>"; wrapper.appendChild(node);
            if(index < rev.length - 1) { const conn = document.createElement('div'); conn.style.height = '15px'; conn.style.width = '2px'; conn.style.background = 'var(--primary-color)'; wrapper.appendChild(conn); }
            if(action === 'push' && index === 0) wrapper.classList.add('anim-push'); ns.appendChild(wrapper);
        });
    }
  }
  function renderQueue() {
    const slots = [0,1,2,3,4].map(i => document.getElementById("qs-" + i));
    for(let i=0; i<5; i++) { const ext = slots[i].querySelector('.q-item'); if(ext) slots[i].removeChild(ext); if(qArr[i] !== null) { const div = document.createElement('div'); div.className = 'q-item'; div.textContent = qArr[i]; slots[i].appendChild(div); } }
    const pf = document.getElementById('front-ptr'); const pr = document.getElementById('rear-ptr');
    if (qCount === 0) { pf.style.left =  (30 + qFront * 65) + 'px'; pr.style.left = (30 + (qRear<0?0:qRear) * 65) + 'px'; } else { pf.style.left = (30 + qFront * 65) + 'px'; pr.style.left = (30 + qRear * 65) + 'px'; }
  }

  function renderDeque() {
    const host = K().acquireDynamicVizHost();
    if (!Array.isArray(_dequeData)) {
        _dequeData = [10, 20, 30];
    }
    const data = _dequeData;
    const wrap = document.createElement('div');
    wrap.className = 'deque-wrap';
    let html = '<div class="deque-caption">head &rarr; ... &rarr; tail</div>';
    html += '<div class="deque-row">';
    html += '<span class="deque-null">null</span>';
    for (let i = 0; i < data.length; i++) {
        html += '<span class="deque-arrow">&#8646;</span>';
        const endClass = (i === 0 ? ' deque-head' : '') + (i === data.length - 1 ? ' deque-tail' : '');
        html += '<span class="deque-node' + endClass + '">' + data[i] + '</span>';
    }
    html += '<span class="deque-arrow">&#8646;</span>';
    html += '<span class="deque-null">null</span>';
    html += '</div>';
    html += '<div class="deque-controls" role="group">' +
                '<input type="number" value="42" data-deque-val>' +
                '<button type="button" data-action="push-front">Push Front</button>' +
                '<button type="button" data-action="push-back">Push Back</button>' +
                '<button type="button" data-action="pop-front">Pop Front</button>' +
                '<button type="button" data-action="pop-back">Pop Back</button>' +
            '</div>';
    wrap.innerHTML = html;
    host.appendChild(wrap);

    const valInput = wrap.querySelector('[data-deque-val]');
    function readVal() {
        const v = parseInt(valInput.value, 10);
        return Number.isNaN(v) ? 0 : v;
    }
    wrap.querySelector('[data-action="push-front"]').onclick = () => {
        data.unshift(readVal());
        renderDeque();
    };
    wrap.querySelector('[data-action="push-back"]').onclick = () => {
        data.push(readVal());
        renderDeque();
    };
    wrap.querySelector('[data-action="pop-front"]').onclick = () => {
        if (data.length === 0) { K().showStatus('Deque is empty', '#f87171'); return; }
        data.shift();
        renderDeque();
    };
    wrap.querySelector('[data-action="pop-back"]').onclick = () => {
        if (data.length === 0) { K().showStatus('Deque is empty', '#f87171'); return; }
        data.pop();
        renderDeque();
    };
  }

  function onModeSwitch(mode) {
    stackData = []; qArr = new Array(5).fill(null); qFront = 0; qRear = -1; qCount = 0;
    if (mode === 'list-array' || mode === 'list-linked') mainListData = [];
  }

  function init() {
    dom = {
      arrayContainer: document.getElementById('array-container'),
      linkedListContainer: document.getElementById('linkedlist-container'),
      queueContainer: document.getElementById('queue-container'),
      listArrContainer: document.getElementById('list-arr-container'),
      listLLContainer: document.getElementById('list-ll-container'),
      btnStdAdd: document.getElementById('btn-std-add'),
      btnStdRemove: document.getElementById('btn-std-remove'),
      btnListAdd: document.getElementById('btn-list-add'),
      btnListRemove: document.getElementById('btn-list-remove'),
      stdVal: document.getElementById('std-value'),
      listIdx: document.getElementById('list-idx'),
      listValInput: document.getElementById('list-val'),
    };

    if (dom.stdVal) dom.stdVal.value = String(randStdValue());

    dom.btnStdAdd.addEventListener('click', () => {
        const currentMode = C().getMode();
        const showStatus = K().showStatus;
        const val = parseInt(dom.stdVal.value); if(isNaN(val)) return showStatus('Enter a valid number.', '#f87171');
        if(currentMode.includes('stack')) { if(currentMode === 'stack-array' && stackData.length >= MAX_SIZE) return showStatus('Stack Overflow!', '#f87171'); stackData.push(val); showStatus("Pushed " + val, '#60a5fa'); renderStack('push'); }
        else if (currentMode === 'queue') { if (qCount >= MAX_SIZE) return showStatus('Queue Overflow!', '#f87171'); qRear = (qRear + 1) % MAX_SIZE; qArr[qRear] = val; qCount++; showStatus("Enqueued " + val, '#60a5fa'); renderQueue('enqueue'); }
        dom.stdVal.value = String(randStdValue());
    });
    dom.btnStdRemove.addEventListener('click', () => {
        const currentMode = C().getMode();
        const showStatus = K().showStatus;
        if(currentMode.includes('stack')) { if(stackData.length === 0) return showStatus('Stack Underflow!', '#f87171'); const popped = stackData.pop(); showStatus("Popped " + popped, '#ec4899'); renderStack('pop'); }
        else if (currentMode === 'queue') { if(qCount === 0) return showStatus('Queue Underflow!', '#f87171'); const deq = qArr[qFront]; qArr[qFront] = null; qFront = (qFront + 1) % MAX_SIZE; qCount--; showStatus("Dequeued " + deq, '#ec4899'); renderQueue('dequeue'); }
    });
    dom.btnListAdd.addEventListener('click', () => {
        const showStatus = K().showStatus;
        const i = parseInt(dom.listIdx.value); const v = parseInt(dom.listValInput.value);
        if(isNaN(i) || isNaN(v)) return showStatus('Invalid input', '#f87171');
        if(i < 0 || i > mainListData.length) return showStatus('Index out of bounds', '#f87171');
        mainListData.splice(i, 0, v); showStatus("Inserted " + v + " at index " + i, '#60a5fa'); renderLists(); dom.listValInput.value = Math.floor(Math.random() * 100);
    });
    dom.btnListRemove.addEventListener('click', () => {
        const showStatus = K().showStatus;
        const i = parseInt(dom.listIdx.value); if(isNaN(i)) return showStatus('Invalid input', '#f87171');
        if(i < 0 || i >= mainListData.length) return showStatus('Index out of bounds', '#f87171');
        const v = mainListData[i]; mainListData.splice(i, 1); showStatus("Removed " + v + " from index " + i, '#ec4899'); renderLists();
    });
  }

  R().attach('stack-array', { render: renderStack, code: () => codeArray, layout: null });
  R().attach('stack-list', { render: renderStack, code: () => codeLinkedList, layout: null });
  R().attach('queue', { render: renderQueue, code: () => codeQueue, layout: { host: 'dynamic' } });
  R().attach('list-array', { render: renderLists, code: () => codeListArray, layout: null });
  R().attach('list-linked', { render: renderLists, code: () => codeListLinked, layout: null });
  R().attach('deque', { render: renderDeque, code: () => codeDeque, layout: { host: 'dynamic' } });
  C().registerDomain({ id: 'linear', init: init, onModeSwitch: onModeSwitch });
})(typeof window !== 'undefined' ? window : globalThis);
