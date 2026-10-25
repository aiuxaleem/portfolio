// Behaviour test for the A/B test (docs/AB_TEST.md) against a running site where it is on (npm run dev, or the Vercel
// site): the split, the overrides, staying in version 2, robots left alone, the contact subject from the address.
// node scripts/quality/check-ab.mjs [--origin=http://127.0.0.1:4321]
import { launch, arg } from '../lib.mjs';
const origin = String(arg('origin', 'http://127.0.0.1:4321')).replace(/\/$/, '');
const browser = await launch(); const out = {}; const fails = [];
const fail = m => fails.push(m);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
/* A visitor: a normal browser (the test's own browser announces itself as automated, which the split leaves alone), with
   the coin toss fixed. */
const visitor = async (coin, ua = UA) => {
  const ctx = await browser.newContext({ userAgent: ua });
  await ctx.addInitScript(c => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); if (c !== null) Math.random = () => c; localStorage.setItem('aiuxaleem-owner', '1'); }, coin);
  return { ctx, p: await ctx.newPage() };
};
const path = p => new URL(p.url()).pathname.replace(/\.html$/, '');
const CLIENTS = 'https://aiuxaleem-clients.vercel.app'; // SUB_SITES.clients.live in src/lib/sites.ts

{ const { ctx, p } = await visitor(0.1); await p.goto(origin + '/', { waitUntil: 'load' }); out.coinLow = { at: path(p), stored: await p.evaluate(() => localStorage.getItem('aiuxaleem-ab')) };
  if (out.coinLow.at !== '/' || out.coinLow.stored !== '1') fail('a visitor drawn for version 1 did not stay on Home');
  await p.goto(origin + '/services', { waitUntil: 'load' }); out.v1Stays = path(p); if (out.v1Stays !== '/services') fail('a version 1 visitor was moved off Services');
  await ctx.close(); }
{ const { ctx, p } = await visitor(0.9); await p.goto(origin + '/', { waitUntil: 'load' }); out.coinHigh = { at: path(p), stored: await p.evaluate(() => localStorage.getItem('aiuxaleem-ab')) };
  if (out.coinHigh.at !== '/v2' || out.coinHigh.stored !== '2') fail('a visitor drawn for version 2 did not land on /v2');
  await p.goto(origin + '/work', { waitUntil: 'load' });
  out.v2Links = await p.evaluate(() => ({ home: [...document.querySelectorAll('header a')].find(a => a.textContent.trim() === 'Home')?.getAttribute('href'), talk: [...document.querySelectorAll('header a')].find(a => /Let.s talk/.test(a.textContent))?.getAttribute('href') }));
  if (out.v2Links.home !== '/v2' || out.v2Links.talk !== '/contact') fail('a version 2 visitor on a shared page is not led to the fork: ' + JSON.stringify(out.v2Links));
  const toClients = p.waitForRequest(r => r.url().startsWith(CLIENTS), { timeout: 15000 }).catch(() => null); await p.goto(origin + '/services', { waitUntil: 'commit' }).catch(() => {}); out.v2Services = (await toClients)?.url() || path(p); if (!String(out.v2Services).startsWith(CLIENTS)) fail('a version 2 visitor opening Services was not taken to the website for clients: ' + out.v2Services);
  await ctx.close(); }
{ const { ctx, p } = await visitor(0.1); await p.goto(origin + '/?ab=2', { waitUntil: 'load' }); out.forceTwo = path(p);
  await p.goto(origin + '/v2?ab=1', { waitUntil: 'load' }); out.forceOne = path(p);
  if (out.forceTwo !== '/v2' || out.forceOne !== '/') fail(`?ab= did not choose the version (${out.forceTwo}, ${out.forceOne})`);
  await ctx.close(); }
{ const { ctx, p } = await visitor(0.9, 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'); await p.goto(origin + '/', { waitUntil: 'load' }); out.robot = { at: path(p), stored: await p.evaluate(() => localStorage.getItem('aiuxaleem-ab')) };
  if (out.robot.at !== '/' || out.robot.stored) fail('a search robot was put in the test');
  await ctx.close(); }
{ const ctx = await browser.newContext(); const p = await ctx.newPage(); await p.goto(origin + '/', { waitUntil: 'load' }); out.automated = path(p); if (out.automated !== '/') fail('an automated browser (the quality checks) was put in the test'); await ctx.close(); }
{ const { ctx, p } = await visitor(null); await p.goto(origin + '/job/contact', { waitUntil: 'load' }); out.topicRole = await p.evaluate(() => document.querySelector('select[name="topic"]')?.value);
  await p.goto(origin + '/clients/contact', { waitUntil: 'load' }); out.topicProject = await p.evaluate(() => document.querySelector('select[name="topic"]')?.value);
  if (out.topicRole !== 'A full-time role' || out.topicProject !== 'A project or contract') fail('a website\'s contact page did not set its subject');
  await p.goto(origin + '/v2', { waitUntil: 'load' }); out.v2Noindex = await p.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content'));
  if (!/noindex/.test(out.v2Noindex || '')) fail('the version 2 fork is not kept out of search');
  await ctx.close(); }
{ const { ctx, p } = await visitor(0.9); await p.goto(origin + '/job', { waitUntil: 'load' }); out.websiteNotSplit = { at: path(p), stored: await p.evaluate(() => localStorage.getItem('aiuxaleem-ab')) };
  if (out.websiteNotSplit.at !== '/job' || out.websiteNotSplit.stored) fail('an audience website was put in the split');
  await ctx.close(); }
await browser.close();
console.log(JSON.stringify(out, null, 1));
if (fails.length) { for (const f of fails) console.log('  FAIL ' + f); console.log(`FAILED: ${fails.length}`); process.exit(1); }
console.log('PASSED: the split, both overrides, Home to the fork and Services to the website for clients in version 2, robots, automated browsers and the audience websites left out, each website\'s contact subject.');
