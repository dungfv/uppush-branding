/**
 * Site-wide settings.
 * Values live in `site.json` so non-developers can edit them in Pages CMS; they
 * are validated with zod at build time so a bad CMS edit fails with a clear message.
 * The canonical origin comes from `site` in astro.config.mjs (single source of truth).
 */
import { z } from 'astro/zod';
import siteJson from './site.json';
import { withAppStoreTracking } from '../lib/app-store-tracking.mjs';

/** Empty strings / nulls from the CMS become "not set". */
const optionalText = z.preprocess((v) => (v == null ? '' : v), z.string().trim());
const optionalUrl = optionalText.refine((v) => v === '' || /^(https?:\/\/|mailto:)/.test(v), {
  message: 'must be empty or start with https://',
});

const SiteSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  appStoreUrl: z.url(),
  /** The listing's name on the Shopify App Store (differs from the brand name). */
  appStoreName: z.string().min(1),
  /** App Store rating shown in hero/footer and used in JSON-LD. Keep in sync with the listing. */
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  /** Empty = Docs links are hidden everywhere. */
  docsUrl: optionalUrl,
  supportEmail: z.email(),
  partnerEmail: z.email(),
  companyName: z.string().min(1),
  /** Shown only while the App Store listing carries the Built for Shopify badge. */
  builtForShopify: z.preprocess((v) => v ?? false, z.boolean()),
  /** App Store launch date (listing: "Launched"). */
  launchDate: z.preprocess((v) => (v ? v : undefined), z.coerce.date().optional()),
  /** Business address as published on the App Store listing. */
  address: z
    .object({ street: z.string(), city: z.string(), postalCode: z.string(), country: z.string() })
    .optional(),
  otherApps: z.preprocess((v) => v ?? [], z.array(z.object({ name: z.string().min(1), url: z.url() }))),
  twitterHandle: optionalText,
  social: z
    .preprocess((v) => v ?? [], z.array(z.object({ label: optionalText, url: optionalUrl })))
    .default([]),
});

export type SiteSettings = z.infer<typeof SiteSchema> & { url: string };

export const site: SiteSettings = {
  ...SiteSchema.parse(siteJson),
  url: (import.meta.env.SITE ?? 'https://uppush.io').replace(/\/$/, ''),
};

/**
 * Every place on the site that links to the App Store, used as `st_position`.
 * One value per button so App Store analytics show which call-to-action drove the visit.
 * Add a new value here before using it — a typo can't silently create a new bucket.
 */
export type AppStorePosition =
  | 'header_install'
  | 'header_mobile_install'
  | 'home_hero_install'
  | 'home_hero_rating'
  | 'home_cart_recovery'
  | 'home_pricing_advantage'
  | 'home_reviews'
  | 'pricing_free_plan'
  | 'pricing_pro_trial'
  | 'web_push_hero'
  | 'why_choose_hero'
  | 'blog_post_cta'
  | 'footer_cta'
  | 'footer_link'
  | 'cart_recovery_hero'
  | 'cart_recovery_pricing'
  | 'email_marketing_hero'
  | 'email_marketing_pricing'
  | `${'klaviyo' | 'omnisend' | 'mailchimp'}_alternative_hero`
  | `${'klaviyo' | 'omnisend' | 'mailchimp'}_alternative_switch`
  | 'about_cta';

/** App Store link tagged with ?st_source=uppush_web&st_position=<position>. `path` e.g. "/reviews". */
export function appStoreUrl(position: AppStorePosition, path = ''): string {
  return withAppStoreTracking(site.appStoreUrl + path, position);
}

/** Social profiles with an actual URL (empty entries are hidden). */
export const socialLinks = site.social.filter((link) => link.url !== '');

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  description?: string;
}

/** "Product" menu: one entry per feature area, used by the header dropdown and the footer. */
export const productNav: NavItem[] = [
  { label: 'Cart recovery', href: '/abandoned-cart-recovery/', description: 'Win back abandoned browses, carts and checkouts' },
  { label: 'Email marketing', href: '/email-marketing/', description: 'Flows, campaigns and AI-written emails' },
  { label: 'Automations', href: '/#automations', description: 'Flows for every moment of the customer journey' },
  { label: 'AI campaigns', href: '/#ai', description: 'Write, design and translate campaigns in seconds' },
  { label: 'Templates', href: '/#templates', description: 'Ready-made emails for every flow and season' },
  { label: 'Campaign calendar', href: '/#calendar', description: 'Plan around Black Friday and every sales day' },
  { label: 'Web push', href: '/web-push/', description: 'Native notifications, no app install needed' },
  { label: 'Popups & sign-up', href: '/#popups', description: 'Spin-to-win, exit intent and add-to-cart popups' },
  { label: 'Deliverability', href: '/#deliverability', description: 'Own domain, warm-up and list cleaning' },
];

const docsLink: NavItem[] = site.docsUrl ? [{ label: 'Docs', href: site.docsUrl, external: true }] : [];

export const mainNav: NavItem[] = [
  { label: 'Web push', href: '/web-push/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Why Uppush', href: '/why-choose-uppush/' },
  { label: 'Partners', href: '/partners/' },
  { label: 'Blog', href: '/blog/' },
  ...docsLink,
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Product',
    items: [
      { label: 'Email marketing', href: '/email-marketing/' },
      { label: 'Cart recovery', href: '/abandoned-cart-recovery/' },
      { label: 'Automations', href: '/#automations' },
      { label: 'Web push', href: '/web-push/' },
      { label: 'Popups', href: '/#popups' },
      { label: 'Pricing', href: '/pricing/' },
      { label: 'Done-for-you service', href: '/marketing-services-by-uppush/' },
    ],
  },
  {
    title: 'Compare',
    items: [
      { label: 'Klaviyo alternative', href: '/klaviyo-alternative/' },
      { label: 'Omnisend alternative', href: '/omnisend-alternative/' },
      { label: 'Mailchimp alternative', href: '/mailchimp-alternative/' },
      { label: 'Pricing calculator', href: '/pricing/#calculator' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Blog', href: '/blog/' },
      { label: 'FAQ', href: '/faq/' },
      ...(site.docsUrl ? [{ label: 'Help center', href: site.docsUrl, external: true }] : []),
      { label: 'Why choose Uppush', href: '/why-choose-uppush/' },
      { label: 'Shopify App Store', href: appStoreUrl('footer_link'), external: true },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about/' },
      { label: 'Partners', href: '/partners/' },
      { label: 'Contact', href: '/contact/' },
      { label: 'Privacy policy', href: '/privacy-policy/' },
      { label: 'Terms and conditions', href: '/terms-and-conditions/' },
    ],
  },
];

/** Attributes for links that open in a new tab. */
export const externalLinkAttrs = { target: '_blank', rel: 'noopener' } as const;
