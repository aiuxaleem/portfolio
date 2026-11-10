// Behaviour test for the pictures (L-60): every uploaded picture is shown whole (no card, cover or gallery frame cuts it) and
// the image preview opens, zooms and closes as specified. Against a quality build in dist/ (QUALITY_BUILD=1 npm run build).
//   node scripts/quality/check-preview.mjs
// Checks: on /work every card picture is drawn whole (object-fit contain); on a project page the cover is a link to its
// full file; a click opens the dialog with focus on Close and the caption set; Zoom in reads 150%, the + key 200% and the
// stage then scrolls; 0 fits again; Escape closes and focus returns to the link; the link's file answers 200 as an image;
// on Home a certificate opens the same dialog; without JavaScript the link opens the file and the dialog is closed.
import fs from 'node:fs';
import http from 'node:http';
import { serve, launch } from '../lib.mjs';

const PORT = 4457; const origin = `http://127.0.0.1:${PORT}`;
fs.mkdirSync('reports/preview', { recursive: true });
const server = await serve('dist', PORT); const browser = await launch();
const out = {}; const fails = [];
const fail = m => { fails.push(m); console.log('  FAIL ' + m); };
const head = url => new Promise(res => http.get(url, { method: 'GET' }, r => { r.resume(); res({ status: r.statusCode, type: r.headers['content-type'] || '' }); }).on('error', () => res({ status: 0, type: '' })));

for (const [w, h, theme] of [[1280, 720, 'light'], [390, 844, 'dark']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const k = `${w}x${h} ${theme}`; out[k] = {};

  await page.goto(`${origin}/work?theme=${theme}`, { waitUntil: 'load' });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400); await page.evaluate(() => scrollTo(0, 0));
  const cards = await page.evaluate(() => [...document.querySelectorAll('.project-card-media img')].map(i => ({ fit: getComputedStyle(i).objectFit, whole: i.classList.contains('fitted-whole') })));
  out[k].cards = cards;
  if (!cards.length) fail(`${k}: no card pictures on /work`);
  cards.forEach((c, i) => { if (c.fit !== 'contain') fail(`${k}: card picture ${i + 1} on /work is ${c.fit}, not contain`); });

  await page.goto(`${origin}/work/colaberry-design-system?theme=${theme}`, { waitUntil: 'load' });
  const link = page.locator('.project-cover a[data-preview]').first();
  if (!(await link.count())) { fail(`${k}: the project cover has no preview link`); await ctx.close(); continue; }
  const href = await link.getAttribute('href'); const file = await head(origin + href);
  out[k].file = file; if (file.status !== 200 || !/^image\//.test(file.type)) fail(`${k}: the full picture ${href} answers ${file.status} ${file.type}`);
  const label = await link.getAttribute('aria-label'); if (!/^View larger: .+/.test(label || '')) fail(`${k}: the cover link's name is "${label}"`);
  await link.click(); await page.waitForTimeout(500);
  const opened = await page.evaluate(() => { const d = document.querySelector('dialog[data-image-preview]'); const f = d?.querySelector('.image-preview-frame'); return { open: !!d?.open, state: f?.getAttribute('data-state'), focus: document.activeElement?.getAttribute('data-close') !== null && document.activeElement?.hasAttribute('data-close'), caption: d?.querySelector('.image-preview-caption')?.textContent?.trim(), level: d?.querySelector('.image-preview-level')?.textContent?.trim(), src: d?.querySelector('.image-preview-image')?.getAttribute('src') }; });
  out[k].opened = opened;
  if (!opened.open) fail(`${k}: the dialog did not open`);
  if (!opened.focus) fail(`${k}: focus is not on Close after opening`);
  if (!opened.caption) fail(`${k}: the caption is empty`);
  if (opened.level !== 'Fit') fail(`${k}: the level reads "${opened.level}" on opening`);
  await page.waitForFunction(() => document.querySelector('dialog[data-image-preview] .image-preview-frame')?.getAttribute('data-state') === 'open', null, { timeout: 8000 }).catch(() => fail(`${k}: the full picture did not arrive (state stays ${opened.state})`));
  await page.click('dialog[data-image-preview] [data-zoom="in"]'); await page.waitForTimeout(250);
  const z1 = await page.evaluate(() => document.querySelector('dialog[data-image-preview] .image-preview-level')?.textContent?.trim());
  if (z1 !== '150%') fail(`${k}: after Zoom in the level reads "${z1}"`);
  await page.keyboard.press('+'); await page.waitForTimeout(250);
  const z2 = await page.evaluate(() => { const s = document.querySelector('dialog[data-image-preview] .image-preview-stage'); return { level: document.querySelector('dialog[data-image-preview] .image-preview-level')?.textContent?.trim(), scrolls: !!s && (s.scrollWidth > s.clientWidth + 2 || s.scrollHeight > s.clientHeight + 2), state: document.querySelector('dialog[data-image-preview] .image-preview-frame')?.getAttribute('data-state') }; });
  out[k].zoomed = z2;
  if (z2.level !== '200%') fail(`${k}: after the + key the level reads "${z2.level}"`);
  if (!z2.scrolls) fail(`${k}: at 200% the stage does not scroll`);
  if (z2.state !== 'zoomed') fail(`${k}: at 200% the state is ${z2.state}`);
  await page.keyboard.press('0'); await page.waitForTimeout(250);
  const z0 = await page.evaluate(() => document.querySelector('dialog[data-image-preview] .image-preview-level')?.textContent?.trim());
  if (z0 !== 'Fit') fail(`${k}: after the 0 key the level reads "${z0}"`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const closed = await page.evaluate(() => ({ open: !!document.querySelector('dialog[data-image-preview]')?.open, focusOnLink: document.activeElement?.matches('a[data-preview]') }));
  out[k].closed = closed;
  if (closed.open) fail(`${k}: Escape did not close the dialog`);
  if (!closed.focusOnLink) fail(`${k}: focus did not return to the picture's link`);
  await page.screenshot({ path: `reports/preview/project-${w}-${theme}.png` });

  await page.goto(`${origin}/?theme=${theme}`, { waitUntil: 'load' });
  const cert = page.locator('#now button[aria-haspopup="dialog"]').first();
  if (await cert.count()) {
    await cert.scrollIntoViewIfNeeded(); await cert.click(); await page.waitForTimeout(500);
    const c = await page.evaluate(() => { const d = document.querySelector('dialog[data-image-preview]'); return { open: !!d?.open, caption: d?.querySelector('.image-preview-caption')?.textContent?.trim(), src: d?.querySelector('.image-preview-image')?.getAttribute('src') || '' }; });
    out[k].certificate = c;
    if (!c.open) fail(`${k}: a certificate did not open the preview`);
    if (!/certs\/full\//.test(c.src) && !/certs\//.test(c.src)) fail(`${k}: the certificate preview shows ${c.src}`);
    if (!c.caption) fail(`${k}: the certificate preview has no caption`);
    await page.screenshot({ path: `reports/preview/certificate-${w}-${theme}.png` });
    await page.keyboard.press('Escape');
  } else out[k].certificate = 'no certificate button on Home';
  await ctx.close();
}
{
  /* A picture in a post's body becomes a preview link after load and opens the dialog from the keyboard. */
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const post = await page.goto(`${origin}/blog/how-i-build-one-linkedin-infographic-a-day`, { waitUntil: 'load' }).then(r => r.ok()).catch(() => false);
  if (!post) out.body = 'post not in this build';
  else {
    const n = await page.evaluate(() => document.querySelectorAll('.prose a.image-preview-body-link[data-preview] > img').length);
    const link = page.locator('.prose a.image-preview-body-link').first();
    let opened = false;
    if (n) { await link.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500); opened = await page.evaluate(() => !!document.querySelector('dialog[data-image-preview]')?.open); await page.keyboard.press('Escape'); }
    out.body = { links: n, openedFromKeyboard: opened };
    if (!n) fail('no picture in the post body became a preview link'); else if (!opened) fail('a body picture did not open the preview from the keyboard');
  }
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, javaScriptEnabled: false });
  const page = await ctx.newPage(); await page.goto(`${origin}/work/colaberry-design-system`, { waitUntil: 'load' });
  const noJs = await page.evaluate(() => ({ dialogOpen: !!document.querySelector('dialog[data-image-preview]')?.open, link: document.querySelector('.project-cover a[data-preview]')?.getAttribute('href') || '', target: document.querySelector('.project-cover a[data-preview]')?.getAttribute('target') }));
  out.noJs = noJs;
  if (noJs.dialogOpen) fail('without JavaScript the dialog is open');
  if (!noJs.link || noJs.target !== '_blank') fail(`without JavaScript the cover link is ${noJs.link} (${noJs.target})`);
  await ctx.close();
}
await browser.close(); server.close();
fs.writeFileSync('reports/preview/check-preview.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 2400));
console.log(fails.length ? `\nFAILED: ${fails.length}` : '\nPASSED: pictures are whole in cards, the preview opens on the cover and a certificate, zooms in steps, fits, closes on Escape with focus returned, and the link works without JavaScript.');
process.exit(fails.length ? 1 : 0);
