/**
 * Product facts used across the marketing pages.
 * Source of truth is the Uppush app (uppush/app): automation types, triggers and
 * default delays come from src/modules/automation/data.ts; plan features from
 * frontend/src/pages/pricing/Pricing.tsx. Update both sides together.
 */
import type { IconName } from '../components/ui/Icon.astro';

export type Channel = 'email' | 'push';
export type Plan = 'Free' | 'Pro';

export interface Automation {
  id: string;
  name: string;
  /** Trigger, phrased for merchants. */
  trigger: string;
  /** Default step delays in the app, in send order. */
  steps: string[];
  /** When the flow stops by itself. */
  stops?: string;
  plan: Plan;
  icon: IconName;
  pitch: string;
}

export const automations: Automation[] = [
  {
    id: 'abandoned-cart',
    name: 'Abandoned cart',
    trigger: 'A shopper adds to cart but doesn’t check out',
    steps: ['20 min', '2 h', '1 day'],
    stops: 'Stops as soon as they start checkout',
    plan: 'Free',
    icon: 'cart',
    pitch: 'Bring shoppers back to the cart they left, with the exact products and an optional discount.',
  },
  {
    id: 'abandoned-checkout',
    name: 'Abandoned checkout',
    trigger: 'A checkout is idle for more than 10 minutes',
    steps: ['20 min', '2 h', '1 day'],
    stops: 'Stops when the customer pays',
    plan: 'Pro',
    icon: 'credit-card',
    pitch: 'Recover high-intent buyers who already entered their details. Also runs from Shopify Flow.',
  },
  {
    id: 'browse-abandonment',
    name: 'Browse abandonment',
    trigger: 'A subscriber views a product without adding it to cart',
    steps: ['20 min', '2 h', '1 day'],
    plan: 'Pro',
    icon: 'eye',
    pitch: 'Follow up on products people looked at, before they forget about them.',
  },
  {
    id: 'welcome',
    name: 'Welcome series',
    trigger: 'A visitor subscribes through your popup',
    steps: ['Now', '2 h', '1 day'],
    plan: 'Free',
    icon: 'hand',
    pitch: 'Deliver the popup discount and make a strong first impression, automatically.',
  },
  {
    id: 'back-in-stock',
    name: 'Back in stock',
    trigger: 'A product they wanted is available again',
    steps: ['Now', '2 h', '1 day'],
    plan: 'Free',
    icon: 'package',
    pitch: 'Turn “sold out” into a waiting list that converts the moment inventory returns.',
  },
  {
    id: 'price-drop',
    name: 'Price drop',
    trigger: 'The price of a product they viewed goes down',
    steps: ['Now', '2 h', '1 day'],
    plan: 'Free',
    icon: 'trending-down',
    pitch: 'Let price-sensitive shoppers know the moment it’s a better deal.',
  },
  {
    id: 'product-release',
    name: 'Product release',
    trigger: 'You publish a product with a chosen tag',
    steps: ['Now'],
    plan: 'Pro',
    icon: 'sparkles',
    pitch: 'Announce launches and drops to every subscriber without building a campaign.',
  },
  {
    id: 'shipping',
    name: 'Shipping updates',
    trigger: 'An order is fulfilled',
    steps: ['Now'],
    plan: 'Pro',
    icon: 'truck',
    pitch: 'Branded shipping notifications that bring customers back to your store, not a carrier page.',
  },
  {
    id: 'winback',
    name: 'Customer winback',
    trigger: 'A customer hasn’t ordered again after their purchase',
    steps: ['30 days', '45 days'],
    plan: 'Pro',
    icon: 'refresh',
    pitch: 'Re-engage past buyers on autopilot and turn one-time customers into regulars.',
  },
];

export interface Feature {
  icon: IconName;
  title: string;
  body: string;
}

/** Popup / list-growth capabilities (app: modules/popup, product-subscriber, captcha). */
export const popupFeatures: Feature[] = [
  { icon: 'gift', title: 'Spin-to-win wheel', body: '4–6 rewards with odds you control. The prize is applied to the welcome flow automatically.' },
  { icon: 'mouse', title: 'Smart triggers', body: 'Show on exit intent, after scrolling, after a delay or when someone clicks Add to cart.' },
  { icon: 'globe', title: 'Targeting', body: 'Choose pages, countries and how often a popup can appear for visitors who haven’t subscribed.' },
  { icon: 'mail', title: 'Email, SMS & web push', body: 'Collect email and phone numbers, or ask for web push permission with a custom pre-prompt.' },
  { icon: 'shield', title: 'Bot protection', body: 'Cloudflare Turnstile keeps fake sign-ups out of your list and your sender reputation intact.' },
  { icon: 'tag', title: 'Unique discount codes', body: 'Auto-generate a single-use code per subscriber, or reuse one of your Shopify discounts.' },
];

/** Campaign capabilities (app: email-campaign, campaign, segment, shopify-segment, email-template). */
export const campaignFeatures: Feature[] = [
  { icon: 'layout', title: 'Drag-and-drop editor', body: 'Pre-designed templates with product, discount and footer blocks. Save your own as templates.' },
  { icon: 'split', title: 'A/B testing', body: 'Test subject, sender or content on 2–90% of your list. The winner by opens, clicks or revenue goes to the rest.' },
  { icon: 'users', title: 'Real-time segments', body: 'Build segments from Uppush behaviour data, or send straight to a segment you made in Shopify.' },
  { icon: 'calendar', title: 'Schedule & send caps', body: 'Schedule campaigns and cap the volume per segment — handy for warming up a new domain.' },
];

/** AI tools (app: modules/ai, translation, "Generate email content/subject/template"; Pro plan). */
export const aiFeatures: Feature[] = [
  { icon: 'wand', title: 'Write subject lines & copy', body: 'Generate subject lines and email content from a short brief, then edit like any other email.' },
  { icon: 'layout', title: 'Generate templates', body: 'Describe the campaign and get a ready-to-edit template in the drag-and-drop editor.' },
  { icon: 'languages', title: 'Auto translation', body: 'Translate subjects and content in one click; each subscriber gets the version in their own language.' },
];

/** Deliverability (app: email-verification, warmup, email-validation, blocked-domain, black-list-text). */
export const deliverabilityFeatures: Feature[] = [
  { icon: 'badge-check', title: 'Your own sender domain', body: 'Verify your domain with DNS records so emails come from your brand, not a shared address.' },
  { icon: 'flame', title: 'Guided domain warm-up', body: 'Start small and ramp up volume over weeks to build trust with Gmail, Outlook and Yahoo.' },
  { icon: 'filter', title: 'List cleaning', body: 'Invalid and bounced addresses are detected and unsubscribed or removed before they hurt your reputation.' },
  { icon: 'server', title: 'Dedicated IP', body: 'Pro stores send from a dedicated IP, so other senders never affect your inbox placement.' },
];

/** Shopify-native integrations (repo: extensions/*). */
export const shopifyIntegrations: Feature[] = [
  { icon: 'store', title: 'Theme app extension', body: 'Popups, web push and cart tracking turn on from the theme editor. No code to paste.' },
  { icon: 'activity', title: 'Web pixel', body: 'Shopify’s customer events power browse, cart and checkout flows reliably.' },
  { icon: 'workflow', title: 'Shopify Flow action', body: 'Trigger the abandoned-checkout email series from your own Shopify Flow workflows.' },
  { icon: 'ticket', title: 'Discounts that apply themselves', body: 'Discount links in emails apply the code for the shopper. Create Uppush codes right from Shopify’s discount page.' },
];

/** Headline numbers. Only facts that can be verified in the app or on the App Store listing. */
export const proofPoints = [
  { value: '9', label: 'automations ready on install' },
  { value: '100+', label: 'languages for translated emails' },
  { value: '$0', label: 'per subscriber — unlimited contacts' },
];

/**
 * Flows on the roadmap (Klaviyo-style library). NOT in the app yet — always shown
 * with a "Coming soon" label. Move an entry into `automations` when it ships.
 */
export interface UpcomingAutomation {
  name: string;
  trigger: string;
  icon: IconName;
}

export const upcomingAutomations: UpcomingAutomation[] = [
  { name: 'Post-purchase thank you', trigger: 'After a customer’s first order', icon: 'heart' },
  { name: 'Review request', trigger: 'Days after an order is delivered', icon: 'star' },
  { name: 'Cross-sell & upsell', trigger: 'Recommend products that pair with a purchase', icon: 'layers' },
  { name: 'Replenishment reminder', trigger: 'When a consumable is about to run out', icon: 'refresh' },
  { name: 'Birthday & anniversary', trigger: 'On a customer’s special date', icon: 'gift' },
  { name: 'VIP milestone', trigger: 'When spend or order count passes a threshold', icon: 'trophy' },
  { name: 'Sunset unengaged', trigger: 'Subscribers who stopped opening and clicking', icon: 'inbox' },
  { name: 'Low inventory alert', trigger: 'A viewed product is almost sold out', icon: 'package' },
];
