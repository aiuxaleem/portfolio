// Behaviour test for the case study page (keyboard) and screenshots. Run after a quality build.
import fs from 'node:fs';
import { serve, launch } from '../lib.mjs';
fs.mkdirSync('reports/case-studies', { recursive: true });
const server = await serve('dist', 4480); const browser = await launch(); const O = 'http://127.0.0.1:4480'; const out = {};

// Before/after: keyboard only
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto(O + '/case-studies/full-fixture?theme=light', { waitUntil: 'load' }); await p.waitForTimeout(600);
  const pos = () => p.evaluate(() => getComputedStyle(document.querySelector('.ba-stage')).getPropertyValue('--pos').trim());
  out.beforeAfter = { enhanced: await p.evaluate(() => document.querySelector('[data-before-after]').hasAttribute('data-enhanced')), start: await pos() };
  await p.locator('.ba-range input').focus(); out.beforeAfter.rangeFocusOutline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth);
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); out.beforeAfter.afterTwoArrowRight = await pos();
  await p.keyboard.press('Home'); out.beforeAfter.afterHome = await pos(); await p.keyboard.press('End'); out.beforeAfter.afterEnd = await pos();
  await p.locator('[data-ba-set="0"]').focus(); await p.keyboard.press('Enter'); out.beforeAfter.showAfterButton = await pos();
  out.beforeAfter.valueText = await p.evaluate(() => document.querySelector('.ba-range input').getAttribute('aria-valuetext'));
  out.beforeAfter.altTexts = await p.evaluate(() => [...document.querySelectorAll('[data-before-after] img')].map(i => i.alt));
  // scroll-spy
  const current = () => p.evaluate(() => (document.querySelector('.case-toc a[aria-current]') || {}).textContent || 'none');
  out.toc = { links: await p.evaluate(() => [...document.querySelectorAll('.case-toc a')].map(a => a.textContent.trim())), atTop: await (async () => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200); return current(); })() };
  await p.evaluate(() => document.getElementById('process').scrollIntoView()); await p.waitForTimeout(300); out.toc.atProcess = await current();
  await p.evaluate(() => document.getElementById('reflection').scrollIntoView()); await p.waitForTimeout(300); out.toc.atReflection = await current();
  out.toc.currentStyle = await p.evaluate(() => { const a = document.querySelector('.case-toc a[aria-current]'); const s = getComputedStyle(a); return `weight ${s.fontWeight}, bar ${s.borderInlineStartColor}, fill ${s.backgroundColor}`; });
  out.toc.sticky = await p.evaluate(() => getComputedStyle(document.querySelector('.case-toc')).position);
  out.headings = await p.evaluate(() => [...document.querySelectorAll('article h1, article h2, article h3')].map(h => h.tagName[1]).join(''));
  out.unverifiedMetricShown = await p.evaluate(() => document.body.innerText.includes('99'));
  out.verifiedMetricShown = await p.evaluate(() => !!document.querySelector('.case-metrics'));
  await ctx.close(); }
// Table of contents on a phone: collapsed, opens from the keyboard
{ const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto(O + '/case-studies/full-fixture?theme=light', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const listShown = () => p.evaluate(() => getComputedStyle(document.querySelector('.case-toc ol')).display !== 'none');
  out.tocMobile = { closedAtStart: !(await listShown()) }; await p.locator('[data-toc-toggle]').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  out.tocMobile.openAfterEnter = await listShown(); out.tocMobile.ariaExpanded = await p.getAttribute('[data-toc-toggle]', 'aria-expanded'); await ctx.close(); }
// JavaScript off: contents listed, images side by side
{ const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, javaScriptEnabled: false }); const p = await ctx.newPage(); await p.goto(O + '/case-studies/full-fixture', { waitUntil: 'load' });
  out.noJs = await p.evaluate(() => ({ tocListShown: getComputedStyle(document.querySelector('.case-toc ol')).display !== 'none', comparisonControlsHidden: document.querySelector('.ba-controls').hidden, panesSideBySide: getComputedStyle(document.querySelector('.ba-stage')).display })); await ctx.close(); }
// Sections present per entry, and screenshots
for (const slug of ['colaberry-design-system', 'freight-platform-rebrand', 'ai-ad-reel-pipeline', 'stress-fixture', 'full-fixture']) { const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); await p.goto(O + '/case-studies/' + slug, { waitUntil: 'load' }); out['sections ' + slug] = await p.evaluate(() => [...document.querySelectorAll('.case-section')].map(s => s.id).join(', ') || '(none: header, cover and contact only)'); await ctx.close(); }
for (const [name, path, w, h, theme] of [['index-1280-light', '/case-studies', 1280, 720, 'light'], ['full-1280-light', '/case-studies/full-fixture', 1280, 720, 'light'], ['colaberry-390-dark', '/case-studies/colaberry-design-system', 390, 844, 'dark'], ['stress-320-light', '/case-studies/stress-fixture', 320, 568, 'light']]) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' }); const p = await c.newPage(); await p.goto(O + path + '?theme=' + theme, { waitUntil: 'load' }); await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(500); await p.screenshot({ path: `reports/case-studies/${name}.png`, fullPage: true }); out['overflow ' + name] = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); await c.close();
}
console.log(JSON.stringify(out, null, 1)); await browser.close(); server.close();
