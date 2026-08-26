(function (global) {
    const K = () => global.VizKit;

    let _cuckooState = null;

    const TABLE_SIZE = 11;
    const MAX_KICKS = TABLE_SIZE * 2;

    function showStatus(msg, color) {
        const el = document.getElementById('status-message');

        if (el) {
            el.textContent = msg;
            el.style.color = color;
        }
    }

    // First hash function
    function hash1(key) {
        let h = 0;

        for (const c of key) {
            h = (h * 31 + c.charCodeAt(0)) >>> 0;
        }

        return h % TABLE_SIZE;
    }

    // Second hash function
    function hash2(key) {
        let h = 5381;

        for (const c of key) {
            h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
        }

        return h % TABLE_SIZE;
    }

    function createInitialState() {
        return {
            table1: new Array(TABLE_SIZE).fill(null),
            table2: new Array(TABLE_SIZE).fill(null),
            inputVal: 'cat',
            frames: [],
            currentFrame: 0,
            message: ''
        };
    }

    function cloneTable(table) {
        return table.slice();
    }

    function saveFrame(
        state,
        message,
        activeTable,
        activeIndex,
        key
    ) {
        state.frames.push({
            table1: cloneTable(state.table1),
            table2: cloneTable(state.table2),
            message,
            activeTable,
            activeIndex,
            key
        });
    }

    function cuckooInsert(state, key) {
        state.frames = [];
        state.currentFrame = 0;

        if (!key) {
            state.message = 'Enter a key.';
            return false;
        }

        let currentKey = key;
        let tableNumber = 1;

        const visited = new Set();

        saveFrame(
            state,
            'Start inserting "' + key + '"',
            null,
            -1,
            key
        );

        for (let kick = 0; kick < MAX_KICKS; kick++) {
            const position =
                tableNumber === 1
                    ? hash1(currentKey)
                    : hash2(currentKey);

            const stateKey =
                tableNumber +
                ':' +
                position +
                ':' +
                currentKey;

            if (visited.has(stateKey)) {
                saveFrame(
                    state,
                    'Cycle detected. Rehash required.',
                    tableNumber,
                    position,
                    currentKey
                );

                state.message =
                    'Cycle detected. Rehash required.';

                return false;
            }

            visited.add(stateKey);

            saveFrame(
                state,
                'h' +
                    tableNumber +
                    '("' +
                    currentKey +
                    '") = ' +
                    position,
                tableNumber,
                position,
                currentKey
            );

            const table =
                tableNumber === 1
                    ? state.table1
                    : state.table2;

            // Empty position
            if (table[position] === null) {
                table[position] = currentKey;

                saveFrame(
                    state,
                    '"' +
                        currentKey +
                        '" inserted into Table ' +
                        tableNumber +
                        '[' +
                        position +
                        ']',
                    tableNumber,
                    position,
                    currentKey
                );

                state.message =
                    '"' +
                    key +
                    '" inserted successfully.';

                return true;
            }

            // Collision -> kick out existing key
            const kicked = table[position];

            table[position] = currentKey;

            saveFrame(
                state,
                'Collision! "' +
                    kicked +
                    '" is kicked out by "' +
                    currentKey +
                    '"',
                tableNumber,
                position,
                currentKey
            );

            currentKey = kicked;

            // Switch to the other table
            tableNumber =
                tableNumber === 1 ? 2 : 1;

            saveFrame(
                state,
                '"' +
                    currentKey +
                    '" moves to Table ' +
                    tableNumber,
                tableNumber,
                -1,
                currentKey
            );
        }

        saveFrame(
            state,
            'Maximum kicks reached. Rehash required.',
            null,
            -1,
            currentKey
        );

        state.message =
            'Maximum kicks reached. Rehash required.';

        return false;
    }

    function renderTable(
        table,
        tableNumber,
        activeTable,
        activeIndex
    ) {
        let html =
            '<div class="cuckoo-table">' +
            '<h3>Table ' +
            tableNumber +
            '</h3>' +
            '<div class="cuckoo-grid">';

        for (let i = 0; i < TABLE_SIZE; i++) {
            const isActive =
                activeTable === tableNumber &&
                activeIndex === i;

            const value =
                table[i] === null
                    ? ''
                    : table[i];

            html +=
                '<div class="cuckoo-cell' +
                (isActive
                    ? ' cuckoo-active'
                    : '') +
                '">' +
                '<span class="cuckoo-index">' +
                i +
                '</span>' +
                '<span class="cuckoo-value">' +
                value +
                '</span>' +
                '</div>';
        }

        html +=
            '</div>' +
            '</div>';

        return html;
    }

    function renderFrame() {
        if (!_cuckooState) {
            _cuckooState =
                createInitialState();
        }

        const host =
            K().acquireDynamicVizHost();

        host.innerHTML = '';

        const frame =
            _cuckooState.frames[
                _cuckooState.currentFrame
            ];

        const wrap =
            document.createElement('div');

        wrap.className =
            'cuckoo-wrap';

        const table1 = frame
            ? frame.table1
            : _cuckooState.table1;

        const table2 = frame
            ? frame.table2
            : _cuckooState.table2;

        const activeTable =
            frame
                ? frame.activeTable
                : null;

        const activeIndex =
            frame
                ? frame.activeIndex
                : -1;

        wrap.innerHTML =
            '<div class="cuckoo-title">' +
            '<h2>Cuckoo Hashing</h2>' +
            '<p>' +
            'Two hash tables with two hash functions' +
            '</p>' +
            '</div>' +

            '<div class="cuckoo-hashes">' +
            '<div>' +
            '<strong>h1(key)</strong>' +
            ' → Table 1' +
            '</div>' +

            '<div>' +
            '<strong>h2(key)</strong>' +
            ' → Table 2' +
            '</div>' +
            '</div>' +

            '<div class="cuckoo-tables">' +
            renderTable(
                table1,
                1,
                activeTable,
                activeIndex
            ) +
            renderTable(
                table2,
                2,
                activeTable,
                activeIndex
            ) +
            '</div>' +

            '<div class="cuckoo-message">' +
            (
                frame
                    ? frame.message
                    : 'Ready.'
            ) +
            '</div>' +

            '<div class="cuckoo-controls">' +
            '<input type="text" data-cuckoo-input>' +
            '<button ' +
            'type="button" ' +
            'data-action="cuckoo-insert">' +
            'Insert' +
            '</button>' +
            '<button ' +
            'type="button" ' +
            'data-action="cuckoo-reset">' +
            'Reset' +
            '</button>' +
            '</div>';

        host.appendChild(wrap);

        const input =
            wrap.querySelector(
                '[data-cuckoo-input]'
            );

        input.value =
            _cuckooState.inputVal;

        input.addEventListener(
            'input',
            () => {
                _cuckooState.inputVal =
                    input.value.trim();
            }
        );

        wrap
            .querySelector(
                '[data-action="cuckoo-insert"]'
            )
            .onclick = () => {
                const key =
                    input.value.trim();

                if (!key) {
                    showStatus(
                        'Enter a key.',
                        '#f87171'
                    );

                    return;
                }

                cuckooInsert(
                    _cuckooState,
                    key
                );

                _cuckooState.inputVal = '';

                renderFrame();

                showStatus(
                    _cuckooState.message,
                    '#34d399'
                );
            };

        wrap
            .querySelector(
                '[data-action="cuckoo-reset"]'
            )
            .onclick = () => {
                _cuckooState =
                    createInitialState();

                renderFrame();

                showStatus(
                    'Cuckoo Hashing reset.',
                    '#60a5fa'
                );
            };
    }

    function renderCuckooHash() {
        if (!_cuckooState) {
            _cuckooState =
                createInitialState();
        }

        renderFrame();
    }

    global.VizRegistry.attach(
        'cuckoo-hash',
        {
            render: renderCuckooHash,
            code: () => codeCuckooHash,
            layout: {
                host: 'dynamic'
            }
        }
    );
})(
    typeof window !== 'undefined'
        ? window
        : globalThis
);
