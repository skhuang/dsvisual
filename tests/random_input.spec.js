const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

async function openSettings(page) {
  await page.click('#settings-toggle');
  await expect(page.locator('#settings-drawer')).toBeVisible();
}

// A randomizer can legitimately regenerate the same value by chance, so a single
// click + strict-inequality assertion is inherently flaky (this is what tripped
// random_input.spec.js:83 on CI, including on main). Re-click until the value
// changes: a working randomizer does so within a few clicks, a broken one never
// will, so this still fails on a genuinely dead button.
async function expectRandomizes(clickTarget, valueLocator, before) {
  await expect(async () => {
    await clickTarget.click();
    expect(await valueLocator.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });
}

test('difficulty is remembered per category and persists across reload', async ({ page }) => {
  await page.goto(fileUri);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await openSettings(page);
  const sel = page.locator('#input-difficulty');
  await expect(sel).toHaveValue('normal');
  await sel.selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');

  await page.reload();
  await openSettings(page);
  await expect(page.locator('#input-difficulty')).toHaveValue('large');

  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dsvisual.inputDifficulty.')));
  expect(stored.length).toBeGreaterThanOrEqual(1);
});

test('random button on tree-traversal changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-traversal');

  const section = page.locator('[data-method-section="tree-traversal"]');
  const input = section.locator('.tt-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on matrix-sparse changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'matrix-sparse');

  const section = page.locator('[data-method-section="matrix-sparse"]');
  const input = section.locator('.sm-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on list-doubly changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'list-doubly');

  const section = page.locator('[data-method-section="list-doubly"]');
  const input = section.locator('.dl-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on binary search observatory honors difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'search-binary');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('edge');
  await page.click('#settings-drawer .settings-drawer-close');

  const card = page.locator('[data-method-section="search-binary"]');
  const input = card.locator('.searchviz-arr');
  const before = await input.inputValue();
  await expectRandomizes(card.locator('.rand-btn'), input, before);
  await expect(card.locator('.searchviz-stage .search-cell').first()).toBeVisible();
});

test('Randomize (🎲) on sort observatory honors large difficulty (>15 bars)', async ({ page }) => {
  await page.goto(fileUri);
  // All sorts now use the dynamic renderSort host: a .sortviz-stage of .sort-bar
  // elements plus a 🎲 .rand-btn that pulls a fresh RandomInput array.
  await loadMethod(page, 'sort-radix');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');

  const card = page.locator('[data-method-section="sort-radix"]');
  const bars = card.locator('.sortviz-stage .sort-bar');
  // Default input renders a small array; large difficulty randomizes to 18-24 values
  // (parseArr caps at 20), so the 🎲 re-render must yield well over 15 bars.
  await expect.poll(async () => await bars.count()).toBeGreaterThan(1);
  await card.locator('.rand-btn').click();
  await expect.poll(async () => await bars.count()).toBeGreaterThan(15);
});

test('random button on search-fibonacci changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'search-fibonacci');

  const section = page.locator('[data-method-section="search-fibonacci"]');
  const input = section.locator('.searchviz-arr');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on tree-radix changes the rendered edges and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-radix');

  const randomBtn = page.locator('[data-testid="text-tree-random"]');
  const edges = page.locator('#advanced-tree-container .edge-label');

  const before = (await edges.allTextContents()).join(',');
  await expect(async () => {
    await randomBtn.click();
    const after = (await edges.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const normalCount = await edges.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const largeCount = await edges.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on tree-btree changes the rendered keys and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-btree');

  const randomBtn = page.locator('[data-testid="tree-random"]');
  const keys = page.locator('#advanced-tree-container .key');

  const before = (await keys.allTextContents()).join(',');
  await expect(async () => {
    await randomBtn.click();
    const after = (await keys.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const normalCount = await keys.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const largeCount = await keys.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on tree-fenwick changes the input field and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-fenwick');

  const section = page.locator('[data-method-section="tree-fenwick"]');
  const input = section.locator('.fenwick-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  const cells = section.locator('.fenwick-cell');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await cells.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await cells.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on tree-segment changes the tree and honors the <=8-leaf cap', async ({ page }) => {
  await page.goto(fileUri);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await loadMethod(page, 'tree-segment');

  const section = page.locator('[data-method-section="tree-segment"]');
  const input = section.locator('.segtree-input');
  const nodes = section.locator('.segtree-node');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  // Step through the query/update phases at this randomized (very likely n!=8)
  // array, so the generalized ql/qr/ul/ur formulas run in the browser at n!=8,
  // not just by hand-proof — and the fixed POS-table gap-skip branch fires.
  // Frame count per phase varies with the recursion shape, so just drive the
  // transport to the end via the scrubber and assert it got there cleanly.
  const phase = section.locator('[data-testid="segtree-phase"]');
  await expect(phase).toContainText('Ready');
  const max = parseInt(await section.locator('.stepctl-scrubber').getAttribute('max'), 10);
  const stepBtn = section.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < max; i++) await stepBtn.click();
  await expect(phase).toContainText('Phase 3');
  await expect(nodes.first()).toBeVisible();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await nodes.count();

  // 'large' always fills all 8 leaves -> all 15 node-table slots are visited
  // (no gaps); 'normal' (4-6 leaves) always renders strictly fewer.
  expect(largeCount).toBe(15);
  expect(largeCount).toBeGreaterThan(normalCount);
  expect(largeCount).toBeLessThanOrEqual(15); // never overflows the fixed 15-node table

  expect(errors).toEqual([]);
});

test('random button on tree-catalan changes n and honors the 0..4 button range at large', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-catalan');

  const section = page.locator('[data-method-section="tree-catalan"]');
  const activeBtn = section.locator('.cat-nbtn.active');
  const shapes = section.locator('.cat-shapes svg.cat-shape');

  const before = await activeBtn.textContent();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await activeBtn.textContent()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  // 'large' always draws n=4 (the UI's own max button) -> C4 = 14 shapes total once
  // every group step has been shown (the step workbench starts at step 0, i.e. only
  // the first split group, so drive the scrubber to the end first).
  await expect(activeBtn).toHaveText('n=4');
  const max = parseInt(await section.locator('.stepctl-scrubber').getAttribute('max'), 10);
  const stepBtn = section.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < max; i++) await stepBtn.click();
  await expect.poll(async () => await shapes.count()).toBe(14);
});

test('random button on graph-floyd-warshall changes the edge list and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'graph-floyd-warshall');

  const section = page.locator('[data-method-section="graph-floyd-warshall"]');
  const input = section.locator('.floyd-edges');
  const cells = section.locator('.floyd-cell');

  await expect(cells).toHaveCount(16); // default 4x4 matrix, unchanged (byte-identical to the old hardcoded demo)
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await cells.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await cells.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on graph-aoe changes the activity network and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'graph-aoe');

  const section = page.locator('[data-method-section="graph-aoe"]');
  const input = section.locator('.aoe-input');
  const nodeCircles = section.locator('.aoe-nodes circle');

  await expect(nodeCircles).toHaveCount(9); // default network ≅ the original 9-node AOE_PRESET
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await nodeCircles.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await nodeCircles.count();

  expect(largeCount).toBeGreaterThan(normalCount);
  // Still a valid single-source/single-sink DAG: the ee/le table renders and the
  // step transport can be driven without erroring.
  await expect(section.locator('.aoe-tbl')).toBeVisible();
});

test('random button on graph-matrix changes n/edges and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'graph-matrix');

  const section = page.locator('[data-method-section="graph-matrix"]');
  const nInput = section.locator('.gm-n');
  const nodes = section.locator('.gm-graph .gm-node');

  const before = await nInput.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), nInput, before);

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await nodes.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on graph-scc changes n/edges and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'graph-scc');

  const section = page.locator('[data-method-section="graph-scc"]');
  const nInput = section.locator('.gsc-n');
  const nodes = section.locator('.gsc-graph .gsc-node');

  const before = await nInput.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), nInput, before);
  // Still a valid directed graph the algorithm can run on: the frame controls
  // (and hence the step transport) render after randomizing.
  await expect(section.locator('.stepctl-scrubber')).toBeVisible();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await nodes.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on hash-chain fills the table and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'hash-chain');
  // loadMethod's last click (the "Hash Chaining" entry in the "Hash & Probabilistic" dropdown)
  // lands the cursor at a spot that, once that dropdown closes, sits directly over the
  // "Design Patterns" pill stacked in the nav's second row — the browser then genuinely
  // :hover-opens ITS flyout there (pre-existing nav layout quirk, unrelated to this feature),
  // which visually overlaps #hash-actions and intercepts the click below. Move the mouse off
  // the nav first so the flyout closes before interacting with the panel.
  await page.mouse.move(50, 900);

  const randomBtn = page.locator('[data-testid="hash-random"]');
  const slots = page.locator('#hash-ch-container .la-slot');

  await expect(slots).toHaveCount(0); // default table is empty until something is inserted
  await expect.poll(async () => { await randomBtn.click(); return slots.count(); }).toBeGreaterThan(0);

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const normalCount = await slots.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const largeCount = await slots.count();

  expect(largeCount).toBeGreaterThan(normalCount);
  expect(largeCount).toBeLessThanOrEqual(9); // matches random_input.js's hash-chain cap
});

test('random button on bloom-filter changes the inserted items and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'bloom-filter');

  const section = page.locator('[data-method-section="bloom-filter"]');
  const itemsList = section.locator('.bloom-items-list');
  const before = await itemsList.textContent();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await itemsList.textContent()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  function itemCount(text) { return text.split(',').map((s) => s.trim()).filter(Boolean).length; }

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = itemCount(await itemsList.textContent());

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = itemCount(await itemsList.textContent());

  expect(largeCount).toBeGreaterThan(normalCount);
  expect(largeCount).toBeLessThanOrEqual(8); // matches random_input.js's bloomWords cap
});

test('random button on skip-list changes the node set and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'skip-list');

  const section = page.locator('[data-method-section="skip-list"]');
  // Every node has height >=1, so it always appears (with its key) at level 0 —
  // counting there gives the exact node count regardless of each node's random height.
  const level0Nodes = section.locator('.skiplist-level[data-level="0"] .skiplist-node[data-key]');
  const before = (await level0Nodes.allTextContents()).join(',');
  await expect(async () => {
    await section.locator('.rand-btn').click();
    const after = (await level0Nodes.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await level0Nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await level0Nodes.count();

  expect(largeCount).toBeGreaterThan(normalCount);
  expect(largeCount).toBeLessThanOrEqual(10); // matches random_input.js's skiplistKeys cap
});

test('random button on count-min-sketch changes the counter table and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'count-min-sketch');

  const section = page.locator('[data-method-section="count-min-sketch"]');
  const cells = section.locator('.cms-cell');
  const before = (await cells.allTextContents()).join(',');
  await expect(async () => {
    await section.locator('.rand-btn').click();
    const after = (await cells.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  function sumCells(texts) { return texts.reduce((sum, t) => sum + (parseInt(t, 10) || 0), 0); }

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalSum = sumCells(await cells.allTextContents());

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeSum = sumCells(await cells.allTextContents());

  expect(largeSum).toBeGreaterThan(normalSum);
});

test('random button on heap-binary changes the rendered nodes and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'heap-binary');

  const randomBtn = page.locator('[data-testid="heap-random"]');
  const nodes = page.locator('.heap-node');

  const before = (await nodes.allTextContents()).join(',');
  await expect(async () => {
    await randomBtn.click();
    const after = (await nodes.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const largeCount = await nodes.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on deque changes the rendered nodes and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'deque');

  const section = page.locator('[data-method-section="deque"]');
  const nodes = section.locator('.deque-node');

  const before = (await nodes.allTextContents()).join(',');
  await expect(async () => {
    await section.locator('.rand-btn').click();
    const after = (await nodes.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await nodes.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on sort-polyphase changes the input field and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'sort-polyphase');

  const section = page.locator('[data-method-section="sort-polyphase"]');
  const input = section.locator('.pf-data');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  const dataLen = (v) => v.split(',').filter(Boolean).length;
  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalLen = dataLen(await input.inputValue());

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeLen = dataLen(await input.inputValue());

  expect(largeLen).toBeGreaterThan(normalLen);
});

test('random button on file-isam changes the search key and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'file-isam');

  const section = page.locator('[data-method-section="file-isam"]');
  const input = section.locator('.isam-key');
  const blocks = section.locator('.isam-block');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await blocks.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await blocks.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on file-inverted changes the query and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'file-inverted');

  const section = page.locator('[data-method-section="file-inverted"]');
  const input = section.locator('.inv-query');
  const docs = section.locator('.inv-doc');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await docs.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await docs.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on gc-memory changes the mark-sweep object graph and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'gc-memory');

  const section = page.locator('[data-method-section="gc-memory"]');
  const nodes = section.locator('.gc-node');

  const before = (await nodes.allTextContents()).join(',');
  await expect(async () => {
    await section.locator('.rand-btn').click();
    const after = (await nodes.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await nodes.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on recursion changes the fibonacci n and honors the <=7 depth cap', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'recursion');

  const section = page.locator('[data-method-section="recursion"]');
  const input = section.locator('.rec-n');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  // 'large' always hits the viz's own n<=7 safety cap exactly (fib(7) => 41 calls, still small).
  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  await expect(input).toHaveValue('7');
  await expect(section.locator('.rec-node').first()).toBeVisible();
});

// Helper: verify every row, column, and both diagonals of a flat cell-value array sum to `magicSum`.
// This is the strongest possible check that a random order n was actually constructible — a broken
// or unsupported n would either error out or produce a square that fails this check.
function assertGenuineMagicSquare(values, n, magicSum) {
  expect(values.length).toBe(n * n);
  expect(values.every(Number.isFinite)).toBe(true);
  const grid = [];
  for (let r = 0; r < n; r++) grid.push(values.slice(r * n, r * n + n));
  for (let r = 0; r < n; r++) expect(grid[r].reduce((a, b) => a + b, 0)).toBe(magicSum);
  for (let c = 0; c < n; c++) expect(grid.reduce((a, row) => a + row[c], 0)).toBe(magicSum);
  expect(grid.reduce((a, row, r) => a + row[r], 0)).toBe(magicSum);
  expect(grid.reduce((a, row, r) => a + row[n - 1 - r], 0)).toBe(magicSum);
}

test('random button on magic-square honors the odd-order dropdown and builds a genuinely magic square', async ({ page }) => {
  await page.goto(fileUri);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await loadMethod(page, 'magic-square');

  const section = page.locator('[data-method-section="magic-square"]');
  const order = section.locator('.magic-order');
  const before = await order.inputValue();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await order.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  const n = parseInt(await order.inputValue(), 10);
  expect([3, 5, 7]).toContain(n); // the only orders this viz's own dropdown ever offers

  // Drive the step control to the final frame so the whole n x n square is filled in.
  const scrubber = section.locator('.stepctl-scrubber');
  const max = parseInt(await scrubber.getAttribute('max'), 10);
  const stepBtn = section.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < max; i++) await stepBtn.click();

  const cells = section.locator('.magic-board .magic-cell');
  await expect.poll(async () => await cells.count()).toBe(n * n);
  const values = (await cells.allTextContents()).map((t) => parseInt(t, 10));
  assertGenuineMagicSquare(values, n, n * (n * n + 1) / 2);

  expect(errors).toEqual([]);
});

test('random button on magic-latin honors the odd-order dropdown (incl. n=9) and builds a genuinely magic square', async ({ page }) => {
  await page.goto(fileUri);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await loadMethod(page, 'magic-latin');

  const section = page.locator('[data-method-section="magic-latin"]');
  const order = section.locator('.ml-order');
  const before = await order.inputValue();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await order.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  const n = parseInt(await order.inputValue(), 10);
  expect([3, 5, 7, 9]).toContain(n); // magic-latin's dropdown additionally offers 9

  // The "square (v)" grid is always drawn in full (unlike the a/b digit grids, which reveal
  // progressively), so it's readable immediately after the 🎲 click, no stepping needed.
  const cells = section.locator('[data-testid="ml-grid-square"] .ml-cell');
  await expect.poll(async () => await cells.count()).toBe(n * n);
  const values = (await cells.allTextContents()).map((t) => parseInt(t, 10));
  assertGenuineMagicSquare(values, n, n * (n * n + 1) / 2);

  expect(errors).toEqual([]);
});

test('random button on magic-torus changes the order and re-renders the toroidal plane without error', async ({ page }) => {
  await page.goto(fileUri);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await loadMethod(page, 'magic-torus');

  const section = page.locator('[data-method-section="magic-torus"]');
  const order = section.locator('.mt-order');
  const before = await order.inputValue();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await order.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  const n = parseInt(await order.inputValue(), 10);
  expect([3, 5, 7]).toContain(n); // the only orders this viz's own dropdown ever offers
  await expect(section.locator('[data-testid="mt-plane"]')).toBeVisible();
  await expect(section.locator('[data-testid="mt-readout"]')).toContainText(String(n * n));
  expect(errors).toEqual([]);
});

test('random button on magic-formula changes the order and fills a genuinely magic square by formula', async ({ page }) => {
  await page.goto(fileUri);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await loadMethod(page, 'magic-formula');

  const section = page.locator('[data-method-section="magic-formula"]');
  const order = section.locator('.mf-order');
  const before = await order.inputValue();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await order.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  const n = parseInt(await order.inputValue(), 10);
  expect([3, 5, 7]).toContain(n); // the only orders this viz's own dropdown ever offers

  await section.locator('.mf-fillall').click();

  // fillAllFrames() steps through the grid one cell at a time — drive the step control to the
  // final ('done') frame so every cell has actually been filled in by the O(1) formula.
  const scrubber = section.locator('.stepctl-scrubber');
  const max = parseInt(await scrubber.getAttribute('max'), 10);
  const stepBtn = section.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < max; i++) await stepBtn.click();

  const cells = section.locator('[data-testid="mf-grid"] .mf-cell');
  await expect.poll(async () => await cells.count()).toBe(n * n);
  await expect(section.locator('[data-testid="mf-readout"]')).toContainText('filled ' + (n * n) + ' / ' + (n * n));
  const values = (await cells.allTextContents()).map((t) => parseInt(t, 10));
  assertGenuineMagicSquare(values, n, n * (n * n + 1) / 2);

  expect(errors).toEqual([]);
});

test('random button on magic-symmetry changes the order and re-renders both grids without error', async ({ page }) => {
  await page.goto(fileUri);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await loadMethod(page, 'magic-symmetry');

  const section = page.locator('[data-method-section="magic-symmetry"]');
  const order = section.locator('.sym-order');
  const before = await order.inputValue();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await order.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  const n = parseInt(await order.inputValue(), 10);
  expect([3, 5, 7]).toContain(n); // the only orders this viz's own dropdown ever offers
  const cells = section.locator('[data-testid="sym-grid-original"] .sym-cell');
  await expect.poll(async () => await cells.count()).toBe(n * n);
  expect(errors).toEqual([]);
});
