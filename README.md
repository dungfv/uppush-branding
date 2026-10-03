# uppush.io — Uppush marketing website

Marketing site for **Uppush**, the email marketing & web push app for Shopify. Replaces the WordPress/Elementor site at the same URLs. Static, fast, SEO-first; every product claim is sourced from the app (`uppush-workspace/uppush`).

| | |
|---|---|
| Framework | Astro 7 (static output), TypeScript |
| Styling | Tailwind CSS 4 + `@tailwindcss/typography`, CSS-variable design tokens (light/dark) |
| Fonts | Geist + Geist Mono, self-hosted (latin subset) |
| Content | Content Collections: blog (Markdown), partners (JSON) |
| CMS | [Pages CMS](https://app.pagescms.org) via `.pages.yml` |
| Search | Pagefind (indexed at build time) |
| Hosting | AWS S3 (private) + CloudFront, deployed by GitHub Actions (OIDC) |
| Edge | CloudFront Function: www → apex, WordPress 301/410 rules, trailing slash |
| Client JS | None by default. Inline: menus, contact form, lazy Crisp + GA; pricing calculator island (~2 KB) |

Migration plan and URL decisions: [`docs/migration-plan.md`](docs/migration-plan.md), [`docs/url-inventory.csv`](docs/url-inventory.csv).

## Quick start

Requires Node.js **22.12+** (see `.nvmrc`).

```bash
npm install
npm run dev              # http://localhost:4321 (search disabled in dev)
npm run check            # astro check — must report 0 errors / 0 warnings
npm run build            # astro build + pagefind → dist/
npm run preview          # serve dist/ (no edge rules; see check:redirects)
npm run check:redirects  # every row of docs/url-inventory.csv against the edge function + dist/
```

## Scripts

| Command | What it does |
|---|---|
| `npm run wp:export` | Re-imports all WordPress posts → `src/content/blog/*.md`, images → `src/assets/uploads/posts/` (WebP, ≤1600px), categories and `?p=` shortlinks. Overwrites; run until cutover, then never again. |
| `npm run redirects` | Regenerates the CloudFront function from `docs/url-inventory.csv` into `infra/cloudfront-function.js` and the CloudFormation template. CI fails if it is out of date. |
| `npm run check:redirects` | Local: runs the function + checks `dist/`. Live: `BASE_URL=https://… npm run check:redirects`. |
| `npm run icons` | Regenerates `src/components/ui/icons.ts` from Lucide (add names in `scripts/build-icons.mjs`). |
| `node scripts/build-brand-images.mjs` | Renders favicon.ico, apple-touch-icon, logo-512 and og-default.jpg from `public/favicon.svg`. |

## URLs (must match WordPress)

| URL | Route |
|---|---|
| `/{post-slug}/` | `src/pages/[slug].astro` — posts live at the root, as on WordPress. Build fails if a slug collides with a page. |
| `/blog/`, `/blog/page/N/` | `src/pages/blog/[...page].astro` |
| `/category/{path}/`, `…/page/N/` | `src/pages/category/[...path].astro` — only categories with ≥ 3 posts |
| `/tag/{slug}/`, `…/page/N/` | `src/pages/tag/[...path].astro` — only tags with ≥ 3 posts |
| Everything else in the inventory | 301/410 at the edge (`infra/cloudfront-function.js`) |

Thin archives (< 3 posts) are not built; their old URLs 301. If you change `MIN_ARCHIVE_POSTS` or add a category, update `docs/url-inventory.csv` and run `npm run redirects`.

## Editing content

| What | Where | CMS |
|---|---|---|
| Name, App Store URL + rating, emails, docs URL, socials | `src/data/site.json` | Site settings |
| Plans, included quotas, pay-as-you-send rates, comparison, billing FAQ | `src/data/pricing.json` | Pricing |
| Partner apps | `src/data/partners.json` + logos in `src/assets/partners/` | Partners |
| Blog posts | `src/content/blog/*.md` | Blog |
| Automations, popup/campaign/AI/deliverability features | `src/data/features.ts` | — |
| FAQ | `src/data/faq.ts` | — |
| Reviews (verbatim from the App Store only) | `src/data/testimonials.ts` | — |
| Competitor prices for the calculator | `src/data/competitor-pricing.json` (copied from the app) | — |
| Roadmap flows ("Coming soon") | `upcomingAutomations` in `src/data/features.ts` — move to `automations` when shipped | — |
| Template carousel | `src/data/email-templates.ts`; drop `<id>.png/jpg/webp` into `src/assets/templates/` to replace a mockup | — |
| Competitor landing pages (`/klaviyo-alternative/` …) | `src/data/alternatives.ts` — only pricing basis and SMS are claimed about competitors; re-check `reviewed` dates | — |
| Company facts on /about/ (launch date, address, Built for Shopify, other apps) | `src/data/site.json` — keep in sync with the App Store listing | Site settings |
| Revenue growth chart | `src/data/growth-stats.json` — fill from `scripts/revenue-stats.mongo.js`, then set `"verified": true` (hidden in production until then) | — |

**Keep the site and the app in sync.** Pricing (`plan.service.ts`, `Pricing.tsx`, `PriceTier.tsx`), the estimate (`ComparePricing.tsx` ↔ `src/lib/pricing-estimate.ts`) and automation triggers/delays (`modules/automation/data.ts` ↔ `src/data/features.ts`) are duplicated on purpose; change both sides together. Only state features the app actually has.

**App Store links** must use `appStoreUrl('<position>')` (positions are a typed list in `src/data/site.ts`), which produces `?st_source=uppush_web&st_position=<position>`. Links typed into blog posts are tagged `blog_post_body` (by `wp:export`, or add the parameters by hand in the CMS). `npm run check:links` (also in CI) fails the build on any untagged App Store link and prints clicks-per-position coverage. GA records `click_app_store` with the same `st_position`.

## SEO

`npm run seo:audit` (after a build; also in CI) checks every page in `dist/`: title 30–60 chars and unique, description ≤ 160 and unique, self canonical, one `<h1>`, no skipped heading levels, alt text, internal links that 404 or redirect, JSON-LD and sitemap coverage. Errors fail the build; warnings are advice.

- Titles: `"{title} | Uppush"` only when it fits 60 chars. Long post titles get a hand-written SEO title in `src/data/seo-overrides.json` (the `<h1>` keeps the full title).
- Descriptions are clamped to 160 chars at a sentence/word boundary (`src/lib/seo.mjs`).
- Posts with < 150 words of text (WordPress image-only posts) are `noindex` and out of the sitemap until rewritten. Tag archives are `noindex, follow` (they duplicate categories).
- Category/tag titles and descriptions: `src/data/taxonomy-seo.json`. Article image alt text: `src/data/image-alt.json`.
- `npm run content:fix` re-applies heading normalisation, help-center link updates and image alts to all posts; a post edited by hand after import gets `wpLocked: true` so `wp:export` leaves it alone.

## Cookie consent (EU)

`src/components/consent/`: `ConsentScript.astro` (in `<head>`, exposes `window.uppushConsent`) and `CookieConsent.astro` (fixed bottom banner + settings dialog, reopened by "Cookie settings" in the footer). Google Analytics (`analytics`) and Crisp (`functional`) only load after consent; withdrawing clears their cookies and reloads. Adding a new tracker: gate it with `uppushConsent.on('<category>', …)`, list its cookies in the dialog table and bump `CONSENT_VERSION` so everyone is asked again.

## Contact form

Configured in `src/data/contact-form.ts`. The form posts to `/api/contact`: a Lambda behind the same CloudFront distribution verifies Cloudflare Turnstile, stores the submission in DynamoDB (with an explicit, unticked-by-default marketing opt-in) and emails it via SNS. Setup, export (`npm run contacts:export`) and troubleshooting: [docs/contact-form.md](docs/contact-form.md). `mailto`, Web3Forms and Formspree remain available as fallbacks.

## Deploy

`.github/workflows/build-and-deploy.yml`: every push/PR runs check, build, redirect generation diff and the redirect check; pushes to `main` deploy to S3 + CloudFront. Infra: `infra/cloudformation-website-hosting.yml` (S3, CloudFront + OAC, edge function, security headers, GitHub OIDC role). The ACM certificate for `uppush.io` + `www.uppush.io` must exist in us-east-1.

**Step-by-step guide (Vietnamese): [`docs/deploy.md`](docs/deploy.md)** — GitHub, ACM, one-command CloudFormation stack (`GitHubOwner`/`GitHubRepo` parameters), GitHub variables, testing on the CloudFront domain, then DNS cutover to Route 53 (DNSSEC must be disabled first) and rollback.
