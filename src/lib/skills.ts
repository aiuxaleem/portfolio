/* Claude skills (/skills, L-61): what is listed, in what order, and the words the page uses. Drafts never show; stress
   fixtures show only in dev and quality builds. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { SKILL_CATEGORIES, type SkillCategory } from './content-schemas';

export type Skill = CollectionEntry<'skills'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';
export const skillCategoryLabel = SKILL_CATEGORIES;

/* One line under each category, so a visitor knows what the group is for. */
export const skillCategoryBlurb: Record<SkillCategory, string> = {
  'design-to-code': 'From a design or a brief to a working, on-brand front end.',
  'design-systems': 'Tokens, components and the rules that keep generated screens on the system.',
  'brand-and-visuals': 'Posters, decks, themes and brand-true visuals.',
  motion: 'Animation that feels designed, not default.',
  'review-and-research': 'Critique, audits and research synthesis with the reasoning shown.',
  'content-and-docs': 'Posts, documents and slides in a house style.',
  'making-skills': 'Writing and testing skills of your own.',
};

const byOrder = (a: Skill, b: Skill) => Number(a.data.fixture) - Number(b.data.fixture) || a.data.order - b.data.order || a.data.title.localeCompare(b.data.title) || a.id.localeCompare(b.id);

/** Every listed skill: mine and others', fixtures last. */
export async function listedSkills(): Promise<Skill[]> {
  return (await getCollection('skills', ({ data }) => !data.draft && (showFixtures || !data.fixture))).sort(byOrder);
}

/** Every category with how many real skills from others it holds, in the order the categories are defined. */
export function skillCategoryCounts(skills: Skill[]): { slug: SkillCategory; label: string; blurb: string; count: number }[] {
  const real = skills.filter(s => !s.data.fixture && !s.data.mine);
  return (Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map(slug => ({ slug, label: SKILL_CATEGORIES[slug], blurb: skillCategoryBlurb[slug], count: real.filter(s => s.data.category === slug).length }));
}

export const hostOf = (url?: string) => { try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };
