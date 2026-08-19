const test = require('node:test');
const assert = require('node:assert');

const CODE_MULTILANG = require('../../js/code_multilang.js');

const LANG_TOKENS = {
    python: 'def ',
    rust: 'fn main',
    go: 'func main',
    php: '<?php',
};

test('CODE_MULTILANG has an entry for graph-dijkstra', () => {
    assert.ok(CODE_MULTILANG['graph-dijkstra'], 'expected graph-dijkstra entry');
});

test('graph-dijkstra has all four languages, non-empty, with the right language token', () => {
    const entry = CODE_MULTILANG['graph-dijkstra'];
    for (const [lang, token] of Object.entries(LANG_TOKENS)) {
        assert.ok(Object.prototype.hasOwnProperty.call(entry, lang), `missing key: ${lang}`);
        const src = entry[lang];
        assert.strictEqual(typeof src, 'string', `${lang} source should be a string`);
        assert.ok(src.length > 0, `${lang} source should be non-empty`);
        assert.ok(src.includes(token), `${lang} source should contain "${token}"`);
    }
});
