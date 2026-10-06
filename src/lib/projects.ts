/* Project helpers shared by /work, /work/[slug] and /_states. */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';

export const statusLabel: Record<Project['data']['status'], string> = { 'in-progress': 'In progress', shipped: 'Shipped', concept: 'Concept' };

/** Projects shown on the site, in order. Drafts never show. Stress fixtures show only in dev and quality builds. */
export async function listedProjects(): Promise<Project[]> {
  const all = await getCollection('projects', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  return all.sort((a, b) => Number(a.data.fixture) - Number(b.data.fixture) || a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
export const day = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "Jan 2025 to present", "Jan 2025 to Mar 2026", or nothing when no start date is known. */
export function timeline(p: Project['data']): string | undefined {
  if (!p.started) return undefined;
  return `${month(p.started)} to ${p.ended ? month(p.ended) : 'present'}`;
}

/** Updates, newest first. */
export const updatesNewestFirst = (p: Project['data']) => [...p.updates].sort((a, b) => b.date.getTime() - a.date.getTime());
