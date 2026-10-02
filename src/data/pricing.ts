/**
 * Pricing data.
 * Values live in `pricing.json` (editable in Pages CMS) and are validated with
 * zod at build time, so a bad edit fails the build with a readable error instead
 * of shipping broken JSON-LD. Billing itself runs through Shopify; the source of
 * truth is the app (uppush/app: modules/plan/plan.service.ts and
 * frontend/src/pages/pricing/{Pricing,PriceTier}.tsx).
 */
import { z } from 'astro/zod';
import pricingJson from './pricing.json';

const text = z.preprocess((v) => (v == null ? '' : v), z.string());
const list = <T extends z.ZodType>(item: T) => z.preprocess((v) => v ?? [], z.array(item));

const PlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tagline: text,
  /** Monthly (every 30 days) price in `currency`. 0 = free. */
  priceMonthly: z.number().min(0),
  priceNote: text,
  includedEmails: z.number().int().min(0),
  includedWebPush: z.number().int().min(0),
  highlight: z.preprocess((v) => v ?? false, z.boolean()),
  ctaLabel: z.string().min(1),
  features: list(z.string()),
});

const PricingSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'use a 3-letter ISO code such as USD'),
    trialDays: z.number().int().min(0),
    headline: z.string().min(1),
    lead: text,
    plans: z.array(PlanSchema).min(1, 'add at least one plan'),
    /** Pay-as-you-send rates per 1,000 messages, by monthly volume. */
    usageTiers: list(z.object({ range: z.string().min(1), email: z.number().min(0), webPush: z.number().min(0) })),
    comparison: list(
      z.object({
        group: z.string().min(1),
        rows: list(z.object({ feature: z.string().min(1), values: list(z.string()) })),
      }),
    ),
    faq: list(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
  })
  .superRefine((data, ctx) => {
    // Every comparison row needs one value per plan, otherwise cells silently read "not included".
    for (const group of data.comparison) {
      for (const row of group.rows) {
        if (row.values.length !== data.plans.length) {
          ctx.addIssue({
            code: 'custom',
            message: `comparison row "${row.feature}" has ${row.values.length} values for ${data.plans.length} plans`,
          });
        }
      }
    }
  });

export type PricingData = z.infer<typeof PricingSchema>;
export type PricingPlan = PricingData['plans'][number];

export const pricing: PricingData = PricingSchema.parse(pricingJson);

export const proPlan = pricing.plans.find((plan) => plan.priceMonthly > 0) ?? pricing.plans[0];

/** Format a price with Intl so separators and symbols follow the currency. */
export function formatPrice(amount: number, currency = pricing.currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);
