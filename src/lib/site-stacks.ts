/* The cards for the stacks on the audience websites' first screens (components/sites/hero-stack.astro, docs/SITES.md).
   Every card is built from published content: case studies, projects, the profile, the AI tools, the UX Library. */
import type { ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';
import { listedCaseStudies, type CaseStudy } from './case-studies';
import { listedProjects, statusLabel } from './projects';
import { listedAiTools, aiCategoryCounts, aiCostLabel } from './ai-tools';
import { listedResources, categoryCounts } from './resources';
import { listedDesignSystems } from './design-systems';
import { profile, careerByCompany } from '../content/profile';
import { site } from '../content/site';
import { cardPicture } from './images';
import type { SectionSceneName } from '../components/art/section-scenes';

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
  /** A section drawing (art/section-scenes.ts) for a card of points, in the space its words leave above the points. */
  scene?: SectionSceneName;
}

const year = (ym: string) => ym.slice(0, 4);

/* The picture a deck card shows: lib/images.ts cardPicture, the cover unless it is a strip far wider than the window. */
const deckPicture = cardPicture;


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

/** A case study as a deck card. Its kicker is the category alone: a deck has its own counter ("01 / 03"), and the case's
    number in the series beside it read as a second, different count ("01 / 03" over "02"; mobile review, 16 November 2026,
    L-74). The list cards keep the series number (L-59 m). */
export const caseCard = (c: CaseStudy): StackCard => ({
  kicker: c.data.category?.split(' · ')[0] || 'Case study',
  meta: c.data.timeline,
  title: c.data.title,
  line: c.data.lead,
  href: `/case-studies/${c.id}`,
  cta: 'Read the case study',
  image: c.data.cover?.src,
  focus: c.data.cover?.focus,
});


/** The three case studies after the newest (the newest is the wide card straight below the first screen). */
/* The owner's picks for a list page's hero stack: up to five, in list order (owner request, 16 November 2026, L-76).
   With none picked the page picks as before: three, so a stack is never empty. */
const PICKS = 5;
const picksOr = <T extends { data: { heroStack?: boolean } }>(all: T[], fallback: T[]): T[] => { const picked = all.filter(x => x.data.heroStack); return picked.length ? picked.slice(0, PICKS) : fallback.slice(0, 3); };

export async function moreCases(): Promise<StackCard[]> {
  const all = (await listedCaseStudies()).filter(c => !c.data.fixture);
  return picksOr(all, all.length > 3 ? all.slice(1) : all).map(c => caseCard(c));
}

export async function projectCards(): Promise<StackCard[]> {
  const all = (await listedProjects()).filter(p => !p.data.fixture);
  return picksOr(all, all).map(p => ({
    kicker: [statusLabel[p.data.status], p.data.tags[0]].filter(Boolean).join(' · '),
    title: p.data.title,
    line: p.data.summary,
    href: `/work/${p.id}`,
    cta: 'Open the project',
    image: deckPicture(p.data.cover, p.data.gallery)?.src,
    focus: deckPicture(p.data.cover, p.data.gallery)?.focus ?? 'center top', // project covers centre their headline
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
    { kicker: 'Expertise', meta: `${profile.expertise.length} areas`, title: 'What I bring to a team', line: profile.positioning, href: '#cv-expertise', cta: 'See the expertise below', points: profile.expertise.map(e => e.title), scene: 'expertise' },
    careerCard('#cv-experience', 'See the experience below'),
  ];
  if (certs.length > 0) cards.push({ kicker: 'Certifications', meta: studying.length ? `${studying.length} in progress` : undefined, title: 'Learning now', href: '#cv-certs', cta: 'See the certifications below', points: [...studying, ...certs.filter(c => c.data.status !== 'in-progress')].map(c => c.data.name), scene: 'certs' });
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

/** The fullest categories of the UX Library, each with its first entries. */
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
    { kicker: 'Principles', meta: String(profile.principles.length), title: "Things I won't trade away", line: profile.principles[0]?.body, href: anchors.principles, cta: 'See the principles below', points: profile.principles.map(p => p.title), scene: 'principles' },
    { kicker: 'Expertise', meta: `${profile.expertise.length} areas`, title: 'What I bring to a product team', line: profile.expertise[0]?.body, href: anchors.expertise, cta: 'See the expertise below', points: profile.expertise.map(e => e.title), scene: 'expertise' },
  ];
}

/** My Design Systems' hero stack: the systems the owner built and picked (or the first three), each linking to its card on
    the page (#system-N, as the page numbers them), with what is inside as its points when it has no cover. */
export async function mySystemCards(): Promise<StackCard[]> {
  const mine = (await listedDesignSystems()).filter(s => s.data.mine);
  const real = mine.filter(s => !s.data.fixture);
  /* A system without a cover of its own shows the cover of its project page (third review, 25 November 2026: the stack
     showed lists where /work shows the same system's screens). */
  const projects = await listedProjects();
  const cover = (s: (typeof real)[number]) => { const p = projects.find(p => s.data.project === `/work/${p.id}`); return s.data.cover ?? deckPicture(p?.data.cover, p?.data.gallery); };
  return picksOr(real, real).map(s => ({
    kicker: s.data.here ? 'This site' : 'Design system',
    meta: s.data.facts[0] ? `${s.data.facts[0].value} ${s.data.facts[0].label}` : undefined,
    title: s.data.title,
    line: s.data.summary,
    href: `#system-${mine.indexOf(s) + 1}`,
    cta: 'See what is inside',
    image: cover(s)?.src,
    focus: cover(s)?.focus,
    points: s.data.facts.length ? s.data.facts.map(f => `${f.value} ${f.label}`) : s.data.madeWith,
  }));
}

/* Pictures from inside the work, for the head of a section that introduces it (components/art/section-art.astro
   `pictures`; seventh review, 26 November 2026: such a head should show the work, not a generic drawing). One per item,
   in order, up to three: a screen from its pages that is not a picture its card or deck already shows, in a usual shape
   so it reads at thumbnail size. Fewer than two found, and the head keeps its drawing. */
const usualShape = (m: ImageMetadata) => { const r = m.width / m.height; return r >= 1.2 && r <= 2.2; };
const inside = (sets: { shown: (ImageMetadata | undefined)[]; pool: ImageMetadata[] }[]): ImageMetadata[] => {
  const out: ImageMetadata[] = [];
  for (const s of sets) {
    const seen = new Set([...s.shown, ...out].filter(Boolean).map(m => m!.src));
    const pick = s.pool.find(m => !seen.has(m.src) && usualShape(m));
    if (pick) out.push(pick);
    if (out.length === 3) break;
  }
  return out.length >= 2 ? out : [];
};

/** Screens from inside the given case studies, never their covers. */
export const caseInsidePictures = (cases: CaseStudy[]): ImageMetadata[] => inside(cases.map(c => ({
  shown: [c.data.cover?.src],
  pool: [...c.data.process.images.map(i => i.src), ...(c.data.process.beforeAfter ? [c.data.process.beforeAfter.after.src] : [])],
})));

/** Screens from the project pages of the systems I built, never the cover their card or the deck shows. The last of each
    gallery comes first: a gallery tends to open on the cover's own page at another size. */
export async function systemInsidePictures(): Promise<ImageMetadata[]> {
  const real = (await listedDesignSystems()).filter(s => s.data.mine && !s.data.fixture);
  const projects = await listedProjects();
  return inside(real.map(s => {
    const p = projects.find(p => s.data.project === `/work/${p.id}`);
    return { shown: [s.data.cover?.src, p?.data.cover?.src, deckPicture(p?.data.cover, p?.data.gallery)?.src], pool: (p?.data.gallery ?? []).map(g => g.src).reverse() };
  }));
}
