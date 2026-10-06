// npm run quality            build the site and run every check on every route, viewport and theme
// npm run quality:quick      two viewports per theme, for use while working
// npm run quality:legacy     run the same checks against the untouched export in legacy/
// Exit code 1 if anything fails. No check is skipped or downgraded.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { ROOT, VIEWPORTS, QUICK_VIEWPORTS, THEMES, serve, launch, routes, arg, open, revealAll } from '../lib.mjs';
import { pageChecks, focusProbe } from './checks.mjs';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const target = arg('target', 'dist');
const quick = !!arg('quick', false);
const PORT = 4400;
const failures = [];
const fail = (check, route, view, detail) => failures.push({ check, route, view, detail });
const run = (cmd, env = {}) => spawnSync(cmd, { cwd: ROOT, shell: true, stdio: 'inherit', env: { ...process.env, ...env } }).status === 0;

// 1. Types, content and build (built site only)
if (target === 'dist') {
  console.log('\n[1/4] astro check');
  if (!run('npx astro check')) fail('type-check', '-', '-', 'astro check reported errors');
  console.log('\n[2/4] build (with /_states)');
  if (!run('npx astro build', { QUALITY_BUILD: '1' })) { fail('build', '-', '-', 'astro build failed'); report(); }

  // 2. Budgets (CLAUDE.md 2.9): gzipped JS <= 100 KB and CSS <= 50 KB per page
  console.log('\n[3/4] budgets');
  const dist = path.join(ROOT, 'dist');
  const gz = file => zlib.gzipSync(fs.readFileSync(file)).length;
  const htmlFiles = fs.readdirSync(dist, { recursive: true }).filter(f => String(f).endsWith('.html'));
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(dist, String(file)), 'utf8');
    const local = re => [...html.matchAll(re)].map(m => m[1]).filter(u => u.startsWith('/')).map(u => path.join(dist, u.split('?')[0])).filter(f => fs.existsSync(f));
    const inlineJs = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].reduce((n, m) => n + zlib.gzipSync(m[1]).length, 0);
    const js = local(/<script[^>]+src="([^"]+)"/g).reduce((n, f) => n + gz(f), 0) + inlineJs;
    const css = local(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g).reduce((n, f) => n + gz(f), 0) + [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((n, m) => n + zlib.gzipSync(m[1]).length, 0);
    console.log(`  ${file}: JS ${(js / 1024).toFixed(1)} KB, CSS ${(css / 1024).toFixed(1)} KB (gzip)`);
    if (js > 100 * 1024) fail('budget-js', String(file), '-', `${(js / 1024).toFixed(1)} KB gzipped, limit 100`);
    if (css > 50 * 1024) fail('budget-css', String(file), '-', `${(css / 1024).toFixed(1)} KB gzipped, limit 50`);
    if (/\[VERIFY\]|\[METRIC:/.test(html) && !String(file).includes('_states')) fail('unverified-content', String(file), '-', 'page still contains a [VERIFY] or [METRIC] placeholder');
  }
}

// 2b. SEO and structured data on every built page: titles, descriptions, canonicals, share images, JSON-LD, feeds, robots.
//     (The sitemap rules are for production builds; run `node scripts/quality/check-seo.mjs` after `npm run build` for those.)
if (target === 'dist') {
  console.log('\n[3b] SEO and structured data');
  if (!run('node scripts/quality/check-seo.mjs --fixtures')) fail('seo', '-', '-', 'see the list above and reports/seo/check-seo.json');
}

// 2c. Owner facts on every built page: one job title, one contact email, the resume link from site settings, no phone number.
if (target === 'dist') {
  console.log('\n[3c] owner facts');
  if (!run('node scripts/quality/check-owner-facts.mjs')) fail('owner-facts', '-', '-', 'see the list above');
}

// 3. Browser checks on every route x viewport x theme
console.log(`\n[4/4] browser checks against ${target}/`);
const server = await serve(target === 'legacy' ? 'legacy' : 'dist', PORT);
const origin = `http://127.0.0.1:${PORT}`;
const browser = await launch();
const list = routes(target);
const viewports = quick ? QUICK_VIEWPORTS : VIEWPORTS;
const jobs = [];
for (const route of list) for (const [width, height] of viewports) for (const theme of THEMES) jobs.push({ route, width, height, theme });
let next = 0, done = 0;
async function worker() {
  while (next < jobs.length) {
    const { route, width, height, theme } = jobs[next++];
    const view = `${width}x${height} ${theme}`;
    try {
      const { ctx, page } = await open(browser, origin, route, { width, height, theme });
      await revealAll(page, height);
      for (const f of await page.evaluate(pageChecks)) fail(f.check, route.name, view, f.detail);
      await page.addScriptTag({ content: AXE });
      const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] })).violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s), first: ${String(v.nodes[0].target[0]).slice(0, 80)}`));
      for (const v of violations) fail('axe', route.name, view, v);
      await ctx.close();
    } catch (e) { fail('page-load', route.name, view, String(e.message).slice(0, 160)); }
    if (++done % 20 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length} views`);
  }
}
await Promise.all([worker(), worker(), worker()]);

// 4. Keyboard walk: every focus stop needs a real outline (CLAUDE.md 2.1). Once per route, desktop, both themes.
for (const route of list) for (const theme of quick ? ['light'] : THEMES) {
  try {
    const { ctx, page } = await open(browser, origin, route, { width: 1280, height: 720, theme });
    const seen = new Set();
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press('Tab'); await page.waitForTimeout(40);
      let f = await page.evaluate(focusProbe); if (!f) continue;
      // A scroll-revealed element can still be fading in when it takes focus; give it time before judging it invisible.
      if (f.invisible) { await page.waitForTimeout(700); f = await page.evaluate(focusProbe); if (!f) continue; }
      if (seen.has(f.key)) { if (seen.size > 3) break; continue; } seen.add(f.key);
      if (f.invisible) fail('focus-invisible-control', route.name, `1280x720 ${theme}`, `"${f.label}" in ${f.where} takes focus but is not visible`);
      else if (!f.outline) fail('focus-outline', route.name, `1280x720 ${theme}`, `"${f.label}" in ${f.where} has no outline when focused`);
    }
    await ctx.close();
  } catch (e) { fail('focus-walk', route.name, `1280x720 ${theme}`, String(e.message).slice(0, 160)); }
}
await browser.close(); server.close();
report();

function report() {
  const dir = path.join(ROOT, 'reports/quality'); fs.mkdirSync(dir, { recursive: true });
  const pending = ['contrast scan', 'hover and touch states', 'text-spacing and zoom', 'JavaScript-off and blocked-host runs', 'stress fixtures on /_states', 'typography scale and measure', 'link check', 'Lighthouse budgets', 'lint rules (no raw colours, no physical properties)'];
  fs.writeFileSync(path.join(dir, `${target}${quick ? '-quick' : ''}.json`), JSON.stringify({ target, quick, date: new Date().toISOString(), failures, notYetWired: pending }, null, 1));
  const byCheck = {};
  for (const f of failures) (byCheck[f.check] = byCheck[f.check] || []).push(f);
  console.log('\n================ quality report ================');
  for (const [check, items] of Object.entries(byCheck).sort((a, b) => b[1].length - a[1].length)) {
    const distinct = [...new Set(items.map(i => `${i.route}: ${i.detail}`))];
    console.log(`\n${check}: ${items.length} failure(s), ${distinct.length} distinct`);
    distinct.slice(0, 6).forEach(d => console.log('  - ' + d));
    if (distinct.length > 6) console.log(`  … ${distinct.length - 6} more in reports/quality/`);
  }
  console.log(`\nNot yet wired into this command (planned in docs/IMPLEMENTATION_PLAN.md section 6): ${pending.join('; ')}.`);
  console.log(failures.length ? `\nFAILED: ${failures.length} failure(s) across ${Object.keys(byCheck).length} check(s).` : '\nPASSED: 0 failures in the checks that are wired.');
  process.exit(failures.length ? 1 : 0);
}
