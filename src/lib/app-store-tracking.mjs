// @ts-check
/**
 * Tracking for links to the Shopify App Store listing:
 *   ?st_source=uppush_web&st_position=<where on the site the visitor clicked>
 * Shared by the site code (appStoreUrl() in src/data/site.ts) and the build scripts
 * (wp-export tags links in imported posts; check-app-store-links fails the build on
 * any untagged link in dist/). Plain JS so Node scripts can import it.
 */

export const ST_SOURCE = 'uppush_web';
const LISTING = /^https:\/\/apps\.shopify\.com\/pushup-notification-marketing(\/|$|\?|#)/;

/**
 * Adds st_source / st_position to an App Store URL. Any other query parameters
 * (old utm_*, surface_*) are dropped so every click is attributed the same way.
 * @param {string} href
 * @param {string} position
 */
export function withAppStoreTracking(href, position) {
  const url = new URL(href);
  url.search = '';
  url.searchParams.set('st_source', ST_SOURCE);
  url.searchParams.set('st_position', position);
  return url.toString();
}

/** @param {string} href */
export const isAppStoreListing = (href) => LISTING.test(href);
