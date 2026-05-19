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

module.exports = { cppFiles, formatCppFile };
