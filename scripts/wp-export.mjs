#!/usr/bin/env node
/**
 * One-way import of the WordPress blog (uppush.io) into Astro content.
 *
 *   npm run wp:export            # re-runnable until cutover; overwrites generated files
 *   WP_URL=https://staging… npm run wp:export
 *
 * Writes:
 *   src/content/blog/{slug}.md        one file per published post (frontmatter + Markdown)
 *   src/assets/uploads/posts/{slug}/  cover + inline images (optimised later by astro:assets)
 *   src/data/categories.json          WordPress categories (slug path, name, description)
 *   src/data/wp-shortlinks.json       ?p= / ?page_id= → path, used by the redirect builder
 *
 * Yoast titles that are just "<post title> - <site suffix>" are dropped so the
 * site-wide "{title} | Uppush" pattern applies; hand-written ones become `seoTitle`.
 */
import { mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import TurndownService from 'turndown';
import { isAppStoreListing, withAppStoreTracking } from '../src/lib/app-store-tracking.mjs';
import { applyImageAlts, fixDocLinks, normalizeHeadings } from './lib/content-fixes.mjs';
import { readFileSync } from 'node:fs';
import { gfm } from 'turndown-plugin-gfm';

const WP = (process.env.WP_URL ?? 'https://uppush.io').replace(/\/$/, '');
const ROOT = path.resolve(import.meta.dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const UPLOADS_DIR = path.join(ROOT, 'src/assets/uploads/posts');
const DATA_DIR = path.join(ROOT, 'src/data');
/** Alt text for images that had none in WordPress (src/data/image-alt.json). */
const IMAGE_ALTS = JSON.parse(readFileSync(path.join(path.resolve(import.meta.dirname, '..'), 'src/data/image-alt.json'), 'utf8'));

/** Placeholder / broken hrefs found in WordPress posts → working targets. */
const LINK_FIXES = {
  REPLACE_WITH_DOC_URL: 'https://docs.uppush.io/settings/verify-custom-domain-and-set-up-email-sender',
};
const YOAST_SUFFIX = / - AI Email Marketing for Shopify \| Free Plan Available$/;

const decode = (s = '') =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();

/** Same rule as slugifyTag() in src/lib/blog-posts.ts. */
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function getAll(endpoint, params = '') {
  const items = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${WP}/wp-json/wp/v2/${endpoint}?per_page=100&page=${page}${params}`);
    if (!res.ok) {
      if (res.status === 400 && page > 1) break; // past the last page
      throw new Error(`${endpoint}: HTTP ${res.status}`);
    }
    const batch = await res.json();
    items.push(...batch);
    if (page >= Number(res.headers.get('x-wp-totalpages') ?? 1)) break;
  }
  return items;
}

/**
 * Download a media file once; returns the local file name.
 * Stills are stored as WebP, max 1600px wide: astro:assets makes the final
 * responsive sizes, this only keeps multi-MB PNG originals out of the repo.
 * GIFs are kept as-is (they may be animated).
 */
async function download(url, dir) {
  const clean = url.split('?')[0];
  // Prefer the original over WordPress' "-1024x683" resized copies.
  const original = clean.replace(/-\d+x\d+(\.\w+)$/, '$1');
  const base = path.basename(original).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const isGif = base.endsWith('.gif');
  const name = isGif ? base : base.replace(/\.\w+$/, '.webp');
  const file = path.join(dir, name);
  if (existsSync(file)) return name;
  let res = await fetch(original);
  if (!res.ok && original !== clean) res = await fetch(clean);
  if (!res.ok) throw new Error(`download ${url}: HTTP ${res.status}`);
  let data = Buffer.from(await res.arrayBuffer());
  if (!isGif) {
    data = await sharp(data).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  }
  await mkdir(dir, { recursive: true });
  await writeFile(file, data);
  return name;
}

const yamlString = (s) => JSON.stringify(s); // JSON strings are valid YAML scalars

function truncate(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '') + '…';
}

async function main() {
  console.log(`Exporting from ${WP}`);
  const [posts, categories, tags, users, pages] = await Promise.all([
    getAll('posts', '&status=publish&_embed=wp:featuredmedia'),
    getAll('categories'),
    getAll('tags'),
    getAll('users').catch(() => []),
    getAll('pages', '&_fields=id,slug,link'),
  ]);
  console.log(`${posts.length} posts, ${categories.length} categories, ${tags.length} tags`);

  const catById = new Map(categories.map((c) => [c.id, c]));
  const catPath = (c) => (c.parent ? `${catPath(catById.get(c.parent))}/${c.slug}` : c.slug);
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const userById = new Map(users.map((u) => [u.id, u]));

  // Tag URLs are rebuilt from tag names; make sure they still match WordPress' slugs.
  const tagMismatches = tags.filter((t) => t.count > 0 && slugify(decode(t.name)) !== t.slug);
  for (const t of tagMismatches) console.warn(`! tag "${decode(t.name)}" → /${slugify(decode(t.name))}/ but WP uses /${t.slug}/`);

  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  turndown.use(gfm);
  turndown.remove(['script', 'style', 'iframe', 'noscript']);

  // Posts hand-edited after import carry `wpLocked: true` and are never overwritten.
  await mkdir(BLOG_DIR, { recursive: true });
  const locked = new Set(
    (await readdir(BLOG_DIR)).filter((f) => /^wpLocked: true$/m.test(readFileSync(path.join(BLOG_DIR, f), 'utf8'))),
  );
  for (const f of await readdir(BLOG_DIR)) if (!locked.has(f)) await rm(path.join(BLOG_DIR, f));

  const shortlinks = {};
  const reserved = new Set(pages.map((p) => p.slug).concat(['blog', 'category', 'tag', 'rss.xml', 'contact', '404']));

  for (const post of posts) {
    const slug = post.slug;
    if (locked.has(`${slug}.md`)) {
      console.log(`\n= ${slug}: wpLocked, kept as is`);
      shortlinks[`p=${post.id}`] = `/${slug}/`;
      continue;
    }
    if (reserved.has(slug)) throw new Error(`Post slug "${slug}" collides with a page or reserved path`);
    const dir = path.join(UPLOADS_DIR, slug);
    const rel = (name) => `../../assets/uploads/posts/${slug}/${name}`;
    const yoast = post.yoast_head_json ?? {};

    // Inline images → local files. Turndown sees the rewritten src.
    let html = post.content.rendered;
    const imgUrls = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
    for (const url of imgUrls) {
      if (!url.includes('/wp-content/uploads/')) continue;
      try {
        const name = await download(url, dir);
        html = html.split(url).join(rel(name));
      } catch (err) {
        // Already broken on the live site (e.g. images hotlinked from a dev host): drop them.
        console.warn(`\n! ${slug}: removing broken image ${url} (${err.cause?.code ?? err.message})`);
        html = html.replace(new RegExp(`<img[^>]+src="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'), '');
      }
    }
    // Known broken links in WordPress content, fixed on every import.
    for (const [from, to] of Object.entries(LINK_FIXES)) html = html.split(`href="${from}"`).join(`href="${to}"`);
    // App Store links get the site-wide st_source / st_position tracking.
    html = html.replace(/href="([^"]+)"/g, (m, href) =>
      isAppStoreListing(href.replace(/&amp;/g, '&')) ? `href="${withAppStoreTracking(href.replace(/&amp;/g, '&'), 'blog_post_body')}"` : m,
    );
    // Drop srcset/sizes (they still point at WordPress) and absolute internal links.
    html = html
      .replace(/\s(srcset|sizes)="[^"]*"/g, '')
      .replace(new RegExp(`href="${WP.replace(/[.]/g, '\\.')}(/[^"]*)"`, 'g'), 'href="$1"');

    const markdown = applyImageAlts(normalizeHeadings(fixDocLinks(turndown.turndown(html)), decode(post.title.rendered)), IMAGE_ALTS)
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Cover image
    const media = post._embedded?.['wp:featuredmedia']?.[0];
    let cover = null;
    if (media?.source_url) {
      const name = await download(media.source_url, dir);
      cover = { src: rel(name), alt: decode(media.alt_text) || decode(post.title.rendered) };
    }

    const title = decode(post.title.rendered);
    const yoastTitle = decode(yoast.title ?? '');
    const seoTitle = yoastTitle && !YOAST_SUFFIX.test(yoastTitle) && yoastTitle !== title ? yoastTitle : '';
    // Some Yoast descriptions are stray notes ("4o mini"); fall back to the excerpt.
    const usable = (s) => (decode(s).length >= 50 ? decode(s) : '');
    const description = truncate(
      usable(yoast.description) || usable(yoast.og_description) || usable(post.excerpt?.rendered) || title,
      220,
    );
    const categoryPaths = post.categories.map((id) => catById.get(id)).filter(Boolean).map(catPath);
    const tagNames = post.tags.map((id) => tagById.get(id)).filter(Boolean).map((t) => decode(t.name));
    const author = decode(userById.get(post.author)?.name ?? '') || 'Uppush team';

    const fm = [
      '---',
      `title: ${yamlString(truncate(title, 120))}`,
      `description: ${yamlString(description)}`,
      ...(seoTitle ? [`seoTitle: ${yamlString(seoTitle)}`] : []),
      `pubDate: ${post.date.slice(0, 10)}`,
      ...(post.modified.slice(0, 10) !== post.date.slice(0, 10) ? [`updatedDate: ${post.modified.slice(0, 10)}`] : []),
      `author: ${yamlString(author === 'admin' ? 'Uppush team' : author)}`,
      `categories: ${JSON.stringify(categoryPaths)}`,
      `tags: ${JSON.stringify(tagNames)}`,
      ...(cover ? ['cover:', `  src: ${yamlString(cover.src)}`, `  alt: ${yamlString(cover.alt)}`] : []),
      `wpId: ${post.id}`,
      '---',
      '',
    ].join('\n');

    await writeFile(path.join(BLOG_DIR, `${slug}.md`), `${fm}${markdown}\n`);
    shortlinks[`p=${post.id}`] = `/${slug}/`;
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  for (const page of pages) {
    shortlinks[`page_id=${page.id}`] = new URL(page.link).pathname;
  }

  const categoryData = categories
    .map((c) => ({
      path: catPath(c),
      name: decode(c.name),
      description: decode(c.description),
      count: c.count,
    }))
    .sort((a, b) => b.count - a.count);

  await writeFile(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categoryData, null, 2) + '\n');
  await writeFile(path.join(DATA_DIR, 'wp-shortlinks.json'), JSON.stringify(shortlinks, null, 2) + '\n');

  const files = await readdir(BLOG_DIR);
  console.log(`Wrote ${files.length} posts, ${categoryData.length} categories, ${Object.keys(shortlinks).length} shortlinks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
