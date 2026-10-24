// Behaviour test for the LinkedIn pages (/posts: filters, posts loaded on request; /articles), /videos and the home page sections, with screenshots. Run after a build.
// node scripts/quality/check-writing.mjs [--dir=dist]
import fs from 'node:fs';
import { serve, launch, arg } from '../lib.mjs';
fs.mkdirSync('reports/writing', { recursive: true });
const dir = arg('dir', 'dist'); const tag = dir === 'dist' ? '' : '-production';
const server = await serve(dir, 4491); const browser = await launch(); const O = 'http://127.0.0.1:4491'; const out = { build: dir };
const open = async (path, { width = 1280, height = 720, js = true } = {}) => { const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', javaScriptEnabled: js }); const seen = []; await ctx.route(u => /youtube|ytimg|linkedin|licdn/.test(u.hostname), r => { seen.push(r.request().url()); r.abort(); }); const p = await ctx.newPage(); await p.goto(O + path, { waitUntil: 'load' }); await p.waitForTimeout(500); return { ctx, p, seen }; };

{ const { ctx, p, seen } = await open('/posts?theme=light'); const w = {};
  w.h1 = await p.evaluate(() => document.querySelector('h1').textContent); w.title = await p.title();
  w.menu = await p.evaluate(() => document.querySelector('header [data-nav-link][aria-current]')?.textContent.trim());
  w.headings = await p.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3')].map(h => h.tagName[1]).join(''));
  w.headingSkips = await p.evaluate(() => { const l = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(h => +h.tagName[1]); return l.some((n, i) => i > 0 && n > l[i - 1] + 1); });
  w.cards = await p.evaluate(() => document.querySelectorAll('[data-project-list] figure.embed-linkedin').length);
  w.order = await p.evaluate(() => [...document.querySelectorAll('[data-project-list] time')].map(t => t.dateTime));
  w.newestFirst = w.order.every((d, i) => i === 0 || w.order[i - 1] >= d);
  w.externalLinks = await p.evaluate(() => [...document.querySelectorAll('main a[target=_blank]')].every(a => a.rel.includes('noopener') && /new tab/.test(a.textContent)));
  w.uniqueNames = await p.evaluate(() => { const n = [...document.querySelectorAll('[data-embed-load], .embed-card-link')].map(e => e.textContent.trim()); return new Set(n).size === n.length; });
  // filters: the first chip narrows the list and the live count says so; "Clear filters" brings every post back
  const chip = p.locator('[data-project-filters] button[aria-pressed]').first();
  if (await chip.count()) { await chip.click(); await p.waitForTimeout(200);
    w.filtered = await p.evaluate(() => ({ shown: [...document.querySelectorAll('[data-project-list] > li')].filter(li => !li.hidden).length, count: document.querySelector('[data-project-filters] [role="status"]')?.textContent.trim() }));
    const clear = p.locator('[data-project-filters] [data-clear-filters]:visible').first(); if (await clear.count()) { await clear.click(); await p.waitForTimeout(200); }
    w.cleared = await p.evaluate(() => [...document.querySelectorAll('[data-project-list] > li')].filter(li => !li.hidden).length); }
  // a post loads only when asked for: the request is blocked here, so the card must end in its failed state with the link still there
  w.thirdPartyBeforeAsking = seen.length;
  const first = p.locator('[data-project-list] > li:not([hidden]) figure').first(); await first.locator('[data-embed-load]').click(); await p.waitForTimeout(500);
  w.embed = { asked: await first.getAttribute('data-embed-src'), stateAfterPress: await first.getAttribute('data-state'), requests: seen.filter(u => /linkedin\.com\/embed/.test(u)).length, linkKept: await first.locator('.embed-card-link').isVisible() };
  await p.screenshot({ path: `reports/writing/posts-1280-light${tag}.png`, fullPage: true });
  out.posts = w; await ctx.close(); }
{ const { ctx, p } = await open('/posts?theme=dark', { width: 390, height: 844 }); out.posts390 = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth })); await p.screenshot({ path: `reports/writing/posts-390-dark${tag}.png`, fullPage: true }); await ctx.close(); }
{ const { ctx, p } = await open('/posts', { js: false }); out.postsNoJs = await p.evaluate(() => ({ filtersHidden: [...document.querySelectorAll('[data-project-filters]')].every(n => n.getBoundingClientRect().height === 0), everyItemListed: [...document.querySelectorAll('[data-project-list] > li')].every(li => li.getBoundingClientRect().height > 0), items: document.querySelectorAll('[data-project-list] > li').length })); await ctx.close(); }
{ const { ctx, p } = await open('/articles?theme=light'); out.articles = await p.evaluate(() => ({ h1: document.querySelector('h1').textContent, cards: document.querySelectorAll('main .project-card').length, menu: document.querySelector('header [data-nav-link][aria-current]')?.textContent.trim(), headings: [...document.querySelectorAll('main h1, main h2, main h3')].map(h => h.tagName[1]).join(''), externalLinks: [...document.querySelectorAll('main a[target=_blank]')].every(a => a.rel.includes('noopener') && /new tab/.test(a.textContent)) })); await p.screenshot({ path: `reports/writing/articles-1280-light${tag}.png`, fullPage: true }); await ctx.close(); }
{ const { ctx, p } = await open('/read'); out.readRedirect = await p.evaluate(() => location.pathname); await ctx.close(); }

{ const { ctx, p, seen } = await open('/videos?theme=light'); out.videos = await p.evaluate(() => ({ h1: document.querySelector('h1').textContent, cards: document.querySelectorAll('.video-card').length, facades: document.querySelectorAll('.embed-video').length, iframes: document.querySelectorAll('iframe').length, primaryAction: document.querySelector('[data-hero-ctas] a').textContent.trim(), headings: [...document.querySelectorAll('main h1, main h2, main h3')].map(h => h.tagName[1]).join('') })); out.videos.thirdPartyRequests = seen.length; await p.screenshot({ path: `reports/writing/videos-1280-light${tag}.png`, fullPage: true }); await ctx.close(); }

{ const { ctx, p } = await open('/?theme=light'); out.home = await p.evaluate(() => { const ids = [...document.querySelectorAll('main section[data-section]')].map(s => s.id); const feeds = [...document.querySelectorAll('[data-home-feed]')]; const bg = s => getComputedStyle(s).backgroundColor; const prev = feeds[0]?.previousElementSibling, next = feeds.at(-1)?.nextElementSibling;
    return { sectionOrder: ids, newSections: feeds.map(s => ({ id: s.id, title: s.querySelector('h2').textContent, surface: s.dataset.surface, cards: s.querySelectorAll('.project-card, .video-card').length, allLink: s.querySelector('a[data-link]').getAttribute('href') })), surfaceBefore: prev ? prev.tagName + '#' + prev.id + ' ' + bg(prev) : null, surfaceAfter: next ? next.id + ' ' + bg(next) : null, fixturesShown: /fixture|deliberately long/i.test(feeds.map(s => s.textContent).join(' ')), h1Count: document.querySelectorAll('h1').length, headingSkips: (() => { const hs = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(h => +h.tagName[1]); return hs.filter((h, i) => i > 0 && h - hs[i - 1] > 1).length; })() }; });
  const first = p.locator('[data-home-feed]').first(); if (await first.count()) { await first.scrollIntoViewIfNeeded(); for (const [i, el] of (await p.locator('[data-home-feed]').all()).entries()) await el.screenshot({ path: `reports/writing/home-section-${i + 1}-1280-light${tag}.png` }); }
  await ctx.close(); }
{ const { ctx, p } = await open('/?theme=dark', { width: 390, height: 844 }); out.home390 = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth })); for (const [i, el] of (await p.locator('[data-home-feed]').all()).entries()) await el.screenshot({ path: `reports/writing/home-section-${i + 1}-390-dark${tag}.png` }); await ctx.close(); }
if (dir === 'dist') { const { ctx, p } = await open('/_states', { width: 1280, height: 900 }); for (const theme of ['light', 'dark']) { const sec = p.locator(`section[data-theme="${theme}"]`); out['statesHomeSections ' + theme] = await sec.locator('[data-home-feed]').count(); for (const [name, text] of [['feed', 'Feed card and filters'], ['video', 'Video card']]) await sec.locator('h2', { hasText: text }).locator('..').screenshot({ path: `reports/writing/states-${name}-${theme}.png` }); for (const [i, el] of (await sec.locator('[data-home-feed]').all()).entries()) await el.screenshot({ path: `reports/writing/states-home-${i + 1}-${theme}.png` }); } await ctx.close(); }

await browser.close(); server.close();
fs.writeFileSync(`reports/writing/check-writing${tag}.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
