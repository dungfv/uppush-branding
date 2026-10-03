/**
 * Contact form delivery settings.
 *
 * - `endpoint` (current): POST to `/api/contact` — a Lambda behind the same CloudFront
 *   distribution (infra/cloudformation-website-hosting.yml) that verifies Cloudflare
 *   Turnstile, stores the submission in DynamoDB and emails it via SNS. See docs/contact-form.md.
 * - `mailto`: opens the visitor's email client with the message pre-filled. No backend.
 * - `web3forms` / `formspree`: hosted form services; set the key / endpoint below.
 *
 * `turnstileSiteKey` adds Cloudflare Turnstile to non-mailto providers; the receiving side
 * must verify it with the matching secret. In `astro dev` Cloudflare's always-pass test key
 * is used so the widget works on localhost (there is no /api locally, so sending fails there).
 */
export type ContactProvider = 'mailto' | 'endpoint' | 'web3forms' | 'formspree';

const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export const contactForm: {
  provider: ContactProvider;
  endpoint: string;
  web3formsAccessKey: string;
  turnstileSiteKey: string;
} = {
  provider: 'endpoint',
  endpoint: '/api/contact',
  web3formsAccessKey: '',
  turnstileSiteKey: import.meta.env.DEV ? TURNSTILE_TEST_SITE_KEY : '0x4AAAAAAD3kOzAab8rMeLS9',
};

/** Messages for `?error=` (no-JS fallback) and JSON `{ error }` responses from /api/contact. */
export const contactErrors: Record<string, string> = {
  captcha: 'We couldn’t verify you’re human. Please complete the check and try again.',
  invalid: 'Please fill in your name, a valid email address and a message.',
  too_large: 'Your message is too long. Please shorten it and try again.',
  default: 'Something went wrong while sending your message. Please try again or email us directly.',
};

export const contactTopics = [
  { value: 'general', label: 'General question' },
  { value: 'support', label: 'Help with the app' },
  { value: 'managed-service', label: 'Done-for-you marketing service' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'billing', label: 'Pricing & billing' },
] as const;
