/* Blog helpers shared by /blog, tag pages, post pages, the RSS feed and /_states. */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';
/* Six posts a page. Quality builds use two, so the fixtures are enough to build and check /blog/page/2. */
export const PAGE_SIZE = process.env.QUALITY_BUILD === '1' ? 2 : 6;

const when = (p: Post) => (p.data.published || p.data.updated || new Date(0)).getTime();

/** Posts shown on the site, newest first. Drafts never show; fixtures show only in dev and quality builds. */
export async function listedPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  return all.sort((a, b) => Number(a.data.fixture) - Number(b.data.fixture) || when(b) - when(a) || a.id.localeCompare(b.id));
}

/** Every tag used by any post, drafts included, so a tag page exists (with an empty state) even when its posts are drafts. */
export async function allTags(): Promise<string[]> {
  const all = await getCollection('posts', ({ data }) => showFixtures || !data.fixture);
  return [...new Set(all.flatMap(p => p.data.tags))].sort((a, b) => a.localeCompare(b));
}

/** Tags that have at least one listed post: the tag links shown on the blog. */
export async function usedTags(): Promise<string[]> {
  return [...new Set((await listedPosts()).filter(p => !p.data.fixture).flatMap(p => p.data.tags))].sort((a, b) => a.localeCompare(b));
}

export const tagSlug = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const postUrl = (p: Post) => `/blog/${p.id}`;
export const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** 200 words a minute, never less than one minute. Legacy pages have no body here, so no figure is shown for them. */
export function readingTime(p: Post): string | undefined {
  if (p.data.legacyPage) return undefined;
  const words = (p.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** Up to three other posts that share the most tags with this one. */
export function related(post: Post, all: Post[]): Post[] {
  return all.filter(p => p.id !== post.id)
    .map(p => ({ p, shared: p.data.tags.filter(t => post.data.tags.includes(t)).length }))
    .filter(x => x.shared > 0).sort((a, b) => b.shared - a.shared || when(b.p) - when(a.p) || a.p.id.localeCompare(b.p.id)).slice(0, 3).map(x => x.p);
}
