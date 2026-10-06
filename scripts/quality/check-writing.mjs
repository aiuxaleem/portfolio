// Behaviour test for the Read page at /read (sections, pages, posts loaded on request), /videos and the home page sections, with screenshots. Run after a build.
// node scripts/quality/check-writing.mjs [--dir=dist]
import fs from 'node:fs';
import { serve, launch, arg } from '../lib.mjs';
fs.mkdirSync('reports/writing', { recursive: true });
const dir = arg('dir', 'dist'); const tag = dir === 'dist' ? '' : '-production';
const server = await serve(dir, 4491); const browser = await launch(); const O = 'http://127.0.0.1:4491'; const out = { build: dir };
const open = async (path, { width = 1280, height = 720, js = true } = {}) => { const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', javaScriptEnabled: js }); const seen = []; await ctx.route(u => /youtube|ytimg|linkedin|licdn/.test(u.hostname), r => { seen.push(r.request().url()); r.abort(); }); const p = await ctx.newPage(); await p.goto(O + path, { waitUntil: 'load' }); await p.waitForTimeout(500); return { ctx, p, seen }; };

{ const { ctx, p, seen } = await open('/read?theme=light'); const w = {};
  const shown = id => p.evaluate(i => [...document.querySelector(`[data-paged="${i}"]`).children].filter(li => !li.hidden).length, id);
  const status = () => p.evaluate(() => document.querySelector('#linkedin-posts [role="status"]').textContent.trim());
  w.h1 = await p.evaluate(() => document.querySelector('h1').textContent); w.title = await p.title();
  w.menu = await p.evaluate(() => document.querySelector('header nav a[aria-current="page"]')?.textContent.trim());
  w.sections = await p.evaluate(() => [...document.querySelectorAll('main section[id] > .page-section-head h2')].map(h => h.textContent));
  w.onThisPage = await p.evaluate(() => [...document.querySelectorAll('nav[aria-label="On this page"] a')].map(a => `${a.getAttribute('href')} ${a.textContent.trim()}`));
  w.linksLand = await p.evaluate(() => [...document.querySelectorAll('nav[aria-label="On this page"] a')].every(a => document.querySelector(a.getAttribute('href'))));
  w.blogCards = await p.evaluate(() => document.querySelectorAll('#blog-posts .project-card').length);
  w.linkedin = { total: await p.evaluate(() => document.querySelector('[data-paged="linkedin-posts"]').children.length), shown: await shown('linkedin-posts'), status: await status(), loadButtons: await p.evaluate(() => document.querySelectorAll('#linkedin-posts [data-embed-load]').length) };
  w.order = await p.evaluate(() => [...document.querySelectorAll('[data-paged="linkedin-posts"] time')].map(t => t.dateTime));
  w.newestFirst = w.order.slice(0, -1).every((d, i) => i === 0 || w.order[i - 1] >= d);
  w.externalLinks = await p.evaluate(() => [...document.querySelectorAll('main section[id] a[target=_blank]')].every(a => a.rel.includes('noopener') && /new tab/.test(a.textContent)));
  w.uniqueNames = await p.evaluate(() => { const n = [...document.querySelectorAll('#linkedin-posts [data-embed-load], #linkedin-posts .embed-card-link')].map(e => e.textContent.trim()); return new Set(n).size === n.length; });
  // keyboard: go to the next page with Enter; focus moves to the section heading, under the sticky header
  await p.locator('[data-pager="linkedin-posts"] [data-pager-next]').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  w.page2 = { shown: await shown('linkedin-posts'), status: await status(), address: await p.evaluate(() => location.search), focusOn: await p.evaluate(() => document.activeElement.id), headingBelowHeader: await p.evaluate(() => document.getElementById('linkedin-posts-title').getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().bottom - 1),
    current: await p.evaluate(() => document.querySelector('[data-pager="linkedin-posts"] [aria-current="page"]').textContent.trim()), olderHidden: await p.evaluate(() => getComputedStyle(document.querySelector('[data-pager="linkedin-posts"] [data-pager-next]')).visibility) };
  await p.screenshot({ path: `reports/writing/writing-page2-1280-light${tag}.png` });
  await p.locator('[data-pager="linkedin-posts"] [data-pager-prev]').click(); await p.waitForTimeout(300);
  w.backToPage1 = { shown: await shown('linkedin-posts'), status: await status(), address: await p.evaluate(() => location.search) };
  // a post loads only when asked for: the request is blocked here, so the card must end in its failed state with the link still there
  w.thirdPartyBeforeAsking = seen.length;
  const first = p.locator('[data-paged="linkedin-posts"] > li:not([hidden]) figure').first(); await first.locator('[data-embed-load]').click();
  w.embed = { asked: await first.getAttribute('data-embed-src'), stateAfterPress: await first.getAttribute('data-state'), requests: seen.filter(u => /linkedin\.com\/embed/.test(u)).length, linkKept: await first.locator('.embed-card-link').isVisible() };
  await p.screenshot({ path: `reports/writing/writing-1280-light${tag}.png`, fullPage: true });
  out.writing = w; await ctx.close(); }
{ const { ctx, p } = await open('/read?linkedin-posts=2&theme=dark', { width: 390, height: 844 }); out.writing390 = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth, linkedToPage2: document.querySelector('#linkedin-posts [role="status"]').textContent.trim() })); await p.screenshot({ path: `reports/writing/writing-390-dark${tag}.png`, fullPage: true }); await ctx.close(); }
{ const { ctx, p } = await open('/read', { js: false }); out.writingNoJs = await p.evaluate(() => ({ pagesHidden: [...document.querySelectorAll('[data-pager]')].every(n => n.getBoundingClientRect().height === 0), everyItemListed: [...document.querySelectorAll('[data-paged] > li')].every(li => li.getBoundingClientRect().height > 0), items: document.querySelectorAll('[data-paged] > li').length })); await ctx.close(); }

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
