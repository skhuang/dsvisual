'use strict';

const { resolveCode } = require('./code-library.js');

// nbformat stores source as a list of lines, each (except the last) ending '\n'.
function toSourceArray(text) {
  const lines = String(text).split('\n');
  return lines.map((l, i) => (i < lines.length - 1 ? l + '\n' : l));
}

function codeCell(text) {
  return { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: toSourceArray(text) };
}

function markdownCell(text) {
  return { cell_type: 'markdown', metadata: {}, source: toSourceArray(text) };
}

function buildNotebook(cells, opts = {}) {
  const libDir = opts.libDir || null;
  const out = [];
  for (const c of cells) {
    const isRunnable = c.kind === 'code' && c.runnable && c.lang === 'cpp';
    if (isRunnable) {
      const src = c.codeRef && libDir ? resolveCode(c.codeRef, libDir) : c.source;
      out.push(codeCell(src));
    } else if (c.kind === 'code') {
      out.push(markdownCell('```' + (c.lang || '') + '\n' + c.source + '\n```'));
    } else {
      out.push(markdownCell(c.source));
    }
  }
  return {
    cells: out,
    metadata: {
      kernelspec: { name: 'xcpp17', display_name: 'C++17', language: 'C++17' },
      language_info: { name: 'C++17', mimetype: 'text/x-c++src', file_extension: '.cpp' },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

module.exports = { buildNotebook, toSourceArray };
