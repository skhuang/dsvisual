'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseLecture } = require('./parse-lecture.js');
const { resolveCodeSafe } = require('./code-library.js');

function lintBindings({ bindings, libDir, vizIds, ojIds }) {
  const errors = [];
  const warnings = [];
  for (const b of bindings) {
    if (b.type === 'code') {
      const r = resolveCodeSafe(b.value, libDir);
      if (!r.ok) errors.push(`line ${b.line}: code: ${b.value} — ${r.error}`);
    } else if (b.type === 'viz') {
      if (!vizIds.has(b.value)) errors.push(`line ${b.line}: viz: unknown id "${b.value}"`);
    } else if (b.type === 'oj') {
      if (!ojIds.has(b.value)) warnings.push(`line ${b.line}: oj: "${b.value}" has no problem dir yet`);
    }
  }
  return { errors, warnings };
}

function discoverVizIds(dsvisualDir) {
  const dir = path.join(dsvisualDir, 'slides', 'en');
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));
}

function discoverOjIds(dsjudgeDir) {
  const dir = path.join(dsjudgeDir, 'problems');
  if (!fs.existsSync(dir)) return new Set();
  return new Set(fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name));
}

function main() {
  const mdPath = process.argv[2];
  if (!mdPath) {
    console.error('usage: node pipeline/lint.js <chapter.md>');
    process.exit(2);
  }
  const dsvisualDir = __dirname.replace(/\/pipeline$/, '');
  const libDir = process.env.LIB_DIR || path.join(dsvisualDir, 'cpp');
  const dsjudgeDir = process.env.DS_JUDGE_DIR || path.join(dsvisualDir, '..', 'dsjudge');
  const { bindings } = parseLecture(fs.readFileSync(mdPath, 'utf8'));
  const out = lintBindings({
    bindings,
    libDir,
    vizIds: discoverVizIds(dsvisualDir),
    ojIds: discoverOjIds(dsjudgeDir),
  });
  for (const w of out.warnings) console.warn('WARN ' + w);
  for (const e of out.errors) console.error('ERR  ' + e);
  console.log(`${out.errors.length} error(s), ${out.warnings.length} warning(s)`);
  process.exit(out.errors.length ? 1 : 0);
}

module.exports = { lintBindings, discoverVizIds, discoverOjIds };

if (require.main === module) main();
