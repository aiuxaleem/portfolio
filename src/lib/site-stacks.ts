/* The cards for the stacks on the audience websites' first screens (components/sites/hero-stack.astro, docs/SITES.md).
   Every card is built from published content: case studies, projects, the profile, the AI tools, the UX Glossary. */
import type { ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';
import { listedCaseStudies, type CaseStudy } from './case-studies';
import { listedProjects, statusLabel } from './projects';
import { listedAiTools, aiCategoryCounts, aiCostLabel } from './ai-tools';
import { listedResources, categoryCounts } from './resources';
import { profile, period, careerByCompany } from '../content/profile';
import { site } from '../content/site';

export interface StackCard {
  kicker: string;
  /** A short fact at the end of the kicker line: a period, a count. */
  meta?: string;
  title: string;
  line?: string;
  href: string;
  cta: string;
  newTab?: boolean;
  image?: ImageMetadata;
  /** Which part of the picture shows when it is cropped (CSS object-position). Default: its top left. */
  focus?: string;
  /** A picture from public/ (the portrait), with its size. */
  picture?: { src: string; width: number; height: number };
  points?: string[];
}

const year = (ym: string) => ym.slice(0, 4);

/** The career at a glance: every company with its years, newest first, and the year it began. */
function career() {
  const groups = careerByCompany();
  const span = (rs: { start: string; end: string }[]) => { const starts = rs.map(r => r.start).filter(Boolean).sort(); const ends = rs.map(r => r.end); return starts[0] ? `${year(starts[0])} to ${ends.some(e => !e) ? 'now' : year(ends.filter(Boolean).sort().at(-1)!)}` : ''; };
  const first = groups.flatMap(g => g.roles.map(r => r.start)).filter(Boolean).sort()[0] ?? '';
  return { groups, span, first: year(first) };
}

/** The whole career on one card: how many companies since when, the newest role, every company with its years. */
function careerCard(href: string, cta: string): StackCard {
  const { groups, span, first } = career();
  const now = groups[0].roles[0];
  return { kicker: 'Career', meta: first ? `${first} to now` : undefined, title: `${groups.length} companies since ${first}`, line: `Now ${now.role} at ${groups[0].company}, after ${groups.slice(1).map(g => g.company).join(', ')}.`, href, cta, points: groups.map(g => `${g.company} · ${span(g.roles)}`) };
}

export const caseCard = (c: CaseStudy): StackCard => ({
  kicker: [c.data.index, c.data.category?.split(' · ')[0]].filter(Boolean).join(' · '),
  meta: c.data.timeline,
  title: c.data.title,
  line: c.data.lead,
  href: `/case-studies/${c.id}`,
  cta: 'Read the case study',
  image: c.data.cover?.src,
  focus: c.data.cover?.focus,
});

/** The featured case studies, as on the main site's Home. */
export async function featuredCases(): Promise<StackCard[]> {
  return (await listedCaseStudies()).filter(c => !c.data.fixture && c.data.featured).slice(0, 3).map(caseCard);
}

/** The three case studies after the newest (the newest is the wide card straight below the first screen). */
export async function moreCases(): Promise<StackCard[]> {
  const all = (await listedCaseStudies()).filter(c => !c.data.fixture);
  return (all.length > 3 ? all.slice(1) : all).slice(0, 3).map(caseCard);
}

export async function projectCards(): Promise<StackCard[]> {
  return (await listedProjects()).filter(p => !p.data.fixture).slice(0, 3).map(p => ({
    kicker: [statusLabel[p.data.status], p.data.tags[0]].filter(Boolean).join(' · '),
    title: p.data.title,
    line: p.data.summary,
    href: `/work/${p.id}`,
    cta: 'Open the project',
    image: p.data.cover?.src,
    focus: p.data.cover?.focus ?? 'center top', // project covers centre their headline
    points: p.data.tags,
  }));
}

/** The whole career first (every company is on it), then the two latest companies with what they shipped. */
export function careerCards(href: string): StackCard[] {
  const { groups, span } = career();
  return [careerCard(href, 'See every role below'), ...groups.slice(0, 2).map(g => ({
    kicker: g.company,
    meta: span(g.roles),
    title: g.roles[0].role,
    line: g.roles[0].summary,
    href,
    cta: 'See every role below',
    points: g.roles.flatMap(r => r.highlights ?? []).slice(0, 2),
  }))];
}

export async function resumeCards(): Promise<StackCard[]> {
  const certs = (await getCollection('certifications', ({ data }) => !data.draft && !data.fixture)).sort((a, b) => a.data.order - b.data.order);
  const studying = certs.filter(c => c.data.status === 'in-progress');
  /* The resume's own first lines (name, title, where) are the words beside the stack, and the career card opens the
     Experience page, so this stack starts with the expertise. */
  const cards: StackCard[] = [
    { kicker: 'Expertise', meta: `${profile.expertise.length} areas`, title: 'What I bring to a team', line: profile.positioning, href: '#cv-expertise', cta: 'See the expertise below', points: profile.expertise.map(e => e.title) },
    careerCard('#cv-experience', 'See the experience below'),
  ];
  if (certs.length > 0) cards.push({ kicker: 'Certifications', meta: studying.length ? `${studying.length} in progress` : undefined, title: 'Learning now', href: '#cv-certs', cta: 'See the certifications below', points: [...studying, ...certs.filter(c => c.data.status !== 'in-progress')].map(c => c.data.name) });
  return cards;
}

/** The categories that hold the tools I use, each listing those tools; the link goes to the category in the list. */
export async function aiToolCards(): Promise<StackCard[]> {
  const tools = (await listedAiTools()).filter(t => !t.data.fixture);
  return aiCategoryCounts(tools).map(g => ({ g, used: tools.filter(t => t.data.category === g.slug && t.data.pick) })).filter(x => x.used.length > 0).slice(0, 3).map(({ g, used }) => ({
    kicker: 'Category',
    meta: `I use ${used.length} of ${g.count}`,
    title: g.label,
    line: g.blurb,
    href: `#ai-${g.slug}`,
    cta: `See all ${g.count} in the list`,
    points: used.map(t => `${t.data.title} · ${aiCostLabel[t.data.cost]}`),
  }));
}

/** The fullest categories of the UX Glossary, each with its first entries. */
export async function glossaryCards(): Promise<StackCard[]> {
  const resources = (await listedResources()).filter(r => !r.data.fixture);
  const fullest = categoryCounts(resources).filter(c => c.count > 0).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 3);
  return fullest.map(c => ({
    kicker: 'Category',
    meta: `${c.count} resources`,
    title: c.label,
    line: c.blurb,
    href: `/resources?category=${c.slug}#resources-list`,
    cta: `Browse ${c.label}`,
    points: resources.filter(r => r.data.category === c.slug).slice(0, 5).map(r => r.data.title),
  }));
}

/** About on the website for clients: the portrait with how I work (the name and title are the words beside it), then the
    principles, then the expertise. */
export function aboutCards(anchors: { method: string; principles: string; expertise: string }): StackCard[] {
  return [
    { kicker: 'How I work', meta: `${site.location.split(',')[0]} · GCC hours`, title: 'From the workflow to the shipped screen', line: profile.aiWorkflow.map(s => s.title).join(' · '), href: anchors.method, cta: 'See how I work with AI below', picture: { src: '/assets/author-portrait.jpg', width: 836, height: 836 } },
    { kicker: 'Principles', meta: String(profile.principles.length), title: "Things I won't trade away", line: profile.principles[0]?.body, href: anchors.principles, cta: 'See the principles below', points: profile.principles.map(p => p.title) },
    { kicker: 'Expertise', meta: `${profile.expertise.length} areas`, title: 'What I bring to a product team', line: profile.expertise[0]?.body, href: anchors.expertise, cta: 'See the expertise below', points: profile.expertise.map(e => e.title) },
  ];
}
