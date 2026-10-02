/**
 * Monthly cost estimate used by the pricing calculator (server-rendered default
 * table + the client-side island). Mirrors `uppushPricing()` in the app's
 * frontend/src/pages/pricing/ComparePricing.tsx so the website and the app
 * always show the same number for the same inputs. Change both together.
 */
import competitorJson from '../data/competitor-pricing.json';

export interface CompetitorTier {
  subscribers: number;
  price: number;
  maxEmail: number;
}

export const competitors: { id: 'klaviyo' | 'omnisend' | 'mailchimp'; name: string; tiers: CompetitorTier[] }[] = [
  { id: 'klaviyo', name: 'Klaviyo', tiers: competitorJson.klaviyo },
  { id: 'omnisend', name: 'Omnisend', tiers: competitorJson.omnisend },
  { id: 'mailchimp', name: 'Mailchimp', tiers: competitorJson.mailchimp },
];

export const subscriberTiers: number[] = competitorJson.subscriberTiers;

const BASE_FEE = 12.99;
const INCLUDED_PER_TIER = 3000;
const TIERS = [
  { limit: 100_000, rate: 1.5 },
  { limit: 500_000, rate: 1 },
  { limit: 1_000_000, rate: 0.75 },
  { limit: 1_500_000, rate: 0.55 },
  { limit: 2_000_000, rate: 0.45 },
  { limit: Infinity, rate: 0.35 },
];

/** Uppush Pro monthly cost for `subscribers` receiving `campaigns` emails a month. */
export function uppushMonthlyCost(subscribers: number, campaigns: number): number {
  const emails = subscribers * campaigns;
  let remaining = emails;
  let cost = 0;
  let prev = 0;
  for (const tier of TIERS) {
    const tierEmails = Math.min(remaining - INCLUDED_PER_TIER, tier.limit - prev - INCLUDED_PER_TIER);
    if (tierEmails <= 0) break;
    cost += (tierEmails / 1000) * tier.rate;
    remaining -= tierEmails;
    prev = tier.limit;
  }
  return Math.round((cost + BASE_FEE) * 100) / 100;
}

export function competitorPrice(id: (typeof competitors)[number]['id'], subscribers: number): CompetitorTier | undefined {
  return competitors.find((c) => c.id === id)?.tiers.find((tier) => tier.subscribers === subscribers);
}

/**
 * Largest saving vs a competitor across every list size the app compares — the single
 * source for "up to X% less" claims, so every page shows the same number.
 */
export function bestSaving(id: (typeof competitors)[number]['id'], campaigns: number): { pct: number; size: number } {
  let top = { pct: 0, size: 0 };
  for (const size of subscriberTiers) {
    const tier = competitorPrice(id, size);
    if (!tier) continue;
    const pct = savings(tier.price, uppushMonthlyCost(size, campaigns));
    if (pct > top.pct) top = { pct, size };
  }
  return top;
}

/** Percentage saved vs a competitor price (0 when Uppush isn't cheaper). */
export function savings(competitor: number, uppush: number): number {
  return competitor > uppush ? Math.round(((competitor - uppush) / competitor) * 100) : 0;
}
