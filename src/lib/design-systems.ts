/* Design systems (L-68): the owner's own on /my-design-systems, the public ones on /design-systems. What is listed, in what
   order, and the words the pages use. Drafts never show; stress fixtures show only in dev and quality builds. */
import { getCollection, type CollectionEntry } from 'astro:content';
import { DS_STRENGTHS, DS_KINDS, DS_PLATFORMS, type DsStrength } from './content-schemas';

export type DesignSystem = CollectionEntry<'designSystems'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';
export const strengthLabel = DS_STRENGTHS;
export const kindLabel = DS_KINDS;
export const platformLabel = DS_PLATFORMS;

const byOrder = (a: DesignSystem, b: DesignSystem) => Number(a.data.fixture) - Number(b.data.fixture) || a.data.order - b.data.order || a.data.title.localeCompare(b.data.title) || a.id.localeCompare(b.id);

/** Every listed design system, mine and others', fixtures last. */
export async function listedDesignSystems(): Promise<DesignSystem[]> {
  return (await getCollection('designSystems', ({ data }) => !data.draft && (showFixtures || !data.fixture))).sort(byOrder);
}

/** Six layers a design system is made of, from the ground up (six, so the grid has no card alone in a row), each with the public systems that show it best. The order and
    the words are the page's; which system teaches a layer comes from each entry's strengths. */
export const LAYERS: { strength: DsStrength; title: string; body: string; study: string[] }[] = [
  { strength: 'tokens', title: 'Tokens', body: 'Colour, type, space, radius and motion as named values, so a decision is made once and every platform reads it.', study: ['primer', 'spectrum-2', 'uswds'] },
  { strength: 'components', title: 'Components', body: 'The parts people build with, each with its states, its props and the rules for when to use it.', study: ['carbon-design-system', 'atlassian-design-system', 'material-design-3'] },
  { strength: 'patterns', title: 'Patterns', body: 'How components combine to solve a recurring task: a form, a table with filters, an empty state.', study: ['gov-uk-design-system', 'uswds', 'ant-design'] },
  { strength: 'accessibility', title: 'Accessibility', body: 'Contrast, focus, keyboard and screen-reader behaviour built into every part, not checked at the end.', study: ['gov-uk-design-system', 'primer', 'react-aria'] },
  { strength: 'content-and-voice', title: 'Content and voice', body: 'The words: tone, naming, error messages and labels, written once so every screen sounds like one product.', study: ['nhs-design-system', 'atlassian-design-system', 'pajamas-design-system'] },
  { strength: 'ai-patterns', title: 'AI patterns', body: 'How a product shows what an AI did, why, and how sure it is, and hands control back to the person.', study: ['carbon-design-system', 'pajamas-design-system', 'salesforce-lightning-design-system'] },
];

/** The systems a layer names to study, in its order, kept only while each still lists that strength (so an edit in the admin
    can never leave a layer pointing at a system that no longer claims it); then any others that list it, to fill three. */
export const teaching = (systems: DesignSystem[], layer: (typeof LAYERS)[number]) => {
  const strong = systems.filter(s => s.data.strengths.includes(layer.strength));
  const named = layer.study.map(id => strong.find(s => s.id === id)).filter(Boolean) as DesignSystem[];
  return [...named, ...strong.filter(s => !named.includes(s))].slice(0, 3);
};

/** What a system publishes for AI agents to read, by kind: an MCP server, an llms.txt, agent skills or an AGENTS.md. */
export const agentLinks = (s: DesignSystem) => ({
  mcp: s.data.ai.find(a => /mcp/i.test(a.label)),
  llms: s.data.ai.find(a => /llms/i.test(a.label)),
  skills: s.data.ai.find(a => /skill|agents.md/i.test(a.label)),
});

export const hostOf = (url?: string) => { try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };

/** The day every fact on Resources > Design Systems was last read on the makers' own pages. */
export const CHECKED = '2026-11-13';
export const checkedOn = (locale = 'en-GB') => new Date(CHECKED).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

/** Further reading about design systems: standards, galleries and books, each checked at its address on CHECKED. */
export const READING: { name: string; url: string; summary: string }[] = [
  { name: 'Design Tokens Format Module 2025.10', url: 'https://www.designtokens.org/tr/2025.10/format/', summary: 'The W3C community group\'s first stable file format for design tokens, released on 28 October 2025.' },
  { name: 'Atomic Design', url: 'https://atomicdesign.bradfrost.com/table-of-contents/', summary: 'Brad Frost\'s book on creating and maintaining design systems, free to read online chapter by chapter.' },
  { name: 'The Component Gallery', url: 'https://component.gallery/', summary: 'Interface components drawn from real design systems, side by side, as a reference for building your own.' },
  { name: 'Design Systems Surf', url: 'https://designsystems.surf/', summary: 'A searchable directory of real design systems, their components, foundations and tools.' },
  { name: 'Design Systems Repo', url: 'https://designsystemsrepo.com/', summary: 'An organised collection of design system examples, tools, articles, books and talks.' },
  { name: 'Design Systems Report 2026', url: 'https://zeroheight.com/resource/design-systems-report-2026/', summary: 'zeroheight\'s annual survey of design system teams: maturity, adoption, staffing and impact.' },
];
