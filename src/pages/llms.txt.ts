/* /llms.txt: a plain-text index of the site for AI agents, built from the same content as the pages (owner request,
   5 November 2026: the site is designed for the person and for the agent acting for them, so it says what is here in a
   form an agent can read in one request). The llms.txt convention: an H1 with the site's name, a short blockquote, then
   sections of links with a one-line description each. Drafts and fixtures never appear. Static, like the feeds. */
import type { APIRoute } from 'astro';
import { site } from '../content/site';
import { profile } from '../content/profile';
import { listedPosts, postUrl } from '../lib/posts';
import { listedCaseStudies } from '../lib/case-studies';
import { listedProjects } from '../lib/projects';

export const GET: APIRoute = async ({ site: origin }) => {
  const base = String(origin).replace(/\/$/, '');
  const url = (path: string) => `${base}${path}`;
  const line = (label: string, path: string, note?: string) => `- [${label}](${url(path)})${note ? `: ${note.replace(/\s+/g, ' ').trim()}` : ''}`;
  const posts = (await listedPosts()).filter(p => !p.data.fixture);
  const cases = (await listedCaseStudies()).filter(c => !c.data.fixture);
  const projects = (await listedProjects()).filter(p => !p.data.fixture);
  const text = [
    `# ${site.brand}: ${site.name}`,
    '',
    `> ${profile.headline}. ${profile.positioning}`,
    '',
    `${profile.summary.join(' ')}`,
    '',
    `Contact: ${site.email}. Based in ${site.location}. ${site.availability.label}.`,
    '',
    '## Start here',
    '',
    line('About', '/about', 'career, principles, expertise, how I work with AI, certifications'),
    line('Resume', '/resume', 'experience, expertise, tools, education and certifications on one page'),
    line('Services', '/services', 'AI product design, design system builds and UX audits, as a role or a project'),
    line('Contact', '/contact', 'book a 15-minute call or send a message'),
    line('Now', '/now', 'what is being built and learned at the moment'),
    line('Sitemap', '/sitemap', 'every page, in the groups of the menu'),
    '',
    '## Case studies',
    '',
    ...cases.map(c => line(c.data.title, `/case-studies/${c.id}`, c.data.lead)),
    '',
    '## Projects',
    '',
    ...projects.map(p => line(p.data.title, `/work/${p.id}`, p.data.summary)),
    '',
    '## Blog',
    '',
    ...posts.map(p => line(p.data.title, postUrl(p), p.data.excerpt)),
    '',
    '## Also on this site',
    '',
    line('LinkedIn posts', '/posts', 'short posts and series, each loaded from LinkedIn on request'),
    line('LinkedIn articles', '/articles', 'longer pieces published on LinkedIn'),
    line('Videos', '/videos', 'recordings on designing AI products people can trust'),
    line('UX Library', '/resources', 'tools, references and reading for AI product design, with my own workflows and skills'),
    line('AI tools', '/ai-tools', 'AI tools for product designers, grouped by what they help with'),
    line('Blog feed', '/rss.xml', 'RSS'),
    line('Writing feed', '/writing/rss.xml', 'RSS of the blog, posts and articles'),
    '',
    '## Optional',
    '',
    line('Arabic Home', '/ar', 'the Home page in Arabic'),
    line('Website for hiring managers', '/job', 'the same work, arranged for a hiring decision'),
    line('Website for clients', '/clients', 'the same work, arranged for a project'),
    '',
  ].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
