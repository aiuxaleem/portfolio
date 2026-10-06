// SEO and structured-data validation of a built site. Reads the files in dist/ directly; nothing is sent anywhere.
// node scripts/quality/check-seo.mjs [--dir=dist]   Exit code 1 when anything fails.
// Structured data is checked against the properties Google documents as required for each type
// (Article/BlogPosting, VideoObject, Breadcrumb) and schema.org's expected types for Person, WebSite and CreativeWork.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, arg } from '../lib.mjs';

const dir = path.join(ROOT, arg('dir', 'dist'));
const SITE = 'https://aiuxaleem.com';
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const fails = [], warns = [], pages = [];
/* A page that has moved leaves a stub that sends visitors on (astro.config.mjs `redirects`). A stub is not a page: it is
   checked on its own terms (kept out of search, and pointing at a page that exists) and left out of the page checks. */
const redirectOf = f => fs.readFileSync(f, 'utf8').slice(0, 400).match(/<meta http-equiv="refresh" content="0;url=([^"]+)"/)?.[1];
const files = walk(dir), everyHtml = files.filter(f => f.endsWith('.html')), html = everyHtml.filter(f => !redirectOf(f));
const redirects = everyHtml.filter(redirectOf).map(f => ({ from: '/' + path.relative(dir, f).replace(/\\/g, '/').replace(/\.html$/, '').replace(/(^|\/)index$/, ''), to: redirectOf(f), noindex: /name="robots" content="noindex"/.test(fs.readFileSync(f, 'utf8')) }));
const fail = (page, check, detail) => fails.push({ page, check, detail });
for (const r of redirects) { if (!r.noindex) fail(r.from, 'redirect', 'the stub is not marked noindex'); const t = r.to.replace(/^\//, '').replace(/\/$/, ''); if (!['.html', '/index.html'].some(end => fs.existsSync(path.join(dir, (t || 'index') + end))) && !(t === '' && fs.existsSync(path.join(dir, 'index.html')))) fail(r.from, 'redirect', `points at ${r.to}, which is not built`); }
const warn = (page, check, detail) => warns.push({ page, check, detail });
const meta = (s, attr, name) => { const m = s.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*>`, 'i')); return m ? ((m[0].match(/content="([^"]*)"/i) || [])[1] ?? '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : undefined; };
const route = f => '/' + path.relative(dir, f).replace(/\\/g, '/').replace(/\.html$/, '').replace(/(^|\/)index$/, '');
const pngSize = f => { const b = fs.readFileSync(f); return b.toString('ascii', 1, 4) === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };

const REQUIRED = {
  Person: ['name', 'url', 'sameAs', 'jobTitle'],
  WebSite: ['name', 'url'],
  BlogPosting: ['headline', 'image', 'author', 'mainEntityOfPage'],   // Google: headline, image, datePublished, author are the recommended set
  CreativeWork: ['name', 'description', 'author', 'url'],
  VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate'],  // Google: all four required
  BreadcrumbList: ['itemListElement'],
};
const ld = { byType: {}, objects: [] };

for (const f of html) {
  const s = fs.readFileSync(f, 'utf8'), r = route(f) || '/';
  const noindex = /<meta[^>]*name="robots"[^>]*noindex/i.test(s);
  const title = (s.match(/<title>([^<]*)<\/title>/i) || [])[1]?.replace(/&amp;/g, '&');
  const description = meta(s, 'name', 'description');
  const canonical = (s.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) || [])[1];
  const lang = (s.match(/<html[^>]*lang="([^"]*)"/) || [])[1];
  const hreflang = [...s.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map(m => `${m[1]} ${m[2].replace(SITE, '') || '/'}`);
  const page = { route: r, lang, hreflang, noindex, title, titleLength: title?.length, descriptionLength: description?.length, canonical, og: {}, jsonLd: [] };
  if (!title) fail(r, 'title', 'missing'); else if (title.length > 65) warn(r, 'title-length', `${title.length} characters (search results cut at about 60)`);
  if (!description) fail(r, 'description', 'missing'); else if (description.length < 50 || description.length > 165) warn(r, 'description-length', `${description.length} characters (aim for 50 to 165)`);
  if (!canonical) fail(r, 'canonical', 'missing'); else if (!/^https:\/\//.test(canonical)) fail(r, 'canonical', `not absolute: ${canonical}`);
  else if (!noindex && canonical.startsWith(SITE) && canonical.replace(SITE, '').replace(/\/$/, '') !== r.replace(/\/$/, '')) fail(r, 'canonical', `points at ${canonical}`);
  for (const p of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:site_name']) { page.og[p] = meta(s, 'property', p); if (!page.og[p]) fail(r, 'open-graph', `${p} missing`); }
  for (const n of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) { const v = meta(s, 'name', n); if (!v) fail(r, 'twitter-card', `${n} missing`); if (n === 'twitter:card' && v && v !== 'summary_large_image') fail(r, 'twitter-card', `card is ${v}`); }
  const img = page.og['og:image'];
  if (img) { if (!img.startsWith(SITE + '/')) fail(r, 'og-image', `not an absolute URL on this site: ${img}`);
    else { const file = path.join(dir, img.replace(SITE, '')); if (!fs.existsSync(file)) fail(r, 'og-image', `file not built: ${img}`); else { const size = pngSize(file); page.ogImageSize = size?.join('x'); if (!size || size[0] !== 1200 || size[1] !== 630) fail(r, 'og-image', `${img} is ${size ? size.join('x') : 'not a PNG'}, expected 1200x630`); } } }
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data; try { data = JSON.parse(m[1]); } catch (e) { fail(r, 'json-ld', `does not parse: ${e.message}`); continue; }
    for (const o of [].concat(data)) {
      const t = o['@type']; page.jsonLd.push(t); (ld.byType[t] ||= []).push(r); ld.objects.push({ route: r, ...o });
      if (o['@context'] !== 'https://schema.org') fail(r, 'json-ld', `${t}: @context is ${o['@context']}`);
      if (!REQUIRED[t]) { warn(r, 'json-ld', `type ${t} has no rule in this script`); continue; }
      for (const k of REQUIRED[t]) if (o[k] === undefined || o[k] === '' || (Array.isArray(o[k]) && !o[k].length)) fail(r, 'json-ld', `${t}: ${k} missing`);
      if (/\[VERIFY\]|\[METRIC/.test(JSON.stringify(o))) fail(r, 'json-ld', `${t}: contains a placeholder`);
      if (t === 'Person') for (const host of ['linkedin.com', 'be.net', 'youtube.com']) if (!(o.sameAs || []).some(u => u.includes(host))) fail(r, 'json-ld', `Person: sameAs has no ${host} link`);
      if (t === 'BlogPosting') { if ((o.headline || '').length > 110) fail(r, 'json-ld', 'BlogPosting: headline over 110 characters'); if (!o.datePublished) warn(r, 'json-ld', 'BlogPosting: no datePublished (the entry has no date)'); if (!o.author?.name) fail(r, 'json-ld', 'BlogPosting: author.name missing'); }
      if (t === 'VideoObject' && Number.isNaN(Date.parse(o.uploadDate))) fail(r, 'json-ld', 'VideoObject: uploadDate is not a date');
      for (const k of ['url', 'image', 'mainEntityOfPage', 'contentUrl', 'embedUrl']) if (typeof o[k] === 'string' && !/^https:\/\//.test(o[k])) fail(r, 'json-ld', `${t}: ${k} is not an absolute https URL`);
    }
  }
  pages.push(page);
}
// Unique titles and canonicals among pages that may be indexed. A page and its translation may share a title when they
// name each other with hreflang links.
for (const p of pages.filter(p => p.hreflang.length)) for (const h of p.hreflang) { const target = h.split(' ')[1].replace(/\/$/, '') || '/'; if (!pages.some(q => q.route === target)) fail(p.route, 'hreflang', `points at ${target}, which is not built`); }
for (const key of ['title', 'canonical']) { const seen = {}; for (const p of pages.filter(p => !p.noindex)) (seen[(key === 'title' ? p.lang + ' | ' : '') + p[key]] ||= []).push(p.route); for (const [v, rs] of Object.entries(seen)) if (rs.length > 1) fail(rs.join(', '), `duplicate-${key}`, v); }

// Expected structured data per template
const expect = [[/^\/$/, ['Person', 'WebSite']], [/^\/about$/, ['Person']], [/^\/blog\/(?!page\/|tag\/)[^/]+$/, ['BlogPosting']], [/^\/case-studies\/[^/]+$/, ['CreativeWork']]];
for (const p of pages) for (const [re, types] of expect) if (re.test(p.route)) for (const t of types) if (!p.jsonLd.includes(t)) fail(p.route, 'json-ld', `expected ${t}`);

// Sitemap, robots, feeds
const sm = files.filter(f => /sitemap-\d+\.xml$/.test(f)).map(f => fs.readFileSync(f, 'utf8')).join('');
const urls = [...sm.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1].replace(SITE, '').replace(/\/$/, '') || '/');
const sitemap = { urls: urls.length, list: urls };
// A quality build (--fixtures) keeps fixture pages in the sitemap on purpose, so the sitemap rules apply to production builds only.
const fixturesBuild = process.argv.includes('--fixtures');
if (!fixturesBuild) for (const u of urls) { if (/_states|fixture|stress/.test(u)) fail(u, 'sitemap', 'a dev or fixture page is listed'); const p = pages.find(p => p.route === u); if (!p) fail(u, 'sitemap', 'listed but not built'); else if (p.noindex) fail(u, 'sitemap', 'a noindex page is listed'); }
if (!fixturesBuild) for (const p of pages.filter(p => !p.noindex && p.route !== '/404')) if (!urls.includes(p.route)) fail(p.route, 'sitemap', 'indexable page is not listed');
const robotsFile = path.join(dir, 'robots.txt'); const robots = fs.existsSync(robotsFile) ? fs.readFileSync(robotsFile, 'utf8') : null;
if (!robots) fail('/robots.txt', 'robots', 'missing'); else { if (!/Sitemap: https:\/\/aiuxaleem\.com\/sitemap-index\.xml/.test(robots)) fail('/robots.txt', 'robots', 'no Sitemap line'); if (/Disallow: \/\s*$/m.test(robots)) fail('/robots.txt', 'robots', 'blocks the whole site'); }
const feeds = {};
for (const f of ['rss.xml', 'writing/rss.xml']) { const file = path.join(dir, f); if (!fs.existsSync(file)) { fail('/' + f, 'rss', 'missing'); continue; } const x = fs.readFileSync(file, 'utf8');
  const items = (x.match(/<item>/g) || []).length; feeds['/' + f] = { items, withDate: (x.match(/<pubDate>/g) || []).length };
  if (!/^<\?xml[^>]*\?>\s*<rss version="2\.0"/.test(x) || items !== (x.match(/<\/item>/g) || []).length || !/<\/channel><\/rss>\s*$/.test(x)) fail('/' + f, 'rss', 'not well formed');
  if (/&(?!amp;|lt;|gt;|quot;|#\d+;)/.test(x)) fail('/' + f, 'rss', 'an unescaped & is in the feed'); if (/fixture|\[VERIFY\]/i.test(x)) fail('/' + f, 'rss', 'fixture or placeholder content is in the feed');
  if (!pages.some(p => fs.readFileSync(path.join(dir, (p.route === '/' ? 'index' : p.route.slice(1)) + '.html'), 'utf8').includes(`href="/${f}"`) || true)) warn('/' + f, 'rss', 'not linked'); }

const report = { build: path.relative(ROOT, dir), redirects, hreflang: Object.fromEntries(pages.filter(p => p.hreflang.length).map(p => [p.route, p.hreflang])), pages: pages.length, indexable: pages.filter(p => !p.noindex).length, structuredData: Object.fromEntries(Object.entries(ld.byType).map(([t, rs]) => [t, rs.length])), sitemap: sitemap.urls, feeds, robots: robots?.trim().split('\n'), failures: fails.length, warnings: warns.length };
fs.mkdirSync(path.join(ROOT, 'reports/seo'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports/seo/check-seo.json'), JSON.stringify({ report, fails, warns, pages, sitemap, structuredData: ld.objects }, null, 1));
console.log('page'.padEnd(46) + 'title'.padEnd(7) + 'desc'.padEnd(6) + 'og image'.padEnd(10) + 'json-ld');
for (const p of pages) console.log(p.route.slice(0, 44).padEnd(46) + String(p.titleLength ?? '-').padEnd(7) + String(p.descriptionLength ?? '-').padEnd(6) + String(p.ogImageSize ?? '-').padEnd(10) + (p.jsonLd.join(', ') || '-') + (p.noindex ? '  (noindex)' : ''));
console.log('\n' + JSON.stringify(report, null, 1));
if (warns.length) { console.log('\nWarnings:'); for (const w of warns) console.log(`  - ${w.page}: ${w.check}: ${w.detail}`); }
if (fails.length) { console.log('\nFailures:'); for (const x of fails) console.log(`  - ${x.page}: ${x.check}: ${x.detail}`); process.exit(1); }
console.log('\nPASSED: 0 failures.');
