/* The AI tools directory (/ai-tools): what is listed, in what order, and the words the page uses. Drafts never show;
   stress fixtures show only in dev and quality builds. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { AI_TOOL_CATEGORIES, RESOURCE_COSTS, type AiToolCategory } from './content-schemas';

export type AiTool = CollectionEntry<'aiTools'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';
export const aiCategoryLabel = AI_TOOL_CATEGORIES, aiCostLabel = RESOURCE_COSTS;

/* One line under each category, so a visitor knows what the group is for. */
export const aiCategoryBlurb: Record<AiToolCategory, string> = {
  assistants: 'General assistants for writing, research and thinking a problem through.',
  'ui-generation': 'From a prompt or a sketch to screens and working prototypes.',
  code: 'Taking a design to a working front end.',
  images: 'Images, illustration and vectors from a description.',
  'video-and-motion': 'Clips, motion studies and 3D models.',
  'audio-and-voice': 'Voice-overs, dictation and music.',
  research: 'Interviews, transcripts and synthesis.',
  testing: 'Usability tests, surveys and predicted attention.',
  'diagrams-and-slides': 'Flows, whiteboards, diagrams and decks.',
  'colour-and-type': 'Palettes and font pairings.',
  patterns: 'Patterns and guidance for designing AI products.',
  accessibility: 'Checks and fixes for inclusive design.',
};

/** Tools shown on the site: my picks first within the order, then A to Z; fixtures last. */
export async function listedAiTools(): Promise<AiTool[]> {
  const all = await getCollection('aiTools', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  return all.sort((a, b) => Number(a.data.fixture) - Number(b.data.fixture) || a.data.title.localeCompare(b.data.title) || a.id.localeCompare(b.id));
}

/** Every category with how many real tools it holds, in the order the categories are defined. */
export function aiCategoryCounts(tools: AiTool[]): { slug: AiToolCategory; label: string; blurb: string; count: number }[] {
  const real = tools.filter(t => !t.data.fixture);
  return (Object.keys(AI_TOOL_CATEGORIES) as AiToolCategory[]).map(slug => ({ slug, label: AI_TOOL_CATEGORIES[slug], blurb: aiCategoryBlurb[slug], count: real.filter(t => t.data.category === slug).length }));
}
