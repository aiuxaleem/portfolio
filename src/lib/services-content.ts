/* The client offer as data, read from the main site's Services page (src/snapshots/services.json), so the client landing page
   (src/pages/clients/index.astro, L-83) and /services say the same thing from one source: the three services with their fit,
   what you get and the proof links; the four moves of the process; the questions before you write. The build stops with a
   plain message if the page has changed shape, so the client page can never lose a part silently. */
import snapshot from '../snapshots/services.json';

const html = snapshot.main;
const text = (s: string) => s.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').replace(/&#8288;/g, '⁠').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, '’').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const fail = (what: string): never => { throw new Error(`services-content: ${what} not found in src/snapshots/services.json; the Services page has changed shape`); };

export interface Offer { id: string; title: string; line: string; fit: string; gets: string[]; links: { label: string; href: string }[] }

export const offers: Offer[] = ['offer-ai', 'offer-ds', 'offer-audit'].map(id => {
  const at = html.indexOf(`<article id="${id}"`);
  if (at < 0) fail(`the service ${id}`);
  const block = html.slice(at, html.indexOf('</article>', at));
  const title = text(block.match(new RegExp(`id="${id}-title"[^>]*>([\\s\\S]*?)</h3>`))?.[1] ?? '');
  const line = text(block.match(/<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
  const fit = text(block.match(/Good fit when<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/)?.[1] ?? '');
  const getsAt = block.indexOf('What you get');
  const gets = [...block.slice(getsAt, block.indexOf('</ul>', getsAt)).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => text(m[1]));
  const links = [...block.slice(block.indexOf('</ul>', getsAt)).matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => ({ href: m[1], label: text(m[2]) }));
  if (!title || !line || !fit || gets.length === 0) fail(`a part of the service ${id}`);
  return { id, title, line, fit, gets, links };
});

const processAt = html.indexOf('id="process-title"');
if (processAt < 0) fail('the process');
const processBlock = html.slice(processAt, html.indexOf('</ol>', processAt));
export const processTitle = text(html.slice(processAt).match(/>([\s\S]*?)<\/h2>/)?.[1] ?? '');
export const processLead = text(processBlock.match(/<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
export const steps = [...processBlock.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>\s*<span[^>]*>([\s\S]*?)<\/span>/g)].map(m => ({ title: text(m[1]), body: text(m[2]) }));
if (steps.length !== 4) fail('the four moves');

const faqAt = html.indexOf('id="faq-title"');
if (faqAt < 0) fail('the questions');
const faqBlock = html.slice(faqAt, html.indexOf('</section>', faqAt));
export const faq = [...faqBlock.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => ({ q: text(m[1]), a: text(m[2]) }));
if (faq.length === 0) fail('the questions');

/* "Not sure which one you need?" under the services. */
const unsureAt = html.indexOf('Not sure which one you need?');
export const unsure = unsureAt < 0 ? fail('"Not sure which one you need?"') : { title: 'Not sure which one you need?', body: text(html.slice(unsureAt).match(/<\/strong>\s*<span[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '') };
