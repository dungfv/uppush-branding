// @ts-check
/**
 * Markdown clean-ups applied to every imported blog post (wp-export) and, once, to
 * the existing files (npm run content:fix). Pure functions on the Markdown body.
 *
 * - Legacy help-center links (doc.uppush.io/uppush/…) → docs.uppush.io, with the
 *   pages that moved mapped explicitly (all targets checked to return 200).
 * - Heading outline for SEO/accessibility: the post title is the page's only <h1>,
 *   so body headings start at h2 and never skip a level; a leading heading that just
 *   repeats the title and empty headings are removed.
 */

/**
 * Paths that changed between the old and the new help center.
 * @type {Record<string, string>}
 */
const DOC_MOVES = {
  '/getting-started/syncing-uppush-with-shopify-automating-subscriber-sync-and-data-flow': '/getting-started/syncing-uppush-with-shopify',
  '/how-to-set-up-discount-codes-in-opt-in-popups-and-automated-emails': '/popup-and-automation/how-to-set-up-discount-codes-in-opt-in-popups-and-automated-emails',
  '/pop-up-and-push-automation/push-automation/abandon-checkout-recovery': '/popup-and-automation/how-to-enable-automations/abandon-checkout-recovery',
  '/pop-up-and-push-automation/push-automation/welcome-notifications': '/popup-and-automation/how-to-enable-automations/welcome-notifications',
  '/settings/verify-domain': '/settings/verify-domain/',
};

/** @param {string} md */
export function fixDocLinks(md) {
  return md.replace(/https:\/\/doc\.uppush\.io\/uppush(\/[^)\s"#]*)(#[^)\s"]*)?/g, (_, path, hash = '') => {
    const target = DOC_MOVES[path] ?? path;
    return `https://docs.uppush.io${target}${DOC_MOVES[path] ? '' : hash}`;
  });
}

/**
 * Fills empty Markdown image alts from src/data/image-alt.json (keyed by
 * "posts/<slug>/<file>"), so descriptions survive a re-import from WordPress.
 * @param {string} md
 * @param {Record<string, string>} alts
 */
export function applyImageAlts(md, alts) {
  return md.replace(/!\[\]\((\.\.\/\.\.\/assets\/uploads\/(posts\/[^)]+))\)/g, (all, src, key) =>
    alts[key] ? `![${alts[key].replace(/[[\]]/g, '')}](${src})` : all,
  );
}

/**
 * @param {string} md Markdown body (no frontmatter)
 * @param {string} title post title (the page <h1>)
 */
export function normalizeHeadings(md, title) {
  const norm = (/** @type {string} */ s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const lines = md.split('\n');
  let inFence = false;
  /** @type {{ i: number, level: number, text: string }[]} */
  const heads = [];
  lines.forEach((line, i) => {
    if (/^```/.test(line)) inFence = !inFence;
    const m = !inFence && line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (m) heads.push({ i, level: m[1].length, text: m[2] });
  });
  const drop = new Set();
  heads.forEach((h, k) => {
    const plain = h.text.replace(/[*_`]/g, '').trim();
    if (!plain) drop.add(h.i);
    else if (k === 0 && norm(plain) === norm(title)) drop.add(h.i);
  });
  const kept = heads.filter((h) => !drop.has(h.i));
  const shift = kept.length ? 2 - Math.min(...kept.map((h) => h.level)) : 0;
  let prev = 1;
  for (const h of kept) {
    const level = Math.min(Math.max(h.level + shift, 2), prev + 1, 6);
    lines[h.i] = `${'#'.repeat(level)} ${h.text}`;
    prev = level;
  }
  return lines
    .filter((_, i) => !drop.has(i))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}
