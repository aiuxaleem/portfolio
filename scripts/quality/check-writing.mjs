// Behaviour test for /writing (filters), /videos and the home page sections, with screenshots. Run after a build.
// node scripts/quality/check-writing.mjs [--dir=dist]
import fs from 'node:fs';
import { serve, launch, arg } from '../lib.mjs';
fs.mkdirSync('reports/writing', { recursive: true });
const dir = arg('dir', 'dist'); const tag = dir === 'dist' ? '' : '-production';
const server = await serve(dir, 4491); const browser = await launch(); const O = 'http://127.0.0.1:4491'; const out = { build: dir };
const open = async (path, { width = 1280, height = 720, js = true } = {}) => { const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', javaScriptEnabled: js }); const seen = []; await ctx.route(u => /youtube|ytimg|linkedin|licdn/.test(u.hostname), r => { seen.push(r.request().url()); r.abort(); }); const p = await ctx.newPage(); await p.goto(O + path, { waitUntil: 'load' }); await p.waitForTimeout(500); return { ctx, p, seen }; };

{ const { ctx, p, seen } = await open('/writing?theme=light'); const w = {};
  const shown = () => p.evaluate(() => [...document.querySelectorAll('[data-project-list] > li')].filter(li => !li.hidden).map(li => li.querySelector('[data-project]').dataset.status + ': ' + li.querySelector('.project-card-title').textContent.trim().slice(0, 44)));
  const count = () => p.evaluate(() => document.querySelector('[data-result-count]').textContent);
  w.h1 = await p.evaluate(() => document.querySelector('h1').textContent);
  w.total = (await shown()).length; w.countText = await count();
  w.order = (await p.evaluate(() => [...document.querySelectorAll('[data-project-list] time')].map(t => t.dateTime)));
  w.newestFirst = w.order.every((d, i) => i === 0 || w.order[i - 1] >= d);
  w.typeChips = await p.evaluate(() => [...document.querySelectorAll('[data-filter-status]')].map(b => b.textContent));
  w.topicChips = await p.evaluate(() => [...document.querySelectorAll('[data-filter-tag]')].map(b => b.textContent));
  w.liveRegion = await p.evaluate(() => { const c = document.querySelector('[data-result-count]'); return c.getAttribute('role') + ' / ' + c.getAttribute('aria-live'); });
  w.externalLinks = await p.evaluate(() => [...document.querySelectorAll('[data-project-list] a[target=_blank]')].every(a => a.rel.includes('noopener') && /opens LinkedIn in a new tab/.test(a.textContent)));
  // keyboard: focus the "LinkedIn article" chip and press Space
  await p.locator('[data-filter-status="article"]').focus(); await p.keyboard.press('Space');
  w.afterArticleFilter = { pressed: await p.getAttribute('[data-filter-status="article"]', 'aria-pressed'), count: await count(), shown: await shown() };
  // add a topic that no article has -> empty state
  const topic = p.locator('[data-filter-tag]').first(); w.topicUsed = await topic.textContent(); await topic.focus(); await p.keyboard.press('Enter');
  w.afterAddingTopic = { count: await count(), shown: (await shown()).length, emptyVisible: await p.evaluate(() => !document.querySelector('[data-project-empty]').hidden), emptyText: await p.evaluate(() => document.querySelector('[data-project-empty] .project-empty-title').textContent) };
  await p.screenshot({ path: `reports/writing/writing-empty-1280-light${tag}.png`, fullPage: true });
  await p.locator('[data-clear-filters]').click();
  w.afterClear = { count: await count(), shown: (await shown()).length, focusOn: await p.evaluate(() => document.activeElement.textContent) };
  await p.locator('[data-filter-status="linkedin"]').click(); w.linkedinOnly = { count: await count(), types: [...new Set((await shown()).map(s => s.split(':')[0]))] };
  await p.locator('[data-filter-status="linkedin"]').click();
  w.thirdPartyRequests = seen.length;
  await p.screenshot({ path: `reports/writing/writing-1280-light${tag}.png`, fullPage: true });
  out.writing = w; await ctx.close(); }
{ const { ctx, p } = await open('/writing?theme=dark', { width: 390, height: 844 }); out.writing390 = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth })); await p.screenshot({ path: `reports/writing/writing-390-dark${tag}.png`, fullPage: true }); await ctx.close(); }
{ const { ctx, p } = await open('/writing', { js: false }); out.writingNoJs = await p.evaluate(() => ({ filtersHidden: getComputedStyle(document.querySelector('[data-project-filters]')).display === 'none', items: document.querySelectorAll('[data-project-list] > li').length })); await ctx.close(); }

{ const { ctx, p, seen } = await open('/videos?theme=light'); out.videos = await p.evaluate(() => ({ h1: document.querySelector('h1').textContent, cards: document.querySelectorAll('.video-card').length, facades: document.querySelectorAll('.embed-video').length, iframes: document.querySelectorAll('iframe').length, primaryAction: document.querySelector('[data-hero-ctas] a').textContent.trim(), headings: [...document.querySelectorAll('main h1, main h2, main h3')].map(h => h.tagName[1]).join('') })); out.videos.thirdPartyRequests = seen.length; await p.screenshot({ path: `reports/writing/videos-1280-light${tag}.png`, fullPage: true }); await ctx.close(); }

{ const { ctx, p } = await open('/?theme=light'); out.home = await p.evaluate(() => { const ids = [...document.querySelectorAll('main section[data-section]')].map(s => s.id); const feeds = [...document.querySelectorAll('[data-home-feed]')]; const bg = s => getComputedStyle(s).backgroundColor; const prev = feeds[0]?.previousElementSibling, next = feeds.at(-1)?.nextElementSibling;
    return { sectionOrder: ids, newSections: feeds.map(s => ({ id: s.id, title: s.querySelector('h2').textContent, surface: s.dataset.surface, cards: s.querySelectorAll('.project-card, .video-card').length, allLink: s.querySelector('a[data-link]').getAttribute('href') })), surfaceBefore: prev ? prev.tagName + '#' + prev.id + ' ' + bg(prev) : null, surfaceAfter: next ? next.id + ' ' + bg(next) : null, fixturesShown: /fixture|deliberately long/i.test(feeds.map(s => s.textContent).join(' ')), h1Count: document.querySelectorAll('h1').length, headingSkips: (() => { const hs = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(h => +h.tagName[1]); return hs.filter((h, i) => i > 0 && h - hs[i - 1] > 1).length; })() }; });
  const first = p.locator('[data-home-feed]').first(); if (await first.count()) { await first.scrollIntoViewIfNeeded(); for (const [i, el] of (await p.locator('[data-home-feed]').all()).entries()) await el.screenshot({ path: `reports/writing/home-section-${i + 1}-1280-light${tag}.png` }); }
  await ctx.close(); }
{ const { ctx, p } = await open('/?theme=dark', { width: 390, height: 844 }); out.home390 = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth })); for (const [i, el] of (await p.locator('[data-home-feed]').all()).entries()) await el.screenshot({ path: `reports/writing/home-section-${i + 1}-390-dark${tag}.png` }); await ctx.close(); }
if (dir === 'dist') { const { ctx, p } = await open('/_states', { width: 1280, height: 900 }); for (const theme of ['light', 'dark']) { const sec = p.locator(`section[data-theme="${theme}"]`); out['statesHomeSections ' + theme] = await sec.locator('[data-home-feed]').count(); for (const [name, text] of [['feed', 'Writing feed: card and filters'], ['video', 'Video card']]) await sec.locator('h2', { hasText: text }).locator('..').screenshot({ path: `reports/writing/states-${name}-${theme}.png` }); for (const [i, el] of (await sec.locator('[data-home-feed]').all()).entries()) await el.screenshot({ path: `reports/writing/states-home-${i + 1}-${theme}.png` }); } await ctx.close(); }

await browser.close(); server.close();
fs.writeFileSync(`reports/writing/check-writing${tag}.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
