'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = __dirname;
const CLANG_FORMAT = path.join(REPO_ROOT, 'node_modules', '.bin', 'clang-format');

function cppFiles() {
  return fs.readdirSync(REPO_ROOT)
    .filter((name) => name.endsWith('.cpp'))
    .map((name) => path.join(REPO_ROOT, name))
    .sort();
}

function formatCppFile(absPath) {
  // -i edits the file in place; --style=file makes clang-format walk up to
  // find the nearest .clang-format. The file's directory is used as CWD.
  execFileSync(CLANG_FORMAT, ['-i', '--style=file', absPath], {
    cwd: path.dirname(absPath),
    stdio: 'pipe',
  });
}

function compileCheck(absPath) {
  try {
    execFileSync('g++', ['-std=c++17', '-fsyntax-only', absPath], {
      cwd: path.dirname(absPath),
      stdio: 'pipe',
    });
  } catch (err) {
    const stderr = (err.stderr && err.stderr.toString()) || '';
    const stdout = (err.stdout && err.stdout.toString()) || '';
    throw new Error('compileCheck failed for ' + absPath + '\n' + stderr + stdout);
  }
}

function formatCppString(code) {
  // --assume-filename=x.cpp tells clang-format the language; stdin/stdout used.
  const out = execFileSync(CLANG_FORMAT,
    ['--style=file', '--assume-filename=x.cpp'],
    { cwd: REPO_ROOT, input: code, stdio: ['pipe', 'pipe', 'pipe'] });
  return out.toString();
}

function formatCppStringInDir(code, cwd) {
  const out = execFileSync(CLANG_FORMAT,
    ['--style=file', '--assume-filename=x.cpp'],
    { cwd, input: code, stdio: ['pipe', 'pipe', 'pipe'] });
  return out.toString();
}

function formatSlidesDbCodeBlocksAt(slidesDbPath) {
  // Clear require cache so successive calls re-read the file.
  delete require.cache[require.resolve(slidesDbPath)];
  const slidesDb = require(slidesDbPath);
  for (const id of Object.keys(slidesDb)) {
    for (const slide of slidesDb[id].slides) {
      for (const block of slide.blocks) {
        if (block.type === 'code' && block.lang === 'cpp') {
          block.code = formatCppStringInDir(block.code, path.dirname(slidesDbPath));
        }
      }
    }
  }
  // Write the formatted slides_db back. Re-serialise using JSON for stable output,
  // then convert to the CommonJS module shape the file uses.
  const body = JSON.stringify(slidesDb, null, 2);
  const out = '// Structured slide content source. Hand-written.\n' +
              '// Consumed only by build_slides.js (Node). Do NOT load this in the browser.\n' +
              '// Text leaves are { zh, en } and may embed inline $...$ LaTeX.\n\n' +
              'const SLIDES_DB = ' + body + ';\n\n' +
              'module.exports = SLIDES_DB;\n';
  fs.writeFileSync(slidesDbPath, out);
}

function formatSlidesDbCodeBlocks() {
  formatSlidesDbCodeBlocksAt(path.join(REPO_ROOT, 'slides_db.js'));
}

module.exports = {
  cppFiles, formatCppFile, compileCheck, formatCppString,
  formatSlidesDbCodeBlocksAt, formatSlidesDbCodeBlocks,
};
