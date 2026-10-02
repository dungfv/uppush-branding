#!/usr/bin/env node
/**
 * On-page SEO audit of the built site (dist/). Run after `npm run build`:
 *   npm run seo:audit            # summary + issues
 *   npm run seo:audit -- --json  # machine-readable
 * Checks titles, descriptions, canonicals, headings, alt text, internal links,
 * JSON-LD and content length. Exits 1 on errors (not on warnings).
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '../dist');
const SITE = 'https://uppush.io';
const files = [];
const walk = (d) => readdirSync(d).forEach((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : f === 'index.html' && files.push(path.join(d, f))));
walk(DIST);

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const text = (h) => decode(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (tag, name) => decode((tag.match(new RegExp(`${name}="([^"]*)"`)) || [])[1] ?? '');

const pages = files.map((f) => {
  const html = readFileSync(f, 'utf8');
  const url = '/' + path.relative(DIST, f).replace(/index\.html$/, '');
  const head = html.slice(0, html.indexOf('</head>'));
  const meta = (n) => attr((head.match(new RegExp(`<meta[^>]+(?:name|property)="${n}"[^>]*>`)) || [''])[0], 'content');
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
  const headings = [...main.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({ level: +m[1], text: text(m[2]) }));
  const h1All = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]));
  const imgs = [...main.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const links = [...main.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => decode(m[1]));
  const jsonld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try { return JSON.parse(m[1]); } catch { return { '@type': 'INVALID' }; }
  });
  return {
    url, title: text((head.match(/<title>([\s\S]*?)<\/title>/) || ['', ''])[1]),
    description: meta('description'), robots: meta('robots'),
    canonical: attr((head.match(/<link[^>]+rel="canonical"[^>]*>/) || [''])[0], 'href'),
    og: { title: meta('og:title'), description: meta('og:description'), image: meta('og:image') },
    headings, h1All, imgs, links, jsonld,
    words: text(main).split(' ').filter(Boolean).length,
    body: (html.match(/data-pagefind-body[^>]*>([\s\S]*?)<footer/) || [])[1] ?? '',
    lang: (html.match(/<html[^>]*lang="([^"]+)"/) || [])[1],
  };
});

const indexable = pages.filter((p) => !/noindex/.test(p.robots));
const issues = [];
const add = (sev, url, msg) => issues.push({ sev, url, msg });
const dup = (key) => {
  const m = new Map();
  indexable.forEach((p) => m.set(p[key], [...(m.get(p[key]) ?? []), p.url]));
  return [...m].filter(([k, v]) => k && v.length > 1);
};

// Resolve internal links against dist + known redirects (edge function).
const redirects = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../infra/cloudfront-function.js'), 'utf8').match(/var R = (\{.*?\});/)[1]);
const keepTags = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../infra/cloudfront-function.js'), 'utf8').match(/var KEEP_TAGS = (\{.*?\});/)[1]);
const resolveInternal = (href) => {
  const u = new URL(href, SITE);
  if (u.origin !== SITE) return null;
  let p = decodeURIComponent(u.pathname);
  if (/\.\w+$/.test(p)) return existsSync(DIST + p) ? 'ok' : '404';
  if (!p.endsWith('/')) return 'redirect (no trailing slash)';
  if (redirects[p]) return `redirect → ${redirects[p]}`;
  const tag = p.match(/^\/tag\/([^/]+)\//);
  if (tag && !keepTags[tag[1]]) return 'redirect → /blog/';
  return existsSync(DIST + p + 'index.html') ? 'ok' : '404';
};

for (const p of pages) {
  const noindex = /noindex/.test(p.robots);
  if (!p.lang) add('error', p.url, 'missing <html lang>');
  if (!p.title) add('error', p.url, 'missing <title>');
  else if (p.title.length > 60) add('warn', p.url, `title ${p.title.length} chars (>60, may be truncated): "${p.title}"`);
  else if (p.title.length < 30 && !noindex) add('warn', p.url, `title ${p.title.length} chars (<30, under-uses the slot): "${p.title}"`);
  if (!p.description) add('error', p.url, 'missing meta description');
  else if (p.description.length > 160) add('warn', p.url, `description ${p.description.length} chars (>160)`);
  else if (p.description.length < 70 && !noindex) add('warn', p.url, `description ${p.description.length} chars (<70): "${p.description}"`);
  if (!noindex) {
    if (!p.canonical) add('error', p.url, 'missing canonical');
    else if (p.canonical !== SITE + p.url) add('error', p.url, `canonical ${p.canonical} ≠ page URL`);
    if (!p.og.image) add('warn', p.url, 'missing og:image');
  }
  if (p.h1All.length !== 1) add('error', p.url, `${p.h1All.length} <h1> elements`);
  else if (!p.h1All[0]) add('error', p.url, 'empty <h1>');
  let prev = 1;
  for (const h of p.headings) {
    if (h.level > prev + 1) add('warn', p.url, `heading jumps h${prev} → h${h.level}: "${h.text.slice(0, 60)}"`);
    if (!h.text) add('warn', p.url, `empty <h${h.level}>`);
    prev = h.level;
  }
  const seen = new Map();
  p.headings.filter((h) => h.level <= 3).forEach((h) => seen.set(h.text.toLowerCase(), (seen.get(h.text.toLowerCase()) ?? 0) + 1));
  for (const [t, n] of seen) if (n > 1 && t) add('warn', p.url, `heading repeated ${n}×: "${t.slice(0, 60)}"`);
  // Astro renders alt="" as a bare `alt` attribute (valid: decorative image).
  const noAlt = p.imgs.filter((i) => !/\salt(=|\s|>|\/)/.test(i)).length;
  if (noAlt) add('error', p.url, `${noAlt} <img> without alt`);
  // Images inside an article body (the Pagefind-indexed prose) should describe themselves.
  const body = p.body ?? '';
  const emptyAlt = [...body.matchAll(/<img\b[^>]*>/g)].filter((m) => !/\salt="[^"]+"/.test(m[0])).length;
  if (emptyAlt) add('info', p.url, `${emptyAlt} article image(s) without alt text`);
  for (const l of new Set(p.links)) {
    if (l.startsWith('#') || l.startsWith('mailto:')) continue;
    if (/^http:\/\//.test(l)) add('warn', p.url, `insecure link ${l}`);
    const r = resolveInternal(l);
    if (r && r !== 'ok') add(r === '404' ? 'error' : 'warn', p.url, `internal link ${l} → ${r}`);
    if (/^https:\/\/doc\.uppush\.io/.test(l)) add('info', p.url, `link to legacy docs host ${l}`);
  }
  if (p.jsonld.some((j) => j['@type'] === 'INVALID')) add('error', p.url, 'invalid JSON-LD');
  if (!noindex && p.words < 300 && !/\/page\/\d+\/$/.test(p.url)) add('info', p.url, `thin content: ${p.words} words in <main>`);
}
for (const [t, urls] of dup('title')) add('error', urls.join(', '), `duplicate title "${t}"`);
for (const [d, urls] of dup('description')) add('warn', urls.join(', '), `duplicate description "${d.slice(0, 70)}…"`);

// Sitemap coverage
const sm = existsSync(DIST + '/sitemap-0.xml') ? readFileSync(DIST + '/sitemap-0.xml', 'utf8') : '';
const inSitemap = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')));
indexable.forEach((p) => !inSitemap.has(p.url) && add('warn', p.url, 'indexable page missing from sitemap'));
pages.filter((p) => /noindex/.test(p.robots) && inSitemap.has(p.url)).forEach((p) => add('error', p.url, 'noindex page listed in sitemap'));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ pages, issues }, null, 1));
} else {
  const by = (s) => issues.filter((i) => i.sev === s);
  console.log(`${pages.length} pages (${indexable.length} indexable) · ${by('error').length} errors · ${by('warn').length} warnings · ${by('info').length} info\n`);
  const group = new Map();
  issues.forEach((i) => {
    const key = `${i.sev.toUpperCase()}  ${i.msg.replace(/"[^"]*"|\d+/g, '…').replace(/ → .*/, '').slice(0, 70)}`;
    group.set(key, [...(group.get(key) ?? []), i]);
  });
  for (const [k, list] of [...group].sort()) {
    console.log(`${k}  (${list.length})`);
    list.slice(0, 6).forEach((i) => console.log(`    ${i.url}  ${i.msg}`));
    if (list.length > 6) console.log(`    … ${list.length - 6} more`);
  }
  process.exit(by('error').length ? 1 : 0);
}
