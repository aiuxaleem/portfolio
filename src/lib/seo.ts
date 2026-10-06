/* SEO helpers: which pages get a generated Open Graph image, and the JSON-LD objects.
   Nothing here invents a fact: every value comes from site settings, the profile file or a content entry, and a
   property is left out when its source is empty. */
import { getCollection } from 'astro:content';
import { site } from '../content/site';
import { profile } from '../content/profile';
import { listedPosts, postUrl, type Post } from './posts';
import { listedProjects } from './projects';
import { listedCaseStudies, type CaseStudy } from './case-studies';
import type { Video } from './videos';

const BASE = String(import.meta.env.SITE).replace(/\/$/, '');
export const abs = (p: string) => (/^https?:/.test(p) ? p : BASE + p);
export const PERSON_ID = `${BASE}/#person`;

export interface OgEntry { path: string; title: string; kicker?: string }
/** Every page that gets its own generated image. Other pages (tag pages, later list pages, 404) use the default one. */
export async function ogEntries(): Promise<OgEntry[]> {
  const pages: OgEntry[] = [
    { path: 'default', title: site.name, kicker: 'AI product design' },
    { path: 'home', title: 'I design AI products people actually trust.', kicker: 'Hyderabad · GCC hours · KSA / UAE / remote' },
    { path: 'work', title: 'Projects', kicker: 'Work' },
    { path: 'case-studies', title: 'Case studies', kicker: 'Selected work' },
    { path: 'writing', title: 'Thinking out loud, in public.', kicker: 'Writing' },
    { path: 'blog', title: 'Blog', kicker: 'Writing' },
    { path: 'videos', title: 'Videos', kicker: 'Videos' },
    { path: 'about', title: 'I make AI feel like something you can rely on.', kicker: 'About' },
    { path: 'resume', title: site.name, kicker: 'Resume' },
    { path: 'now', title: 'What I am building and learning.', kicker: 'Now' },
    { path: 'contact', title: 'Get in touch.', kicker: 'Contact' },
    { path: 'services', title: 'Three ways to work together.', kicker: 'Services' },
  ];
  const projects = (await listedProjects()).map(p => ({ path: `work/${p.id}`, title: p.data.title, kicker: 'Project' }));
  const cases = (await listedCaseStudies()).map(c => ({ path: `case-studies/${c.id}`, title: c.data.title, kicker: ['Case study', c.data.category].filter(Boolean).join(' · ') }));
  const posts = (await listedPosts()).map(p => ({ path: postUrl(p).slice(1), title: p.data.title, kicker: ['Blog', p.data.category].filter(Boolean).join(' · ') }));
  return [...pages, ...projects, ...cases, ...posts];
}
let known: Set<string> | undefined;
/** The image for a pathname: its own generated image, or the default. */
export async function ogImageFor(pathname: string): Promise<string> {
  const p = pathname.replace(/\.html$/, '').replace(/^\/|\/$/g, '');
  if (p === '' || p === 'ar') return '/og/home.png';
  known ||= new Set((await ogEntries()).map(e => e.path));
  return `/og/${known.has(p) ? p : 'default'}.png`;
}

const clean = <T extends Record<string, unknown>>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))) as T;
const iso = (d?: Date) => (d ? d.toISOString() : undefined);
const authorRef = { '@type': 'Person', '@id': PERSON_ID, name: site.name, url: BASE + '/' };

export function personLd() {
  return clean({
    '@context': 'https://schema.org', '@type': 'Person', '@id': PERSON_ID,
    name: site.name, alternateName: site.brand, url: BASE + '/', image: abs('/assets/author-portrait.jpg'),
    jobTitle: profile.headline, description: profile.positioning, email: `mailto:${site.email}`,
    address: { '@type': 'PostalAddress', addressLocality: site.location.split(',')[0].trim(), addressCountry: 'IN' },
    worksFor: profile.career[0] ? { '@type': 'Organization', name: profile.career[0].company } : undefined,
    knowsAbout: profile.expertise.map(e => e.title),
    sameAs: [site.socials.linkedin, site.socials.behance, site.socials.youtube].filter(Boolean),
  });
}
export const websiteLd = () => ({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${BASE}/#website`, url: BASE + '/', name: site.brand, description: site.positioning, inLanguage: 'en', publisher: { '@id': PERSON_ID } });

export function blogPostingLd(post: Post, image: string) {
  const d = post.data, url = abs(postUrl(post));
  return clean({
    '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${url}#post`, mainEntityOfPage: url, url,
    headline: d.title.slice(0, 110), description: d.excerpt, image: abs(image),
    /* Only a real publication date is stated. A post that only has an updated date gets dateModified alone. */
    datePublished: iso(d.published), dateModified: iso(d.updated || d.published),
    author: authorRef, publisher: authorRef, keywords: d.tags.join(', '), articleSection: d.category, inLanguage: 'en',
    isBasedOn: d.originallyPublished?.url,
  });
}
export function caseStudyLd(entry: CaseStudy, image: string) {
  const d = entry.data, url = abs(`/case-studies/${entry.id}`);
  return clean({
    '@context': 'https://schema.org', '@type': 'CreativeWork', '@id': `${url}#case-study`, url, mainEntityOfPage: url,
    name: d.title, headline: d.title.slice(0, 110), description: d.lead, image: abs(image), genre: 'Case study',
    author: authorRef, creator: authorRef, about: d.category, keywords: d.stack.join(', '), inLanguage: 'en',
    sourceOrganization: d.company && !d.confidential ? { '@type': 'Organization', name: d.company } : undefined,
  });
}
/** A VideoObject needs a real id, a description and an upload date. A video missing any of them gets no markup. */
export function videoLd(video: Video) {
  const d = video.data;
  if (!/^[\w-]{11}$/.test(d.youtubeId) || !d.published || !d.description) return undefined;
  return clean({
    '@context': 'https://schema.org', '@type': 'VideoObject', name: d.title, description: d.description,
    thumbnailUrl: [`https://i.ytimg.com/vi/${d.youtubeId}/hqdefault.jpg`], uploadDate: iso(d.published),
    contentUrl: `https://www.youtube.com/watch?v=${d.youtubeId}`, embedUrl: `https://www.youtube-nocookie.com/embed/${d.youtubeId}`,
    duration: d.duration && /^PT/.test(d.duration) ? d.duration : undefined, author: authorRef, keywords: d.tags.join(', '),
  });
}
export const breadcrumbLd = (items: [string, string][]) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) })) });

/** Everything that may be published, for feeds. */
export const publishedLinkedin = async () => ({
  articles: await getCollection('linkedinArticles', ({ data }) => !data.draft && !data.fixture),
  posts: await getCollection('linkedinPosts', ({ data }) => !data.draft && !data.fixture),
});

/* Pages that exist in English and Arabic. Each gets hreflang links to both, so search engines treat them as one page in
   two languages. Add a path here when its Arabic page is added under src/pages/ar/. */
const BILINGUAL = ['/', '/case-studies/colaberry-design-system'];
export function languageAlternates(pathname: string): { lang: string; href: string }[] {
  const en = pathname.replace(/\.html$/, '').replace(/^\/ar(?=\/|$)/, '').replace(/\/$/, '') || '/';
  if (!BILINGUAL.includes(en)) return [];
  const ar = en === '/' ? '/ar' : `/ar${en}`;
  return [{ lang: 'en', href: abs(en) }, { lang: 'ar', href: abs(ar) }, { lang: 'x-default', href: abs(en) }];
}
