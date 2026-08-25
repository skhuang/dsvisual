(function (global) {
    const K = () => global.VizKit;

    const SEG_DEFAULT = [5, 8, 6, 3, 2, 7, 2, 6];

    // ============================================================
    // 解析輸入
    // 最多 8 個數字，每個數字限制 0~99
    // ============================================================

    function parseSegInput(text) {
        const nums = String(text)
            .split(/[\s,]+/)
            .map((s) => parseInt(s, 10))
            .filter(Number.isFinite);

        const clamped = nums
            .filter((v) => v >= 0 && v <= 99)
            .slice(0, 8);

        return clamped.length >= 1
            ? clamped
            : SEG_DEFAULT.slice();
    }


    // 數字限制
    function clampInt(value, min, max, fallback) {
        const n = parseInt(value, 10);

        if (!Number.isFinite(n)) {
            return fallback;
        }

        return Math.max(min, Math.min(max, n));
    }


    let _segState = null;


    // ============================================================
    // Persistent Segment Tree
    // ============================================================

    function renderPersistentSegmentTree() {

        const host = K().acquireDynamicVizHost();


        // --------------------------------------------------------
        // 預設資料
        // --------------------------------------------------------

        if (!_segState) {
            _segState = {
                vals: SEG_DEFAULT.slice(),

                // 預設把 index 6 的值改成 9
                updateIndex: 6,
                updateValue: 9
            };
        }


        const lang =
            (global.I18N && I18N.getCurrentLanguage)
                ? I18N.getCurrentLanguage()
                : 'en';


        const arr = _segState.vals.slice();

        const n = arr.length;


        const updateIndex =
            Math.min(
                Math.max(0, _segState.updateIndex),
                n - 1
            );


        const updateValue =
            _segState.updateValue;



        // ========================================================
        // Node Storage
        // ========================================================

        /*
            每一個節點：

            {
                id,
                l,
                r,
                sum,
                left,
                right,
                clonedFrom
            }

            Persistent Segment Tree：

            Version 0 -> rootV0
            Version 1 -> rootV1

            更新時只複製：

            root
              ↓
            target leaf

            的路徑。

            其他節點直接共用。
        */


        let nextId = 1;


        const nodes =
            new Map();



        // ========================================================
        // 建立節點
        // ========================================================

        function createNode(
            l,
            r,
            sum,
            left = null,
            right = null,
            clonedFrom = null
        ) {

            const id =
                nextId++;


            nodes.set(
                id,
                {
                    id,
                    l,
                    r,
                    sum,
                    left,
                    right,
                    clonedFrom
                }
            );


            return id;
        }



        // ========================================================
        // 建立 Version 0
        // ========================================================

        function build(l, r) {

            // leaf
            if (l === r) {

                return createNode(
                    l,
                    r,
                    arr[l]
                );
            }


            const mid =
                (l + r) >> 1;


            const left =
                build(
                    l,
                    mid
                );


            const right =
                build(
                    mid + 1,
                    r
                );


            const sum =
                nodes.get(left).sum +
                nodes.get(right).sum;


            return createNode(
                l,
                r,
                sum,
                left,
                right
            );
        }



        // Version 0 root
        const rootV0 =
            build(
                0,
                n - 1
            );


        // Version 1 root
        let rootV1 =
            null;



        // ========================================================
        // Animation Frames
        // ========================================================

        const frames = [];



        // --------------------------------------------------------
        // 複製目前所有 node 狀態
        // --------------------------------------------------------

        function freezeNodes() {

            const copy = {};


            for (const [id, node] of nodes.entries()) {

                copy[id] = {
                    ...node
                };
            }


            return copy;
        }



        // --------------------------------------------------------
        // 儲存動畫畫面
        // --------------------------------------------------------

        function snapshot(
            phase,
            activeId,
            msg,
            extra = {}
        ) {

            frames.push({

                nodes:
                    freezeNodes(),

                rootV0:
                    rootV0,

                rootV1:
                    rootV1,

                activeId:
                    activeId,

                phase:
                    phase,

                msg:
                    msg,

                copiedIds:
                    extra.copiedIds
                        ? extra.copiedIds.slice()
                        : [],

                showV1:
                    extra.showV1 !== undefined
                        ? extra.showV1
                        : rootV1 !== null
            });
        }



        // ========================================================
        // Version 0
        // ========================================================

        snapshot(
            'Version 0',
            rootV0,
            lang === 'zh'
                ? '建立原始版本 v0'
                : 'initial persistent segment tree v0',
            {
                showV1: false
            }
        );



        // ========================================================
        // Step 1
        // 選擇 Version 0 Root
        // ========================================================

        snapshot(
            'Step 1',
            rootV0,
            lang === 'zh'
                ? '選擇 Version 0 的 root'
                : 'select root of Version 0',
            {
                showV1: false
            }
        );



        // ========================================================
        // 記錄 V1 新建立的節點
        // ========================================================

        const copiedIds = [];



        // ========================================================
        // Clone Node
        // ========================================================

        function cloneNode(oldId) {

            const old =
                nodes.get(oldId);


            const newId =
                createNode(
                    old.l,
                    old.r,
                    old.sum,
                    old.left,
                    old.right,

                    // 記錄從哪個 node 複製
                    oldId
                );


            copiedIds.push(
                newId
            );


            return newId;
        }



        // ========================================================
        // Step 2
        // Clone Root
        // ========================================================

        rootV1 =
            cloneNode(
                rootV0
            );


        snapshot(
            'Step 2',
            rootV1,
            lang === 'zh'
                ? '複製 root，開始建立 Version 1'
                : 'clone root to create Version 1',
            {
                copiedIds
            }
        );



        // ========================================================
        // Persistent Point Update
        // ========================================================

        /*
            oldId：
                舊版本節點

            newId：
                新版本複製的節點

            只複製更新路徑。

            沒有走過的子樹：
                Version 0 與 Version 1 共用。
        */

        function persistentPointUpdate(
            oldId,
            newId,
            index,
            value
        ) {

            const oldNode =
                nodes.get(oldId);


            const newNode =
                nodes.get(newId);



            // ====================================================
            // Leaf
            // ====================================================

            if (oldNode.l === oldNode.r) {

                const oldValue =
                    oldNode.sum;


                // 只修改新節點
                newNode.sum =
                    value;


                snapshot(
                    'Step 4',
                    newId,

                    lang === 'zh'
                        ? '更新索引 ' +
                          index +
                          '：' +
                          oldValue +
                          ' → ' +
                          value

                        : 'update index ' +
                          index +
                          ': ' +
                          oldValue +
                          ' → ' +
                          value,

                    {
                        copiedIds
                    }
                );


                return;
            }



            const mid =
                (oldNode.l + oldNode.r) >> 1;



            // ====================================================
            // 往左
            // ====================================================

            if (index <= mid) {

                const copiedLeft =
                    cloneNode(
                        oldNode.left
                    );


                // Version 1 左邊改成新節點
                newNode.left =
                    copiedLeft;


                // Version 1 右邊仍然使用舊節點
                // newNode.right 不變


                snapshot(
                    'Step 3',
                    copiedLeft,

                    lang === 'zh'
                        ? '複製左子節點；右子樹與 Version 0 共用'
                        : 'clone left child; right subtree is shared',

                    {
                        copiedIds
                    }
                );


                persistentPointUpdate(
                    oldNode.left,
                    copiedLeft,
                    index,
                    value
                );
            }


            // ====================================================
            // 往右
            // ====================================================

            else {

                const copiedRight =
                    cloneNode(
                        oldNode.right
                    );


                // Version 1 右邊改成新節點
                newNode.right =
                    copiedRight;


                // Version 1 左邊仍然共用 Version 0
                // newNode.left 不變


                snapshot(
                    'Step 3',
                    copiedRight,

                    lang === 'zh'
                        ? '複製右子節點；左子樹與 Version 0 共用'
                        : 'clone right child; left subtree is shared',

                    {
                        copiedIds
                    }
                );


                persistentPointUpdate(
                    oldNode.right,
                    copiedRight,
                    index,
                    value
                );
            }



            // ====================================================
            // Step 5
            // Pull Up
            // ====================================================

            newNode.sum =
                nodes.get(
                    newNode.left
                ).sum
                +
                nodes.get(
                    newNode.right
                ).sum;


            snapshot(
                'Step 5',
                newId,

                lang === 'zh'
                    ? '重新計算區間 [' +
                      newNode.l +
                      ',' +
                      newNode.r +
                      ']，sum = ' +
                      newNode.sum

                    : 'recompute [' +
                      newNode.l +
                      ',' +
                      newNode.r +
                      '], sum = ' +
                      newNode.sum,

                {
                    copiedIds
                }
            );
        }



        // ========================================================
        // 執行 Persistent Update
        // ========================================================

        persistentPointUpdate(
            rootV0,
            rootV1,
            updateIndex,
            updateValue
        );



        // ========================================================
        // Version 1 完成
        // ========================================================

        snapshot(
            'Version 1',
            -1,

            lang === 'zh'
                ? 'Version 1 建立完成；未修改的子樹與 Version 0 共用'
                : 'Version 1 created; unchanged subtrees are shared',

            {
                copiedIds
            }
        );



        // ========================================================
        // UI
        // ========================================================

        const wrap =
            document.createElement(
                'div'
            );


        wrap.className =
            'segtree-wrap';



        wrap.innerHTML =

            '<div class="segtree-controls">' +


                // ==================================================
                // Array
                // ==================================================

                '<input ' +
                    'type="text" ' +
                    'class="segtree-input" ' +
                    'value="' +
                    arr.join(',') +
                '">' +


                // ==================================================
                // Index
                // ==================================================

                '<label style="margin-left:8px;">' +

                    (
                        lang === 'zh'
                            ? '更新索引'
                            : 'Index'
                    ) +

                '</label>' +


                '<input ' +
                    'type="number" ' +
                    'class="segtree-index" ' +
                    'min="0" ' +
                    'max="' +
                    (n - 1) +
                    '" ' +
                    'value="' +
                    updateIndex +
                    '" ' +
                    'style="width:64px;"' +
                '>' +


                // ==================================================
                // Value
                // ==================================================

                '<label style="margin-left:8px;">' +

                    (
                        lang === 'zh'
                            ? '新值'
                            : 'New value'
                    ) +

                '</label>' +


                '<input ' +
                    'type="number" ' +
                    'class="segtree-value" ' +
                    'min="0" ' +
                    'max="99" ' +
                    'value="' +
                    updateValue +
                    '" ' +
                    'style="width:64px;"' +
                '>' +


                // ==================================================
                // Build
                // ==================================================

                '<button ' +
                    'type="button" ' +
                    'class="segtree-build"' +
                '>' +

                    (
                        lang === 'zh'
                            ? '建立 / 更新'
                            : 'Build / Update'
                    ) +

                '</button>' +


                // ==================================================
                // Random
                // ==================================================

                '<button ' +
                    'type="button" ' +
                    'class="rand-btn" ' +
                    'title="' +
                    K().t('btn.random-input') +
                '">' +

                    '🎲' +

                '</button>' +


            '</div>' +


            '<div ' +
                'class="segtree-phase" ' +
                'data-testid="segtree-phase"' +
            '></div>' +


            '<div class="segtree-grid"></div>' +


            '<div ' +
                'class="segtree-msg" ' +
                'data-testid="segtree-msg"' +
            '>' +

                '&nbsp;' +

            '</div>';



        const gridEl =
            wrap.querySelector(
                '.segtree-grid'
            );


        const phaseEl =
            wrap.querySelector(
                '.segtree-phase'
            );


        const msgEl =
            wrap.querySelector(
                '.segtree-msg'
            );



        // ========================================================
        // 取得 Frame 中 Node
        // ========================================================

        function getNode(
            frame,
            id
        ) {

            if (id == null) {
                return null;
            }


            return frame.nodes[id];
        }



        // ========================================================
        // 自動計算 Tree Position
        // ========================================================

        function computePositions(
            frame,
            rootId,
            x0,
            x1
        ) {

            const pos = {};


            function walk(
                id,
                depth
            ) {

                const node =
                    getNode(
                        frame,
                        id
                    );


                if (!node) {
                    return null;
                }


                let x;



                // ------------------------------------------------
                // Leaf
                // ------------------------------------------------

                if (node.l === node.r) {

                    const step =
                        (x1 - x0) / n;


                    x =
                        x0 +
                        step *
                        (
                            node.l +
                            0.5
                        );
                }


                // ------------------------------------------------
                // Internal
                // ------------------------------------------------

                else {

                    const lx =
                        walk(
                            node.left,
                            depth + 1
                        );


                    const rx =
                        walk(
                            node.right,
                            depth + 1
                        );


                    x =
                        (lx + rx) / 2;
                }



                const y =
                    60 +
                    depth * 58;


                pos[id] =
                    [
                        x,
                        y
                    ];


                return x;
            }



            if (rootId != null) {

                walk(
                    rootId,
                    0
                );
            }


            return pos;
        }



        // ========================================================
        // 找到 root 可以到達的所有 Node
        // ========================================================

        function collectReachable(
            frame,
            rootId
        ) {

            const seen =
                new Set();


            function dfs(id) {

                if (
                    id == null ||
                    seen.has(id)
                ) {
                    return;
                }


                const node =
                    getNode(
                        frame,
                        id
                    );


                if (!node) {
                    return;
                }


                seen.add(id);


                dfs(
                    node.left
                );


                dfs(
                    node.right
                );
            }


            dfs(
                rootId
            );


            return seen;
        }



        // ========================================================
        // 畫 Tree
        // ========================================================

        function drawTree(
            frame,
            rootId,
            positions,
            versionLabel,
            copiedSet,
            xTitle
        ) {

            if (rootId == null) {
                return '';
            }


            const reachable =
                collectReachable(
                    frame,
                    rootId
                );


            let s = '';



            // ====================================================
            // Version Title
            // ====================================================

            s +=

                '<text ' +
                    'x="' +
                    xTitle +
                    '" ' +

                    'y="25" ' +

                    'font-size="18" ' +

                    'font-weight="700" ' +

                    'text-anchor="middle" ' +

                    'fill="#1e293b"' +
                '>' +

                    versionLabel +

                '</text>';



            // ====================================================
            // Edges
            // ====================================================

            for (const id of reachable) {

                const node =
                    getNode(
                        frame,
                        id
                    );


                const p =
                    positions[id];


                if (
                    !node ||
                    !p
                ) {
                    continue;
                }


                const children =
                    [
                        node.left,
                        node.right
                    ];


                for (const childId of children) {

                    if (
                        childId == null ||
                        !positions[childId]
                    ) {
                        continue;
                    }


                    const c =
                        positions[childId];


                    // V1 新複製的節點
                    const childIsCopied =
                        versionLabel === 'Version 1' &&
                        copiedSet.has(
                            childId
                        );


                    // V1 共用節點
                    const childIsShared =
                        versionLabel === 'Version 1' &&
                        !copiedSet.has(
                            childId
                        );


                    let edgeColor =
                        '#cbd5e1';


                    let edgeWidth =
                        '1.5';


                    // 新複製 path
                    if (childIsCopied) {

                        edgeColor =
                            '#10b981';

                        edgeWidth =
                            '2.5';
                    }


                    // 共用 path
                    else if (childIsShared) {

                        edgeColor =
                            '#60a5fa';

                        edgeWidth =
                            '2';
                    }


                    s +=

                        '<line ' +

                            'x1="' +
                            p[0] +
                            '" ' +

                            'y1="' +
                            (p[1] + 16) +
                            '" ' +

                            'x2="' +
                            c[0] +
                            '" ' +

                            'y2="' +
                            (c[1] - 16) +
                            '" ' +

                            'stroke="' +
                            edgeColor +
                            '" ' +

                            'stroke-width="' +
                            edgeWidth +
                            '"' +

                        '/>';
                }
            }



            // ====================================================
            // Nodes
            // ====================================================

            for (const id of reachable) {

                const node =
                    getNode(
                        frame,
                        id
                    );


                const p =
                    positions[id];


                if (
                    !node ||
                    !p
                ) {
                    continue;
                }



                // ------------------------------------------------
                // Active node
                // ------------------------------------------------

                const isActive =
                    id === frame.activeId;



                // ------------------------------------------------
                // V1 新複製節點
                // ------------------------------------------------

                const isCopied =
                    versionLabel === 'Version 1' &&
                    copiedSet.has(id);



                // ------------------------------------------------
                // V1 共用節點
                // ------------------------------------------------

                const isShared =
                    versionLabel === 'Version 1' &&
                    !copiedSet.has(id);



                let fill;
                let stroke;



                // =================================================
                // 橘色：
                // 目前正在執行的 node
                // =================================================

                if (isActive) {

                    fill =
                        '#f59e0b';

                    stroke =
                        '#d97706';
                }


                // =================================================
                // 綠色：
                // Version 1 新複製的 Node
                // =================================================

                else if (isCopied) {

                    fill =
                        '#d1fae5';

                    stroke =
                        '#059669';
                }


                // =================================================
                // 藍色：
                // V0 / V1 共用 Node
                // =================================================

                else if (isShared) {

                    fill =
                        '#dbeafe';

                    stroke =
                        '#2563eb';
                }


                // =================================================
                // 白色：
                // Version 0
                // =================================================

                else {

                    fill =
                        '#ffffff';

                    stroke =
                        '#1e40af';
                }



                const textFill =
                    isActive
                        ? '#ffffff'
                        : '#1e293b';



                // =================================================
                // Node Rectangle
                // =================================================

                s +=

                    '<rect ' +

                        'x="' +
                        (p[0] - 28) +
                        '" ' +

                        'y="' +
                        (p[1] - 15) +
                        '" ' +

                        'width="56" ' +

                        'height="30" ' +

                        'rx="4" ' +

                        'fill="' +
                        fill +
                        '" ' +

                        'stroke="' +
                        stroke +
                        '" ' +

                        'stroke-width="1.8"' +

                    '/>';



                // =================================================
                // Range
                // =================================================

                s +=

                    '<text ' +

                        'x="' +
                        p[0] +
                        '" ' +

                        'y="' +
                        (p[1] - 19) +
                        '" ' +

                        'text-anchor="middle" ' +

                        'font-size="9" ' +

                        'fill="#64748b"' +

                    '>' +

                        '[' +
                        node.l +
                        ',' +
                        node.r +
                        ']' +

                    '</text>';



                // =================================================
                // Sum
                // =================================================

                s +=

                    '<text ' +

                        'x="' +
                        p[0] +
                        '" ' +

                        'y="' +
                        (p[1] + 5) +
                        '" ' +

                        'text-anchor="middle" ' +

                        'font-size="13" ' +

                        'font-weight="700" ' +

                        'fill="' +
                        textFill +
                        '"' +

                    '>' +

                        node.sum +

                    '</text>';



                // =================================================
                // Node ID
                //
                // V0 / V1 如果看到一樣的 #id
                // 就代表它們是同一個 physical node
                // =================================================

                s +=

                    '<text ' +

                        'x="' +
                        p[0] +
                        '" ' +

                        'y="' +
                        (p[1] + 27) +
                        '" ' +

                        'text-anchor="middle" ' +

                        'font-size="8" ' +

                        'fill="#94a3b8"' +

                    '>' +

                        '#' +
                        id +

                    '</text>';
            }



            return s;
        }



        // ========================================================
        // Draw Frame
        // ========================================================

        function draw(frame) {

            const copiedSet =
                new Set(
                    frame.copiedIds || []
                );



            // ====================================================
            // V0 在左邊
            // ====================================================

            const posV0 =
                computePositions(
                    frame,
                    frame.rootV0,
                    20,
                    465
                );



            // ====================================================
            // V1 在右邊
            // ====================================================

            const posV1 =
                (
                    frame.showV1 &&
                    frame.rootV1 != null
                )

                    ? computePositions(
                        frame,
                        frame.rootV1,
                        535,
                        980
                    )

                    : {};



            let svg =

                '<svg ' +
                    'class="segtree-svg" ' +
                    'viewBox="0 0 1000 340" ' +
                    'width="100%" ' +
                    'xmlns="http://www.w3.org/2000/svg"' +
                '>';



            // ====================================================
            // Version 0
            // ====================================================

            svg +=

                drawTree(
                    frame,

                    frame.rootV0,

                    posV0,

                    'Version 0',

                    new Set(),

                    245
                );



            // ====================================================
            // 分隔線
            // ====================================================

            svg +=

                '<line ' +

                    'x1="500" ' +
                    'y1="35" ' +

                    'x2="500" ' +
                    'y2="275" ' +

                    'stroke="#e2e8f0" ' +

                    'stroke-width="1" ' +

                    'stroke-dasharray="5 5"' +

                '/>';



            // ====================================================
            // Version 1
            // ====================================================

            if (
                frame.showV1 &&
                frame.rootV1 != null
            ) {

                svg +=

                    drawTree(
                        frame,

                        frame.rootV1,

                        posV1,

                        'Version 1',

                        copiedSet,

                        755
                    );
            }

            else {

                svg +=

                    '<text ' +

                        'x="755" ' +

                        'y="150" ' +

                        'text-anchor="middle" ' +

                        'font-size="15" ' +

                        'fill="#94a3b8"' +

                    '>' +

                        (
                            lang === 'zh'
                                ? '尚未建立 Version 1'
                                : 'Version 1 not created yet'
                        ) +

                    '</text>';
            }



            // ====================================================
            // Legend
            // ====================================================


            // ----------------------------------------------------
            // 白色 Version 0
            // ----------------------------------------------------

            svg +=

                '<rect ' +

                    'x="230" ' +
                    'y="305" ' +

                    'width="14" ' +
                    'height="14" ' +

                    'rx="2" ' +

                    'fill="#ffffff" ' +

                    'stroke="#1e40af"' +

                '/>';


            svg +=

                '<text ' +

                    'x="250" ' +
                    'y="316" ' +

                    'font-size="10" ' +

                    'fill="#475569"' +

                '>' +

                    (
                        lang === 'zh'
                            ? 'Version 0'
                            : 'Version 0'
                    ) +

                '</text>';



            // ----------------------------------------------------
            // 綠色 clone node
            // ----------------------------------------------------

            svg +=

                '<rect ' +

                    'x="350" ' +
                    'y="305" ' +

                    'width="14" ' +
                    'height="14" ' +

                    'rx="2" ' +

                    'fill="#d1fae5" ' +

                    'stroke="#059669"' +

                '/>';


            svg +=

                '<text ' +

                    'x="370" ' +
                    'y="316" ' +

                    'font-size="10" ' +

                    'fill="#475569"' +

                '>' +

                    (
                        lang === 'zh'
                            ? '新複製節點'
                            : 'cloned node'
                    ) +

                '</text>';



            // ----------------------------------------------------
            // 藍色 shared node
            // ----------------------------------------------------

            svg +=

                '<rect ' +

                    'x="485" ' +
                    'y="305" ' +

                    'width="14" ' +
                    'height="14" ' +

                    'rx="2" ' +

                    'fill="#dbeafe" ' +

                    'stroke="#2563eb"' +

                '/>';


            svg +=

                '<text ' +

                    'x="505" ' +
                    'y="316" ' +

                    'font-size="10" ' +

                    'fill="#475569"' +

                '>' +

                    (
                        lang === 'zh'
                            ? '共用節點'
                            : 'shared node'
                    ) +

                '</text>';



            // ----------------------------------------------------
            // 橘色 active node
            // ----------------------------------------------------

            svg +=

                '<rect ' +

                    'x="600" ' +
                    'y="305" ' +

                    'width="14" ' +
                    'height="14" ' +

                    'rx="2" ' +

                    'fill="#f59e0b" ' +

                    'stroke="#d97706"' +

                '/>';


            svg +=

                '<text ' +

                    'x="620" ' +
                    'y="316" ' +

                    'font-size="10" ' +

                    'fill="#475569"' +

                '>' +

                    (
                        lang === 'zh'
                            ? '目前節點'
                            : 'active node'
                    ) +

                '</text>';



            svg +=
                '</svg>';



            // 顯示 SVG
            gridEl.innerHTML =
                svg;


            // 顯示步驟
            phaseEl.textContent =
                frame.phase;


            // 顯示說明
            msgEl.textContent =
                frame.msg;
        }



        // ========================================================
        // Step Workbench
        // ========================================================

        host.appendChild(

            K().buildStepWorkbench({

                stage:
                    wrap,

                frames:
                    frames,

                paint:
                    draw,

                runIntervalMs:
                    700,

                getMessage:
                    (f) =>
                        f.phase +
                        (
                            f.msg
                                ? ' — ' + f.msg
                                : ''
                        )
            })
        );



        // ========================================================
        // Build / Update
        // ========================================================

        wrap
            .querySelector(
                '.segtree-build'
            )
            .onclick = () => {


                // 取得 array
                const vals =
                    parseSegInput(

                        wrap
                            .querySelector(
                                '.segtree-input'
                            )
                            .value
                    );



                // 取得 index
                const idx =
                    clampInt(

                        wrap
                            .querySelector(
                                '.segtree-index'
                            )
                            .value,

                        0,

                        vals.length - 1,

                        0
                    );



                // 取得更新值
                const value =
                    clampInt(

                        wrap
                            .querySelector(
                                '.segtree-value'
                            )
                            .value,

                        0,

                        99,

                        vals[idx]
                    );



                // 儲存
                _segState = {

                    vals:
                        vals,

                    updateIndex:
                        idx,

                    updateValue:
                        value
                };



                // 重新畫
                renderPersistentSegmentTree();
            };



        // ========================================================
        // Random
        // ========================================================

        wrap
            .querySelector(
                '.rand-btn'
            )
            .onclick = () => {


                const difficulty =

                    (
                        global.VizKit &&
                        global.VizKit.getInputDifficulty
                    )

                        ? global.VizKit.getInputDifficulty()

                        : 'normal';



                const r =

                    global.RandomInput &&

                    global.RandomInput.randomInputFor(
                        'tree-persistent-segment',
                        difficulty
                    );



                let vals;



                // 有 RandomInput
                if (
                    r &&
                    Array.isArray(r.vals) &&
                    r.vals.length
                ) {

                    vals =

                        r.vals
                            .slice(0, 8)
                            .map(
                                (v) =>
                                    clampInt(
                                        v,
                                        0,
                                        99,
                                        0
                                    )
                            );
                }


                // 沒有 RandomInput
                else {

                    vals =
                        SEG_DEFAULT.slice();
                }



                const idx =
                    Math.floor(
                        Math.random() *
                        vals.length
                    );



                const value =
                    Math.floor(
                        Math.random() *
                        100
                    );



                _segState = {

                    vals:
                        vals,

                    updateIndex:
                        idx,

                    updateValue:
                        value
                };



                renderPersistentSegmentTree();
            };
    }



    // ============================================================
    // Registry
    // ============================================================

    global.VizRegistry.attach(
        'tree-persistent-segment',
        {
            render:
                renderPersistentSegmentTree,

            code:
                () => codeTreeSegment,

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