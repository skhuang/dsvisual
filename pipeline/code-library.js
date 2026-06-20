'use strict';

const fs = require('node:fs');
const path = require('node:path');

function splitRef(ref) {
  const hash = ref.indexOf('#');
  if (hash === -1) return { file: ref, section: null };
  return { file: ref.slice(0, hash), section: ref.slice(hash + 1) };
}

function extractSection(src, section) {
  const lines = src.split('\n');
  const begin = lines.findIndex((l) => l.trim() === `// >>> ${section}`);
  const end = lines.findIndex((l) => l.trim() === `// <<< ${section}`);
  if (begin === -1 || end === -1 || end <= begin) {
    throw new Error(`section not found: ${section}`);
  }
  return lines.slice(begin + 1, end).join('\n');
}

function resolveCode(ref, libDir) {
  const { file, section } = splitRef(ref);
  const full = path.join(libDir, file);
  if (!fs.existsSync(full)) throw new Error(`code file not found: ${file}`);
  const src = fs.readFileSync(full, 'utf8');
  return section ? extractSection(src, section) : src;
}

function resolveCodeSafe(ref, libDir) {
  try {
    resolveCode(ref, libDir);
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { resolveCode, resolveCodeSafe, splitRef };
