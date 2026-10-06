// Behaviour test for the contact form and the About, Resume and Now pages, with screenshots. Run after a quality build.
// The form service is intercepted: no message is sent anywhere. node scripts/quality/check-brand.mjs
import fs from 'node:fs';
import { serve, launch } from '../lib.mjs';
fs.mkdirSync('reports/brand', { recursive: true });
const server = await serve('dist', 4492); const browser = await launch(); const O = 'http://127.0.0.1:4492'; const out = {};
const open = async (path, { width = 1280, height = 800, js = true, mode = 'ok' } = {}) => { const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', javaScriptEnabled: js }); const net = { mode, posts: [] }; await ctx.route(u => u.hostname.includes('formspree'), async r => { net.posts.push(r.request().postData()); if (net.mode === 'ok') { await new Promise(x => setTimeout(x, 1200)); await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); } else if (net.mode === 'error') await r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"x"}' }); else await r.abort(); }); const p = await ctx.newPage(); await p.goto(O + path, { waitUntil: 'load' }); await p.waitForTimeout(400); return { ctx, p, net }; };
const F = '[data-contact-form]:not([data-static])';
const st = p => p.evaluate(s => document.querySelector(s).dataset.state, F);

// 1. Empty submit: error summary, inline errors, focus
{ const { ctx, p, net } = await open('/contact?theme=light'); const r = {};
  r.requestsBeforeSubmit = net.posts.length;
  r.labels = await p.evaluate(s => [...document.querySelectorAll(s + ' label')].map(l => `${l.textContent} -> #${l.htmlFor}`), F);
  await p.locator(F + ' [data-form-submit]').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  r.afterEmptySubmit = await p.evaluate(s => { const root = document.querySelector(s), sum = root.querySelector('[data-form-summary]'); return { state: root.dataset.state, summaryShown: !sum.hidden, summaryTitle: sum.querySelector('[data-form-summary-title]').textContent, summaryLinks: [...sum.querySelectorAll('a')].map(a => a.textContent), focusOnSummary: document.activeElement === sum, role: sum.getAttribute('role'),
    fields: [...root.querySelectorAll('[data-field]')].map(w => { const i = w.querySelector('input, textarea'), e = w.querySelector('[data-field-error]'); return { name: i.name, invalid: i.getAttribute('aria-invalid'), describedBy: i.getAttribute('aria-describedby'), error: e.hidden ? null : e.textContent.trim(), errorIdMatches: (i.getAttribute('aria-describedby') || '').split(' ').includes(e.id), icon: !!e.querySelector('svg') }; }) }; }, F);
  r.requestsAfterEmptySubmit = net.posts.length;
  await p.locator(F + ' [data-form-summary] a').first().click(); r.summaryLinkFocuses = await p.evaluate(() => document.activeElement.name);
  await p.screenshot({ path: 'reports/brand/contact-invalid-1280-light.png', fullPage: true });
  // fixing a field clears its error as you type
  await p.fill(F + ' [name=name]', 'Test Person'); r.nameErrorAfterTyping = await p.evaluate(s => document.querySelector(s + ' [name=name]').getAttribute('aria-invalid'), F);
  r.summaryAfterFix = await p.evaluate(s => document.querySelector(s + ' [data-form-summary-title]').textContent, F);
  out.validation = r; await ctx.close(); }

// 2. Validation on blur, before any submit
{ const { ctx, p } = await open('/contact'); await p.fill(F + ' [name=email]', 'not-an-email'); await p.locator(F + ' [name=message]').focus(); await p.waitForTimeout(100);
  out.blur = await p.evaluate(s => { const i = document.querySelector(s + ' [name=email]'); const e = i.closest('[data-field]').querySelector('[data-field-error]'); return { invalid: i.getAttribute('aria-invalid'), error: e.textContent.trim(), summaryShown: !document.querySelector(s + ' [data-form-summary]').hidden, emptyFieldLeftAlone: document.querySelector(s + ' [name=name]').getAttribute('aria-invalid') }; }, F); await ctx.close(); }

const fill = async p => { await p.fill(F + ' [name=name]', 'Test Person'); await p.fill(F + ' [name=email]', 'test@example.com'); await p.fill(F + ' [name=message]', 'A test message that must survive a failed send.'); };
// 3. Submitting, then success
{ const { ctx, p, net } = await open('/contact'); await fill(p); await p.locator(F + ' [data-form-submit]').click(); await p.waitForTimeout(300);
  const r = { whileSending: await p.evaluate(s => { const root = document.querySelector(s), b = root.querySelector('[data-form-submit]'); return { state: root.dataset.state, buttonDisabled: b.disabled, buttonLabel: b.textContent.trim(), status: root.querySelector('[data-form-status]').textContent, fieldsLocked: [...root.querySelectorAll('[data-field] input, [data-field] textarea')].every(i => i.readOnly) }; }, F) };
  await p.screenshot({ path: 'reports/brand/contact-submitting-1280-light.png', fullPage: true });
  await p.waitForFunction(s => document.querySelector(s).dataset.state === 'success', F, { timeout: 8000 });
  r.success = await p.evaluate(s => { const root = document.querySelector(s), ok = root.querySelector('[data-form-success]'); return { state: root.dataset.state, text: ok.textContent.trim().replace(/\s+/g, ' '), focusOnMessage: document.activeElement === ok, formHidden: root.querySelector('form').hidden }; }, F);
  r.sent = JSON.parse(net.posts[0]); r.requests = net.posts.length;
  await p.screenshot({ path: 'reports/brand/contact-success-1280-light.png', fullPage: true });
  out.send = r; await ctx.close(); }

// 4. Failure (server error, then network failure): input kept, email offered, retry works
for (const mode of ['error', 'abort']) { const { ctx, p, net } = await open('/contact', { mode }); await fill(p); await p.locator(F + ' [data-form-submit]').click();
  await p.waitForFunction(s => document.querySelector(s).dataset.state === 'failure', F, { timeout: 8000 });
  const r = await p.evaluate(s => { const root = document.querySelector(s), fail = root.querySelector('[data-form-failure]'); return { state: root.dataset.state, text: fail.textContent.trim().replace(/\s+/g, ' '), focusOnFailure: document.activeElement === fail, kept: Object.fromEntries([...root.querySelectorAll('[data-field] input, [data-field] textarea')].map(i => [i.name, i.value])), editable: [...root.querySelectorAll('[data-field] input, [data-field] textarea')].every(i => !i.readOnly), buttonEnabled: !root.querySelector('[data-form-submit]').disabled, mailto: decodeURIComponent(fail.querySelector('a').href) }; }, F);
  if (mode === 'error') { await p.screenshot({ path: 'reports/brand/contact-failure-1280-light.png', fullPage: true }); net.mode = 'ok'; await p.locator(F + ' [data-form-submit]').click(); await p.waitForFunction(s => document.querySelector(s).dataset.state === 'success', F, { timeout: 8000 }); r.retryThenSuccess = await st(p); }
  out['failure (' + mode + ')'] = r; await ctx.close(); }

// 5. Without JavaScript the form still posts to the service and the browser validates
{ const { ctx, p } = await open('/contact', { js: false }); out.noJs = await p.evaluate(s => { const f = document.querySelector(s + ' form'); return { action: f.action, method: f.method, browserValidation: !f.noValidate, required: [...f.querySelectorAll('[required]')].map(i => i.name) }; }, F); await ctx.close(); }
{ const { ctx, p } = await open('/contact?theme=dark', { width: 320, height: 640 }); out.contact320 = await p.evaluate(() => ({ pageScrolls: document.documentElement.scrollWidth > innerWidth })); await p.screenshot({ path: 'reports/brand/contact-320-dark.png', fullPage: true }); await ctx.close(); }

// 6. About, Resume, Now
for (const [name, path] of [['about', '/about'], ['resume', '/resume'], ['now', '/now']]) { const { ctx, p } = await open(path + '?theme=light');
  out[name] = await p.evaluate(() => { const hs = [...document.querySelectorAll('main h1, main h2, main h3, main h4')]; const lv = hs.map(h => +h.tagName[1]); return { h1: document.querySelector('h1').textContent.trim(), h2: hs.filter(h => h.tagName === 'H2').map(h => h.textContent.trim()), headingSkips: lv.filter((l, i) => i > 0 && l - lv[i - 1] > 1).length, companies: [...document.querySelectorAll('.career-company > :first-child')].map(h => h.textContent), roles: [...document.querySelectorAll('.career-role > :first-child')].length, certifications: document.querySelectorAll('.cert-list > li').length, placeholderText: /\[VERIFY\]|\[METRIC/.test(document.body.innerText), percentFigures: (document.querySelector('main').innerText.match(/[+]?\d+%/g) || []), testimonials: document.querySelectorAll('.testimonial').length, pdfButton: [...document.querySelectorAll('a')].filter(a => /PDF/.test(a.textContent)).map(a => a.getAttribute('href')), primaryButtons: document.querySelectorAll('main .ui-button-primary').length }; });
  await p.screenshot({ path: `reports/brand/${name}-1280-light.png`, fullPage: true }); await ctx.close();
  const m = await open(path + '?theme=dark', { width: 390, height: 844 }); out[name].scrollsAt390 = await m.p.evaluate(() => document.documentElement.scrollWidth > innerWidth); await m.p.screenshot({ path: `reports/brand/${name}-390-dark.png`, fullPage: true }); await m.ctx.close(); }

// 7. States page: form states and testimonials in both themes
{ const { ctx, p } = await open('/_states', { width: 1280, height: 900 }); for (const theme of ['light', 'dark']) { const sec = p.locator(`section[data-theme="${theme}"]`);
    await sec.locator('h2', { hasText: 'Contact form' }).locator('..').screenshot({ path: `reports/brand/states-form-${theme}.png` });
    await sec.locator('[data-states-testimonials]').screenshot({ path: `reports/brand/states-testimonials-${theme}.png` }); }
  out.states = await p.evaluate(() => ({ formStates: [...document.querySelectorAll('section[data-theme="light"] [data-contact-form]')].map(f => f.dataset.state), testimonialPlaceholders: document.querySelectorAll('section[data-theme="light"] .testimonial').length, verifyNotes: document.querySelectorAll('section[data-theme="light"] .verify-list li').length })); await ctx.close(); }

await browser.close(); server.close();
fs.writeFileSync('reports/brand/check-brand.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
