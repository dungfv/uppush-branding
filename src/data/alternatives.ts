/**
 * "<Competitor> alternative" landing pages (/klaviyo-alternative/ …).
 *
 * Only state what can be checked publicly: each tool's pricing basis and that it
 * offers SMS (Uppush doesn't, yet). Prices come from the app's comparison table
 * (src/data/competitor-pricing.json ← ComparePricing.tsx) and are shown with that
 * caveat. Re-check `reviewed` facts against each vendor's pricing page periodically.
 */
import type { competitors } from '../lib/pricing-estimate';

type CompetitorId = (typeof competitors)[number]['id'];

export interface Alternative {
  id: CompetitorId;
  name: string;
  slug: string;
  company: string;
  /** What the competitor's email pricing scales with. */
  pricingBasis: string;
  /** Honest "when they may suit you better" points. */
  betterFit: string[];
  /** Blog posts to link (slugs that exist in src/content/blog). */
  related: string[];
  /** Date the competitor facts on this page were last reviewed. */
  reviewed: string;
}

export const alternatives: Alternative[] = [
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    slug: 'klaviyo-alternative',
    company: 'Klaviyo, Inc.',
    pricingBasis: 'the number of active profiles in your account',
    betterFit: [
      'You need SMS today alongside email.',
      'You have a dedicated marketing team that relies on advanced predictive analytics and data tooling.',
    ],
    related: ['top-10-klaviyo-alternatives-for-shopify-and-ecommerce', 'klaviyo-vs-omnisend-which-is-better-for-shopify', '7-shopify-marketing-automations-every-store-should-set-up'],
    reviewed: '2026-10-02',
  },
  {
    id: 'omnisend',
    name: 'Omnisend',
    slug: 'omnisend-alternative',
    company: 'Omnisend',
    pricingBasis: 'the number of contacts in your account',
    betterFit: ['You need SMS today alongside email.', 'You want to manage several channels beyond email and web push in one tool.'],
    related: ['klaviyo-vs-omnisend-which-is-better-for-shopify', 'top-10-klaviyo-alternatives-for-shopify-and-ecommerce', 'email-vs-push-notifications-which-should-you-use'],
    reviewed: '2026-10-02',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    slug: 'mailchimp-alternative',
    company: 'Intuit Mailchimp',
    pricingBasis: 'the number of contacts in your audience',
    betterFit: ['You sell outside Shopify or need a general-purpose newsletter tool for many platforms.', 'You need SMS today alongside email.'],
    related: ['shopify-email-marketing-a-complete-guide-for-beginners', 'top-10-klaviyo-alternatives-for-shopify-and-ecommerce', 'how-to-create-a-shopify-email-marketing-strategy-from-scratch'],
    reviewed: '2026-10-02',
  },
];
