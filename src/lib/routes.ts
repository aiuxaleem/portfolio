/* One place that knows every URL. Legacy file names map to the new routes (docs/IMPLEMENTATION_PLAN.md section 7). */
export const legacyToRoute: Record<string, string> = {
  'AIUXAleem Home.dc.html': '/',
  'Work.dc.html': '/case-studies',
  'Services.dc.html': '/services',
  'About.dc.html': '/about',
  'Content.dc.html': '/read',
  'Guides.dc.html': '/blog',
  'Guide.dc.html': '/blog/component-spec-files',
  '404.dc.html': '/404',
};

export const caseSlugs = ['colaberry-design-system', 'freight-platform-rebrand', 'ai-ad-reel-pipeline'] as const;

/** Rewrites one legacy href (relative file name, optional query and hash) to its new URL. Other hrefs pass through. */
export function rewriteHref(href: string): string {
  const m = href.match(/^(?:\.\/)?([^?#]+\.dc\.html)(\?[^#]*)?(#.*)?$/);
  if (!m) return href;
  const file = decodeURIComponent(m[1]);
  const params = new URLSearchParams(m[2] || '');
  const hash = m[3] || '';
  const ar = params.get('lang') === 'ar';
  if (file === 'Case Study.dc.html') {
    const slug = params.get('case') || caseSlugs[0];
    // Only the first case study has an Arabic page; links to the others go to the English one.
    return `${ar && slug === caseSlugs[0] ? '/ar' : ''}/case-studies/${slug}${hash}`;
  }
  const route = legacyToRoute[file];
  if (!route) return href;
  if (ar && route === '/') return '/ar' + hash;
  return route + hash;
}

/** Applies rewriteHref to every href="..." in a markup string. */
export function rewriteLinks(html: string): string {
  return html.replace(/href="([^"]+)"/g, (_, href) => `href="${rewriteHref(href.replace(/&amp;/g, '&')).replace(/&/g, '&amp;')}"`);
}
