// Behaviour test for the blog and the embeds, with screenshots. Run after a quality build (QUALITY_BUILD=1).
// Third-party hosts are intercepted: "ok" answers with a stub page, "hang" never answers (a blocked or dead network).
import fs from 'node:fs';
import { serve, launch } from '../lib.mjs';
fs.mkdirSync('reports/blog', { recursive: true });
const server = await serve('dist', 4490); const browser = await launch(); const O = 'http://127.0.0.1:4490'; const out = {};
const THIRD = /youtube|ytimg|linkedin|licdn/;

async function open(path, { mode = 'ok', width = 1280, height = 720, js = true, offline = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', javaScriptEnabled: js });
  const seen = [], net = { mode };
  await ctx.route(u => THIRD.test(u.hostname), r => { seen.push(r.request().url()); if (net.mode === 'ok') r.fulfill({ contentType: 'text/html', body: '<p>stub</p>' }); });
  const p = await ctx.newPage(); await p.goto(O + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
  if (offline) await ctx.setOffline(true);
  return { ctx, p, seen, net };
}
const state = (p, sel) => p.evaluate(s => document.querySelector(s).dataset.state, sel);
const box = (p, sel) => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(r.top + scrollY)].join(','); }, sel);
const POST = '/blog/rich-content-fixture?theme=light';

// YouTube: facade, keyboard, load, no layout shift
{ const { ctx, p, seen } = await open(POST); const y = {};
  y.thirdPartyRequestsBeforeClick = seen.length;
  y.iframesBeforeClick = await p.evaluate(() => document.querySelectorAll('iframe').length);
  y.frameBoxBefore = await box(p, '.embed-video .embed-frame'); y.nextBlockBefore = await box(p, '.embed-linkedin');
  y.playName = await p.evaluate(() => document.querySelector('.embed-play').textContent.trim());
  await p.locator('.embed-play').focus(); y.playFocusOutline = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineWidth; });
  await p.keyboard.press('Enter'); await p.waitForFunction(() => document.querySelector('.embed-video').dataset.state === 'loaded', null, { timeout: 5000 });
  y.stateAfterEnter = await state(p, '.embed-video');
  y.iframe = await p.evaluate(() => { const f = document.querySelector('.embed-video iframe'); return { src: f.src, title: f.title, focusInsideEmbed: !!document.activeElement.closest('.embed-video'), focusOn: document.activeElement.tagName }; });
  y.frameBoxAfter = await box(p, '.embed-video .embed-frame'); y.nextBlockAfter = await box(p, '.embed-linkedin');
  y.requests = seen.map(u => new URL(u).hostname);
  out.youtube = y; await ctx.close(); }

// YouTube: loading, then failed after the time limit, then retry
{ const { ctx, p, net } = await open(POST, { mode: 'hang' }); const y = {};
  await p.locator('.embed-play').click(); await p.waitForTimeout(300);
  y.stateWhileWaiting = await state(p, '.embed-video'); y.statusText = await p.evaluate(() => document.querySelector('.embed-video .embed-status').textContent);
  await p.screenshot({ path: 'reports/blog/youtube-loading-1280-light.png', clip: await p.evaluate(() => { const r = document.querySelector('.embed-video').getBoundingClientRect(); scrollTo(0, r.top + scrollY - 40); const q = document.querySelector('.embed-video').getBoundingClientRect(); return { x: q.x, y: q.y, width: q.width, height: q.height }; }) });
  await p.waitForFunction(() => document.querySelector('.embed-video').dataset.state === 'failed', null, { timeout: 16000 });
  y.stateAfterTimeLimit = await state(p, '.embed-video');
  y.focusAfterFail = await p.evaluate(() => document.activeElement.textContent.trim());
  y.failedText = await p.evaluate(() => document.querySelector('.embed-failed p').textContent);
  y.fallbackLink = await p.evaluate(() => document.querySelector('.embed-failed a').href);
  y.iframeRemoved = await p.evaluate(() => !document.querySelector('.embed-video iframe'));
  y.failedButtons = await p.evaluate(() => [...document.querySelectorAll('.embed-failed .ui-button')].map(b => { const r = b.getBoundingClientRect(); return `${b.textContent.trim().slice(0, 16)} ${Math.round(r.width)}x${Math.round(r.height)}`; }));
  net.mode = 'ok';
  await p.keyboard.press('Enter'); await p.waitForFunction(() => document.querySelector('.embed-video').dataset.state === 'loaded', null, { timeout: 5000 }).catch(() => {});
  y.stateAfterRetry = await state(p, '.embed-video');
  out.youtubeFailure = y; await ctx.close(); }

// Offline: fails at once
{ const { ctx, p } = await open(POST, { offline: true }); await p.locator('.embed-play').click(); await p.waitForTimeout(300);
  out.offline = { youtube: await state(p, '.embed-video') }; await p.locator('.embed-linkedin [data-embed-load]').click(); await p.waitForTimeout(300); out.offline.linkedin = await state(p, '.embed-linkedin'); await ctx.close(); }

// LinkedIn post: facade card, load, failed fallback
{ const { ctx, p, seen } = await open(POST); const l = {};
  l.facade = await p.evaluate(() => { const f = document.querySelector('.embed-linkedin'); return { state: f.dataset.state, link: f.querySelector('.embed-card-link').href, button: f.querySelector('[data-embed-load]').textContent.trim() }; });
  await p.locator('.embed-linkedin [data-embed-load]').focus(); await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('.embed-linkedin').dataset.state === 'loaded', null, { timeout: 5000 });
  l.loaded = await p.evaluate(() => { const f = document.querySelector('.embed-linkedin iframe'); return { src: f.src, title: f.title, linkStillShown: !!document.querySelector('.embed-linkedin .embed-card-link').offsetParent }; });
  l.requests = seen.map(u => new URL(u).hostname);
  out.linkedinPost = l; await ctx.close(); }
{ const { ctx, p } = await open(POST, { mode: 'hang' }); const l = {};
  await p.locator('.embed-linkedin [data-embed-load]').click(); await p.waitForTimeout(300); l.stateWhileWaiting = await state(p, '.embed-linkedin'); l.statusText = await p.evaluate(() => document.querySelector('.embed-linkedin .embed-status').textContent);
  await p.waitForFunction(() => document.querySelector('.embed-linkedin').dataset.state === 'failed', null, { timeout: 16000 });
  l.failed = await p.evaluate(() => { const f = document.querySelector('.embed-linkedin'); return { state: f.dataset.state, message: f.querySelector('.embed-card-failed').offsetParent ? f.querySelector('.embed-card-failed').textContent.trim() : 'hidden', link: !!f.querySelector('.embed-card-link').offsetParent, retryButton: !!f.querySelector('[data-embed-load]').offsetParent, focus: document.activeElement.textContent.trim() }; });
  out.linkedinPostFailure = l; await ctx.close(); }

// LinkedIn article card, and the page itself
{ const { ctx, p, seen } = await open(POST); const a = {};
  a.articleCard = await p.evaluate(() => { const c = document.querySelector('.embed-article'); const l = c.querySelector('a'); return { href: l.href, name: l.textContent.trim(), links: c.querySelectorAll('a').length, time: c.querySelector('time')?.dateTime }; });
  a.canonical = await p.evaluate(() => document.querySelector('link[rel=canonical]').href);
  a.originNote = await p.evaluate(() => document.querySelector('.post-origin').textContent.trim());
  a.kicker = await p.evaluate(() => document.querySelector('article .case-kicker').textContent.trim());
  a.dates = await p.evaluate(() => document.querySelector('.post-dates').textContent.trim().replace(/\s+/g, ' '));
  a.headings = await p.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3')].map(h => h.tagName[1]).join(''));
  a.related = await p.evaluate(() => [...document.querySelectorAll('#related-title ~ div .project-card-title')].map(h => h.textContent.trim().slice(0, 40)));
  a.tagLinks = await p.evaluate(() => [...document.querySelectorAll('.post-tags a')].map(x => x.getAttribute('href')));
  a.codeHighlighterInlineColours = await p.evaluate(() => document.querySelectorAll('.post-code [style*="color"]').length);
  a.thirdPartyRequestsOnLoad = seen.length;
  out.post = a;
  await p.screenshot({ path: 'reports/blog/post-1280-light.png', fullPage: true }); await ctx.close(); }

// Table and code scroll inside their own box at 320; the page does not
for (const w of [320, 390]) { const { ctx, p } = await open(POST, { width: w, height: 800 });
  out['overflow at ' + w] = await p.evaluate(() => { const t = document.querySelector('.post-table'), c = document.querySelector('.post-code'); return { pageScrolls: document.documentElement.scrollWidth > innerWidth, table: `${t.scrollWidth} inside ${t.clientWidth}`, tableFocusable: t.tabIndex === 0, code: `${c.scrollWidth} inside ${c.clientWidth}`, galleryColumns: getComputedStyle(document.querySelector('.post-gallery')).gridTemplateColumns.split(' ').length }; });
  await p.locator('.post-table').focus(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
  out['overflow at ' + w].tableScrolledByKeyboard = await p.evaluate(() => document.querySelector('.post-table').scrollLeft > 0);
  if (w === 390) { await p.screenshot({ path: 'reports/blog/post-390-light.png', fullPage: true }); await p.goto(O + '/blog/rich-content-fixture?theme=dark'); await p.waitForTimeout(400); await p.screenshot({ path: 'reports/blog/post-390-dark.png', fullPage: true }); }
  await ctx.close(); }

// Without JavaScript: the links are still there
{ const { ctx, p } = await open(POST, { js: false });
  out.noJs = await p.evaluate(() => ({ youtubeLink: document.querySelector('.embed-video figcaption a').href, linkedinLink: document.querySelector('.embed-linkedin .embed-card-link').href, articleLink: document.querySelector('.embed-article a').href })); await ctx.close(); }

// Index, pagination, tag pages, stress post, RSS
{ const { ctx, p } = await open('/blog?theme=light'); const b = {};
  b.index = await p.evaluate(() => ({ h1: document.querySelector('h1').textContent, count: document.querySelector('.project-filter-count').textContent.trim(), cards: document.querySelectorAll('.project-card').length, pages: [...document.querySelectorAll('.post-pagination ol a')].map(a => a.textContent.trim() + (a.getAttribute('aria-current') ? ' (current)' : '')), next: document.querySelector('.post-pagination [rel=next]')?.getAttribute('href'), topicLinks: [...document.querySelectorAll('.post-tags a')].map(a => a.getAttribute('href')) }));
  await p.screenshot({ path: 'reports/blog/index-1280-light.png', fullPage: true });
  await p.goto(O + '/blog/page/2'); b.page2 = await p.evaluate(() => ({ title: document.title, cards: document.querySelectorAll('.project-card').length, current: document.querySelector('.post-pagination [aria-current]').textContent.trim(), prev: document.querySelector('.post-pagination [rel=prev]')?.getAttribute('href'), canonical: document.querySelector('link[rel=canonical]').href }));
  await p.goto(O + '/blog/tag/unpublished-topic'); b.emptyTag = await p.evaluate(() => ({ h1: document.querySelector('h1').textContent, message: document.querySelector('.project-empty-title').textContent, action: document.querySelector('.project-empty a').textContent.trim() + ' -> ' + document.querySelector('.project-empty a').getAttribute('href'), robots: document.querySelector('meta[name=robots]')?.content }));
  await p.screenshot({ path: 'reports/blog/tag-empty-1280-light.png', fullPage: true });
  await p.goto(O + '/blog/tag/design-systems'); b.tag = await p.evaluate(() => ({ h1: document.querySelector('h1').textContent, cards: document.querySelectorAll('.project-card').length, currentChip: document.querySelector('.post-tags [aria-current]')?.textContent }));
  await p.goto(O + '/blog/stress-fixture'); b.stressPost = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth, cover: !!document.querySelector('article .project-cover'), subtitle: document.querySelectorAll('article header p').length, tags: document.querySelectorAll('.post-tags a').length }));
  const rss = await (await p.request.get(O + '/rss.xml')).text(); b.rss = { items: (rss.match(/<item>/g) || []).length, hasFixture: /fixture/i.test(rss), firstLink: (rss.match(/<item><title>[^<]*<\/title><link>([^<]*)/) || [])[1] };
  out.blog = b; await ctx.close(); }
{ const { ctx, p } = await open('/blog/stress-fixture?theme=light', { width: 320, height: 568 }); out.stressAt320 = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth, h1Width: Math.round(document.querySelector('h1').getBoundingClientRect().width) })); await p.screenshot({ path: 'reports/blog/stress-320-light.png', fullPage: true }); await ctx.close(); }

// Embed states on /_states, both themes
for (const theme of ['light', 'dark']) { const { ctx, p } = await open('/_states', { width: 1280, height: 900 });
  const sec = p.locator(`section[data-theme="${theme}"]`);
  for (const [name, text] of [['youtube', 'Embed: YouTube'], ['linkedin-post', 'Embed: LinkedIn post'], ['linkedin-article', 'Embed: LinkedIn article'], ['blocks', 'Blog: post card and content blocks']]) await sec.locator('h2', { hasText: text }).locator('..').screenshot({ path: `reports/blog/states-${name}-${theme}.png` });
  await ctx.close(); }

await browser.close(); server.close();
fs.writeFileSync('reports/blog/check-blog.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
