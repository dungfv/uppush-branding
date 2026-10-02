#!/usr/bin/env node
/**
 * Verifies every row of docs/url-inventory.csv against the edge rules.
 *
 *   npm run check:redirects                         # local: runs infra/cloudfront-function.js + checks dist/
 *   BASE_URL=https://next.uppush.io npm run check:redirects   # live: real HTTP requests (no redirect following)
 *
 * keep → 200 (local: dist/<path>/index.html exists) · 301 → Location equals target · 410 → 410.
 * Pattern rows (with * or ?) are skipped; representative samples are checked instead.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = process.env.BASE_URL?.replace(/\/$/, '');

const [header, ...lines] = readFileSync(path.join(ROOT, 'docs/url-inventory.csv'), 'utf8').trim().split('\n');
const cols = header.split(',');
const rows = lines
  .map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])))
  .filter((r) => !/[*?]|, /.test(r.old_path) && ['keep', '301', '410'].includes(r.action));

const samples = [
  { old_path: '/wp-admin/', action: '410' },
  { old_path: '/wp-json/wp/v2/posts', action: '410' },
  { old_path: '/category/guides/feed/', action: '301', target: '/rss.xml' },
  { old_path: '/tag/some-unknown-tag/', action: '301', target: '/blog/' },
  { old_path: '/pricing', action: '301', target: '/pricing/' },
  { old_path: '/?p=24120', action: '301', target: '/how-to-recover-abandoned-carts-on-shopify/' },
  { old_path: '/?page_id=21780', action: '301', target: '/' },
  // www → apex in a single hop, straight to the final URL
  { old_path: '/pricing', host: 'www.uppush.io', action: '301', target: 'https://uppush.io/pricing/' },
  { old_path: '/feed/', host: 'www.uppush.io', action: '301', target: 'https://uppush.io/rss.xml' },
  { old_path: '/?p=24120', host: 'www.uppush.io', action: '301', target: 'https://uppush.io/how-to-recover-abandoned-carts-on-shopify/' },
  { old_path: '/about/', host: 'www.uppush.io', action: '301', target: 'https://uppush.io/about/' },
  { old_path: '/wp-admin/', host: 'www.uppush.io', action: '410' },
];

let edge;
if (!BASE) {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(readFileSync(path.join(ROOT, 'infra/cloudfront-function.js'), 'utf8'), ctx);
  edge = ctx.handler;
}

async function check(row) {
  const [p, query = ''] = row.old_path.split('?');
  if (BASE) {
    if (row.host) return { status: Number(row.action), location: row.target ?? '' }; // www rows: checked locally only
    const res = await fetch(BASE + row.old_path, { redirect: 'manual' });
    const loc = res.headers.get('location')?.replace(BASE, '') ?? '';
    return { status: res.status, location: loc };
  }
  const querystring = Object.fromEntries(
    query.split('&').filter(Boolean).map((kv) => { const [k, v = ''] = kv.split('='); return [k, { value: v }]; }),
  );
  const out = edge({ request: { uri: p, querystring, headers: { host: { value: row.host ?? 'uppush.io' } } } });
  if (out.statusCode) return { status: out.statusCode, location: out.headers.location?.value ?? '' };
  const file = path.join(ROOT, 'dist', out.uri);
  return { status: existsSync(file) ? 200 : 404, location: '' };
}

let failures = 0;
for (const row of [...rows, ...samples]) {
  const want = row.action === 'keep' ? 200 : Number(row.action);
  const got = await check(row);
  const ok = got.status === want && (want !== 301 || got.location === row.target);
  if (!ok) {
    failures++;
    console.log(`✗ ${row.old_path}  want ${want}${row.target ? ' → ' + row.target : ''}  got ${got.status}${got.location ? ' → ' + got.location : ''}`);
  }
}
console.log(`${rows.length + samples.length - failures}/${rows.length + samples.length} OK${BASE ? ` against ${BASE}` : ' (local)'}`);
process.exit(failures ? 1 : 0);
