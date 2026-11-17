// Behaviour test for the private work (docs/PRIVATE_WORK.md, section 7, items 3 to 9): the request form on /private-work,
// the owner's decisions in /admin/access, the one-time sign-in link and the viewer's session, the private links, the
// headers of every /private-work answer, the NDA notice's link, and the sitemap. It runs against a running site with the
// admin and a database (a production build served by serve-production.mjs, or npm run dev), with sending switched off (no
// RESEND_API_KEY), so no email is ever sent:
//   node scripts/quality/check-private-work.mjs [--origin=http://localhost:4323]
// It reads ADMIN_EMAIL, ADMIN_PASSWORD and DATABASE_URL from the environment or .env.local and never prints them.
// The database is the shared one the live admin uses. Every row this run makes carries the run's mark: requests come from
// addresses on <run>.example.test (a reserved test domain) with names that start "Check PW <run>", links have labels that
// start the same way, and every visitor address is a made-up documentation address (2001:db8::/32) of its own, so the
// limit of 3 requests an hour only ever counts this run's rows. The owner's actions are pressed only on rows found by the
// run's email addresses. Everything the run made is deleted at the end, also when a check fails or the run stops.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { ROOT, launch, arg } from '../lib.mjs';

const origin = String(arg('origin', 'http://localhost:4323')).replace(/\/$/, '');
const local = name => { const f = path.join(ROOT, '.env.local'); if (!fs.existsSync(f)) return undefined; return fs.readFileSync(f, 'utf8').match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, 'm'))?.[1]; };
const EMAIL = process.env.ADMIN_EMAIL || local('ADMIN_EMAIL'), PASSWORD = process.env.ADMIN_PASSWORD || local('ADMIN_PASSWORD'), DB = process.env.DATABASE_URL || local('DATABASE_URL');
if (!EMAIL || !PASSWORD || !DB) { console.error('ADMIN_EMAIL, ADMIN_PASSWORD and DATABASE_URL are needed (environment or .env.local).'); process.exit(1); }
const { neon } = await import('@neondatabase/serverless'); const sql = neon(DB);
const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const fails = [], out = {}; const fail = m => { fails.push(m); console.log('  FAIL ' + m); };
const step = m => console.log('- ' + m);

/* The run's mark. */
const RUN = Date.now().toString(36) + crypto.randomBytes(2).toString('hex');
const DOMAIN = `pw-${RUN}.example.test`, MARK = `Check PW ${RUN}`;
const person = key => ({ name: `${MARK} ${key}`, email: `${key.toLowerCase()}@${DOMAIN}`, company: 'Example Test Company', role: 'Test role', reason: '', consent: 'yes' });
/* The address hash the server stores (addressHash() in src/admin/lib/auth.ts: salted with ANALYTICS_SECRET, else DATABASE_URL). */
const SALT = process.env.ANALYTICS_SECRET || local('ANALYTICS_SECRET') || DB;
const hashOf = ip => crypto.createHash('sha256').update([SALT, ip].join('|')).digest('hex');
const prefix = crypto.randomBytes(6).toString('hex').match(/.{4}/g).join(':'); let n = 0;
const newIp = () => `2001:db8:${prefix}::${(++n).toString(16)}`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const FIELD_EMAIL = 'Enter your work email, like name@example.com.';
const NDA_CASE = 'design-system-audit-skill';

/* ---------- every /private-work answer carries the four headers ---------- */
const headerLog = { checked: 0, statuses: {}, bad: [] };
const isPrivate = u => { try { const p = new URL(u).pathname.replace(/\/$/, ''); return p === '/private-work' || p.startsWith('/private-work/'); } catch { return false; } };
const checkHeaders = (h, status, label) => {
  headerLog.checked++; headerLog.statuses[status] = (headerLog.statuses[status] || 0) + 1;
  const wrong = [];
  if (!/no-store/.test(h['cache-control'] || '')) wrong.push(`Cache-Control ${h['cache-control']}`);
  if (!/noindex/.test(h['x-robots-tag'] || '') || !/nofollow/.test(h['x-robots-tag'] || '')) wrong.push(`X-Robots-Tag ${h['x-robots-tag']}`);
  if ((h['x-frame-options'] || '').toUpperCase() !== 'DENY') wrong.push(`X-Frame-Options ${h['x-frame-options']}`);
  if ((h['referrer-policy'] || '') !== 'same-origin') wrong.push(`Referrer-Policy ${h['referrer-policy']}`);
  if (wrong.length) { headerLog.bad.push(`${label} ${status}: ${wrong.join(', ')}`); fail(`${label} (${status}) lacks ${wrong.join(', ')}`); }
};

const browser = await launch();
const contexts = [];
const open = async ({ ip = newIp(), js = true, width = 1280 } = {}) => {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', javaScriptEnabled: js, extraHTTPHeaders: { 'x-forwarded-for': ip }, userAgent: UA });
  ctx.on('response', r => { if (isPrivate(r.url())) checkHeaders(r.headers(), r.status(), `${r.request().method()} ${new URL(r.url()).pathname}`); });
  contexts.push(ctx); const p = await ctx.newPage(); return { ctx, p, ip };
};
/* A form posted the way a browser posts it (same site unless told otherwise), without following a redirect. */
const post = async (who, route, form, { from = origin, ip = who.ip } = {}) => {
  const r = await who.ctx.request.post(origin + route, { form, headers: { origin: from, 'x-forwarded-for': ip }, maxRedirects: 0 });
  if (isPrivate(origin + route)) checkHeaders(r.headers(), r.status(), `POST ${route} (request)`);
  return r;
};
const get = async (who, route) => { const r = await who.ctx.request.get(origin + route, { maxRedirects: 0 }); if (isPrivate(origin + route)) checkHeaders(r.headers(), r.status(), `GET ${route} (request)`); return r; };
/* A press that sends a form and loads its answer: the answer to the POST itself (before any redirect is followed). */
const press = async (p, locator, route) => {
  const [resp] = await Promise.all([p.waitForResponse(r => new URL(r.url()).pathname === route && r.request().method() === 'POST', { timeout: 30000 }), p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }), locator.click()]);
  return resp;
};
const axe = async (p, label) => {
  await p.addScriptTag({ content: axeSource });
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations.map(x => `${x.id} (${x.nodes.length}): ${x.nodes[0].target}`));
  (out.axe ||= {})[label] = v.length; if (v.length) fail(`axe, ${label}: ${v.join('; ')}`);
};
const themed = async (p, route, label) => { for (const theme of ['light', 'dark']) { await p.goto(`${origin}${route}${route.includes('?') ? '&' : '?'}theme=${theme}`, { waitUntil: 'load' }); await axe(p, `${label}, ${theme}`); } };
const rowOf = async email => (await sql`select * from access_requests where email = ${email}`)[0];
const text = async (loc) => ((await loc.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
const tokenOf = link => new URL(link).searchParams.get('token');

let owner = null;
try {
  /* ---------- 3. The visitor's request ---------- */
  step('3. the request form');
  const V = await open();
  // 3a. Signed out: the page, its headers, noindex, no cookie.
  { const r = await V.p.goto(origin + '/private-work', { waitUntil: 'load' });
    out.page = { status: r.status(), h1: await text(V.p.locator('h1')), metaRobots: await V.p.getAttribute('meta[name="robots"]', 'content'), form: await V.p.locator('form[data-access-request]').count(), cookies: (await V.ctx.cookies()).map(c => c.name) };
    if (r.status() !== 200 || out.page.form !== 1) fail(`/private-work answered ${r.status()} with ${out.page.form} request forms`);
    if (!/noindex/.test(out.page.metaRobots || '')) fail('/private-work has no robots noindex meta');
    if (out.page.cookies.length) fail(`/private-work set cookies before any sign-in: ${out.page.cookies.join(', ')}`); }
  // 3b. Blur checks: an untouched empty field says nothing when left; a wrong email says so when left, and the error goes as soon as it is right.
  { await V.p.focus('#access-name'); await V.p.keyboard.press('Tab');
    const quietName = await V.p.locator('#access-name-error').isHidden();
    await V.p.fill('#access-email', 'not-an-email'); await V.p.locator('#access-email').blur();
    const err = V.p.locator('#access-email-error');
    const shown = { visible: await err.isVisible(), text: await text(err), invalid: await V.p.getAttribute('#access-email', 'aria-invalid'), described: await V.p.getAttribute('#access-email', 'aria-describedby') };
    await V.p.fill('#access-email', 'right@' + DOMAIN);
    const cleared = { hidden: await err.isHidden(), invalid: await V.p.getAttribute('#access-email', 'aria-invalid') };
    out.blur = { quietName, shown, cleared };
    if (!quietName) fail('leaving an untouched empty field showed an error');
    if (!shown.visible || shown.text !== FIELD_EMAIL || shown.invalid !== 'true' || !(shown.described || '').split(' ').includes('access-email-error')) fail('a wrong email is not flagged on blur: ' + JSON.stringify(shown));
    if (!cleared.hidden || cleared.invalid) fail('the email error stays after the email is corrected: ' + JSON.stringify(cleared)); }
  // 3c. Sending with errors: nothing is posted, a summary takes focus and links to each field.
  { await V.p.fill('#access-email', ''); let posted = false; const spy = r => { if (r.method() === 'POST') posted = true; }; V.p.on('request', spy);
    await V.p.click('form[data-access-request] button[type="submit"]'); await V.p.waitForTimeout(400); V.p.off('request', spy);
    const summary = { posted, visible: await V.p.locator('[data-form-summary]').isVisible(), focused: await V.p.evaluate(() => document.activeElement?.hasAttribute('data-form-summary')), title: await text(V.p.locator('[data-form-summary-title]')), items: await V.p.locator('[data-form-summary-list] a').allTextContents() };
    await V.p.locator('[data-form-summary-list] a').first().click(); summary.linkFocus = await V.p.evaluate(() => document.activeElement?.id);
    out.summary = summary;
    if (posted) fail('a form with errors was posted'); if (!summary.visible || !summary.focused) fail('the error summary is not shown and focused');
    if (summary.title !== 'Fix 5 fields to send your request' || summary.items.length !== 5) fail(`the summary says "${summary.title}" with ${summary.items.length} items, expected 5 (name, email, company, role, the box)`);
    if (summary.linkFocus !== 'access-name') fail(`the summary's first link put focus on ${summary.linkFocus}`); }
  await axe(V.p, 'request form with blur errors and summary');

  // 3d. From the NDA notice on a case study to a request sent. (Item 8, the served page.)
  const A = person('Alpha');
  { await V.p.goto(`${origin}/case-studies/${NDA_CASE}`, { waitUntil: 'load' });
    const link = V.p.locator('.case-nda-access a'); const href = await link.getAttribute('href'); const title = await text(V.p.locator('h1'));
    await Promise.all([V.p.waitForNavigation({ waitUntil: 'load' }), link.click()]);
    const reason = await V.p.inputValue('#access-reason');
    out.ndaNotice = { href, landed: new URL(V.p.url()).pathname + new URL(V.p.url()).search, reason, title };
    if (href !== `/private-work?from=case-studies%2F${NDA_CASE}`) fail(`the NDA notice links to ${href}`);
    if (new URL(V.p.url()).pathname !== '/private-work') fail('the NDA notice link did not reach /private-work');
    if (reason !== `The live links and prototypes for ${title}.`) fail(`the request did not start by naming the case study: "${reason}" (page title "${title}")`);
    await V.p.fill('#access-name', A.name); await V.p.fill('#access-email', A.email); await V.p.fill('#access-company', A.company); await V.p.fill('#access-role', A.role); await V.p.check('#access-consent');
    const resp = await press(V.p, V.p.locator('form[data-access-request] button[type="submit"]'), '/private-work');
    const ok = V.p.locator('[data-form-success]');
    out.sent = { status: resp.status(), visible: await ok.isVisible(), focused: await V.p.evaluate(() => document.activeElement?.hasAttribute('data-form-success')), says: await text(ok) };
    if (resp.status() !== 200 || !out.sent.visible || !out.sent.focused) fail('a valid request did not end on a focused confirmation: ' + JSON.stringify(out.sent));
    if (!out.sent.says.includes(A.email)) fail('the confirmation does not name the email address');
    const row = await rowOf(A.email);
    out.sentRow = row && { status: row.status, consented: !!row.consented_at, reason: row.reason, hashed: row.ip_hash === hashOf(V.ip), rawIpStored: Object.values(row).some(v => String(v).includes(V.ip)) };
    if (!row || row.status !== 'waiting' || !row.consented_at || row.reason !== reason) fail('the request was not stored as waiting with its consent and reason: ' + JSON.stringify(out.sentRow));
    if (row && (!out.sentRow.hashed || out.sentRow.rawIpStored)) fail('the address is not stored as the salted hash only');
    await axe(V.p, 'request sent'); }

  // 3e. A request the server refuses (422): the input is kept, the summary takes focus, nothing is stored.
  { const W = await open(); await W.p.goto(origin + '/private-work', { waitUntil: 'load' });
    const bad = { name: `${MARK} Refused`, email: `nobody@pw-${RUN}-example-test`, company: 'Example Test Company', role: 'Test role' };
    for (const [k, v] of Object.entries(bad)) await W.p.fill(`#access-${k}`, v); await W.p.check('#access-consent');
    const [resp] = await Promise.all([W.p.waitForResponse(r => r.request().method() === 'POST'), W.p.waitForNavigation({ waitUntil: 'load' }), W.p.evaluate(() => HTMLFormElement.prototype.submit.call(document.querySelector('form[data-access-request]')))]);
    const kept = {}; for (const k of Object.keys(bad)) kept[k] = await W.p.inputValue(`#access-${k}`);
    out.refused = { status: resp.status(), kept, consent: await W.p.isChecked('#access-consent'), summaryFocused: await W.p.evaluate(() => document.activeElement?.hasAttribute('data-form-summary')), summary: await W.p.locator('[data-form-summary-list] a').allTextContents(), invalid: await W.p.getAttribute('#access-email', 'aria-invalid'), stored: (await sql`select count(*)::int n from access_requests where email = ${bad.email}`)[0].n };
    if (resp.status() !== 422) fail(`a refused request answered ${resp.status()}, expected 422`);
    if (JSON.stringify(kept) !== JSON.stringify(bad) || !out.refused.consent) fail('the refused request did not keep the input: ' + JSON.stringify(kept));
    if (!out.refused.summaryFocused || out.refused.summary.join() !== FIELD_EMAIL || out.refused.invalid !== 'true') fail('the server\'s refusal is not a focused summary naming the email: ' + JSON.stringify(out.refused));
    if (out.refused.stored) fail('a refused request was stored');
    await axe(W.p, 'request refused (422)'); }

  // 3f. The spam trap: thanked, nothing kept.
  { const trap = { ...person('Trap'), _gotcha: 'https://spam.example.test' };
    const r = await post(V, '/private-work', trap, { ip: newIp() }); const body = await r.text();
    out.spamTrap = { status: r.status(), thanked: body.includes('Request sent.'), stored: (await sql`select count(*)::int n from access_requests where email = ${trap.email}`)[0].n };
    if (r.status() !== 200 || !out.spamTrap.thanked || out.spamTrap.stored) fail('the spam trap: ' + JSON.stringify(out.spamTrap)); }

  // 3g. Three requests an hour from one address; the fourth is refused (429), keeps the input, and nothing is stored for it.
  { const L = await open(); const codes = [];
    for (const k of ['Limit1', 'Limit2', 'Limit3']) codes.push((await post(L, '/private-work', person(k))).status());
    const fourth = person('Limit4');
    await L.p.goto(origin + '/private-work', { waitUntil: 'load' });
    for (const k of ['name', 'email', 'company', 'role']) await L.p.fill(`#access-${k}`, fourth[k]); await L.p.check('#access-consent');
    const resp = await press(L.p, L.p.locator('form[data-access-request] button[type="submit"]'), '/private-work');
    const failure = L.p.locator('[data-form-failure]');
    out.limit = { first3: codes, fourth: resp.status(), says: await text(failure), focused: await L.p.evaluate(() => document.activeElement?.hasAttribute('data-form-failure')), keptName: await L.p.inputValue('#access-name'), keptEmail: await L.p.inputValue('#access-email'),
      storedFourth: (await sql`select count(*)::int n from access_requests where email = ${fourth.email}`)[0].n, fromThisAddress: (await sql`select count(*)::int n from access_requests where ip_hash = ${hashOf(L.ip)}`)[0].n };
    if (codes.some(c => c !== 200)) fail(`the first three requests from one address answered ${codes.join(', ')}`);
    if (resp.status() !== 429 || !/more than 3 requests in an hour/.test(out.limit.says) || !out.limit.focused) fail('the fourth request in an hour: ' + JSON.stringify(out.limit));
    if (out.limit.keptName !== fourth.name || out.limit.keptEmail !== fourth.email) fail('the limited request did not keep the input');
    if (out.limit.storedFourth !== 0 || out.limit.fromThisAddress !== 3) fail(`after the limit, ${out.limit.storedFourth} rows for the fourth and ${out.limit.fromThisAddress} from the address (expected 0 and 3)`);
    await axe(L.p, 'request limited (429)'); }

  // 3h. Posted from another site: refused (403), nothing stored; the same for Continue and Sign out.
  { const x = person('Foreign'); const r = await post(V, '/private-work', x, { from: 'https://evil.example.test', ip: newIp() });
    const enter = await post(V, '/private-work/enter', { token: 'x'.repeat(43) }, { from: 'https://evil.example.test' });
    const leave = await post(V, '/private-work/leave', {}, { from: 'https://evil.example.test' });
    out.crossSite = { request: r.status(), enter: enter.status(), leave: leave.status(), stored: (await sql`select count(*)::int n from access_requests where email = ${x.email}`)[0].n };
    if (r.status() !== 403 || enter.status() !== 403 || leave.status() !== 403 || out.crossSite.stored) fail('cross-site posts: ' + JSON.stringify(out.crossSite)); }
  for (const [route, label] of [['/private-work', 'request page']]) await themed(V.p, route, label);
  { await V.p.setViewportSize({ width: 320, height: 640 }); await V.p.goto(origin + '/private-work', { waitUntil: 'load' }); if (await V.p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail('/private-work scrolls sideways at 320px'); await V.p.setViewportSize({ width: 1280, height: 900 }); }

  /* The other requests the owner decides on, each from an address of its own. */
  const B = person('Bravo'), C = person('Charlie'), D = person('Delta'), E = person('Echo');
  for (const x of [B, C, D, E]) { const r = await post(V, '/private-work', x, { ip: newIp() }); if (r.status() !== 200) fail(`the request for ${x.name} answered ${r.status()}`); }

  /* ---------- 4. The owner's decisions ---------- */
  step('4. the owner in /admin/access');
  owner = await open(); const O = owner.p;
  await owner.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await O.goto(origin + '/admin/login', { waitUntil: 'load' }); await O.fill('#login-email', EMAIL); await O.fill('#login-password', PASSWORD);
  await Promise.all([O.waitForNavigation({ waitUntil: 'load' }), O.click('button[type="submit"]')]);
  if (new URL(O.url()).pathname !== '/admin') throw new Error(`the owner could not sign in (landed on ${new URL(O.url()).pathname})`);
  const unexpected = []; const noDialog = d => { unexpected.push(d.message()); d.dismiss(); };
  const item = (p, x) => p.locator('li[data-filter-row]').filter({ hasText: x.email });
  /* Every action is pressed on a row found by this run's email address, after the search has narrowed the list to it. */
  const act = async (p, x, action, answer) => {
    if (!x.email.endsWith('@' + DOMAIN)) throw new Error('refusing to act on a row this run did not make');
    if (new URL(p.url()).pathname !== '/admin/access') await p.goto(origin + '/admin/access', { waitUntil: 'load' });
    await p.fill('#request-filter', x.email);
    const btn = item(p, x).locator(`button[name="action"][value="${action}"]`);
    const asked = [];
    if (answer) p.once('dialog', d => { asked.push(d.message()); answer === 'accept' ? d.accept() : d.dismiss(); }); else p.on('dialog', noDialog);
    let resp = null;
    if (answer === 'dismiss') { let posted = false; const spy = r => { if (r.method() === 'POST') posted = true; }; p.on('request', spy); await btn.click(); await p.waitForTimeout(500); p.off('request', spy); if (posted) fail(`dismissing the question on ${action} still sent it`); }
    else resp = await press(p, btn, '/admin/access');
    p.off('dialog', noDialog);
    return { resp, asked };
  };
  const note = async (p, title) => { const panels = await p.locator('.form-panel').allTextContents(); return panels.map(t => t.replace(/\s+/g, ' ').trim()).find(t => t.includes(title)) || ''; };

  // 4a. Waiting, the side panel's badge, the note that sending is off.
  { const waitingNow = async () => (await sql`select count(*)::int n from access_requests where status = 'waiting'`)[0].n;
    const before = await waitingNow(); await O.goto(origin + '/admin/access', { waitUntil: 'load' }); const after = await waitingNow();
    const badge = await text(O.locator('.admin-nav a[href="/admin/access"] .admin-state').first());
    const selected = await text(O.locator('[role="tab"][aria-selected="true"]'));
    const mine = await O.locator('li[data-filter-row][data-status="waiting"]').filter({ hasText: `@${DOMAIN}` }).count();
    out.waiting = { badge, dbWaiting: [before, after], selected, mineInWaiting: mine, emailOff: await note(O, 'Sign-in links are not emailed yet.') };
    if (![before, after].map(String).some(n => badge.startsWith(n))) fail(`the side panel's badge says "${badge}", the database ${before}/${after} waiting`);
    if (!/^Waiting · \d+/.test(selected)) fail(`the selected tab is "${selected}", expected Waiting`);
    if (mine !== 5 + 3) fail(`${mine} of this run's requests are in Waiting, expected 8 (Alpha to Echo and the three from one address)`);
    if (!/RESEND_API_KEY/.test(out.waiting.emailOff)) fail('the note that sending is off does not name RESEND_API_KEY');
    if (/re_[A-Za-z0-9]{8,}/.test(await O.content())) fail('the page shows something shaped like a Resend key');
    await axe(O, 'access requests, waiting'); }

  // 4b. Approve with sending off: the link is shown once, Copy, Open in your email; no question is asked.
  let linkA;
  { const { resp } = await act(O, A, 'approve');
    const panel = O.locator('.access-notice'); linkA = await text(O.locator('#link-code'));
    const mailto = await O.locator('.access-notice a[href^="mailto:"]').getAttribute('href');
    const copy = O.locator('.access-notice [data-copy]'); await copy.click(); await O.waitForTimeout(300);
    const copied = { label: await text(copy), status: await text(O.locator('.access-copy [role="status"]')), clip: await O.evaluate(() => navigator.clipboard.readText()).catch(e => 'unreadable: ' + e.message) };
    const row = await rowOf(A.email), tokens = await sql`select count(*)::int n, bool_and(used_at is null) unused from access_tokens where request_id = ${row.id}`;
    out.approve = { status: resp.status(), title: await text(panel.locator('strong').first()), says: (await text(panel)).slice(0, 400), link: linkA.replace(/token=.*/, 'token=…'), mailto: decodeURIComponent(mailto || '').slice(0, 120) + '…', copied: { ...copied, clip: copied.clip === linkA ? 'the link' : copied.clip }, db: { status: row.status, decided: !!row.decided_at, tokens: tokens[0] }, asked: unexpected.slice() };
    if (resp.status() !== 200 || out.approve.title !== 'Approved, but the sign-in link was not emailed.') fail('approve with sending off: ' + JSON.stringify(out.approve).slice(0, 400));
    if (!/sending is not set up yet: RESEND_API_KEY/.test(out.approve.says)) fail('the reason the link was not emailed is not given');
    if (!linkA.startsWith(`${origin}/private-work/enter?token=`) || !/^[\w-]{40,}$/.test(tokenOf(linkA) || '')) fail(`the link shown is ${linkA.slice(0, 60)}`);
    if (!mailto?.startsWith(`mailto:${A.email}?subject=`) || !decodeURIComponent(mailto).includes(linkA)) fail('Open in your email is not a written message to the visitor with the link');
    if (copied.clip !== linkA || !/Copied/.test(copied.label + copied.status)) fail('Copy the link: ' + JSON.stringify(out.approve.copied));
    if (row.status !== 'approved' || !row.decided_at || tokens[0].n !== 1 || !tokens[0].unused) fail('after approving, the database holds ' + JSON.stringify(out.approve.db));
    if (unexpected.length) fail('Approve asked a question: ' + unexpected.join(' | '));
    await axe(O, 'access requests, link shown');
    await O.goto(origin + '/admin/access', { waitUntil: 'load' });
    out.approve.shownAgain = (await O.content()).includes(tokenOf(linkA)); if (out.approve.shownAgain) fail('the sign-in link is shown again after a reload'); }

  // 4c. Decline asks first; No changes nothing; Yes closes the request and says so. It can then be approved again.
  { await act(O, B, 'decline', 'dismiss'); const still = (await rowOf(B.email)).status;
    const { resp, asked } = await act(O, B, 'decline', 'accept');
    const row = await rowOf(B.email);
    out.decline = { afterNo: still, status: resp.status(), asked: asked[0], note: await note(O, 'Declined.'), db: row.status, again: await item(O, B).locator('button[value="approve"]').count() ? await text(item(O, B).locator('button[value="approve"]')) : '' };
    if (still !== 'waiting') fail('answering No to Decline still declined the request');
    if (!/^Decline .*Bravo's request\?/.test(asked[0] || '')) fail(`Decline asked "${asked[0]}"`);
    if (row.status !== 'declined' || !out.decline.note.includes(B.name) || !/nothing was sent/.test(out.decline.note)) fail('decline: ' + JSON.stringify(out.decline));
    if (!/^Approve again/.test(out.decline.again)) fail('a declined request does not offer Approve again'); }

  // 4d. A request changed in another tab: "Nothing was done", and nothing changes.
  { const stale = await owner.ctx.newPage(); await stale.goto(origin + '/admin/access', { waitUntil: 'load' });
    await act(O, C, 'decline', 'accept'); const decided = (await rowOf(C.email)).decided_at;
    const { resp } = await act(stale, C, 'decline', 'accept');
    out.stale = { status: resp.status(), note: await note(stale, 'Nothing was done.'), decidedSame: String((await rowOf(C.email)).decided_at) === String(decided) };
    if (!/This request is declined now: it was changed in another tab or window/.test(out.stale.note) || !out.stale.decidedSame) fail('the stale tab: ' + JSON.stringify(out.stale));
    // and a request that is no longer there (an id no row has)
    const gone = await post(owner, '/admin/access', { id: '9007199254740990', action: 'approve' }); const body = await gone.text();
    out.stale.gone = { status: gone.status(), says: /That request is no longer here/.test(body) }; if (!out.stale.gone.says) fail('an action on a request that is gone does not say so');
    const foreign = await post(owner, '/admin/access', { id: String((await rowOf(D.email)).id), action: 'approve' }, { from: 'https://evil.example.test' });
    out.stale.crossSite = foreign.status(); if (foreign.status() !== 403 || (await rowOf(D.email)).status !== 'waiting') fail(`an approval posted from another site answered ${foreign.status()}`);
    await stale.close(); }

  /* ---------- 5. Signing in with the link ---------- */
  step('5. the sign-in link and the viewer session');
  const V2 = await open(); const tokenA = tokenOf(linkA);
  // 5a. Opening the link twice uses nothing.
  { const r1 = await V2.p.goto(linkA, { waitUntil: 'load' }); const r2 = await V2.p.goto(linkA, { waitUntil: 'load' });
    const used = (await sql`select t.used_at from access_tokens t join access_requests r on r.id = t.request_id where r.email = ${A.email}`)[0]?.used_at;
    out.enterGet = { statuses: [r1.status(), r2.status()], h1: await text(V2.p.locator('h1')), usedAfterTwoOpens: !!used, metaRobots: await V2.p.getAttribute('meta[name="robots"]', 'content'), cookies: (await V2.ctx.cookies()).map(c => c.name) };
    if (r1.status() !== 200 || r2.status() !== 200 || out.enterGet.h1 !== 'Continue to the private work' || used) fail('opening the link: ' + JSON.stringify(out.enterGet));
    if (!/noindex/.test(out.enterGet.metaRobots || '')) fail('the enter page has no robots noindex meta');
    if (out.enterGet.cookies.length) fail('opening the link set a cookie');
    await axe(V2.p, 'enter, ready'); }
  // 5b. Continue signs in and lands on the list; the cookie's flags.
  { const resp = await press(V2.p, V2.p.locator('form[action="/private-work/enter"] button[type="submit"]'), '/private-work/enter');
    const setCookie = (await resp.headerValue('set-cookie')) || '';
    const c = (await V2.ctx.cookies()).find(x => x.name === 'viewer_session');
    out.signIn = { status: resp.status(), location: resp.headers()['location'], landed: new URL(V2.p.url()).pathname, who: await text(V2.p.locator('.pw-who')), cookie: c && { httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite, path: c.path, days: Math.round((c.expires - Date.now() / 1000) / 86400 * 10) / 10 }, setCookieFlags: setCookie.replace(/viewer_session=[^;]+/, 'viewer_session=…') };
    if (resp.status() !== 303 || out.signIn.location !== '/private-work' || out.signIn.landed !== '/private-work' || !out.signIn.who.includes(A.name)) fail('Continue: ' + JSON.stringify(out.signIn));
    if (!c || !c.httpOnly || c.sameSite !== 'Lax' || c.path !== '/private-work' || Math.abs(out.signIn.cookie.days - 30) > 0.2) fail('the viewer cookie: ' + JSON.stringify(out.signIn.cookie));
    if (!/HttpOnly/i.test(setCookie) || !/SameSite=Lax/i.test(setCookie) || !/Path=\/private-work/i.test(setCookie)) fail('the Set-Cookie header lacks a flag: ' + out.signIn.setCookieFlags);
    const db = await sql`select count(*)::int n from viewer_sessions s join access_requests r on r.id = s.request_id where r.email = ${A.email}`; out.signIn.sessions = db[0].n; if (db[0].n !== 1) fail(`${db[0].n} sessions after signing in`);
    // the viewer cookie never opens the admin, the admin's never opens the private work
    await V2.p.goto(origin + '/admin', { waitUntil: 'load' }); out.signIn.viewerToAdmin = new URL(V2.p.url()).pathname; if (out.signIn.viewerToAdmin !== '/admin/login') fail('the viewer cookie opened the admin');
    await O.goto(origin + '/private-work', { waitUntil: 'load' }); out.signIn.ownerSeesList = await O.locator('.pw-signed').count(); if (out.signIn.ownerSeesList) fail("the admin's session opened the private work");
    await V2.p.goto(origin + '/private-work', { waitUntil: 'load' }); await themed(V2.p, '/private-work', 'signed in, no links of this run yet'); }
  // 5c. A second Continue goes on without using anything; elsewhere the used link says so (410).
  { const again = await post(V2, '/private-work/enter', { token: tokenA });
    const V3 = await open(); const elsewhere = await post(V3, '/private-work/enter', { token: tokenA }); const elsewhereBody = await elsewhere.text();
    const gUsed = await V3.p.goto(linkA, { waitUntil: 'load' });
    out.second = { again: [again.status(), again.headers()['location']], elsewhere: elsewhere.status(), elsewhereSays: /It has already been used\./.test(elsewhereBody), getUsed: gUsed.status(), getSays: await text(V3.p.locator('.form-panel-title')), cookieElsewhere: (await V3.ctx.cookies()).some(c => c.name === 'viewer_session'),
      sessions: (await sql`select count(*)::int n from viewer_sessions s join access_requests r on r.id = s.request_id where r.email = ${A.email}`)[0].n };
    if (again.status() !== 303 || again.headers()['location'] !== '/private-work') fail('a second Continue in the signed-in browser: ' + JSON.stringify(out.second.again));
    if (elsewhere.status() !== 410 || !out.second.elsewhereSays || out.second.cookieElsewhere) fail('the used link in another browser: ' + JSON.stringify(out.second));
    if (gUsed.status() !== 410 || out.second.getSays !== 'It has already been used.') fail(`opening a used link answered ${gUsed.status()} "${out.second.getSays}"`);
    if (out.second.sessions !== 1) fail(`${out.second.sessions} sessions after the second Continue, expected 1`);
    await axe(V3.p, 'enter, used (410)'); }
  // 5d. Unknown links (made up, cut short, none): 410 and the same words.
  { const W = await open(); out.unknown = {};
    for (const [label, q] of [['made up', '?token=' + crypto.randomBytes(32).toString('base64url')], ['cut short', '?token=' + tokenA.slice(0, 20)], ['none', ''], ['odd characters', '?token=' + encodeURIComponent('<script>alert(1)</script>')]]) {
      const r = await W.p.goto(origin + '/private-work/enter' + q, { waitUntil: 'load' }); out.unknown[label] = [r.status(), await text(W.p.locator('.form-panel-title'))];
      if (r.status() !== 410 || out.unknown[label][1] !== 'It is not one this site can use.') fail(`an unknown link (${label}) answered ${r.status()} "${out.unknown[label][1]}"`); }
    const p = await post(W, '/private-work/enter', { token: crypto.randomBytes(32).toString('base64url') }); out.unknown.post = p.status(); if (p.status() !== 410) fail(`Continue with an unknown link answered ${p.status()}`);
    await themed(W.p, '/private-work/enter?token=unknown-link-of-the-check-run', 'enter, unknown (410)'); }
  // 5e. An expired link: 410 on opening and on Continue. (Its expiry is moved back in the database, on this run's own row.)
  { await act(O, D, 'approve'); const linkD = await text(O.locator('#link-code')); const rowD = await rowOf(D.email);
    await sql`update access_tokens set expires_at = now() - interval '1 minute' where request_id = ${rowD.id} and request_id in (select id from access_requests where email like ${'%@' + DOMAIN})`;
    const W = await open(); const r = await W.p.goto(linkD, { waitUntil: 'load' }); const says = await text(W.p.locator('.form-panel-title'));
    const p = await post(W, '/private-work/enter', { token: tokenOf(linkD) }); const pBody = await p.text();
    out.expired = { get: r.status(), says, post: p.status(), postSays: /It has expired\./.test(pBody), cookie: (await W.ctx.cookies()).some(c => c.name === 'viewer_session') };
    if (r.status() !== 410 || says !== 'It has expired.' || p.status() !== 410 || !out.expired.postSays || out.expired.cookie) fail('an expired link: ' + JSON.stringify(out.expired));
    await axe(W.p, 'enter, expired (410)'); }
  // 5f. Send a new link: the old one stops working, the new one works; after Revoke the new one stops too.
  { await act(O, E, 'approve'); const e1 = await text(O.locator('#link-code'));
    const { resp } = await act(O, E, 'newlink'); const e2 = await text(O.locator('#link-code')); const title = await text(O.locator('.access-notice strong').first());
    const W = await open(); const old = await W.p.goto(e1, { waitUntil: 'load' }); const oldSays = await text(W.p.locator('.form-panel-title')); const fresh = await W.p.goto(e2, { waitUntil: 'load' });
    out.newLink = { status: resp.status(), title, differs: e1 !== e2, old: [old.status(), oldSays], fresh: fresh.status(), unusedTokens: (await sql`select count(*)::int n from access_tokens t join access_requests r on r.id = t.request_id where r.email = ${E.email} and t.used_at is null`)[0].n };
    if (title !== 'A new sign-in link is ready, but it was not emailed.' || !out.newLink.differs) fail('Send a new link: ' + JSON.stringify(out.newLink));
    if (old.status() !== 410 || oldSays !== 'It is not one this site can use.' || fresh.status() !== 200 || out.newLink.unusedTokens !== 1) fail('the old link still works or the new one does not: ' + JSON.stringify(out.newLink));
    await act(O, E, 'revoke', 'accept');
    const after = await W.p.goto(e2, { waitUntil: 'load' }); out.newLink.afterRevoke = [after.status(), await text(W.p.locator('.form-panel-title'))];
    if (after.status() !== 410 || out.newLink.afterRevoke[1] !== 'It is not one this site can use.') fail('a link of a revoked request: ' + JSON.stringify(out.newLink.afterRevoke)); }
  // 5g. Revoke asks first, and signs the visitor out on their next request.
  { await act(O, A, 'revoke', 'dismiss'); const still = await V2.p.goto(origin + '/private-work', { waitUntil: 'load' }); const stillIn = await V2.p.locator('.pw-signed').count();
    const { resp, asked } = await act(O, A, 'revoke', 'accept'); const row = await rowOf(A.email);
    const sessions = (await sql`select count(*)::int n from viewer_sessions where request_id = ${row.id}`)[0].n;
    await V2.p.goto(origin + '/private-work', { waitUntil: 'load' });
    out.revoke = { stillInAfterNo: stillIn, status: resp.status(), asked: asked[0], note: await note(O, 'Access revoked.'), db: row.status, sessions, visitorAfter: { list: await V2.p.locator('.pw-signed').count(), form: await V2.p.locator('form[data-access-request]').count() } };
    if (still.status() !== 200 || stillIn !== 1) fail('answering No to Revoke still signed the visitor out');
    if (!/^Revoke .*Alpha's access\?/.test(asked[0] || '') || !out.revoke.note.includes(A.name) || row.status !== 'revoked' || sessions !== 0) fail('revoke: ' + JSON.stringify(out.revoke));
    if (out.revoke.visitorAfter.list !== 0 || out.revoke.visitorAfter.form !== 1) fail('after Revoke the visitor still sees the private work'); }

  // Approve again: a new link, a new browser signed in (for the links and Sign out).
  const { resp: againResp } = await act(O, A, 'approve'); const linkA2 = await text(O.locator('#link-code'));
  out.approveAgain = { status: againResp.status(), title: await text(O.locator('.access-notice strong').first()), db: (await rowOf(A.email)).status };
  if (out.approveAgain.db !== 'approved' || !linkA2.includes('token=')) fail('Approve again: ' + JSON.stringify(out.approveAgain));
  const V4 = await open(); await V4.p.goto(linkA2, { waitUntil: 'load' }); await press(V4.p, V4.p.locator('form[action="/private-work/enter"] button[type="submit"]'), '/private-work/enter');
  if (!(await V4.p.locator('.pw-signed').count())) fail('approved again, the new link did not sign in');

  // 4e. The tabs and the search, with this run's requests in all three.
  { const counts = Object.fromEntries((await sql`select status, count(*)::int n from access_requests group by status`).map(r => [r.status, r.n]));
    await O.goto(origin + '/admin/access', { waitUntil: 'load' });
    const tabs = await O.locator('[role="tab"]').allTextContents();
    const expect = [`Waiting · ${counts.waiting || 0}`, `Approved · ${counts.approved || 0}`, `Closed · ${(counts.declined || 0) + (counts.revoked || 0)}`];
    await O.click('[role="tab"]:has-text("Closed")'); const closedOn = { selected: await O.getAttribute('[role="tab"]:has-text("Closed")', 'aria-selected'), visibleRows: await O.locator('li[data-filter-row]:visible').evaluateAll(l => l.map(x => x.dataset.status)) };
    await O.keyboard.press('ArrowLeft'); const arrow = { focused: await O.evaluate(() => document.activeElement?.textContent), selected: await text(O.locator('[role="tab"][aria-selected="true"]')) };
    await O.fill('#request-filter', B.name); const one = { rows: await O.locator('li[data-filter-row]:visible').count(), count: await text(O.locator('[data-filter-count]')), tablistShown: await O.locator('[role="tablist"]').isVisible() };
    await O.fill('#request-filter', MARK); const all = await O.locator('li[data-filter-row]:visible').evaluateAll(l => l.map(x => x.dataset.status));
    await O.fill('#request-filter', 'zz-no-such-request-' + RUN); const none = { empty: await O.locator('[data-filter-empty]').isVisible(), rows: await O.locator('li[data-filter-row]:visible').count() };
    await O.click('[data-filter-clear]'); const cleared = { value: await O.inputValue('#request-filter'), tablist: await O.locator('[role="tablist"]').isVisible(), focus: await O.evaluate(() => document.activeElement?.id) };
    out.tabs = { tabs, expect, closedOn, arrow, one, all, none, cleared };
    if (JSON.stringify(tabs.map(t => t.trim())) !== JSON.stringify(expect)) fail(`the tabs read ${JSON.stringify(tabs)}, expected ${JSON.stringify(expect)}`);
    if (closedOn.selected !== 'true' || !closedOn.visibleRows.length || closedOn.visibleRows.some(s => !['declined', 'revoked'].includes(s))) fail('the Closed tab: ' + JSON.stringify(closedOn));
    if (!/^Approved/.test(arrow.selected) || !/Approved/.test(arrow.focused || '')) fail('the arrow key does not move to the Approved tab: ' + JSON.stringify(arrow));
    if (one.rows !== 1 || !/^Showing 1 of \d+ requests$/.test(one.count) || one.tablistShown) fail('searching for one request: ' + JSON.stringify(one));
    const mine = { waiting: 3, approved: 2, declined: 2, revoked: 1 }; // the three from one address; Alpha, Delta; Bravo, Charlie; Echo
    const got = all.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {});
    if (JSON.stringify(Object.entries(got).sort()) !== JSON.stringify(Object.entries(mine).sort())) fail(`searching for this run found ${JSON.stringify(got)} across the tabs, expected ${JSON.stringify(mine)}`);
    if (!none.empty || none.rows) fail('a search with no match does not say so');
    if (cleared.value || !cleared.tablist || cleared.focus !== 'request-filter') fail('Clear the search: ' + JSON.stringify(cleared));
    await themed(O, '/admin/access', 'access requests'); }

  /* ---------- 6. The private links ---------- */
  step('6. the private links');
  const L1 = `${MARK} Figma file`, L2 = `${MARK} Clickable prototype`, URL1 = `https://example.com/check-pw-${RUN}`;
  { await O.goto(origin + '/admin/access/links/new', { waitUntil: 'load' });
    const options = await O.locator('select[name="project"] option').evaluateAll(o => o.map(x => ({ v: x.value, t: x.textContent.trim() })));
    const ndaIdx = options.map((o, i) => (/\(under NDA\)$/.test(o.t) ? i : -1)).filter(i => i >= 0), plain = options.map((o, i) => (o.v && !/\(under NDA\)$/.test(o.t) ? i : -1)).filter(i => i >= 0);
    out.menu = { options: options.length, nda: ndaIdx.length, first: options[1]?.t, ndaFirst: Math.max(...ndaIdx) < Math.min(...plain) };
    if (!ndaIdx.length || !out.menu.ndaFirst || !options.some(o => o.v === `case-study:${NDA_CASE}` && /\(under NDA\)$/.test(o.t))) fail('the page menu does not put the NDA pages first, marked: ' + JSON.stringify(out.menu));
    await axe(O, 'link editor, new');
    // only https:// is accepted (the page's own form, then other refused shapes posted directly)
    await O.selectOption('select[name="project"]', `case-study:${NDA_CASE}`); await O.fill('[name="label"]', L1); await O.fill('[name="url"]', 'http://example.com/check'); await O.fill('[name="note"]', 'Check note');
    const r = await press(O, O.locator('.admin-savebar button[value="save"]'), '/admin/access/links/new');
    const refused = { status: r.status(), problems: await text(O.locator('#problems')), keptLabel: await O.inputValue('[name="label"]'), keptUrl: await O.inputValue('[name="url"]'), focused: await O.evaluate(() => document.activeElement?.id) };
    const others = {}; for (const u of ['ftp://example.com/x', 'javascript:alert(1)', 'https://localhost/x', 'example.com/x', 'https://exa mple.com']) others[u] = (await post(owner, '/admin/access/links/new', { project: `case-study:${NDA_CASE}`, label: L1, url: u, note: '', order: '0', action: 'save' })).status();
    out.httpsOnly = { refused, others, stored: (await sql`select count(*)::int n from private_links where label like ${MARK + '%'}`)[0].n };
    if (r.status() !== 422 || !/Use a full address starting with https:\/\//.test(refused.problems) || refused.keptLabel !== L1 || refused.keptUrl !== 'http://example.com/check' || refused.focused !== 'problems') fail('an http:// address: ' + JSON.stringify(refused));
    if (Object.values(others).some(s => s !== 422) || out.httpsOnly.stored) fail('a link that is not https:// was accepted: ' + JSON.stringify(out.httpsOnly));
    await axe(O, 'link editor, refused');
    const foreign = await post(owner, '/admin/access/links/new', { project: `case-study:${NDA_CASE}`, label: L1, url: URL1, action: 'save' }, { from: 'https://evil.example.test' }); out.httpsOnly.crossSite = foreign.status(); if (foreign.status() !== 403) fail(`a link posted from another site answered ${foreign.status()}`);
    // added
    await O.fill('[name="url"]', URL1);
    const saved = await press(O, O.locator('.admin-savebar button[value="save"]'), '/admin/access/links/new');
    out.added = { status: saved.status(), location: saved.headers()['location'], landed: new URL(O.url()).pathname, notice: await note(O, 'Saved.') };
    if (saved.status() !== 303 || !/^\/admin\/access\/links\/\d+$/.test(out.added.landed) || !out.added.notice) fail('adding a link: ' + JSON.stringify(out.added)); }
  const linkPage = new URL(O.url()).pathname;
  // the visitor sees it at once, opening safely in a new tab, under the case study's title
  const caseTitle = out.ndaNotice.title;
  const visitorLinks = async () => { await V4.p.goto(origin + '/private-work', { waitUntil: 'load' }); return V4.p.locator('.pw-group').evaluateAll(gs => gs.map(g => ({ title: g.querySelector('.pw-group-title')?.textContent.trim(), page: g.querySelector('.pw-page-link')?.getAttribute('href') || '', links: [...g.querySelectorAll('a.pw-link')].map(a => ({ label: a.querySelector('.pw-link-label')?.textContent.trim(), host: a.querySelector('.pw-link-host')?.textContent.trim(), href: a.getAttribute('href'), target: a.target, rel: a.rel, note: a.parentElement.querySelector('.pw-link-note')?.textContent.trim() || '' })) }))); };
  { const groups = await visitorLinks(); const g = groups.find(x => x.links.some(l => l.label === L1)); const l = g?.links.find(x => x.label === L1);
    out.visitorSees = { group: g && { title: g.title, page: g.page }, link: l };
    if (!g || g.title !== caseTitle || g.page !== `/case-studies/${NDA_CASE}`) fail('the visitor does not see the new link under the case study: ' + JSON.stringify(out.visitorSees));
    if (!l || l.href !== URL1 || l.target !== '_blank' || l.rel !== 'noopener noreferrer' || l.host !== 'example.com' || l.note !== 'Check note') fail('the visitor\'s link: ' + JSON.stringify(l));
    await themed(V4.p, '/private-work', 'signed in, with links');
    await V4.p.setViewportSize({ width: 320, height: 640 }); await V4.p.goto(origin + '/private-work', { waitUntil: 'load' }); if (await V4.p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail('the signed-in list scrolls sideways at 320px'); await V4.p.setViewportSize({ width: 1280, height: 900 }); }
  // edited
  { await O.goto(origin + linkPage, { waitUntil: 'load' }); await O.fill('[name="label"]', L2);
    const r = await press(O, O.locator('.admin-savebar button[value="save"]'), linkPage);
    const groups = await visitorLinks(); const labels = groups.flatMap(g => g.links.map(l => l.label));
    out.edited = { status: r.status(), notice: await note(O, 'Saved. Approved visitors see the link as it is now.'), visitorSeesNew: labels.includes(L2), visitorSeesOld: labels.includes(L1) };
    if (r.status() !== 200 || !out.edited.notice || !out.edited.visitorSeesNew || out.edited.visitorSeesOld) fail('editing a link: ' + JSON.stringify(out.edited)); }
  // a link whose page has left the site still shows, named by its key (made in the database, this run's mark on it)
  { const key = `case-study:pw-gone-${RUN}`; const [row] = await sql`insert into private_links (project_key, label, url, note, sort_order) values (${key}, ${MARK + ' Orphan'}, ${'https://example.com/orphan-' + RUN}, '', 0) returning id`;
    const groups = await visitorLinks(); const g = groups.find(x => x.links.some(l => l.label === `${MARK} Orphan`));
    await O.goto(`${origin}/admin/access/links/${row.id}`, { waitUntil: 'load' }); const chosen = await O.locator('select[name="project"] option:checked').textContent();
    out.lostPage = { visitor: g && { title: g.title, page: g.page }, editorOption: chosen?.trim() };
    if (!g || g.title !== `pw-gone-${RUN}` || g.page) fail('a link whose page left the site: ' + JSON.stringify(out.lostPage));
    if (out.lostPage.editorOption !== `No longer on the site: ${key}`) fail(`the editor's menu for a lost page shows "${out.lostPage.editorOption}"`); }
  // the list and its search
  { const total = (await sql`select count(*)::int n from private_links`)[0].n; await O.goto(origin + '/admin/access/links', { waitUntil: 'load' });
    await O.fill('#list-filter', MARK); const found = await text(O.locator('[data-filter-count]'));
    await O.fill('#list-filter', 'zz-no-such-link-' + RUN); const none = await O.locator('[data-filter-empty]').isVisible();
    out.linkList = { total, found, none }; if (found !== `Showing 2 of ${total} links` || !none) fail('the links list search: ' + JSON.stringify(out.linkList));
    await themed(O, '/admin/access/links', 'private links list'); }
  // removed: asks first; then gone for the visitor
  { await O.goto(origin + linkPage, { waitUntil: 'load' }); const del = O.locator('button[value="delete"]');
    let posted = false; const spy = r => { if (r.method() === 'POST') posted = true; }; O.on('request', spy); O.once('dialog', d => d.dismiss()); await del.click(); await O.waitForTimeout(500); O.off('request', spy);
    const asked = []; O.once('dialog', d => { asked.push(d.message()); d.accept(); });
    const r = await press(O, del, linkPage);
    const groups = await visitorLinks();
    out.removed = { afterNo: posted, status: r.status(), asked: asked[0], landed: new URL(O.url()).pathname + new URL(O.url()).search, note: await note(O, 'Removed.'), inDb: (await sql`select count(*)::int n from private_links where label = ${L2}`)[0].n, visitorSees: groups.some(g => g.links.some(l => l.label === L2)) };
    if (posted) fail('answering No to Delete still sent it');
    if (r.status() !== 303 || out.removed.landed !== '/admin/access/links?removed=1' || !out.removed.note || out.removed.inDb || out.removed.visitorSees || !/^Delete this private link\?/.test(asked[0] || '')) fail('removing a link: ' + JSON.stringify(out.removed)); }

  /* ---------- 5h. Sign out ---------- */
  { const foreign = await post(V4, '/private-work/leave', {}, { from: 'https://evil.example.test' }); await V4.p.goto(origin + '/private-work', { waitUntil: 'load' }); const stillIn = await V4.p.locator('.pw-signed').count();
    const resp = await press(V4.p, V4.p.locator('form[action="/private-work/leave"] button[type="submit"]'), '/private-work/leave');
    const status = V4.p.locator('.form-success[role="status"]');
    const rowA = await rowOf(A.email);
    out.signOut = { crossSite: foreign.status(), stillInAfterCrossSite: stillIn, status: resp.status(), location: resp.headers()['location'], says: await text(status), cookie: (await V4.ctx.cookies()).some(c => c.name === 'viewer_session'), sessions: (await sql`select count(*)::int n from viewer_sessions where request_id = ${rowA.id}`)[0].n, form: await V4.p.locator('form[data-access-request]').count() };
    const g = await get(V4, '/private-work/leave'); out.signOut.getLeave = [g.status(), g.headers()['location']];
    if (foreign.status() !== 403 || stillIn !== 1) fail('a sign-out posted from another site was not refused or signed the visitor out');
    if (resp.status() !== 303 || out.signOut.location !== '/private-work?left=1' || !/You are signed out\./.test(out.signOut.says) || out.signOut.cookie || out.signOut.sessions !== 0 || out.signOut.form !== 1) fail('Sign out: ' + JSON.stringify(out.signOut));
    if (g.status() !== 303 || g.headers()['location'] !== '/private-work') fail('GET /private-work/leave: ' + JSON.stringify(out.signOut.getLeave));
    await axe(V4.p, 'signed out'); }

  /* ---------- 8. The NDA notice in the build, and on a page without NDA ---------- */
  step('8. the NDA notice');
  { const client = path.join(ROOT, 'dist/client'); const pages = [];
    const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const full = path.join(d, f.name); if (f.isDirectory()) walk(full); else if (f.name.endsWith('.html')) { const html = fs.readFileSync(full, 'utf8'); for (const m of html.matchAll(/<span class="case-nda-access"[^>]*>[^<]*<a[^>]*href="([^"]*)"/g)) pages.push([path.relative(client, full).replace(/\\/g, '/'), m[1]]); } } };
    if (fs.existsSync(client)) walk(client);
    out.ndaBuild = { pages: pages.length, hrefs: [...new Set(pages.map(p => p[1]))], projects: pages.filter(p => /(^|\/)work\//.test(p[0])).length };
    if (!pages.length) fail('no built page has the NDA notice\'s access link (dist/client)');
    if (pages.some(([, h]) => !/^\/private-work\?from=(case-studies|work)%2F[\w-]+$/.test(h))) fail('a built NDA link is not relative to /private-work: ' + JSON.stringify(out.ndaBuild.hrefs));
    await V.p.goto(origin + '/case-studies/colaberry-design-system', { waitUntil: 'load' }); out.ndaBuild.plainCase = await V.p.locator('.case-nda, .case-nda-access').count(); if (out.ndaBuild.plainCase) fail('a case study without nda shows the NDA notice'); }

  /* ---------- 9. Not in the sitemap, and noindex ---------- */
  step('9. sitemap and robots');
  { const idx = await V.ctx.request.get(origin + '/sitemap-index.xml'); const locs = [...(await idx.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]); let urls = 0, hits = [];
    for (const l of locs) { const r = await V.ctx.request.get(origin + new URL(l).pathname); const body = await r.text(); urls += (body.match(/<loc>/g) || []).length; if (/private-work/.test(body)) hits.push(l); }
    const files = fs.existsSync(path.join(ROOT, 'dist/client')) ? fs.readdirSync(path.join(ROOT, 'dist/client')).filter(f => /^sitemap.*\.xml$/.test(f)) : [];
    for (const f of files) if (/private-work/.test(fs.readFileSync(path.join(ROOT, 'dist/client', f), 'utf8'))) hits.push('dist/client/' + f);
    const robots = await (await V.ctx.request.get(origin + '/robots.txt')).text();
    const enter = await get(V, '/private-work/enter');
    out.sitemap = { sitemaps: locs.length, urls, files, hits, robotsMentions: /private-work/.test(robots), enterRobotsHeader: enter.headers()['x-robots-tag'] };
    if (!locs.length || !urls) fail('the sitemap could not be read'); if (hits.length) fail('/private-work is in a sitemap: ' + hits.join(', '));
    if (out.sitemap.robotsMentions) fail('robots.txt names /private-work (a Disallow would hide its noindex)'); }
} catch (e) {
  fail('the run stopped: ' + (e?.stack || e).toString().split('\n').slice(0, 3).join(' '));
} finally {
  /* ---------- clean up: only this run's rows ---------- */
  const cleanup = {};
  try {
    if (owner) { const r = await owner.ctx.request.post(origin + '/admin/logout', { headers: { origin, 'x-forwarded-for': owner.ip }, maxRedirects: 0 }).catch(() => null); cleanup.ownerSignedOut = r?.status(); }
    cleanup.requests = (await sql`delete from access_requests where email like ${'%pw-' + RUN + '%'} returning id`).length;
    cleanup.links = (await sql`delete from private_links where label like ${MARK + '%'} returning id`).length;
    if (owner) cleanup.loginAttempts = (await sql`delete from login_attempts where ip_hash = ${hashOf(owner.ip)} returning id`).length;
    const left = await sql`select (select count(*)::int from access_requests where email like ${'%pw-' + RUN + '%'} or ip_hash = any(${[...Array(n).keys()].map(i => hashOf(`2001:db8:${prefix}::${(i + 1).toString(16)}`))})) as requests,
      (select count(*)::int from access_tokens t where not exists (select 1 from access_requests r where r.id = t.request_id)) as orphanTokens,
      (select count(*)::int from private_links where label like ${MARK + '%'} or url like ${'%' + RUN + '%'}) as links`;
    cleanup.left = left[0];
    if (left[0].requests || left[0].links) fail('rows of this run are left in the database: ' + JSON.stringify(left[0]));
  } catch (e) { fail('cleaning up failed: ' + e.message + ` (delete by hand: access_requests where email like '%pw-${RUN}%', private_links where label like '${MARK}%')`); }
  out.cleanup = cleanup;
  for (const c of contexts) await c.close().catch(() => {});
  await browser.close();
}

out.headers = headerLog;
if (headerLog.checked < 30) fail(`only ${headerLog.checked} /private-work answers had their headers checked`);
fs.mkdirSync(path.join(ROOT, 'reports/quality'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/quality/check-private-work.json'), JSON.stringify({ origin, run: RUN, fails, out }, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 9000));
console.log(fails.length ? `\nFAILED: ${fails.length}` : `\nPASSED: the request form, the owner's decisions, the sign-in link, the viewer session, the private links, the headers of ${headerLog.checked} /private-work answers, the NDA notice and the sitemap behave as specified.`);
process.exit(fails.length ? 1 : 0);
