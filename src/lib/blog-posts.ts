/**
 * Blog helpers: published-post query, categories, tags, reading time, related posts, URLs.
 *
 * URL scheme is inherited from WordPress and must not change (SEO):
 *   post      /{slug}/
 *   listing   /blog/, /blog/page/2/
 *   category  /category/{parent}/{child}/
 *   tag       /tag/{slug}/
 * Category and tag archives with fewer than MIN_ARCHIVE_POSTS posts are not
 * built; their old URLs 301 elsewhere (docs/url-inventory.csv).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import categoriesJson from '../data/categories.json';

export type BlogPost = CollectionEntry<'blog'>;

export const POSTS_PER_PAGE = 10;
export const MIN_ARCHIVE_POSTS = 3;

/** All posts, newest first. Drafts are visible in `astro dev` but never in production builds. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => (import.meta.env.PROD ? !data.draft : true));
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postUrl = (post: BlogPost | string) => `/${typeof post === 'string' ? post : post.id}/`;

export function slugifyTag(tag: string): string {
  const slug = tag
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents left by NFKD
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error(`Tag "${tag}" has no URL-safe characters; use a Latin-script tag name.`);
  return slug;
}

export const tagUrl = (tag: string) => `/tag/${slugifyTag(tag)}/`;
export const categoryUrl = (path: string) => `/category/${path}/`;

export interface Category {
  path: string;
  name: string;
  description: string;
}

const categoryByPath = new Map<string, Category>(categoriesJson.map((c) => [c.path, c]));

export function getCategory(path: string): Category {
  const category = categoryByPath.get(path);
  if (!category) throw new Error(`Unknown category "${path}" — add it to src/data/categories.json`);
  return category;
}

/** Categories that have an archive page (enough posts), with counts, most used first. */
export function getArchiveCategories(posts: BlogPost[]): (Category & { count: number })[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const path of post.data.categories) counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_ARCHIVE_POSTS)
    .map(([path, count]) => ({ ...getCategory(path), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Unique tags with post counts, most used first. */
export function getAllTags(posts: BlogPost[]): { name: string; slug: string; count: number }[] {
  const tags = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of posts) {
    for (const name of post.data.tags) {
      const slug = slugifyTag(name);
      const entry = tags.get(slug) ?? { name, slug, count: 0 };
      entry.count += 1;
      tags.set(slug, entry);
    }
  }
  return [...tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export const getArchiveTags = (posts: BlogPost[]) => getAllTags(posts).filter((t) => t.count >= MIN_ARCHIVE_POSTS);

/** Estimated reading time in minutes (≈220 words per minute). */
export function readingTime(markdown = ''): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Posts sharing the most categories/tags with `post`, then the most recent. */
export function getRelatedPosts(post: BlogPost, posts: BlogPost[], limit = 3): BlogPost[] {
  const keys = new Set([...post.data.tags.map(slugifyTag), ...post.data.categories.map((c) => `c:${c}`)]);
  return posts
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => ({
      candidate,
      score: [...candidate.data.tags.map(slugifyTag), ...candidate.data.categories.map((c) => `c:${c}`)].filter((k) =>
        keys.has(k),
      ).length,
    }))
    .sort((a, b) => b.score - a.score || b.candidate.data.pubDate.valueOf() - a.candidate.data.pubDate.valueOf())
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
export const formatDate = (date: Date) => dateFormatter.format(date);

export interface PostPage {
  posts: BlogPost[];
  currentPage: number;
  lastPage: number;
  /** First-page URL of this listing, e.g. "/blog/" or "/category/guides/". */
  baseUrl: string;
}

/** WordPress-style page URLs: page 1 = baseUrl, page N = `${baseUrl}page/N/`. */
export const listingPageUrl = (baseUrl: string, n: number) => (n === 1 ? baseUrl : `${baseUrl}page/${n}/`);

/**
 * Split posts into WordPress-style pages for a `[...path]` route. `prefix` is the
 * route param for page 1 (undefined for the route root); later pages append `page/N`.
 */
export function paginateWp(posts: BlogPost[], baseUrl: string, prefix?: string): { param: string | undefined; page: PostPage }[] {
  const lastPage = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  return Array.from({ length: lastPage }, (_, i) => {
    const n = i + 1;
    const suffix = n === 1 ? undefined : `page/${n}`;
    const param = [prefix, suffix].filter(Boolean).join('/') || undefined;
    return {
      param,
      page: { posts: posts.slice(i * POSTS_PER_PAGE, n * POSTS_PER_PAGE), currentPage: n, lastPage, baseUrl },
    };
  });
}
