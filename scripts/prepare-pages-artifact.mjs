import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, '_site');

const entries = [
  'index.html',
  'style.css',
  'cpp',
  'docs/private-decks.example.json',
  'docs/private-slides.md',
  'js',
  'slides',
  'vendor',
];

function shouldCopy(src) {
  const name = src.split(/[\\/]/).pop();
  return name !== '.DS_Store';
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const entry of entries) {
  const from = join(root, entry);
  if (!existsSync(from)) continue;
  const to = join(outDir, entry);
  await cp(from, to, {
    recursive: true,
    filter: shouldCopy,
  });
}

await writeFile(join(outDir, '.nojekyll'), '');
