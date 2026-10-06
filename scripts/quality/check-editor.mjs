// Starts the dev server, opens the content editor and reports what it finds. node scripts/quality/check-editor.mjs
import { spawn } from 'node:child_process';
import { ROOT, launch } from '../lib.mjs';

const PORT = 4500;
const dev = spawn(`npx astro dev --port ${PORT}`, { cwd: ROOT, shell: true });
let log = ''; dev.stdout.on('data', d => { log += d; }); dev.stderr.on('data', d => { log += d; });
const until = async (fn, ms) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fn()) return true; await new Promise(r => setTimeout(r, 500)); } return false; };
const up = await until(async () => { try { return (await fetch(`http://127.0.0.1:${PORT}/`)).ok; } catch { return false; } }, 90000);
const out = { devServer: up };
if (up) {
  const browser = await launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message).slice(0, 160)));
  const r = await page.goto(`http://127.0.0.1:${PORT}/admin`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  out.adminStatus = r.status(); out.adminLandsOn = new URL(page.url()).pathname;
  // First load in dev compiles the editor's dependencies and may reload the page; give it time.
  await until(async () => { try { return (await page.evaluate(() => document.body.innerText.length)) > 80; } catch { return false; } }, 150000);
  const consoleErrors = []; page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
  out.editorText = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 420);
  out.collectionsListed = await page.evaluate(() => ['Projects', 'Case studies', 'Blog posts', 'YouTube videos', 'LinkedIn posts', 'LinkedIn articles', 'Certifications', 'Testimonials', 'Site settings'].filter(n => document.body.innerText.includes(n)));
  // open one collection and one entry
  await page.goto(`http://127.0.0.1:${PORT}/keystatic/collection/certifications`, { waitUntil: 'load' }); await page.waitForTimeout(4000);
  out.certificationsList = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 260);
  await page.goto(`http://127.0.0.1:${PORT}/keystatic/collection/certifications/item/khda-ai-ml`, { waitUntil: 'load' }); await page.waitForTimeout(5000);
  out.entryFields = await page.evaluate(() => [...document.querySelectorAll('label')].map(l => l.innerText.trim()).filter(Boolean).slice(0, 14));
  out.imageUploadControls = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(t => /choose|upload|image|remove/i.test(t)).slice(0, 6));
  await page.screenshot({ path: 'reports/editor.png' }).catch(() => {});
  out.pageErrors = errors.slice(0, 3); out.consoleErrors = consoleErrors.slice(0, 4); out.htmlLength = (await page.content()).length;
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
if (!up) console.log(log.slice(-1500));
dev.kill(); spawn(`taskkill /pid ${dev.pid} /T /F`, { shell: true });
setTimeout(() => process.exit(0), 1500);
