// Behaviour test for /work filters (keyboard only) and screenshots of the project pages. Run after a quality build.
import fs from 'node:fs';
import { serve, launch } from '../lib.mjs';
fs.mkdirSync('reports/projects', { recursive: true });
const server = await serve('dist', 4470); const browser = await launch(); const O = 'http://127.0.0.1:4470'; const out = {};
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' }); const page = await ctx.newPage();
await page.goto(O + '/work?theme=light', { waitUntil: 'load' }); await page.waitForTimeout(600);
const state = () => page.evaluate(() => ({ count: document.querySelector('[data-result-count]').textContent, visible: [...document.querySelectorAll('[data-project]')].filter(c => !c.closest('li').hidden).map(c => c.querySelector('a').textContent), emptyShown: !document.querySelector('[data-project-empty]').hidden, pressed: [...document.querySelectorAll('.ui-chip[aria-pressed="true"]')].map(c => c.textContent) }));
out.filtersVisibleWithJs = await page.evaluate(() => !document.querySelector('[data-project-filters]').hidden);
out.initial = await state();
// keyboard: Tab until the first chip, press Space, then keep tabbing to a status chip and press Enter
const focusChip = async text => { for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(t => document.activeElement.classList.contains('ui-chip') && document.activeElement.textContent === t, text)) return true; } return false; };
out.reachedAI = await focusChip('AI'); await page.keyboard.press('Space'); await page.waitForTimeout(150); out.afterAI = await state();
out.focusOutlineOnChip = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth);
out.reachedConcept = await focusChip('Concept'); await page.keyboard.press('Enter'); await page.waitForTimeout(150); out.afterAIandConcept = await state();
await page.screenshot({ path: 'reports/projects/work-empty-1280-light.png' });
// clear filters from the keyboard
for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.activeElement.hasAttribute('data-clear-filters'))) break; }
out.focusOnClear = await page.evaluate(() => document.activeElement.textContent.trim()); await page.keyboard.press('Enter'); await page.waitForTimeout(150); out.afterClear = await state(); out.focusAfterClear = await page.evaluate(() => document.activeElement.textContent.trim());
await ctx.close();
// JavaScript off: all projects listed, filter bar hidden
{ const c = await browser.newContext({ viewport: { width: 1280, height: 720 }, javaScriptEnabled: false }); const p = await c.newPage(); await p.goto(O + '/work', { waitUntil: 'load' }); out.noJs = await p.evaluate(() => ({ filtersHidden: document.querySelector('[data-project-filters]').hidden, cards: document.querySelectorAll('[data-project]').length })); await c.close(); }
// screenshots
for (const [name, path, w, h, theme] of [['work-1280-light', '/work', 1280, 720, 'light'], ['work-390-dark', '/work', 390, 844, 'dark'], ['project-1280-light', '/work/colaberry-design-system', 1280, 720, 'light'], ['project-390-dark', '/work/freight-design-system', 390, 844, 'dark'], ['project-stress-320-light', '/work/stress-fixture', 320, 568, 'light']]) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' }); const p = await c.newPage(); await p.goto(O + path + '?theme=' + theme, { waitUntil: 'load' }); await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(500); await p.screenshot({ path: `reports/projects/${name}.png`, fullPage: true }); out['overflow ' + name] = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); await c.close();
}
// equal card heights on the index at 1280
{ const c = await browser.newContext({ viewport: { width: 1280, height: 720 } }); const p = await c.newPage(); await p.goto(O + '/work', { waitUntil: 'load' }); await p.waitForTimeout(500); out.cardHeights1280 = await p.evaluate(() => [...document.querySelectorAll('[data-project]')].map(c => Math.round(c.getBoundingClientRect().top) + ':' + Math.round(c.getBoundingClientRect().height))); await c.close(); }
console.log(JSON.stringify(out, null, 1)); await browser.close(); server.close();
