/* Blog helpers shared by /blog, tag pages, post pages, the RSS feed and /_states. */
import { getCollection, type CollectionEntry } from 'astro:content';
import guide from '../snapshots/guide.json';

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
  return merged(all.flatMap(p => p.data.tags)).map(t => t.tag);
}

/* Tags that differ only in capitals or punctuation ("Design systems", "Design Systems") share one page address, so they
   are one topic: counted together and shown in the spelling most posts use (A to Z on a tie). */
function merged(tags: string[]): { tag: string; n: number }[] {
  const bySlug = new Map<string, Map<string, number>>();
  for (const t of tags) { const m = bySlug.get(tagSlug(t)) ?? new Map(); m.set(t, (m.get(t) ?? 0) + 1); bySlug.set(tagSlug(t), m); }
  return [...bySlug.values()].map(m => { const spellings = [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); return { tag: spellings[0][0], n: spellings.reduce((s, [, n]) => s + n, 0) }; })
    .sort((a, b) => a.tag.localeCompare(b.tag));
}
/** A post's topics in the spelling the blog's topic list uses, each topic once. */
export async function topicsOf(p: Post): Promise<string[]> {
  const all = await getCollection('posts', ({ data }) => showFixtures || !data.fixture);
  const canon = new Map(merged(all.flatMap(x => x.data.tags)).map(t => [tagSlug(t.tag), t.tag]));
  return [...new Map(p.data.tags.map(t => [tagSlug(t), canon.get(tagSlug(t)) ?? t])).values()];
}
/** True when a post carries the topic, in any of its spellings. */
export const hasTag = (p: Post, tag: string) => p.data.tags.some(t => tagSlug(t) === tagSlug(tag));

/** Tags that have at least one listed post: the tag links shown on the blog. */
/** The topics of the published posts with how many posts carry each, A to Z: the chips on the blog and their counts. */
export async function usedTags(): Promise<{ tag: string; n: number }[]> {
  /* A post that carries two spellings of one topic counts once. */
  return merged((await listedPosts()).filter(p => !p.data.fixture).flatMap(p => [...new Map(p.data.tags.map(t => [tagSlug(t), t])).values()]));
}

export const tagSlug = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const postUrl = (p: Post) => `/blog/${p.id}`;
export const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** The bodies of the posts still served from a legacy snapshot, so their reading time is counted like any other. */
const LEGACY_BODIES: Record<string, string> = { 'component-spec-files': guide.main };
/** 200 words a minute, never less than one minute. */
export function readingTime(p: Post): string | undefined {
  const html = p.data.legacyPage ? LEGACY_BODIES[p.id] : p.body;
  if (!html) return undefined;
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** Up to three other posts that share the most tags with this one. */
export function related(post: Post, all: Post[]): Post[] {
  return all.filter(p => p.id !== post.id)
    .map(p => ({ p, shared: p.data.tags.filter(t => post.data.tags.includes(t)).length }))
    .filter(x => x.shared > 0).sort((a, b) => b.shared - a.shared || when(b.p) - when(a.p) || a.p.id.localeCompare(b.p.id)).slice(0, 3).map(x => x.p);
}
