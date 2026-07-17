(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _magicSquareState = null;
    function buildMagicSquareFrames(n) {
        const grid = Array.from({ length: n }, () => new Array(n).fill(0));
        const frames = [{
            grid: grid.map((row) => row.slice()),
            num: 0,
            pos: null,
            next: { r: 0, c: Math.floor(n / 2) },
            collision: false,
            done: false,
            msg: {
                zh: '從第一列中央開始，準備放入 1。',
                en: 'Start at the center of the top row; get ready to place 1.',
            },
        }];
        let r = 0;
        let c = Math.floor(n / 2);
        for (let num = 1; num <= n * n; num++) {
            grid[r][c] = num;
            const up = (r - 1 + n) % n;
            const left = (c - 1 + n) % n;
            const collision = grid[up][left] !== 0;
            const next = collision ? { r: (r + 1) % n, c } : { r: up, c: left };
            frames.push({
                grid: grid.map((row) => row.slice()),
                num,
                pos: { r, c },
                trial: { r: up, c: left },
                next,
                collision,
                done: num === n * n,
                msg: num === n * n
                    ? {
                        zh: '完成：每列、每欄與兩條對角線的和都相同。',
                        en: 'Complete: every row, column, and diagonal has the same sum.',
                    }
                    : collision
                        ? {
                            zh: '左上格已被占用，所以改從目前位置往下一格。',
                            en: 'The up-left cell is occupied, so move one cell down instead.',
                        }
                        : {
                            zh: '左上格可用，下一步移到左上方；超出邊界時以環狀方式包回。',
                            en: 'The up-left cell is free, so move up-left; wrap around edges when needed.',
                        },
            });
            r = next.r;
            c = next.c;
        }
        return frames;
    }

    function renderMagicSquare() {
        const host = K().acquireDynamicVizHost();
        if (!_magicSquareState) _magicSquareState = { n: 5 };
        const st = _magicSquareState;
        const langOf = K().langOf;
        const n = st.n;
        const frames = buildMagicSquareFrames(n);
        const magicSum = n * (n * n + 1) / 2;
        let idx = 0;

        host.innerHTML =
            '<div class="magic-wrap">' +
                '<div class="magic-controls">' +
                    '<label>Order <select class="magic-order"><option value="3">3 x 3</option><option value="5">5 x 5</option><option value="7">7 x 7</option></select></label>' +
                    '<span class="magic-sum">Magic sum = ' + magicSum + '</span>' +
                '</div>' +
                '<div class="magic-layout">' +
                    '<div class="magic-board" style="--magic-n:' + n + '"></div>' +
                    '<div class="magic-panel">' +
                        '<div class="magic-step"></div>' +
                        '<div class="magic-rule"></div>' +
                        '<div class="magic-readout"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        const order = host.querySelector('.magic-order');
        order.value = String(n);

        function cellClass(fr, r, c, v) {
            const cls = ['magic-cell'];
            if (v) cls.push('filled');
            if (fr.pos && fr.pos.r === r && fr.pos.c === c) cls.push('current');
            if (!fr.done && fr.trial && fr.trial.r === r && fr.trial.c === c) cls.push(fr.collision ? 'blocked' : 'trial');
            if (!fr.done && fr.next && fr.next.r === r && fr.next.c === c && fr.collision) cls.push('next');
            return cls.join(' ');
        }

        function sumsHtml(fr) {
            const rowSums = fr.grid.map((row) => row.reduce((a, b) => a + b, 0));
            const colSums = Array.from({ length: n }, (_, c) => fr.grid.reduce((a, row) => a + row[c], 0));
            const diagA = fr.grid.reduce((a, row, r) => a + row[r], 0);
            const diagB = fr.grid.reduce((a, row, r) => a + row[n - 1 - r], 0);
            return '<div><strong>Rows</strong> ' + rowSums.join(', ') + '</div>' +
                '<div><strong>Cols</strong> ' + colSums.join(', ') + '</div>' +
                '<div><strong>Diag</strong> ' + diagA + ', ' + diagB + '</div>';
        }

        function paint() {
            const fr = frames[idx];
            const board = host.querySelector('.magic-board');
            if (!board) return;
            let html = '';
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    const v = fr.grid[r][c];
                    html += '<div class="' + cellClass(fr, r, c, v) + '" data-cell="' + r + '-' + c + '">' + (v || '') + '</div>';
                }
            }
            board.innerHTML = html;
            host.querySelector('.magic-step').textContent = 'Step ' + idx + ' / ' + (frames.length - 1);
            host.querySelector('.magic-rule').textContent = langOf(fr.msg);
            const detail = fr.done
                ? 'n = ' + n + ', magic sum = ' + magicSum
                : fr.num === 0
                    ? 'next: row 0, col ' + Math.floor(n / 2)
                    : 'placed ' + fr.num + ' at (' + fr.pos.r + ', ' + fr.pos.c + '), trial up-left (' + fr.trial.r + ', ' + fr.trial.c + ')' + (fr.collision ? ' was occupied' : ' is free');
            host.querySelector('.magic-readout').innerHTML = '<div>' + detail + '</div>' + sumsHtml(fr);
        }

        function step() {
            if (idx < frames.length - 1) {
                idx++;
                paint();
                return idx < frames.length - 1;
            }
            return false;
        }
        function reset() {
            idx = 0;
            paint();
        }

        host.querySelector('.magic-wrap').appendChild(K().buildStepControls(step, reset, 500));
        order.onchange = () => {
            _magicSquareState.n = parseInt(order.value, 10);
            renderMagicSquare();
        };
        paint();
    }

    global.VizRegistry.attach('magic-square', {
        render: renderMagicSquare,
        code: () => codeMagicSquare,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
