/* What the Read page and the home page list: blog posts, LinkedIn articles and LinkedIn posts, newest first.
   Drafts never show; fixtures show only in dev and quality builds. Items with no date come last. */
import { getCollection } from 'astro:content';
import { listedPosts, postUrl } from './posts';
import { linkedinUrn } from './content-schemas';

const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';
const keep = ({ data }: { data: { draft: boolean; fixture: boolean } }) => !data.draft && (showFixtures || !data.fixture);

export const feedTypes = { blog: 'Blog post', article: 'LinkedIn article', linkedin: 'LinkedIn post' } as const;
export type FeedType = keyof typeof feedTypes;
export interface FeedItem { id: string; type: FeedType; title: string; excerpt?: string; date?: Date; dateLabel?: string; href: string; external: boolean; tags: string[]; fixture: boolean }

export async function feedItems(): Promise<FeedItem[]> {
  const posts: FeedItem[] = (await listedPosts()).map(p => ({
    id: `blog-${p.id}`, type: 'blog', title: p.data.title, excerpt: p.data.excerpt, date: p.data.published || p.data.updated,
    dateLabel: p.data.published ? undefined : 'Updated', href: postUrl(p), external: false, tags: p.data.tags, fixture: p.data.fixture,
  }));
  const articles: FeedItem[] = (await getCollection('linkedinArticles', keep)).map(a => ({
    id: `article-${a.id}`, type: 'article', title: a.data.title, excerpt: a.data.excerpt, date: a.data.published, href: a.data.url, external: true, tags: a.data.tags, fixture: a.data.fixture,
  }));
  /* A LinkedIn post's series is offered as a topic too, so a whole series can be filtered. */
  const linkedin: FeedItem[] = (await getCollection('linkedinPosts', keep)).map(p => ({
    id: `linkedin-${p.id}`, type: 'linkedin', title: p.data.title, excerpt: p.data.excerpt, date: p.data.published, href: p.data.url, external: true,
    tags: [...new Set([...p.data.tags, ...(p.data.series ? [p.data.series] : [])])], fixture: p.data.fixture,
  }));
  const when = (i: FeedItem) => (i.date ? i.date.getTime() : -Infinity);
  return [...posts, ...articles, ...linkedin].sort((a, b) => Number(a.fixture) - Number(b.fixture) || when(b) - when(a) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export interface LinkedinEntry { id: string; title: string; excerpt?: string; url: string; date: Date; series?: string; /** Set when the post may be loaded on the page. */ urn?: string; fixture: boolean }

/** LinkedIn posts for the Read page, newest first, fixtures last. */
export async function linkedinEntries(): Promise<LinkedinEntry[]> {
  return (await getCollection('linkedinPosts', keep)).map(p => ({ id: p.id, title: p.data.title, excerpt: p.data.excerpt, url: p.data.url, date: p.data.published, series: p.data.series, urn: (p.data.embed && linkedinUrn(p.data.url)) || undefined, fixture: p.data.fixture }))
    .sort((a, b) => Number(a.fixture) - Number(b.fixture) || b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title));
}

/** Topics offered as filters: those of real items only, so fixture tags never reach the filter bar. */
export const feedTags = (items: FeedItem[]) => [...new Set(items.filter(i => !i.fixture).flatMap(i => i.tags))].sort((a, b) => a.localeCompare(b));
