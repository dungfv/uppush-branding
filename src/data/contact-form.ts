/**
 * Contact form delivery settings.
 *
 * - `mailto` (default until a backend is chosen): opens the visitor's email client
 *   with the message pre-filled, addressed to `site.supportEmail`. No backend needed.
 * - `endpoint` (recommended): any HTTPS endpoint that accepts a form POST — e.g. a
 *   small route in the Uppush backend that verifies Turnstile and sends the message
 *   through mail-service. It should 303-redirect to `/contact/thanks/` on success.
 * - `web3forms` / `formspree`: hosted form services; set the key / endpoint below.
 *
 * `turnstileSiteKey` adds Cloudflare Turnstile to non-mailto providers (the same
 * site key the WordPress contact form used). The receiving side must verify it.
 * Add the endpoint's origin to the CSP `form-action` in infra/cloudformation-website-hosting.yml.
 */
export type ContactProvider = 'mailto' | 'endpoint' | 'web3forms' | 'formspree';

export const contactForm: {
  provider: ContactProvider;
  endpoint: string;
  web3formsAccessKey: string;
  turnstileSiteKey: string;
} = {
  provider: 'mailto',
  endpoint: '',
  web3formsAccessKey: '',
  turnstileSiteKey: '0x4AAAAAAD3kOzAab8rMeLS9',
};

export const contactTopics = [
  { value: 'general', label: 'General question' },
  { value: 'support', label: 'Help with the app' },
  { value: 'managed-service', label: 'Done-for-you marketing service' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'billing', label: 'Pricing & billing' },
] as const;
