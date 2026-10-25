/* Sitemaps of the audience websites (docs/SITES.md): their fixed pages, then every published case study and project, on
   the website's own address. Fixtures are never listed. */
import { listedCaseStudies } from './case-studies';
import { listedProjects } from './projects';
import { SUB_SITES, SITE_PAGES, type SubSite } from './sites';

export async function siteSitemap(key: SubSite): Promise<string> {
  const origin = SUB_SITES[key].origin;
  const cases = (await listedCaseStudies()).filter(c => !c.data.fixture).map(c => `/case-studies/${c.id}`);
  const projects = (await listedProjects()).filter(p => !p.data.fixture).map(p => `/work/${p.id}`);
  const urls = [...SITE_PAGES[key], ...cases, ...projects].map(p => `  <url><loc>${origin}${p === '/' ? '/' : p}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
