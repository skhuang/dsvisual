'use strict';

const DIRECTIVE_RE = /^<!--\s*(code|runnable|viz|oj):?\s*(.*?)\s*-->\s*$/;
const FENCE_RE = /^```(.*)$/;

// Parse one directive comment line into a Binding, or null if not a directive.
function parseDirectiveLine(line, lineNo) {
  const m = line.match(/^<!--\s*(code|runnable|viz|oj)\b\s*:?\s*(.*?)\s*-->\s*$/);
  if (!m) return null;
  const type = m[1];
  let rest = m[2];
  let title = null;
  const titleMatch = rest.match(/"([^"]*)"\s*$/);
  if (titleMatch) {
    title = titleMatch[1];
    rest = rest.slice(0, titleMatch.index).trim();
  }
  return { type, value: rest, title, line: lineNo };
}

function pushMarkdown(cells, buf) {
  const text = buf.join('\n').replace(/^\n+|\n+$/g, '');
  if (text.trim() !== '') {
    cells.push({ kind: 'markdown', source: text, lang: null, runnable: false, codeRef: null });
  }
}

function parseLecture(md) {
  const lines = String(md).split('\n');
  const cells = [];
  const bindings = [];
  let mdBuf = [];
  let pending = { codeRef: null, runnable: false }; // directives waiting for the next fence
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const dir = parseDirectiveLine(line, i + 1);
    if (dir) {
      bindings.push(dir);
      if (dir.type === 'code') pending.codeRef = dir.value;
      if (dir.type === 'runnable') pending.runnable = true;
      i += 1;
      continue;
    }
    const fence = line.match(FENCE_RE);
    if (fence) {
      pushMarkdown(cells, mdBuf);
      mdBuf = [];
      const lang = fence[1].trim() === '' ? null : fence[1].trim();
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].match(FENCE_RE)) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // consume closing fence
      cells.push({
        kind: 'code',
        source: body.join('\n'),
        lang,
        runnable: pending.runnable,
        codeRef: pending.codeRef,
      });
      pending = { codeRef: null, runnable: false };
      continue;
    }
    mdBuf.push(line);
    i += 1;
  }
  pushMarkdown(cells, mdBuf);
  return { cells, bindings };
}

module.exports = { parseLecture, parseDirectiveLine };
