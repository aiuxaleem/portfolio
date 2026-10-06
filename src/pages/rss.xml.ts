/* RSS feed for the blog, from the posts collection. Drafts and fixtures are never in the feed.
   A post with no publication date (the migrated guide only says "Updated") gets no pubDate. */
import type { APIRoute } from 'astro';
import { listedPosts, postUrl } from '../lib/posts';
import { rss } from '../lib/rss';

export const GET: APIRoute = async ({ site }) => {
  const base = String(site).replace(/\/$/, '');
  const posts = (await listedPosts()).filter(p => !p.data.fixture);
  return rss({
    title: 'AIUXAleem blog: Mohammad Abdul Aleem', description: 'Guides and articles on design systems and AI product design.', site: `${base}/blog`, self: `${base}/rss.xml`,
    items: posts.map(p => ({ title: p.data.title, link: base + postUrl(p), description: p.data.excerpt, date: p.data.published, category: p.data.category })),
  });
};
