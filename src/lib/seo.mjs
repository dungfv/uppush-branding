// @ts-check
/**
 * SEO helpers shared by pages and astro.config.mjs (plain JS for the config).
 *
 * Titles: Google shows ~60 characters. The " | Uppush" suffix is only added when it
 * fits; longer titles get a hand-written override in src/data/seo-overrides.json.
 * Descriptions: shown up to ~155–160 characters; longer ones are cut at a sentence
 * or word boundary for the meta tag (the full text still shows on cards).
 * Thin posts: a post body under THIN_WORDS words (WordPress image-only posts) is
 * noindex and left out of the sitemap until it is rewritten.
 */

export const SITE_SUFFIX = ' | Uppush';
export const MAX_TITLE = 60;
export const MAX_DESCRIPTION = 160;
export const THIN_WORDS = 150;

/** @param {string} title */
export function withSuffix(title) {
  return title.length + SITE_SUFFIX.length <= MAX_TITLE ? title + SITE_SUFFIX : title;
}

/** @param {string} text */
export function clampDescription(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= MAX_DESCRIPTION) return t;
  const cut = t.slice(0, MAX_DESCRIPTION - 1);
  const sentence = cut.lastIndexOf('. ');
  if (sentence > 90) return cut.slice(0, sentence + 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:–—-]$/, '') + '…';
}

/** Words of real prose in a Markdown body (images, link targets and markup removed). @param {string | undefined} md */
export function proseWords(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** @param {string | undefined} md */
export const isThin = (md) => proseWords(md) < THIN_WORDS;
