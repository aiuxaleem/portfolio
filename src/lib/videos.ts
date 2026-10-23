/* Videos shown on the site, newest first. Drafts never show; fixtures show only in dev and quality builds. */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Video = CollectionEntry<'videos'>;

/** "PT4M30S" (the ISO form the structured data needs) shown as "4:30"; anything else is shown as it is. */
export function formatDuration(iso?: string): string | undefined {
  const m = iso?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return iso;
  const h = Number(m[1] || 0), min = Number(m[2] || 0), s = Number(m[3] || 0), two = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${two(min)}:${two(s)}` : `${min}:${two(s)}`;
}
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';

export async function listedVideos(): Promise<Video[]> {
  const all = await getCollection('videos', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  const when = (v: Video) => (v.data.published ? v.data.published.getTime() : -Infinity);
  return all.sort((a, b) => Number(a.data.fixture) - Number(b.data.fixture) || when(b) - when(a) || a.id.localeCompare(b.id));
}
