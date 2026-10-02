// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { isThin } from './src/lib/seo.mjs';

// Canonical origin. Used for canonical URLs, sitemap, RSS and Open Graph.
const SITE_URL = 'https://uppush.io';

// Blog posts: last-modified dates for the sitemap, and thin (noindex) posts to leave out.
const BLOG_DIR = './src/content/blog';
const posts = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const [, fm = '', body = ''] = readFileSync(`${BLOG_DIR}/${f}`, 'utf8').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
    const date = (fm.match(/^updatedDate: (\S+)/m) ?? fm.match(/^pubDate: (\S+)/m) ?? [])[1];
    return { path: `/${f.replace(/\.md$/, '')}/`, lastmod: date, thin: isThin(body) };
  });
const lastmodByPath = new Map(posts.map((p) => [p.path, p.lastmod]));
// noindex pages never belong in the sitemap.
const NOINDEX = new Set(['/404/', '/contact/thanks/', '/terms-and-conditions/', ...posts.filter((p) => p.thin).map((p) => p.path)]);

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Pages build to `pricing/index.html`; the CloudFront function serves them at `/pricing/`
  // (and 301s `/pricing` there), so every URL ends with a slash — same as WordPress did.
  trailingSlash: 'always',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    mdx(),
    sitemap({
      // Tag archives are noindex,follow (they duplicate categories); see src/pages/tag/.
      filter: (page) => !NOINDEX.has(new URL(page).pathname) && !new URL(page).pathname.startsWith('/tag/'),
      serialize: (item) => {
        const lastmod = lastmodByPath.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod: new Date(lastmod).toISOString() } : item;
      },
      i18n: { defaultLocale: 'en', locales: { en: 'en' } },
    }),
  ],

  // Self-hosted variable fonts (latin subset). Astro generates @font-face rules,
  // metric-matched fallbacks (less layout shift) and preload links.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-geist',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/geist-variable-latin.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/geist-mono-variable-latin.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
