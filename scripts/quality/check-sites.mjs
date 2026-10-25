// Behaviour test for the three connected websites (docs/SITES.md): on each, the bar of websites at the top names all
// three, links to the other two and marks its own; the header's "Let's talk", on every page but Contact, leads to that
// website's contact page; the bar slides up after the first scroll and comes back when a link in it has focus; /v2 (the
// ended A/B test) goes Home.
// Against a production build (default: dist, where the websites are /job and /clients) or the live sites (--live).
// node scripts/quality/check-sites.mjs [--live]
import { launch, serve, arg } from '../lib.mjs';
const live = arg('live', false) !== false;
const MAIN = 'https://aiuxaleem-portfolio-app.vercel.app', JOB = 'https://aiuxaleem-job.vercel.app', CLIENTS = 'https://aiuxaleem-clients.vercel.app'; // src/lib/sites.ts
const server = live ? null : await serve('dist', 4554);
const local = 'http://127.0.0.1:4554';
const sites = live
  ? [{ key: 'main', home: MAIN + '/', contact: '/contact' }, { key: 'job', home: JOB + '/', contact: '/contact' }, { key: 'clients', home: CLIENTS + '/', contact: '/contact' }]
  : [{ key: 'main', home: local + '/', contact: '/contact' }, { key: 'job', home: local + '/job', contact: '/contact' }, { key: 'clients', home: local + '/clients', contact: '/contact' }];
const browser = await launch(); const fails = []; const fail = m => fails.push(m);
for (const [w, h] of [[1280, 800], [360, 740]]) {
  const p = await (await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })).newPage();
  for (const s of sites) {
    await p.goto(s.home, { waitUntil: 'load' });
    const bar = await p.evaluate(() => {
      const nav = document.querySelector('[data-site-switch]'); if (!nav) return null;
      const links = [...nav.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim(), current: a.getAttribute('aria-current'), box: a.getBoundingClientRect().toJSON() }));
      const talk = document.querySelector('[data-hdr-talk] a, [data-site-header] a.ui-button-secondary');
      return { name: nav.getAttribute('aria-label'), links, talk: talk ? { text: talk.textContent.trim(), href: talk.getAttribute('href') } : null, top: nav.getBoundingClientRect().top };
    });
    const at = `${s.key} at ${w}px`;
    if (!bar) { fail(`${at}: no bar of websites`); continue; }
    if (bar.links.length !== 3) fail(`${at}: the bar has ${bar.links.length} links, not 3`);
    const current = bar.links.filter(l => l.current === 'true');
    if (current.length !== 1) fail(`${at}: ${current.length} links marked current`);
    const others = { main: [JOB, CLIENTS], job: [MAIN, CLIENTS], clients: [MAIN, JOB] }[s.key];
    for (const o of others) if (!bar.links.some(l => (l.href || '').replace(/\/$/, '') === o)) fail(`${at}: no link to ${o}`);
    if (bar.links.some(l => l.box.height < 44 || l.box.width < 44)) fail(`${at}: a link in the bar is smaller than 44 by 44`);
    if (bar.links.some(l => l.box.right > w + 1)) fail(`${at}: a link in the bar runs off the screen`);
    if (Math.round(bar.top) !== 0) fail(`${at}: the bar is not at the top of the page (${bar.top})`);
    if (!bar.talk || bar.talk.text !== "Let's talk" || bar.talk.href !== s.contact) fail(`${at}: the header button is ${JSON.stringify(bar.talk)}, not "Let's talk" to ${s.contact}`);
    // After a scroll the bar is out of view; a link in it with focus brings it back.
    // The header is marked on the next animation frame after a scroll; a heavy page may take a moment.
    await p.evaluate(() => window.scrollTo(0, 600));
    await p.waitForFunction(() => document.querySelector('[data-site-header]')?.hasAttribute('data-scrolled'), null, { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(100);
    const hidden = await p.evaluate(() => document.querySelector('[data-site-switch]').getBoundingClientRect().bottom);
    if (hidden > 1) fail(`${at}: the bar is still in view after scrolling (bottom ${hidden})`);
    await p.focus('[data-site-switch] a'); await p.waitForTimeout(500);
    const back = await p.evaluate(() => document.querySelector('[data-site-switch]').getBoundingClientRect().top);
    if (Math.round(back) !== 0) fail(`${at}: a focused link in the bar is off screen (top ${back})`);
  }
  await p.context().close();
}
/* Every page but Contact has "Let's talk" in its header, to its own website's contact form. */
{
  const pages = { main: ['case-studies', 'work', 'about', 'services', 'resume', 'resources', 'ai-tools', 'videos', 'read'], job: ['case-studies', 'work', 'experience', 'resume'], clients: ['case-studies', 'work', 'resources', 'ai-tools', 'about'] };
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  for (const s of sites) for (const route of pages[s.key]) {
    await p.goto(`${s.home.replace(/\/$/, '')}/${route}`, { waitUntil: 'load' });
    // A page may rewrite its own address once loaded (Read keeps its section in it); read the header after it settles.
    const read = () => p.evaluate(() => { const a = document.querySelector('[data-hdr-talk] a'); return a && !a.closest('[aria-hidden="true"]') ? { text: a.textContent.trim(), href: a.getAttribute('href') } : null; });
    const talk = await read().catch(async () => { await p.waitForLoadState('load'); return read(); });
    if (!talk || talk.text !== "Let's talk" || talk.href !== s.contact) fail(`${s.key} /${route}: the header button is ${JSON.stringify(talk)}`);
  }
  await p.context().close();
}
if (live) {
  const p = await browser.newPage(); const res = await p.goto(MAIN + '/v2', { waitUntil: 'load' });
  if (new URL(p.url()).pathname !== '/' || res?.status() !== 200) fail(`/v2 did not lead Home (${p.url()})`);
}
await browser.close(); server?.close();
console.log(fails.length ? `FAILED:\n  - ${fails.join('\n  - ')}` : `PASSED: the bar of websites and "Let's talk" on all three websites, at two widths${live ? ', and /v2 leads Home' : ''}.`);
process.exit(fails.length ? 1 : 0);
