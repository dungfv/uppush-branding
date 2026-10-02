/**
 * /llms.txt — a plain-Markdown summary of Uppush for AI assistants (llmstxt.org).
 * Replaces the Yoast-generated file, which listed theme demo pages. Built from the
 * same data as the site, so features, pricing and posts never drift.
 */
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { automations, upcomingAutomations } from '../data/features';
import { formatNumber, formatPrice, pricing, proPlan } from '../data/pricing';
import { getPublishedPosts, postUrl } from '../lib/blog-posts';
import { isThin } from '../lib/seo.mjs';

export async function GET(context: APIContext) {
  const base = (context.site ?? new URL(site.url)).toString().replace(/\/$/, '');
  const abs = (path: string) => base + path;
  const posts = (await getPublishedPosts()).filter((p) => !isThin(p.body));
  const free = pricing.plans.find((p) => p.priceMonthly === 0);
  const firstTier = pricing.usageTiers[0];

  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `${site.name} is a Shopify app (listed as “${site.appStoreName}”, rated ${site.rating}/5 from ${site.reviewCount} reviews) for email marketing and web push notifications, with AI tools for writing, designing and translating campaigns.`,
    '',
    '## Key facts',
    `- Channels: email and web push, in the same automations and campaigns.`,
    `- Automations (${automations.length}): ${automations.map((a) => `${a.name} (${a.plan})`).join(', ')}.`,
    `- On the roadmap, not yet available: ${upcomingAutomations.map((a) => a.name).join(', ')}.`,
    `- AI: subject line, copy and template generation; automatic translation with per-subscriber language detection.`,
    `- Pricing: Free plan${free ? ` with ${formatNumber(free.includedEmails)} emails and ${formatNumber(free.includedWebPush)} web push a month` : ''}; Pro ${formatPrice(proPlan.priceMonthly)}/month with ${formatNumber(proPlan.includedEmails)} emails and ${formatNumber(proPlan.includedWebPush)} web push included${firstTier ? `, then ${formatPrice(firstTier.email)} per 1,000 emails and ${formatPrice(firstTier.webPush)} per 1,000 web push` : ''}. Unlimited subscribers on every plan; ${pricing.trialDays}-day Pro trial.`,
    `- Install: ${site.appStoreUrl}`,
    `- Support: ${site.supportEmail}${site.docsUrl ? ` · Help center: ${site.docsUrl}` : ''}`,
    '',
    '## Pages',
    `- [Home](${abs('/')}): product overview`,
    `- [Pricing](${abs('/pricing/')}): plans, pay-as-you-send rates and cost comparison`,
    `- [Web push](${abs('/web-push/')}): web push notifications for Shopify`,
    `- [Email marketing](${abs('/email-marketing/')}): email flows, campaigns and AI for Shopify`,
    `- [Abandoned cart recovery](${abs('/abandoned-cart-recovery/')}): browse, cart and checkout recovery by email and web push`,
    `- [Klaviyo alternative](${abs('/klaviyo-alternative/')}), [Omnisend alternative](${abs('/omnisend-alternative/')}), [Mailchimp alternative](${abs('/mailchimp-alternative/')}): pricing-model comparisons`,
    `- [Why choose Uppush](${abs('/why-choose-uppush/')})`,
    `- [Done-for-you marketing service](${abs('/marketing-services-by-uppush/')})`,
    `- [FAQ](${abs('/faq/')})`,
    `- [Partners](${abs('/partners/')})`,
    `- [About](${abs('/about/')})`,
    `- [Contact](${abs('/contact/')})`,
    '',
    '## Blog',
    ...posts.map((p) => `- [${p.data.title}](${abs(postUrl(p))}): ${p.data.description}`),
    '',
    '## Optional',
    `- [Privacy policy](${abs('/privacy-policy/')})`,
    `- [Sitemap](${abs('/sitemap-index.xml')})`,
    `- [RSS](${abs('/rss.xml')})`,
    '',
  ];

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
