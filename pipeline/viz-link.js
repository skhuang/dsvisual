'use strict';

const DEFAULT_BASE = 'https://skhuang.github.io/dsvisual/';
// Whole-line viz directive: <!-- viz: <id> ["label"] -->
const VIZ_LINE_RE = /^<!--\s*viz:\s*([A-Za-z0-9-]+)\s*(?:"([^"]*)")?\s*-->\s*$/;

function expandVizLinks(md, opts = {}) {
  const baseUrl = opts.baseUrl || process.env.DSVISUAL_BASE_URL || DEFAULT_BASE;
  return String(md).split('\n').map((line) => {
    const m = line.match(VIZ_LINE_RE);
    if (!m) return line;
    const id = m[1];
    const label = (m[2] && m[2].trim()) || id;
    return `> ▶ [互動視覺化:${label}](${baseUrl}#m=${id})`;
  }).join('\n');
}

module.exports = { expandVizLinks };
