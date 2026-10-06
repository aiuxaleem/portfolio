// End-to-end editor test: create a project through /admin, add an update, confirm the file on disk, then remove it.
// node scripts/quality/check-editor-e2e.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, launch } from '../lib.mjs';

const PORT = 4502, TITLE = 'Editor test project', FILE = path.join(ROOT, 'src/content/projects/editor-test-project.mdx');
fs.rmSync(FILE, { force: true });
const dev = spawn(`npx astro dev --port ${PORT}`, { cwd: ROOT, shell: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 180; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch {} await wait(500); }
const browser = await launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const out = { steps: [] }; const step = (name, ok, extra = '') => out.steps.push(`${ok ? 'ok ' : 'FAIL'} ${name}${extra ? ': ' + extra : ''}`);
try {
  await page.goto(`http://127.0.0.1:${PORT}/admin`, { waitUntil: 'load' });
  await page.waitForSelector('text=Projects', { timeout: 150000 }); step('open /admin, editor lists Projects', true, new URL(page.url()).pathname);
  await page.goto(`http://127.0.0.1:${PORT}/keystatic/collection/projects/create`, { waitUntil: 'load' });
  await page.getByLabel('Title', { exact: true }).first().waitFor({ timeout: 60000 });
  await page.getByLabel('Title', { exact: true }).first().fill(TITLE);
  await page.getByLabel('Summary').fill('Created by the automated editor test. Safe to delete.');
  step('fill title and summary', true);
  await page.getByRole('button', { name: /^Create$/ }).click();
  const created = await (async () => { for (let i = 0; i < 40; i++) { if (fs.existsSync(FILE)) return true; await wait(500); } return false; })();
  step('click Create, file written to src/content/projects/', created, created ? path.basename(FILE) : 'file not found');
  if (created) {
    out.fileAfterCreate = fs.readFileSync(FILE, 'utf8').slice(0, 400);
    // add an update
    await page.waitForTimeout(1500);
    const addButtons = page.getByRole('button', { name: /^Add$/ });
    out.addButtons = await addButtons.count();
    // the Updates log is the last array field with an Add button before the body editor
    const updatesGroup = page.getByRole('group', { name: /Updates log/ }).or(page.locator('fieldset, div').filter({ hasText: /^Updates log/ })).first();
    await updatesGroup.getByRole('button', { name: /^Add$/ }).first().click({ timeout: 15000 });
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ timeout: 15000 });
    const date = dialog.getByLabel('Date');
    await date.first().click().catch(() => {});
    await page.keyboard.type('10042026').catch(() => {});
    await dialog.getByLabel('Title').fill('First update from the editor test');
    await dialog.getByLabel('Note').fill('This update was added through the editor.');
    await dialog.getByRole('button', { name: /^(Add|Done|Save)$/ }).first().click();
    step('add an update in the dialog', true);
    await page.getByRole('button', { name: /^Save$/ }).click({ timeout: 15000 });
    const saved = await (async () => { for (let i = 0; i < 40; i++) { if (/First update from the editor test/.test(fs.readFileSync(FILE, 'utf8'))) return true; await wait(500); } return false; })();
    step('click Save, update written to the file', saved);
    out.fileAfterUpdate = fs.readFileSync(FILE, 'utf8').slice(0, 700);
  }
} catch (e) { step('unexpected error', false, String(e.message).split('\n')[0].slice(0, 220)); await page.screenshot({ path: path.join(ROOT, 'reports/editor-e2e-error.png') }).catch(() => {}); }
await browser.close();
// does the site still build and list the new project?
if (fs.existsSync(FILE)) {
  const r = await fetch(`http://127.0.0.1:${PORT}/work/editor-test-project`).catch(() => null);
  step('new project page renders in dev', !!r && r.ok, r ? 'status ' + r.status : 'no response');
  if (r && r.ok) { const html = await r.text(); step('update appears on the project page', /First update from the editor test/.test(html)); }
}
console.log(JSON.stringify(out, null, 1));
spawn(`taskkill /pid ${dev.pid} /T /F`, { shell: true });
if (!process.argv.includes('--keep')) fs.rmSync(FILE, { force: true });
setTimeout(() => process.exit(0), 1500);
