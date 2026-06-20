// pipeline/bind-viz.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { expandVizLinks } = require('./viz-link.js');

function main() {
  const args = process.argv.slice(2);
  const mdPath = args[0];
  if (!mdPath) { console.error('usage: node pipeline/bind-viz.js <chapter.md> [--out p]'); process.exit(2); }
  const outIdx = args.indexOf('--out');
  const dir = path.dirname(mdPath);
  const base = path.basename(mdPath).replace(/\.md$/, '');
  const outPath = outIdx !== -1 ? args[outIdx + 1] : path.join(dir, base + '.viz.md');

  const md = fs.readFileSync(mdPath, 'utf8');
  const expanded = expandVizLinks(md);
  fs.writeFileSync(outPath, expanded);
  const n = (expanded.match(/^> ▶ \[互動視覺化:/gm) || []).length;
  console.log(`wrote ${outPath} (${n} viz links)`);
}

if (require.main === module) main();
