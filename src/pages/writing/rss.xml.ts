/* RSS feed for everything on /writing: blog posts, LinkedIn articles and LinkedIn posts, newest first.
   LinkedIn items link to LinkedIn. Fixtures are never in the feed. */
import type { APIRoute } from 'astro';
import { feedItems, feedTypes } from '../../lib/writing';
import { rss } from '../../lib/rss';

export const GET: APIRoute = async ({ site }) => {
  const base = String(site).replace(/\/$/, '');
  const items = (await feedItems()).filter(i => !i.fixture);
  return rss({
    title: 'AIUXAleem writing: Mohammad Abdul Aleem', description: 'Blog posts, LinkedIn articles and LinkedIn posts on AI product design and design systems.', site: `${base}/writing`, self: `${base}/writing/rss.xml`,
    items: items.map(i => ({ title: i.title, link: i.external ? i.href : base + i.href, description: i.excerpt, date: i.dateLabel ? undefined : i.date, category: feedTypes[i.type] })),
  });
};
