/* The two audience websites (version 2, docs/SITES.md): one for hiring managers and one for clients, served from this same
   deployment and managed from the same admin. Their pages live under src/pages/job/ and src/pages/clients/; on their own
   host names (vercel.json) the prefix disappears, so /job/case-studies is job.aiuxaleem.com/case-studies.
   `origin` is the address search engines are told about (the planned domain); `live` is where the site answers today and
   what links between the sites use. When the domain is connected, set `live` to the same address as `origin`. */
import type { NavEntry, NavItem } from '../content/site';

export type SubSite = 'job' | 'clients';
export interface SubSiteConfig {
  key: SubSite;
  prefix: string;
  /** The audience, as a short label beside the brand and in titles. */
  label: string;
  origin: string;
  live: string;
  nav: NavEntry[];
  cta: { label: string; href: string };
  footer: { label: string; links: NavItem[] }[];
}

export const MAIN_LIVE = 'https://aiuxaleem-portfolio-app.vercel.app';
const JOB_LIVE = 'https://aiuxaleem-job.vercel.app';
const CLIENTS_LIVE = 'https://aiuxaleem-clients.vercel.app';

export const SUB_SITES: Record<SubSite, SubSiteConfig> = {
  job: {
    key: 'job', prefix: '/job', label: 'For hiring managers',
    origin: 'https://job.aiuxaleem.com', live: JOB_LIVE,
    nav: [
      { key: 'home', label: 'Home', href: '/' },
      { key: 'case-studies', label: 'Case Studies', href: '/case-studies' },
      { key: 'work', label: 'Projects', href: '/work' },
      { key: 'experience', label: 'Experience', href: '/experience' },
      { key: 'resume', label: 'Resume', href: '/resume' },
    ],
    cta: { label: "Let's talk", href: '/contact' },
    footer: [
      { label: 'The work', links: [{ key: 'case-studies', label: 'Case Studies', href: '/case-studies' }, { key: 'work', label: 'Projects', href: '/work' }] },
      { label: 'About', links: [{ key: 'experience', label: 'Experience', href: '/experience' }, { key: 'resume', label: 'Resume', href: '/resume' }, { key: 'contact', label: "Let's talk", href: '/contact' }] },
      { label: 'Elsewhere', links: [{ key: 'clients', label: 'For clients', href: CLIENTS_LIVE }, { key: 'main', label: 'Full portfolio', href: MAIN_LIVE }] },
    ],
  },
  clients: {
    key: 'clients', prefix: '/clients', label: 'For clients',
    origin: 'https://clients.aiuxaleem.com', live: CLIENTS_LIVE,
    nav: [
      { key: 'home', label: 'Services', href: '/' },
      { key: 'case-studies', label: 'Case Studies', href: '/case-studies' },
      { key: 'work', label: 'Projects', href: '/work' },
      { key: 'resources-group', label: 'Resources', children: [
        { key: 'resources', label: 'UX Glossary', href: '/resources', blurb: 'Tools, references and reading for AI product design' },
        { key: 'ai-tools', label: 'AI Tools', href: '/ai-tools', blurb: 'AI tools for product teams, by what they help with' },
      ] },
      { key: 'about', label: 'About', href: '/about' },
    ],
    cta: { label: "Let's talk", href: '/contact' },
    footer: [
      { label: 'The work', links: [{ key: 'case-studies', label: 'Case Studies', href: '/case-studies' }, { key: 'work', label: 'Projects', href: '/work' }] },
      { label: 'Resources', links: [{ key: 'resources', label: 'UX Glossary', href: '/resources' }, { key: 'ai-tools', label: 'AI Tools', href: '/ai-tools' }] },
      { label: 'About', links: [{ key: 'about', label: 'About', href: '/about' }, { key: 'contact', label: "Let's talk", href: '/contact' }] },
      { label: 'Elsewhere', links: [{ key: 'job', label: 'For hiring managers', href: JOB_LIVE }, { key: 'main', label: 'Full portfolio', href: MAIN_LIVE }] },
    ],
  },
};

/** Which audience website a built page belongs to, from its path (/job/... or /clients/...). */
export function siteOf(pathname: string): SubSite | undefined {
  const p = pathname.replace(/\.html$/, '');
  for (const k of Object.keys(SUB_SITES) as SubSite[]) if (p === SUB_SITES[k].prefix || p.startsWith(SUB_SITES[k].prefix + '/')) return k;
  return undefined;
}

/** The page's path on its own website: /job/case-studies -> /case-studies. */
export function sitePath(pathname: string): string {
  const k = siteOf(pathname);
  const p = pathname.replace(/\.html$/, '').replace(/\/index$/, '');
  return k ? p.slice(SUB_SITES[k].prefix.length) || '/' : p || '/';
}

/** The current nav item on an audience website. */
export function subCurrentKey(pathname: string): string {
  const p = sitePath(pathname);
  if (p === '/') return 'home';
  for (const [prefix, key] of [['/case-studies', 'case-studies'], ['/work', 'work'], ['/experience', 'experience'], ['/resume', 'resume'], ['/resources', 'resources'], ['/ai-tools', 'ai-tools'], ['/about', 'about'], ['/contact', 'contact']] as const) {
    if (p === prefix || p.startsWith(prefix + '/')) return key;
  }
  return '';
}

/** The fixed pages of each audience website, for its sitemap (case studies and projects are added from the collections). */
export const SITE_PAGES: Record<SubSite, string[]> = {
  job: ['/', '/case-studies', '/work', '/experience', '/resume', '/contact'],
  clients: ['/', '/case-studies', '/work', '/resources', '/ai-tools', '/about', '/contact'],
};
