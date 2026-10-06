/* One RSS 2.0 writer for both feeds (/rss.xml for the blog, /writing/rss.xml for everything in the Writing feed). */
export interface RssItem { title: string; link: string; description?: string; date?: Date; category?: string }
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function rss({ title, description, site, self, items }: { title: string; description: string; site: string; self: string; items: RssItem[] }): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${esc(title)}</title>
<link>${esc(site)}</link>
<description>${esc(description)}</description>
<language>en</language>
<atom:link href="${esc(self)}" rel="self" type="application/rss+xml" />
${items.map(i => `<item><title>${esc(i.title)}</title><link>${esc(i.link)}</link><guid isPermaLink="true">${esc(i.link)}</guid>${i.description ? `<description>${esc(i.description)}</description>` : ''}${i.category ? `<category>${esc(i.category)}</category>` : ''}${i.date ? `<pubDate>${i.date.toUTCString()}</pubDate>` : ''}</item>`).join('\n')}
</channel></rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
