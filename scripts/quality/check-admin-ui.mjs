// The quality checks for the admin area: the same checks every public page gets (scripts/quality/checks.mjs and axe),
// on every admin page, at every test screen size, in both themes, plus a keyboard walk. The admin pages are rendered on
// the server and need a sign-in, so this runs against a running site instead of a build:
//   npm run dev                                   (in another terminal)
//   node scripts/quality/check-admin-ui.mjs       every size and theme
//   node scripts/quality/check-admin-ui.mjs --quick     two sizes per theme
// A new admin page is added to ROUTES below; it is then held to the rules in CLAUDE.md section 2 like every other page.
// It only reads: nothing is saved, published or deleted.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, VIEWPORTS, QUICK_VIEWPORTS, THEMES, launch, arg } from '../lib.mjs';
import { pageChecks, focusProbe } from './checks.mjs';

const origin = String(arg('origin', 'http://127.0.0.1:4321')).replace(/\/$/, ''); const quick = process.argv.includes('--quick');
const local = name => { const f = path.join(ROOT, '.env.local'); if (!fs.existsSync(f)) return undefined; return fs.readFileSync(f, 'utf8').match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, 'm'))?.[1]; };
const EMAIL = process.env.ADMIN_EMAIL || local('ADMIN_EMAIL'), PASSWORD = process.env.ADMIN_PASSWORD || local('ADMIN_PASSWORD');
if (!EMAIL || !PASSWORD) { console.error('ADMIN_EMAIL and ADMIN_PASSWORD are needed (in .env.local).'); process.exit(1); }
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

/* Every admin page, by what it is. An editor is opened on the first entry of its list, so no entry is named here. */
const ROUTES = [
  { name: 'sign-in', path: '/admin/login', signedOut: true },
  { name: 'dashboard', path: '/admin' },
  ...['projects', 'case-studies', 'posts', 'videos', 'linkedin-posts', 'linkedin-articles'].flatMap(k => [{ name: `${k} list`, path: `/admin/${k}` }, { name: `${k} editor`, path: `/admin/${k}`, first: true }, { name: `${k} new`, path: `/admin/${k}/new` }]),
  { name: 'site details', path: '/admin/site/config' }, { name: 'about and career', path: '/admin/profile/profile' },
  { name: 'images', path: '/admin/images' }, { name: 'youtube', path: '/admin/youtube' },
];
const only = String(arg('only', '')).split(',').filter(Boolean); const routes = ROUTES.filter(r => !only.length || only.some(o => r.name.includes(o)));

const browser = await launch(); const fails = []; const fail = (check, route, view, detail) => fails.push({ check, route, view, detail });
const signIn = async (ctx) => { const p = await ctx.newPage(); await p.goto(`${origin}/admin/login`, { waitUntil: 'networkidle' }); await p.fill('#login-email', EMAIL); await p.fill('#login-password', PASSWORD); await Promise.all([p.waitForLoadState('load'), p.click('button[type="submit"]')]); await p.waitForTimeout(500); if (!new URL(p.url()).pathname.replace(/\/$/, '').endsWith('/admin')) throw new Error('Sign-in did not work: ' + p.url()); await p.close(); };
/* One signed-in session is shared: each view gets its own page at its own size. */
const session = await browser.newContext({ reducedMotion: 'reduce', extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.60, admin-ui-check' } }); await signIn(session);
const cookies = await session.cookies(); const firsts = {};
const target = async (page, route) => { if (!route.first) return `${origin}${route.path}`; if (!(route.path in firsts)) { await page.goto(`${origin}${route.path}`, { waitUntil: 'load' }); firsts[route.path] = await page.evaluate(() => document.querySelector('.admin-list tbody th a')?.getAttribute('href') || ''); } return firsts[route.path] ? origin + firsts[route.path] : null; };
const open = async (route, width, height, theme) => { const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.60, admin-ui-check' } }); if (!route.signedOut) await ctx.addCookies(cookies); const page = await ctx.newPage(); const url = await target(page, route); if (!url) { await ctx.close(); return null; } await page.goto(`${url}${url.includes('?') ? '&' : '?'}theme=${theme}`, { waitUntil: 'load' }); await page.waitForTimeout(350); return { ctx, page }; };

const viewports = quick ? QUICK_VIEWPORTS : VIEWPORTS; const jobs = [];
for (const route of routes) for (const [width, height] of viewports) for (const theme of THEMES) jobs.push({ route, width, height, theme });
console.log(`${routes.length} admin pages, ${jobs.length} views, against ${origin}`);
let done = 0; const skipped = new Set();
for (const { route, width, height, theme } of jobs) {
  const view = `${width}x${height} ${theme}`;
  try {
    const o = await open(route, width, height, theme); if (!o) { skipped.add(route.name); continue; }
    const { ctx, page } = o;
    if (!route.signedOut && /\/admin\/login/.test(page.url())) throw new Error('was sent to the sign-in page');
    for (const f of await page.evaluate(pageChecks)) fail(f.check, route.name, view, f.detail);
    /* The buttons at the foot of an editor must never cover the field that has focus (WCAG 2.4.11). */
    const covered = await page.evaluate(() => { const bar = document.querySelector('.admin-savebar'); if (!bar) return null; const fields = [...document.querySelectorAll('.admin-form input:not([type=hidden]), .admin-form textarea, .admin-form select')]; const last = fields[fields.length - 1]; if (!last) return null; last.focus(); const f = last.getBoundingClientRect(), b = bar.getBoundingClientRect(); /* A text box taller than the screen always runs under the bar; what must not happen is the focused field being wholly hidden. */ return f.top >= b.top - 1 ? `${last.id} is wholly under the save bar when focused` : null; });
    if (covered) fail('focus-obscured', route.name, view, covered);
    await page.addScriptTag({ content: AXE });
    const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] })).violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s), first: ${String(v.nodes[0].target[0]).slice(0, 90)}${v.nodes[0].any?.[0]?.data?.contrastRatio ? ` ratio ${v.nodes[0].any[0].data.contrastRatio}` : ''}`));
    for (const v of violations) fail('axe', route.name, view, v);
    await ctx.close();
  } catch (e) { fail('page-load', route.name, view, String(e.message).slice(0, 160)); }
  if (++done % 20 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length} views`);
}

// Keyboard walk: every focus stop shows a real outline. Once per page, desktop and phone width, both themes.
for (const route of routes) for (const theme of quick ? ['light'] : THEMES) for (const [width, height] of [[1280, 720], [390, 844]]) {
  try {
    const o = await open(route, width, height, theme); if (!o) continue; const { ctx, page } = o; const seen = new Set();
    for (let i = 0; i < 70; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(30); /* The development server adds its own toolbar to the page; it is not part of the site. */ if (await page.evaluate(() => document.activeElement?.tagName === 'ASTRO-DEV-TOOLBAR')) continue; const f = await page.evaluate(focusProbe); if (!f) continue; if (seen.has(f.key)) { if (seen.size > 3) break; continue; } seen.add(f.key);
      if (f.invisible) fail('focus-invisible-control', route.name, `${width}x${height} ${theme}`, `"${f.label}" in ${f.where} takes focus but is not visible`); else if (!f.outline) fail('focus-outline', route.name, `${width}x${height} ${theme}`, `"${f.label}" in ${f.where} has no outline when focused`); }
    await ctx.close();
  } catch (e) { fail('keyboard-walk', route.name, `${width}x${height} ${theme}`, String(e.message).slice(0, 160)); }
}
await browser.close();

const groups = {}; for (const f of fails) { const k = `${f.check} | ${f.route} | ${f.detail}`; (groups[k] ||= []).push(f.view); }
fs.mkdirSync(path.join(ROOT, 'reports/admin'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'reports/admin/admin-ui.json'), JSON.stringify({ origin, views: jobs.length, fails }, null, 1));
console.log('\n================ admin interface report ================');
for (const [k, views] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) console.log(`- ${k}\n    in ${views.length} view(s), e.g. ${views.slice(0, 3).join(', ')}`);
if (skipped.size) console.log(`\nNot checked, because the list was empty: ${[...skipped].join(', ')}`);
console.log(fails.length ? `\nFAILED: ${fails.length} finding(s), ${Object.keys(groups).length} distinct.` : `\nPASSED: ${jobs.length} views of ${routes.length} admin pages, 0 findings.`);
process.exit(fails.length ? 1 : 0);
