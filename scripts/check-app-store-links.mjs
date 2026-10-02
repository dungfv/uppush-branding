#!/usr/bin/env node
/**
 * Audits every link to the App Store listing in dist/ (run after `npm run build`).
 * Each must carry ?st_source=uppush_web&st_position=<snake_case> and nothing else,
 * so installs stay attributable per call-to-action — including links typed into
 * blog posts via the CMS. Prints a per-position summary; exits 1 on any bad link.
 *
 *   npm run check:links
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { ST_SOURCE } from '../src/lib/app-store-tracking.mjs';

const DIST = path.resolve(import.meta.dirname, '../dist');
const OK = new RegExp(`^https://apps\\.shopify\\.com/pushup-notification-marketing(/reviews)?\\?st_source=${ST_SOURCE}&st_position=([a-z0-9_]+)$`);

const files = [];
const walk = (dir) => readdirSync(dir).forEach((f) => (statSync(path.join(dir, f)).isDirectory() ? walk(path.join(dir, f)) : f.endsWith('.html') && files.push(path.join(dir, f))));
walk(DIST);

const positions = new Map();
const bad = [];
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const [, raw] of html.matchAll(/href="(https:\/\/apps\.shopify\.com\/pushup-notification-marketing[^"]*)"/g)) {
    const href = raw.replace(/&amp;/g, '&');
    const m = href.match(OK);
    const page = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
    if (!m) bad.push(`${page}  ${href}`);
    else positions.set(m[2], (positions.get(m[2]) ?? 0) + 1);
  }
}

for (const [pos, n] of [...positions].sort()) console.log(`${pos.padEnd(26)} ${String(n).padStart(4)} links`);
if (bad.length) {
  console.error(`\n${bad.length} App Store link(s) without st_source/st_position:\n  ${bad.join('\n  ')}`);
  process.exit(1);
}
console.log(`\nAll App Store links tagged (${files.length} pages scanned).`);
