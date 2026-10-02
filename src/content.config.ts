/**
 * Content collections. Schemas are mirrored in `.pages.yml` (Pages CMS) —
 * keep both in sync when adding fields.
 *
 * CMS editors may save empty optional fields as '' or null; those are
 * normalised to "not set" so a harmless edit never breaks the build.
 */
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const emptyToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);
const list = <T extends z.ZodType>(item: T) => z.preprocess((value) => value ?? [], z.array(item));

const blog = defineCollection({
  // Top-level files only: post ids become root URL slugs (/{slug}/), like on WordPress.
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(120),
      description: z.string().min(1).max(220),
      /** Optional <title> override; defaults to "{title} | Uppush". */
      seoTitle: z.preprocess(emptyToUndefined, z.string().max(70).optional()),
      pubDate: z.coerce.date(),
      updatedDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
      author: z.preprocess(emptyToUndefined, z.string().default('Uppush team')),
      /** Category paths from src/data/categories.json, e.g. "email-marketing/email-automation". */
      categories: list(z.string().min(1)),
      tags: list(z.string().min(1)),
      // Cover images live in src/assets/uploads so astro:assets can optimise them.
      cover: z.preprocess(
        (value) => (value && typeof value === 'object' && (value as { src?: unknown }).src ? value : undefined),
        z.object({ src: image(), alt: z.string().min(1, 'cover.alt is required when a cover is set') }).optional(),
      ),
      draft: z.preprocess((value) => value ?? false, z.boolean()),
      /** Hand-edited after import: `npm run wp:export` leaves this file alone. */
      wpLocked: z.preprocess((value) => value ?? false, z.boolean()),
      /** WordPress post id, kept so /?p=<id> shortlinks keep redirecting. */
      wpId: z.preprocess(emptyToUndefined, z.number().int().optional()),
    }),
});

/** Recommended partner apps (/partners/), editable in Pages CMS. */
const partners = defineCollection({
  loader: file('src/data/partners.json', {
    parser: (text) =>
      (JSON.parse(text).apps as { name: string }[]).map((app, index) => ({
        id: app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        order: index,
        ...app,
      })),
  }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      name: z.string().min(1),
      category: z.string().min(1),
      description: z.string().min(1).max(160),
      reviews: z.preprocess(emptyToUndefined, z.string().optional()),
      logo: image(),
      url: z.url(),
    }),
});

export const collections = { blog, partners };
