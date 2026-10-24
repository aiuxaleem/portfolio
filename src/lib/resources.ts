/* The UX resources directory (/resources): what is listed, in what order, and the words the page uses for each value.
   Drafts never show; stress fixtures show only in dev and quality builds. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { RESOURCE_CATEGORIES, RESOURCE_COSTS, RESOURCE_TYPES, type ResourceCategory } from './content-schemas';

export type Resource = CollectionEntry<'resources'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';

export const categoryLabel = RESOURCE_CATEGORIES, typeLabel = RESOURCE_TYPES, costLabel = RESOURCE_COSTS;

/* One line under each category heading, so a visitor knows what to expect before opening it. */
export const categoryBlurb: Record<ResourceCategory, string> = {
  'ai-design-patterns': 'Guidance and pattern libraries for designing products that use AI.',
  'prompting-and-evaluation': 'How to write, test and judge prompts and model behaviour.',
  'design-systems': 'Published systems to learn from, and tools for running one.',
  'design-tokens': 'Token formats, naming and the tools that turn them into code.',
  accessibility: 'Standards, checkers and writing on inclusive design.',
  'research-and-testing': 'Methods, platforms and reading for understanding people.',
  prototyping: 'Design and prototyping tools.',
  typography: 'Fonts, type scales and font tooling.',
  colour: 'Palettes, contrast and colour tooling.',
  'icons-and-illustration': 'Icon sets and illustration libraries.',
  motion: 'Animation tools and libraries.',
  'handoff-and-documentation': 'Documenting and handing over design work.',
  learning: 'Courses, books and references for the craft.',
  inspiration: 'Real product interfaces and portfolios to study.',
  utilities: 'Small tools that save an hour.',
  communities: 'Places to ask, mentor and compare notes.',
};

/** Resources shown on the site: newest first, then by title, with the id as the final tie-break so the order is stable
    between builds. Fixtures come last. */
export async function listedResources(): Promise<Resource[]> {
  const all = await getCollection('resources', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  return all.sort((a, b) => Number(a.data.fixture) - Number(b.data.fixture) || b.data.added.getTime() - a.data.added.getTime() || a.data.title.localeCompare(b.data.title) || a.id.localeCompare(b.id));
}

/** Every category with how many real (non-fixture) resources it holds, in the order the categories are defined. */
export function categoryCounts(resources: Resource[]): { slug: ResourceCategory; label: string; blurb: string; count: number }[] {
  const real = resources.filter(r => !r.data.fixture);
  return (Object.keys(RESOURCE_CATEGORIES) as ResourceCategory[]).map(slug => ({ slug, label: RESOURCE_CATEGORIES[slug], blurb: categoryBlurb[slug], count: real.filter(r => r.data.category === slug).length }));
}

/** My own work (AI workflows, Claude skills, artifacts), newest first: the section that leads the page. */
export const madeByMe = (resources: Resource[]) => resources.filter(r => r.data.mine);

/** The site a resource lives on, as a visitor would say it: "figma.com". */
export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

