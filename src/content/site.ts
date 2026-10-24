/* Site configuration, read from src/content/site/config.json (editable at /admin, validated by the `site` collection).
   This module adds the things that are code, not content: navigation, and the legacy header and footer content used only
   when the site is built with LEGACY_PARITY=1 for the pixel comparison against the legacy baseline. */
import fs from 'node:fs';
import path from 'node:path';
import config from './site/config.json';

export interface NavItem { key: string; label: string; href: string; /** One line under the link in a menu. */ blurb?: string }
/** A heading in the navigation that is not a page: it opens a menu of its pages. */
export interface NavGroup { key: string; label: string; children: NavItem[] }
export type NavEntry = NavItem | NavGroup;
export const isGroup = (n: NavEntry): n is NavGroup => 'children' in n;

/* The resume link points at the PDF in public/ once that file exists; until then it uses the fallback URL from the config. */
const resumeFile = path.join(process.cwd(), 'public', config.resume.path);
const resumeUrl = fs.existsSync(resumeFile) ? config.resume.path : (config.resume.fallbackUrl || config.resume.path);

/** The PDF path when the file exists in public/, otherwise nothing: /resume hides its download button. */
export const resumePdf = fs.existsSync(resumeFile) ? config.resume.path : undefined;

/** Attributes for a link to the resume: a file on this site downloads; a link to another site opens in a new tab. */
export const resumeExternal = /^https?:/.test(resumeUrl);
export const resumeAttrs = resumeExternal ? { target: '_blank', rel: 'noopener' } : { download: true };

export const site = {
  ...config,
  resumeUrl,
  rss: '/rss.xml',
  nav: [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'recent-work', label: 'My Recent Work', children: [
      { key: 'work', label: 'Projects', href: '/work', blurb: 'What I am building and what has shipped' },
      { key: 'case-studies', label: 'Case Studies', href: '/case-studies', blurb: 'How the work was designed, and what changed' },
    ] },
    { key: 'my-resources', label: 'My Resources', children: [
      { key: 'blog', label: 'Blogs', href: '/blog', blurb: 'Guides and longer pieces written for this site' },
      { key: 'posts', label: 'Posts', href: '/posts', blurb: 'Short posts and series from LinkedIn' },
      { key: 'articles', label: 'Articles', href: '/articles', blurb: 'Longer pieces published on LinkedIn' },
    ] },
    { key: 'videos', label: 'My Videos', href: '/videos' },
    { key: 'resources-group', label: 'Resources', children: [
      { key: 'resources', label: 'UX Glossary', href: '/resources', blurb: 'Tools, references and reading for AI product design' },
      { key: 'ai-tools', label: 'AI Tools', href: '/ai-tools', blurb: 'AI tools for designers, by what they help with' },
    ] },
    { key: 'about', label: 'About me', href: '/about' },
  ] as NavEntry[],
  cta: { label: "Let's talk", href: '/contact' },
  /** The footer's columns: every page a visitor may look for, grouped the way the header groups them. */
  footer: [
    { label: 'My Recent Work', links: [{ label: 'Projects', href: '/work' }, { label: 'Case Studies', href: '/case-studies' }] },
    { label: 'My Resources', links: [{ label: 'Blogs', href: '/blog' }, { label: 'Posts', href: '/posts' }, { label: 'Articles', href: '/articles' }, { label: 'My Videos', href: '/videos' }] },
    { label: 'Resources', links: [{ label: 'UX Glossary', href: '/resources' }, { label: 'AI Tools', href: '/ai-tools' }] },
    { label: 'About', links: [{ label: 'About me', href: '/about' }, { label: 'Resume', href: '/resume' }, { label: 'Now', href: '/now' }, { label: 'Services', href: '/services' }, { label: "Let's talk", href: '/contact' }] },
  ],
};

export const legacyChrome = {
  nav: [
    { key: 'work', label: 'Work', href: '/case-studies' },
    { key: 'content', label: 'Content', href: '/read' },
    { key: 'guides', label: 'Guides', href: '/blog' },
    { key: 'services', label: 'Services', href: '/services' },
    { key: 'about', label: 'About', href: '/about' },
  ] as NavItem[],
  cta: { label: "Let's talk", href: '/#contact' },
};

export const parity = process.env.LEGACY_PARITY === '1';

/** Which nav item is current for a pathname (a page inside a group; the group shows it too). */
export function currentKey(pathname: string, legacy = parity): string {
  const p = pathname.replace(/^\/ar(?=\/|$)/, '').replace(/\.html$/, '') || '/';
  if (p === '/') return legacy ? '' : 'home';
  if (p.startsWith('/case-studies')) return legacy ? 'work' : 'case-studies';
  if (p === '/work' || p.startsWith('/work/')) return 'work';
  if (p === '/read') return legacy ? 'content' : 'blog';
  if (p.startsWith('/blog')) return legacy ? 'guides' : 'blog';
  if (p === '/posts') return 'posts';
  if (p === '/articles') return 'articles';
  if (p === '/services') return legacy ? 'services' : '';
  if (p === '/about' || p === '/resume' || p === '/now') return 'about';
  if (p === '/videos') return 'videos';
  if (p === '/resources') return 'resources';
  if (p === '/ai-tools') return 'ai-tools';
  if (p === '/contact') return 'contact';
  return '';
}
