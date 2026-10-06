/* Site configuration, read from src/content/site/config.json (editable at /admin, validated by the `site` collection).
   This module adds the things that are code, not content: navigation, and the legacy header and footer content used only
   when the site is built with LEGACY_PARITY=1 for the pixel comparison against the legacy baseline. */
import fs from 'node:fs';
import path from 'node:path';
import config from './site/config.json';

export interface NavItem { key: string; label: string; href: string }

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
    { key: 'work', label: 'Work', href: '/work' },
    { key: 'case-studies', label: 'Case Studies', href: '/case-studies' },
    { key: 'writing', label: 'Read', href: '/read' },
    { key: 'videos', label: 'Videos', href: '/videos' },
    { key: 'about', label: 'About', href: '/about' },
    { key: 'contact', label: 'Contact', href: '/contact' },
  ] as NavItem[],
  cta: { label: 'Get in touch', href: '/contact' },
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

/** Which nav item is current for a pathname. */
export function currentKey(pathname: string, legacy = parity): string {
  const p = pathname.replace(/^\/ar(?=\/|$)/, '').replace(/\.html$/, '') || '/';
  if (p.startsWith('/case-studies')) return legacy ? 'work' : 'case-studies';
  if (p === '/work' || p.startsWith('/work/')) return 'work';
  if (p === '/read') return legacy ? 'content' : 'writing';
  if (p.startsWith('/blog')) return legacy ? 'guides' : 'writing';
  if (p === '/services') return legacy ? 'services' : '';
  if (p === '/about' || p === '/resume' || p === '/now') return 'about';
  if (p === '/videos') return 'videos';
  if (p === '/contact') return 'contact';
  return '';
}
