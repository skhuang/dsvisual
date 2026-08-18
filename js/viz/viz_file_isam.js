(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _isamState = null;
    function renderFileIsam() {
        if (!_isamState) _isamState = { keys: FileIsamViz.SAMPLE_KEYS.slice(), blockSize: FileIsamViz.SAMPLE_BLOCK, key: 50 };
        const host = K().acquireDynamicVizHost();
        const isam = FileIsamViz.buildIsam(_isamState.keys, _isamState.blockSize);
        const { frames } = FileIsamViz.searchFrames(isam, _isamState.key);

        host.innerHTML =
            '<div class="isam-controls">' +
              '<label>Search key <input type="number" class="isam-key" value="' + _isamState.key + '"></label>' +
              '<button type="button" class="isam-search">Search</button>' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<span class="isam-badge"></span>' +
            '</div>' +
            '<div class="isam-stage"></div>';

        const stage = host.querySelector('.isam-stage');
        const badge = host.querySelector('.isam-badge');

        function paint(fr) {
            stage.innerHTML = '';

            const idxRow = document.createElement('div');
            idxRow.className = 'isam-index-row';
            const idxLabel = document.createElement('div');
            idxLabel.className = 'isam-row-label';
            idxLabel.textContent = 'Index';
            idxRow.appendChild(idxLabel);
            isam.index.forEach((e, i) => {
                const c = document.createElement('div');
                c.className = 'isam-idx-cell' + (fr.phase === 'index' && fr.activeIndex === i ? ' isam-active' : '');
                c.textContent = e.minKey === Infinity ? '∞' : e.minKey;
                idxRow.appendChild(c);
            });
            stage.appendChild(idxRow);

            const blkRow = document.createElement('div');
            blkRow.className = 'isam-block-row';
            const blkLabel = document.createElement('div');
            blkLabel.className = 'isam-row-label';
            blkLabel.textContent = 'Blocks';
            blkRow.appendChild(blkLabel);
            isam.blocks.forEach((b, bi) => {
                const blkActive = (fr.activeBlock === bi);
                const block = document.createElement('div');
                block.className = 'isam-block' +
                    (blkActive && (fr.phase === 'block' || fr.phase === 'scan' || fr.phase === 'found' || fr.phase === 'overflow') ? ' isam-block-active' : '') +
                    (blkActive && fr.phase === 'notfound' ? ' isam-block-miss' : '');
                if (!b.keys.length) {
                    const empty = document.createElement('div');
                    empty.className = 'isam-slot isam-empty';
                    empty.textContent = '·';
                    block.appendChild(empty);
                } else {
                    b.keys.forEach((k, s) => {
                        const slot = document.createElement('div');
                        const slotActive = blkActive && fr.activeSlot === s;
                        slot.className = 'isam-slot' +
                            (slotActive && fr.phase === 'scan' ? ' isam-active' : '') +
                            (slotActive && fr.phase === 'found' && !fr.overflow ? ' isam-found' : '');
                        slot.textContent = k;
                        block.appendChild(slot);
                    });
                }
                if (b.overflow && b.overflow.length) {
                    const arrow = document.createElement('div');
                    arrow.className = 'isam-overflow-arrow';
                    arrow.textContent = '→';
                    block.appendChild(arrow);
                    b.overflow.forEach((k, s) => {
                        const slot = document.createElement('div');
                        const slotActive = blkActive && fr.activeSlot === s;
                        slot.className = 'isam-slot isam-overflow-slot' +
                            (slotActive && fr.phase === 'overflow' ? ' isam-active' : '') +
                            (slotActive && fr.phase === 'found' && fr.overflow ? ' isam-found' : '');
                        slot.textContent = k;
                        block.appendChild(slot);
                    });
                }
                blkRow.appendChild(block);
            });
            stage.appendChild(blkRow);

            badge.textContent = 'phase: ' + fr.phase + '  (key ' + fr.key + ')';
        }

        host.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));

        host.querySelector('.rand-btn').onclick = function () {
            const difficulty = (global.VizKit && global.VizKit.getInputDifficulty) ? global.VizKit.getInputDifficulty() : 'normal';
            const r = global.RandomInput && global.RandomInput.randomInputFor('file-isam', difficulty);
            if (!r || !Array.isArray(r.keys)) return;
            _isamState = { keys: r.keys, blockSize: r.blockSize || FileIsamViz.SAMPLE_BLOCK, key: r.key };
            renderFileIsam();
        };

        host.querySelector('.isam-search').onclick = function () {
            try {
                const v = parseInt(host.querySelector('.isam-key').value, 10);
                if (Number.isFinite(v)) { _isamState.key = v; renderFileIsam(); }
            } catch (e) { /* ignore invalid input */ }
        };
    }

    global.VizRegistry.attach('file-isam', {
        render: renderFileIsam,
        code: () => codeFileIsam,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
