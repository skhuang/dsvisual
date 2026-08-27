(function (global) {
    const K = () => global.VizKit;

    let state = null;

    const TABLE_SIZE = 11;

    function hash1(key) {
        let h = 0;

        for (const c of key) {
            h = (h * 31 + c.charCodeAt(0)) >>> 0;
        }

        return h % TABLE_SIZE;
    }

    function hash2(key) {
        let h = 7;

        for (const c of key) {
            h = (h * 37 + c.charCodeAt(0)) >>> 0;
        }

        return h % TABLE_SIZE;
    }

    function cloneTables(t1, t2) {
        return {
            table1: [...t1],
            table2: [...t2]
        };
    }

    function createFrames(keys) {
        const table1 = new Array(TABLE_SIZE).fill('');
        const table2 = new Array(TABLE_SIZE).fill('');

        const frames = [];

        frames.push({
            ...cloneTables(table1, table2),
            message: 'Ready to insert keys.',
            activeTable: null,
            activeIndex: -1,
            kicked: null
        });

        for (const key of keys) {
            let current = key;
            let table = 1;

            frames.push({
                ...cloneTables(table1, table2),
                message: `Insert "${key}"`,
                activeTable: table,
                activeIndex: hash1(key),
                kicked: null
            });

            let inserted = false;

            for (let step = 0; step < TABLE_SIZE * 2; step++) {
                if (table === 1) {
                    const pos = hash1(current);

                    frames.push({
                        ...cloneTables(table1, table2),
                        message: `hash1("${current}") = ${pos}`,
                        activeTable: 1,
                        activeIndex: pos,
                        kicked: null
                    });

                    if (table1[pos] === '') {
                        table1[pos] = current;

                        frames.push({
                            ...cloneTables(table1, table2),
                            message:
                                `"${current}" inserted into Table 1[${pos}]`,
                            activeTable: 1,
                            activeIndex: pos,
                            kicked: null
                        });

                        inserted = true;
                        break;
                    }

                    const old = table1[pos];

                    table1[pos] = current;
                    current = old;

                    frames.push({
                        ...cloneTables(table1, table2),
                        message:
                            `Collision! "${current}" was kicked out from Table 1[${pos}]`,
                        activeTable: 1,
                        activeIndex: pos,
                        kicked: current
                    });

                    table = 2;
                } else {
                    const pos = hash2(current);

                    frames.push({
                        ...cloneTables(table1, table2),
                        message: `hash2("${current}") = ${pos}`,
                        activeTable: 2,
                        activeIndex: pos,
                        kicked: current
                    });

                    if (table2[pos] === '') {
                        table2[pos] = current;

                        frames.push({
                            ...cloneTables(table1, table2),
                            message:
                                `"${current}" inserted into Table 2[${pos}]`,
                            activeTable: 2,
                            activeIndex: pos,
                            kicked: null
                        });

                        inserted = true;
                        break;
                    }

                    const old = table2[pos];

                    table2[pos] = current;
                    current = old;

                    frames.push({
                        ...cloneTables(table1, table2),
                        message:
                            `Collision! "${current}" was kicked out from Table 2[${pos}]`,
                        activeTable: 2,
                        activeIndex: pos,
                        kicked: current
                    });

                    table = 1;
                }
            }

            if (!inserted) {
                frames.push({
                    ...cloneTables(table1, table2),
                    message:
                        `Cycle detected while inserting "${key}". Rehash required.`,
                    activeTable: null,
                    activeIndex: -1,
                    kicked: current
                });

                break;
            }
        }

        return frames;
    }

    function renderTable(table, tableNumber, frame) {
        let html = `
            <div class="cuckoo-table">
                <h3>Hash Table ${tableNumber}</h3>
                <div class="cuckoo-table-grid">
        `;

        for (let i = 0; i < TABLE_SIZE; i++) {
            const value = table[i] || '';

            let classes = 'cuckoo-cell';

            if (
                frame.activeTable === tableNumber &&
                frame.activeIndex === i
            ) {
                classes += ' cuckoo-active';
            }

            html += `
                <div class="${classes}">
                    <div class="cuckoo-index">${i}</div>
                    <div class="cuckoo-value">
                        ${value || '&nbsp;'}
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    function renderFrame(host, frame, frameIndex, totalFrames) {
        host.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'cuckoo-wrap';

        const title = document.createElement('div');
        title.className = 'cuckoo-title';

        title.innerHTML = `
            <h2>Cuckoo Hashing</h2>
        `;

        const status = document.createElement('div');
        status.className = 'cuckoo-status';

        status.textContent =
            `Step ${frameIndex + 1} / ${totalFrames}: ${frame.message}`;

        const tables = document.createElement('div');
        tables.className = 'cuckoo-tables';

        tables.innerHTML =
            renderTable(frame.table1, 1, frame) +
            renderTable(frame.table2, 2, frame);

        const hashInfo = document.createElement('div');
        hashInfo.className = 'cuckoo-hash-info';

        hashInfo.innerHTML = `
            <div>
                <strong>hash1(key)</strong> → Table 1
            </div>

            <div>
                <strong>hash2(key)</strong> → Table 2
            </div>

            <div>
                <strong>Collision</strong>
                → kick out existing key
            </div>
        `;

        if (frame.kicked) {
            const kicked = document.createElement('div');

            kicked.className = 'cuckoo-kicked';

            kicked.textContent =
                `Kicked out: ${frame.kicked}`;

            wrap.appendChild(kicked);
        }

        wrap.appendChild(title);
        wrap.appendChild(status);
        wrap.appendChild(hashInfo);
        wrap.appendChild(tables);

        host.appendChild(wrap);
    }
    function loadExamples(methodId) {
        try {
            return ExamplesStore.load(localStorage, methodId);
        } catch (e) {
            return [];
        }
    }
    function buildExamplesSelect(methodId, defaultText) {
        const lang =
            (global.I18N && I18N.getCurrentLanguage)
                ? I18N.getCurrentLanguage()
                : 'en';

        const escAttr = (s) =>
            String(s)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;');

        const escText = (s) =>
            String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;');

        const trunc = (s) => {
            s = String(s);
            return s.length > 24
                ? s.slice(0, 24) + '…'
                : s;
        };

        const placeholder =
            lang === 'zh' ? '範例…' : 'Examples…';

        const defLabel =
            lang === 'zh' ? '預設' : 'Default';

        let h =
            '<select class="ex-select" data-method="' +
            escAttr(methodId) +
            '">';

        h +=
            '<option value="">' +
            placeholder +
            '</option>';

        h +=
            '<option value="' +
            escAttr(defaultText) +
            '">' +
            defLabel +
            '</option>';

        loadExamples(methodId).forEach((e) => {
            if (e.text === defaultText) return;

            h +=
                '<option value="' +
                escAttr(e.text) +
                '">' +
                escText(trunc(e.text)) +
                '</option>';
        });

        h += '</select>';

        return h;
    }
    function randomCuckooKeys(difficulty) {
        const words = [
            'cat',
            'dog',
            'bird',
            'fish',
            'lion',
            'bear',
            'wolf',
            'fox',
            'deer',
            'frog',
            'duck',
            'goat'
        ];

        let count;

        switch (difficulty) {
            case 'edge':
                count = 1;
                break;

            case 'special':
                count = 6;
                break;

            case 'large':
                count = 8;
                break;

            default:
                count = 4;
                break;
        }

        const shuffled = [...words];

        for (let i = shuffled.length - 1; i > 0; --i) {
            const j = Math.floor(Math.random() * (i + 1));

            [shuffled[i], shuffled[j]] =
                [shuffled[j], shuffled[i]];
        }

        return shuffled.slice(0, count);
    }

    function renderCuckooHash() {
        const kit = K();
        const host = kit.acquireDynamicVizHost();

        const methodId = 'cuckoo-hash';
        const defaultText = 'cat,dog,bird,fish';




        if (!state) {
            state = {
                keys: ['cat', 'dog', 'bird', 'fish'],
                frame: 0
            };
        }

        const frames = createFrames(state.keys);

        host.innerHTML = '';

        const vizHost = document.createElement('div');
        vizHost.className = 'cuckoo-viz-host';

        const controlsHost = document.createElement('div');
        controlsHost.className = 'cuckoo-controls-host';
        host.appendChild(vizHost);
        host.appendChild(controlsHost);



        const randomButton = document.createElement('button');

        randomButton.type = 'button';
        randomButton.className = 'rand-btn';
        randomButton.title = 'Random';
        randomButton.textContent = '🎲';



        randomButton.onclick = () => {
            const difficulty =
                global.VizKit &&
                global.VizKit.getInputDifficulty
                    ? global.VizKit.getInputDifficulty()
                    : 'normal';

            state.keys = randomCuckooKeys(difficulty);
            state.frame = 0;
            console.log('Cuckoo random keys:', state.keys);

            renderCuckooHash();
        };



        const paint = (frame, index) => {
            state.frame = index;

            renderFrame(
                vizHost,
                frame,
                index,
                frames.length
            );
        };

        paint(
            frames[state.frame],
            state.frame
        );

        const frameControls = K().buildFrameControls(
            frames,
            paint,
            {
                runIntervalMs: 700
            }
        );

        frameControls.prepend(randomButton);

        const examplesHost = document.createElement('div');
        examplesHost.innerHTML =
            buildExamplesSelect(methodId, defaultText);

        controlsHost.appendChild(examplesHost);
        controlsHost.appendChild(frameControls);
        const ex = examplesHost.querySelector('.ex-select');

        if (ex) {
            ex.addEventListener('change', (e) => {
                if (!e.target.value) return;

                state.keys = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                state.frame = 0;

                renderCuckooHash();
            });
        }


    }

    const codeCuckooHash = `
#include <string>
#include <vector>
#include <functional>
#include <utility>

class CuckooHash
{
private:
    static constexpr int TABLE_SIZE = 11;

    std::vector<std::string> table1;
    std::vector<std::string> table2;

    int hash1(const std::string& key) const
    {
        return static_cast<int>(
            std::hash<std::string>{}(key) % TABLE_SIZE
        );
    }

    int hash2(const std::string& key) const
    {
        std::size_t h = std::hash<std::string>{}(key);

        return static_cast<int>(
            (h / TABLE_SIZE) % TABLE_SIZE
        );
    }

public:
    CuckooHash()
        : table1(TABLE_SIZE),
          table2(TABLE_SIZE)
    {
    }

    bool insert(const std::string& key)
    {
        std::string current = key;

        for (int step = 0;
             step < TABLE_SIZE * 2;
             ++step)
        {
            int pos1 = hash1(current);

            if (table1[pos1].empty())
            {
                table1[pos1] = current;
                return true;
            }

            std::swap(table1[pos1], current);

            int pos2 = hash2(current);

            if (table2[pos2].empty())
            {
                table2[pos2] = current;
                return true;
            }

            std::swap(table2[pos2], current);
        }

        return false;
    }
};
`;

    global.VizRegistry.attach('cuckoo-hash', {
        render: renderCuckooHash,
        code: () => codeCuckooHash,
        layout: {
            host: 'dynamic',
            codeDrawer: false
        }
    });

})(typeof window !== 'undefined' ? window : globalThis);