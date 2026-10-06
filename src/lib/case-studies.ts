/* Case study helpers shared by /case-studies, /case-studies/[slug] and /_states. */
import { getCollection, type CollectionEntry } from 'astro:content';

export type CaseStudy = CollectionEntry<'caseStudies'>;
const showFixtures = import.meta.env.DEV || process.env.QUALITY_BUILD === '1';

/** Case studies shown on the site, in order. Drafts never show; fixtures show only in dev and quality builds. */
export async function listedCaseStudies(): Promise<CaseStudy[]> {
  const all = await getCollection('caseStudies', ({ data }) => !data.draft && (showFixtures || !data.fixture));
  return all.sort((a, b) => Number(a.data.fixture) - Number(b.data.fixture) || a.data.order - b.data.order || a.id.localeCompare(b.id));
}

const has = (v: unknown): boolean => (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.values(v).some(has) : !!v);

/** The sections that have content, in page order. Drives both the page and its table of contents. */
export function sections(d: CaseStudy['data'], hasBody: boolean) {
  const verified = d.outcomes.metrics.filter(m => m.verified);
  return [
    { id: 'summary', label: 'In short', show: d.tldr.length > 0 },
    { id: 'context', label: 'Problem and context', show: has(d.context) },
    { id: 'research', label: 'Research and insights', show: has(d.research) },
    { id: 'process', label: 'Process', show: has(d.process) },
    { id: 'ai', label: 'Designing the AI', show: has(d.ai) },
    { id: 'decisions', label: 'Key decisions', show: d.decisions.length > 0 },
    { id: 'outcomes', label: 'Outcomes', show: !!d.outcomes.summary || verified.length > 0 || !!d.quote },
    { id: 'reflection', label: 'Reflection', show: has(d.reflection) },
    { id: 'notes', label: 'Notes', show: hasBody },
  ].filter(s => s.show);
}

/** Reading time from every piece of text on the page, at 200 words a minute, never less than one minute. */
export function readingTime(d: CaseStudy['data'], body = ''): string {
  const words: string[] = [];
  const walk = (v: unknown) => { if (typeof v === 'string') words.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object' && !(v instanceof Date)) Object.entries(v).forEach(([k, x]) => { if (k !== 'src' && k !== 'seo') walk(x); }); };
  walk(d); words.push(body);
  const count = words.join(' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(count / 200))} min read`;
}
