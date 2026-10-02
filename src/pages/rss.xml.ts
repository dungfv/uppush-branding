import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { getPublishedPosts, postUrl } from '../lib/blog-posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${site.name} blog`,
    description: 'Guides on Shopify email marketing, abandoned cart recovery and web push notifications.',
    site: context.site ?? site.url,
    trailingSlash: true,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(post),
      categories: post.data.tags,
      author: `${site.supportEmail} (${post.data.author})`,
    })),
    customData: '<language>en</language>',
  });
}
