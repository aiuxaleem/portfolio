// Opens a post in the content editor and reports whether the body parses and which content blocks the editor offers.
// node scripts/quality/check-editor-blocks.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { ROOT, launch } from '../lib.mjs';

const PORT = 4501, O = `http://127.0.0.1:${PORT}`;
const dev = spawn(`npx astro dev --port ${PORT}`, { cwd: ROOT, shell: true });
let log = ''; dev.stdout.on('data', d => { log += d; }); dev.stderr.on('data', d => { log += d; });
const until = async (fn, ms) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fn()) return true; await new Promise(r => setTimeout(r, 500)); } return false; };
const up = await until(async () => { try { return (await fetch(O + '/')).ok; } catch { return false; } }, 90000);
const out = { devServer: up };
if (up) {
  const browser = await launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message).slice(0, 200)));
  const text = () => page.evaluate(() => document.body.innerText).catch(() => '');
  for (const [name, path, probe] of [['posts', 'posts/item/rich-content-fixture', 'Excerpt'], ['caseStudies', 'caseStudies/item/full-fixture', 'Category'], ['projects', 'projects/item/stress-fixture', 'Summary']]) {
    await page.goto(`${O}/keystatic/collection/${path}`, { waitUntil: 'load' });
    const ready = await until(async () => (await text()).includes(probe), 150000); await page.waitForTimeout(2500);
    const t = await text(); const r = { opened: ready, error: (t.match(/[^.\n]*(error|failed|unexpected)[^\n]*/i) || [null])[0] };
    if (name === 'posts') {
      r.fields = await page.evaluate(() => [...document.querySelectorAll('label')].map(l => l.innerText.trim()).filter(Boolean).slice(0, 30));
      r.bodyShowsContent = ['Fixture opening paragraph', 'A second-level heading', 'Fixture callout text', 'Fixture block quote'].filter(s => t.includes(s));
      r.blocksRenderedInBody = ['YouTube video', 'LinkedIn post', 'LinkedIn article (link card)', 'Callout', 'Image with caption', 'Gallery'].filter(s => t.includes(s));
    }
    // The insert menu in the body toolbar lists the custom blocks.
    r.insertMenu = [];
    const pops = page.locator('[role="toolbar"] button[aria-haspopup]');
    for (let i = 0; i < await pops.count(); i++) { await pops.nth(i).click().catch(() => {}); await page.waitForTimeout(700);
      const items = await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"], [role="option"]')].map(x => x.innerText.trim().split('\n')[0]).filter(Boolean));
      if (items.some(x => /YouTube|Callout/.test(x))) { r.insertMenu = items; await page.screenshot({ path: `reports/blog/editor-${name}.png` }).catch(() => {}); }
      await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
    if (!r.insertMenu.length) { // The same list opens from the keyboard: "/" on an empty line in the body.
      const ed = page.locator('[contenteditable="true"]').last(); await ed.click(); await page.keyboard.press('Control+End'); await page.keyboard.press('Enter'); await page.keyboard.type('/'); await page.waitForTimeout(900);
      r.insertMenu = await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"], [role="option"]')].map(x => x.innerText.trim().split('\n')[0]).filter(Boolean));
      r.insertMenuOpenedBy = 'typing / in the body'; await page.screenshot({ path: `reports/blog/editor-${name}.png` }).catch(() => {}); await page.keyboard.press('Escape'); await page.keyboard.press('Backspace'); }
    if (!r.insertMenu.length) { // The same list opens from the keyboard: "/" on an empty line in the body.
      const ed = page.locator('[contenteditable="true"]').last(); await ed.click(); await page.keyboard.press('Control+End'); await page.keyboard.press('Enter'); await page.keyboard.type('/'); await page.waitForTimeout(900);
      r.insertMenu = await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"], [role="option"]')].map(x => x.innerText.trim().split('\n')[0]).filter(Boolean));
      r.insertMenuOpenedBy = 'typing / in the body'; await page.screenshot({ path: `reports/blog/editor-${name}.png` }).catch(() => {}); await page.keyboard.press('Escape'); await page.keyboard.press('Backspace'); }
    out[name] = r;  }
  // The settings pages (site settings and the profile file behind About, Resume, Now and the contact form).
  for (const [name, probe] of [['site', 'Availability'], ['profile', 'Positioning statement']]) { await page.goto(`${O}/keystatic/singleton/${name}`, { waitUntil: 'load' }); const ready = await until(async () => (await text()).includes(probe), 60000); await page.waitForTimeout(1500);
    out['settings: ' + name] = { opened: ready, labels: await page.evaluate(() => [...document.querySelectorAll('label, legend')].map(l => l.innerText.trim().split('\n')[0]).filter(Boolean).slice(0, 24)) }; }
  // The YouTube block, found by typing its name after "/".
  { await page.goto(`${O}/keystatic/collection/posts/item/rich-content-fixture`, { waitUntil: 'load' }); await until(async () => (await text()).includes('Excerpt'), 60000); await page.waitForTimeout(2000);
    const ed = page.locator('[contenteditable="true"]').last(); await ed.click(); await page.keyboard.press('Control+End'); await page.keyboard.press('Enter'); await page.keyboard.type('/'); await page.waitForTimeout(900); const menuAll = await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"], [role="option"]')].length); await page.keyboard.type('you', { delay: 200 }); await page.waitForTimeout(900); out.menuItemsBeforeTyping = menuAll;
    out.youtubeBlockInMenu = await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"], [role="option"]')].map(x => x.innerText.trim().split('\n')[0]).filter(Boolean)); await page.keyboard.press('Escape'); }
  out.pageErrors = errors.slice(0, 4);
  await browser.close();
}
fs.mkdirSync('reports/blog', { recursive: true }); fs.writeFileSync('reports/blog/check-editor-blocks.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
if (!up) console.log(log.slice(-1500));
dev.kill(); spawn(`taskkill /pid ${dev.pid} /T /F`, { shell: true });
setTimeout(() => process.exit(0), 1500);
