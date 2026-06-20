'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseLecture } = require('./parse-lecture.js');
const { buildNotebook } = require('./build-notebook.js');

function toReadonly(nb) {
  const cells = nb.cells.map((c) => {
    if (c.cell_type !== 'code') return c;
    const body = c.source.join('');
    return { cell_type: 'markdown', metadata: {}, source: ['```cpp\n', body, '\n```'] };
  });
  return Object.assign({}, nb, { cells });
}

function main() {
  const args = process.argv.slice(2);
  const mdPath = args[0];
  if (!mdPath) { console.error('usage: node pipeline/gen-ipynb.js <chapter.md> [--out p] [--readonly]'); process.exit(2); }
  const readonly = args.includes('--readonly');
  const outIdx = args.indexOf('--out');
  const dsvisualDir = __dirname.replace(/\/pipeline$/, '');
  const ds2026Dir = process.env.DS2026_DIR || path.join(dsvisualDir, '..', 'ds2026');
  const libDir = process.env.LIB_DIR || path.join(dsvisualDir, 'cpp');
  const base = path.basename(mdPath).replace(/\.md$/, '');
  let outPath = outIdx !== -1 ? args[outIdx + 1] : path.join(ds2026Dir, 'notebooks', base + '.ipynb');
  if (readonly && outIdx === -1) outPath = outPath.replace(/\.ipynb$/, '.readonly.ipynb');

  const { cells } = parseLecture(fs.readFileSync(mdPath, 'utf8'));
  let nb = buildNotebook(cells, { libDir });
  if (readonly) nb = toReadonly(nb);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(nb, null, 2) + '\n');
  const codeCount = nb.cells.filter((c) => c.cell_type === 'code').length;
  console.log(`wrote ${outPath} (${nb.cells.length} cells, ${codeCount} code)`);
}

module.exports = { toReadonly };

if (require.main === module) main();
