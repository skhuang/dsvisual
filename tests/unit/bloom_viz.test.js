const test = require('node:test');
const assert = require('node:assert');

const { hashes, buildInsertFrames, buildQueryFrames, SIZE } = require('../../js/viz/viz_bloom.js');

// Fresh empty filter state: a bit array plus per-bit attribution of which words set it.
function emptyState() {
    return {
        bits: new Array(SIZE).fill(false),
        owners: Array.from({ length: SIZE }, () => []),
    };
}

function insert(state, word) {
    return buildInsertFrames(word, state.bits, state.owners);
}

test('hashes() returns k=3 indices inside the bit array', () => {
    const idxs = hashes('cat');
    assert.strictEqual(idxs.length, 3);
    for (const i of idxs) {
        assert.ok(Number.isInteger(i), 'index is an integer');
        assert.ok(i >= 0 && i < SIZE, 'index ' + i + ' is within [0, ' + SIZE + ')');
    }
});

test('hashes() is deterministic for the same word', () => {
    assert.deepStrictEqual(hashes('zebra'), hashes('zebra'));
});

test('insert sets every probed bit and steps one probe at a time', () => {
    const state = emptyState();
    const frames = insert(state, 'cat');

    // start frame + one frame per hash + done frame
    assert.strictEqual(frames.length, hashes('cat').length + 2);
    assert.strictEqual(frames[0].phase, 'start');
    assert.strictEqual(frames[frames.length - 1].phase, 'done');

    const setFrames = frames.filter((f) => f.phase === 'set');
    assert.strictEqual(setFrames.length, 3);
    // Each probe frame points at exactly one bit, in hash order.
    assert.deepStrictEqual(setFrames.map((f) => f.bit), hashes('cat'));

    for (const i of hashes('cat')) assert.strictEqual(state.bits[i], true);
});

test('no false negatives: every inserted word queries as present', () => {
    const state = emptyState();
    for (const w of ['cat', 'dog', 'bird', 'zebra']) insert(state, w);

    for (const w of ['cat', 'dog', 'bird', 'zebra']) {
        const frames = buildQueryFrames(w, state.bits, state.owners);
        const done = frames[frames.length - 1];
        assert.strictEqual(done.present, true, w + ' must be reported present');
        assert.strictEqual(done.falsePositive, false, w + ' is a real member, not a false positive');
    }
});

test('query stops probing at the first zero bit', () => {
    const state = emptyState();
    insert(state, 'cat');

    // Find a word whose first probed bit is 0 on this near-empty filter.
    let word = null;
    for (const w of ['qqq', 'zzz', 'xyz', 'www', 'kkk', 'jjj']) {
        if (!state.bits[hashes(w)[0]]) { word = w; break; }
    }
    assert.ok(word, 'expected a word missing at its first probe');

    const frames = buildQueryFrames(word, state.bits, state.owners);
    const probes = frames.filter((f) => f.phase === 'hit' || f.phase === 'miss');
    assert.strictEqual(probes.length, 1, 'a conclusive 0 ends the probe loop');
    assert.strictEqual(probes[0].phase, 'miss');
    assert.strictEqual(frames[frames.length - 1].present, false);
});

test('query does not mutate the filter', () => {
    const state = emptyState();
    insert(state, 'cat');
    const before = state.bits.slice();

    buildQueryFrames('mouse', state.bits, state.owners);
    assert.deepStrictEqual(state.bits, before);
});

test('a false positive is detected and attributed to the words that set the bits', () => {
    const state = emptyState();
    // Fill every bit: any query then probes all-ones without the word ever being inserted.
    insert(state, 'cat');
    for (let i = 0; i < SIZE; i++) {
        if (!state.bits[i]) { state.bits[i] = true; state.owners[i].push('filler'); }
    }

    const frames = buildQueryFrames('neverinserted', state.bits, state.owners);
    const done = frames[frames.length - 1];
    assert.strictEqual(done.present, true, 'all bits are 1 -> reported present');
    assert.strictEqual(done.falsePositive, true, 'but the word was never inserted');
    assert.ok(done.setters.length > 0, 'the verdict names the words that set those bits');
    assert.ok(!done.setters.includes('neverinserted'));
});

test('frames carry independent bit snapshots so scrubbing backwards works', () => {
    const state = emptyState();
    const frames = insert(state, 'cat');

    // The start frame must still show the pre-insert state after the run completes.
    const start = frames[0];
    const done = frames[frames.length - 1];
    for (const i of hashes('cat')) {
        assert.strictEqual(start.bits[i], false, 'start frame predates the writes');
        assert.strictEqual(done.bits[i], true, 'done frame reflects the writes');
    }
});

test('re-inserting a word marks already-set bits as unchanged', () => {
    const state = emptyState();
    insert(state, 'cat');
    const frames = insert(state, 'cat');

    const setFrames = frames.filter((f) => f.phase === 'set');
    assert.ok(setFrames.every((f) => f.was === true), 'every bit was already 1');
});
