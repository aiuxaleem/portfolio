/* Videos shown on the site, newest first. Drafts never show; fixtures show only in dev and quality builds. */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Video = CollectionEntry<'videos'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';

export async function listedVideos(): Promise<Video[]> {
  const all = await getCollection('videos', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  const when = (v: Video) => (v.data.published ? v.data.published.getTime() : -Infinity);
  return all.sort((a, b) => Number(a.data.fixture) - Number(b.data.fixture) || when(b) - when(a) || a.id.localeCompare(b.id));
}
