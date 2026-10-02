#!/usr/bin/env node
// Applies scripts/lib/content-fixes.mjs to every post in src/content/blog (idempotent).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { applyImageAlts, fixDocLinks, normalizeHeadings } from './lib/content-fixes.mjs';

const alts = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../src/data/image-alt.json'), 'utf8'));

const dir = path.resolve(import.meta.dirname, '../src/content/blog');
let changed = 0;
for (const f of readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
  const file = path.join(dir, f);
  const src = readFileSync(file, 'utf8');
  const [, fm, body] = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  if (!fm) continue;
  const title = JSON.parse(fm.match(/^title: (".*")$/m)?.[1] ?? '""');
  const out = `---\n${fm}\n---\n${applyImageAlts(normalizeHeadings(fixDocLinks(body), title), alts)}`;
  if (out !== src) {
    writeFileSync(file, out);
    changed++;
  }
}
console.log(`content:fix — ${changed} post(s) updated`);
